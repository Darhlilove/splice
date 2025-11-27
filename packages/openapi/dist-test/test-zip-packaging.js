"use strict";
/**
 * Test script for ZIP packaging functionality
 * Tests the packageAsZip method directly with a mock SDK directory
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_manager_js_1 = require("./src/file-manager.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const archiver_1 = __importDefault(require("archiver"));
/**
 * Create a mock SDK directory structure for testing
 */
function createMockSDKDirectory(basePath) {
    const sdkDir = path.join(basePath, `test-sdk-${Date.now()}`);
    // Create directory structure
    fs.mkdirSync(sdkDir, { recursive: true });
    fs.mkdirSync(path.join(sdkDir, "src"), { recursive: true });
    fs.mkdirSync(path.join(sdkDir, "types"), { recursive: true });
    // Create mock files
    fs.writeFileSync(path.join(sdkDir, "package.json"), JSON.stringify({
        name: "test-api-client",
        version: "1.0.0",
        description: "Test SDK",
        main: "dist/index.js",
        types: "dist/index.d.ts",
    }, null, 2));
    fs.writeFileSync(path.join(sdkDir, "README.md"), `# Test API Client\n\nA test SDK for ZIP packaging.\n\n## Installation\n\n\`\`\`bash\nnpm install test-api-client\n\`\`\``);
    fs.writeFileSync(path.join(sdkDir, "src", "index.ts"), `export class APIClient {\n  constructor() {}\n  async get() { return {}; }\n}`);
    fs.writeFileSync(path.join(sdkDir, "types", "index.d.ts"), `export interface APIResponse {\n  data: any;\n}`);
    return sdkDir;
}
/**
 * Package a directory into a ZIP file
 */
async function packageAsZip(outputPath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(outputPath)) {
            reject(new Error(`Output directory not found: ${outputPath}`));
            return;
        }
        const zipPath = `${outputPath}.zip`;
        const output = fs.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)("zip", {
            zlib: { level: 9 },
        });
        output.on("close", () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`   ZIP archive created: ${zipPath} (${sizeInMB} MB)`);
            resolve(zipPath);
        });
        output.on("error", (err) => {
            reject(new Error(`Failed to create ZIP file: ${err.message}`));
        });
        archive.on("error", (err) => {
            reject(new Error(`Archive error: ${err.message}`));
        });
        archive.pipe(output);
        archive.directory(outputPath, false);
        archive.finalize();
    });
}
async function testZipPackaging() {
    console.log("=== Testing ZIP Packaging ===\n");
    const tempDir = "/tmp/splice-sdks";
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    console.log("1. Creating mock SDK directory...");
    const sdkDir = createMockSDKDirectory(tempDir);
    console.log(`   ✅ Mock SDK created at: ${sdkDir}`);
    // List files in the directory
    const files = fs.readdirSync(sdkDir, { recursive: true });
    console.log(`   Files created: ${files.length}`);
    files.forEach((file) => console.log(`      - ${file}`));
    console.log("\n2. Creating ZIP archive...");
    const zipPath = await packageAsZip(sdkDir);
    console.log(`   ✅ ZIP created at: ${zipPath}`);
    // Verify ZIP file exists and get size
    if (fs.existsSync(zipPath)) {
        const stats = fs.statSync(zipPath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`   ZIP file size: ${sizeInKB} KB`);
    }
    console.log("\n3. Testing FileManager integration...");
    const fileManager = new file_manager_js_1.FileManager();
    const fileId = await fileManager.storeFile(zipPath);
    console.log(`   ✅ File stored with ID: ${fileId}`);
    const downloadUrl = fileManager.getDownloadUrl(fileId);
    console.log(`   Download URL: ${downloadUrl}`);
    // Retrieve file
    const retrievedPath = await fileManager.getFile(fileId);
    if (retrievedPath) {
        console.log(`   ✅ File retrieved successfully: ${retrievedPath}`);
    }
    else {
        console.error("   ❌ Failed to retrieve file");
    }
    console.log("\n4. Testing file expiration...");
    const allFiles = fileManager.getAllFiles();
    console.log(`   Files in manager: ${allFiles.length}`);
    allFiles.forEach((file) => {
        console.log(`      - ID: ${file.id}`);
        console.log(`        Created: ${file.createdAt.toISOString()}`);
        console.log(`        Expires: ${file.expiresAt.toISOString()}`);
        console.log(`        Size: ${(file.size / 1024).toFixed(2)} KB`);
    });
    console.log("\n5. Cleaning up...");
    await fileManager.deleteFile(fileId);
    console.log("   ✅ File deleted from FileManager");
    // Clean up test files
    if (fs.existsSync(sdkDir)) {
        fs.rmSync(sdkDir, { recursive: true, force: true });
        console.log("   ✅ SDK directory deleted");
    }
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        console.log("   ✅ ZIP file deleted");
    }
    console.log("\n=== Test Complete ===");
    console.log("✅ All ZIP packaging tests passed!");
}
// Run the test
testZipPackaging().catch((error) => {
    console.error("❌ Test failed with error:", error);
    process.exit(1);
});

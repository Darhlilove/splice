import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function testDirectGeneration() {
    console.log("🧪 Testing direct openapi-generator-cli execution...\n");

    const outputPath = "/tmp/test-sdk-direct";
    const specPath = path.join(__dirname, "temp-test-spec.json");

    // Create a simple test spec
    const testSpec = {
        openapi: "3.0.0",
        info: {
            title: "Test API",
            version: "1.0.0",
        },
        paths: {
            "/test": {
                get: {
                    responses: {
                        "200": {
                            description: "OK",
                        },
                    },
                },
            },
        },
    };

    fs.writeFileSync(specPath, JSON.stringify(testSpec, null, 2));

    const args = [
        "openapi-generator-cli",
        "generate",
        "-i",
        specPath,
        "-g",
        "typescript-fetch",
        "-o",
        outputPath,
    ];

    console.log("Command:", `npx ${args.join(" ")}`);
    console.log("");

    const child = spawn("npx", args);

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);
    });

    child.stderr?.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        console.error(output);
    });

    child.on("close", (code) => {
        console.log(`\n\nProcess exited with code: ${code}`);

        // Check output directory
        console.log("\nChecking output directory...");
        if (fs.existsSync(outputPath)) {
            const files = fs.readdirSync(outputPath);
            console.log(`Files created: ${files.length}`);
            console.log(files);
        } else {
            console.log("❌ Output directory doesn't exist!");
        }

        // Cleanup
        fs.unlinkSync(specPath);
    });
}

testDirectGeneration();

"use strict";
/**
 * SDK Generator implementation
 * Orchestrates SDK generation using OpenAPI Generator CLI
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
exports.SDKGenerator = void 0;
const fs = __importStar(require("fs"));
const archiver_1 = __importDefault(require("archiver"));
const sdk_config_validator_js_1 = require("./sdk-config-validator.js");
/**
 * SDK Generator class
 * Handles SDK generation orchestration with progress tracking and resource management
 */
class SDKGenerator {
    constructor() {
        this.activeGenerations = new Map();
        this.MAX_CONCURRENT_GENERATIONS = 3;
        this.GENERATION_TIMEOUT_MS = 60000; // 60 seconds
        this.configValidator = new sdk_config_validator_js_1.SDKConfigValidator();
    }
    /**
     * Generate an SDK from an OpenAPI specification
     * @param spec - OpenAPI specification object
     * @param config - SDK configuration
     * @param onProgress - Optional progress callback
     * @returns Generation result with output path or error
     */
    async generateSDK(spec, config, onProgress) {
        // Validate configuration before starting generation
        const validationResult = this.configValidator.validateConfig(config);
        if (!validationResult.valid) {
            return {
                success: false,
                error: this.formatValidationErrors(validationResult.errors),
            };
        }
        const generationId = this.generateId();
        // Check concurrent generation limit
        if (this.activeGenerations.size >= this.MAX_CONCURRENT_GENERATIONS) {
            return {
                success: false,
                error: `Maximum concurrent generations (${this.MAX_CONCURRENT_GENERATIONS}) reached. Please try again later.`,
            };
        }
        // Initialize generation state
        const state = {
            id: generationId,
            startTime: Date.now(),
            progress: {
                stage: "validating",
                progress: 0,
                message: "Validating OpenAPI specification...",
            },
        };
        this.activeGenerations.set(generationId, state);
        try {
            // Update progress callback
            const updateProgress = (progress) => {
                state.progress = progress;
                if (onProgress) {
                    onProgress(progress);
                }
            };
            // Stage 1: Validate spec (0-20%)
            updateProgress({
                stage: "validating",
                progress: 10,
                message: "Validating OpenAPI specification...",
            });
            await this.validateSpec(spec);
            updateProgress({
                stage: "validating",
                progress: 20,
                message: "Specification validated successfully",
            });
            // Stage 2: Generate SDK (20-80%)
            updateProgress({
                stage: "generating",
                progress: 30,
                message: "Starting SDK generation...",
            });
            const outputPath = await this.executeOpenAPIGenerator(spec, config, generationId, (progress) => {
                updateProgress({
                    stage: "generating",
                    progress: 30 + progress * 0.5, // Map 0-100 to 30-80
                    message: "Generating SDK files...",
                });
            });
            updateProgress({
                stage: "generating",
                progress: 80,
                message: "SDK generation complete",
            });
            // Stage 3: Package (80-100%)
            updateProgress({
                stage: "packaging",
                progress: 85,
                message: "Creating ZIP archive...",
            });
            const zipPath = await this.packageAsZip(outputPath);
            updateProgress({
                stage: "packaging",
                progress: 95,
                message: "ZIP archive created",
            });
            updateProgress({
                stage: "complete",
                progress: 100,
                message: "SDK generation complete",
            });
            const result = {
                success: true,
                outputPath: zipPath,
            };
            state.result = result;
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            const result = {
                success: false,
                error: errorMessage,
            };
            state.result = result;
            return result;
        }
        finally {
            // Cleanup after a delay to allow status checks
            setTimeout(() => {
                this.activeGenerations.delete(generationId);
            }, 60000); // Keep state for 1 minute
        }
    }
    /**
     * Cancel an ongoing generation
     * @param generationId - ID of the generation to cancel
     */
    async cancelGeneration(generationId) {
        const state = this.activeGenerations.get(generationId);
        if (!state) {
            throw new Error(`Generation ${generationId} not found`);
        }
        if (state.process) {
            state.process.kill("SIGTERM");
        }
        this.activeGenerations.delete(generationId);
    }
    /**
     * Get the status of a generation
     * @param generationId - ID of the generation
     * @returns Current generation progress or null if not found
     */
    getGenerationStatus(generationId) {
        const state = this.activeGenerations.get(generationId);
        return state ? state.progress : null;
    }
    /**
     * Validate OpenAPI specification
     * @param spec - OpenAPI specification to validate
     * @throws Error if validation fails
     */
    async validateSpec(spec) {
        // Check for required fields
        if (!spec.openapi && !spec.swagger) {
            throw new Error("Invalid OpenAPI specification: missing openapi or swagger version");
        }
        if (!spec.info) {
            throw new Error("Invalid OpenAPI specification: missing info object");
        }
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            throw new Error("Invalid OpenAPI specification: no paths defined");
        }
        // Additional validation using the parser
        // This will throw if the spec is invalid
        try {
            // We don't need the result, just want to validate
            // Note: This requires the spec to be written to a file first
            // For now, we'll do basic validation above
            // Full validation will happen when OpenAPI Generator runs
        }
        catch (error) {
            throw new Error(`OpenAPI specification validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Execute OpenAPI Generator CLI
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     * @param generationId - Unique generation ID
     * @param onProgress - Progress callback (0-100)
     * @returns Path to generated SDK
     */
    async executeOpenAPIGenerator(spec, config, generationId, onProgress) {
        return new Promise((resolve, reject) => {
            const state = this.activeGenerations.get(generationId);
            if (!state) {
                reject(new Error("Generation state not found"));
                return;
            }
            // Setup timeout
            const timeout = setTimeout(() => {
                if (state.process) {
                    state.process.kill("SIGTERM");
                }
                reject(new Error(`SDK generation timed out after ${this.GENERATION_TIMEOUT_MS / 1000} seconds`));
            }, this.GENERATION_TIMEOUT_MS);
            // For now, we'll simulate the generation process
            // In a real implementation, this would spawn the OpenAPI Generator CLI
            // Example command:
            // openapi-generator-cli generate -i spec.json -g typescript-fetch -o output
            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (progress <= 100 && onProgress) {
                    onProgress(progress);
                }
                if (progress >= 100) {
                    clearInterval(progressInterval);
                }
            }, 500);
            // Simulate generation completion
            setTimeout(() => {
                clearTimeout(timeout);
                clearInterval(progressInterval);
                const outputPath = `/tmp/splice-sdks/${generationId}`;
                resolve(outputPath);
            }, 5000);
            // Real implementation would look like:
            /*
            const outputPath = `/tmp/splice-sdks/${generationId}`;
            const specPath = `/tmp/splice-specs/${generationId}.json`;
            
            // Write spec to temp file
            fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
      
            const args = [
              'generate',
              '-i', specPath,
              '-g', 'typescript-fetch',
              '-o', outputPath,
              '--additional-properties',
              `npmName=${config.packageName},npmVersion=${config.packageVersion},supportsES6=true,withInterfaces=true,useSingleRequestParameter=true`
            ];
      
            const process = spawn('openapi-generator-cli', args);
            state.process = process;
      
            let stdout = '';
            let stderr = '';
      
            process.stdout?.on('data', (data) => {
              stdout += data.toString();
              // Parse progress from output if available
            });
      
            process.stderr?.on('data', (data) => {
              stderr += data.toString();
            });
      
            process.on('close', (code) => {
              clearTimeout(timeout);
              
              if (code === 0) {
                resolve(outputPath);
              } else {
                reject(new Error(`OpenAPI Generator failed: ${stderr}`));
              }
            });
      
            process.on('error', (error) => {
              clearTimeout(timeout);
              reject(new Error(`Failed to execute OpenAPI Generator: ${error.message}`));
            });
            */
        });
    }
    /**
     * Generate a unique ID for a generation
     * @returns Unique generation ID
     */
    generateId() {
        return `sdk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Get count of active generations
     * @returns Number of active generations
     */
    getActiveGenerationCount() {
        return this.activeGenerations.size;
    }
    /**
     * Format validation errors into a user-friendly error message
     * @param errors - Array of validation errors
     * @returns Formatted error message
     */
    formatValidationErrors(errors) {
        if (errors.length === 0) {
            return "Configuration validation failed";
        }
        const errorMessages = errors.map((error) => `  - ${error.field}: ${error.message}`);
        return `SDK configuration is invalid:\n${errorMessages.join("\n")}`;
    }
    /**
     * Package generated SDK directory into a ZIP archive
     * @param outputPath - Path to the generated SDK directory
     * @returns Path to the created ZIP file
     */
    async packageAsZip(outputPath) {
        return new Promise((resolve, reject) => {
            // Validate output directory exists
            if (!fs.existsSync(outputPath)) {
                reject(new Error(`Output directory not found: ${outputPath}`));
                return;
            }
            // Create ZIP file path (same directory, .zip extension)
            const zipPath = `${outputPath}.zip`;
            // Create write stream for ZIP file
            const output = fs.createWriteStream(zipPath);
            const archive = (0, archiver_1.default)("zip", {
                zlib: { level: 9 }, // Maximum compression
            });
            // Handle stream events
            output.on("close", () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`[SDKGenerator] ZIP archive created: ${zipPath} (${sizeInMB} MB)`);
                resolve(zipPath);
            });
            output.on("error", (err) => {
                reject(new Error(`Failed to create ZIP file: ${err.message}`));
            });
            archive.on("error", (err) => {
                reject(new Error(`Archive error: ${err.message}`));
            });
            archive.on("warning", (err) => {
                if (err.code === "ENOENT") {
                    console.warn(`[SDKGenerator] Archive warning: ${err.message}`);
                }
                else {
                    reject(err);
                }
            });
            // Pipe archive to output file
            archive.pipe(output);
            // Add all files from the output directory
            // Preserve directory structure in ZIP
            archive.directory(outputPath, false);
            // Finalize the archive
            archive.finalize();
        });
    }
}
exports.SDKGenerator = SDKGenerator;

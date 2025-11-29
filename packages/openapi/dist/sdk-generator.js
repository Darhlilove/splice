/**
 * SDK Generator implementation
 * Orchestrates SDK generation using OpenAPI Generator CLI
 */
import { spawn, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { SDKConfigValidator } from "./sdk-config-validator.js";
import { ReadmeGenerator } from "./readme-generator.js";
const execAsync = promisify(exec);
/**
 * SDK Generator class
 * Handles SDK generation orchestration with progress tracking and resource management
 */
export class SDKGenerator {
    constructor() {
        this.activeGenerations = new Map();
        this.MAX_CONCURRENT_GENERATIONS = 3;
        this.GENERATION_TIMEOUT_MS = 60000; // 60 seconds
        this.configValidator = new SDKConfigValidator();
        this.readmeGenerator = new ReadmeGenerator();
        this.openAPIGeneratorAvailable = null;
    }
    /**
     * Log error with detailed information
     * @param context - Context where error occurred
     * @param error - Error object
     * @param additionalInfo - Additional information to log
     */
    logError(context, error, additionalInfo) {
        console.error(`[SDKGenerator Error] ${context}`);
        console.error(`  Message: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
        if (additionalInfo) {
            console.error(`  Additional Info:`, JSON.stringify(additionalInfo, null, 2));
        }
        console.error(`  Timestamp: ${new Date().toISOString()}`);
    }
    /**
     * Log generation metrics
     * @param generationId - Generation ID
     * @param startTime - Start timestamp
     * @param success - Whether generation succeeded
     * @param error - Error if generation failed
     */
    logGenerationMetrics(generationId, startTime, success, error) {
        const duration = Date.now() - startTime;
        const durationSeconds = (duration / 1000).toFixed(2);
        console.log(`[SDKGenerator Metrics] Generation ${generationId}`);
        console.log(`  Duration: ${durationSeconds}s`);
        console.log(`  Success: ${success}`);
        console.log(`  Active Generations: ${this.activeGenerations.size}`);
        if (error) {
            console.log(`  Error: ${error}`);
        }
        // Log memory usage
        const memUsage = process.memoryUsage();
        console.log(`  Memory Usage:`);
        console.log(`    RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    }
    /**
     * Check if OpenAPI Generator CLI is available
     * @returns True if available, false otherwise
     */
    async checkOpenAPIGeneratorAvailable() {
        // Cache the result to avoid repeated checks
        if (this.openAPIGeneratorAvailable !== null) {
            return this.openAPIGeneratorAvailable;
        }
        try {
            // Try to execute local openapi-generator-cli via npx
            // This is preferred as it uses the project dependency
            await execAsync("npx openapi-generator-cli version");
            this.openAPIGeneratorAvailable = true;
            console.log("[SDKGenerator] OpenAPI Generator CLI detected (via npx)");
            return true;
        }
        catch (error) {
            try {
                // Fallback to global installation
                await execAsync("openapi-generator-cli version");
                this.openAPIGeneratorAvailable = true;
                console.log("[SDKGenerator] OpenAPI Generator CLI detected (global)");
                return true;
            }
            catch (globalError) {
                this.openAPIGeneratorAvailable = false;
                console.warn("[SDKGenerator] OpenAPI Generator CLI not found");
                return false;
            }
        }
    }
    /**
     * Get installation instructions for OpenAPI Generator
     * @returns Formatted installation instructions
     */
    getOpenAPIGeneratorInstallInstructions() {
        return `OpenAPI Generator CLI is not installed or not available in PATH.

Installation Instructions:

Option 1 - NPM (Recommended):
  npm install -g @openapitools/openapi-generator-cli

Option 2 - Yarn:
  yarn global add @openapitools/openapi-generator-cli

Option 3 - Homebrew (macOS):
  brew install openapi-generator

After installation, verify by running:
  openapi-generator-cli version

For more information, visit:
  https://openapi-generator.tech/docs/installation`;
    }
    /**
     * Generate an SDK from an OpenAPI specification
     * @param spec - OpenAPI specification object
     * @param config - SDK configuration
     * @param onProgress - Optional progress callback
     * @returns Generation result with output path or error
     */
    async generateSDK(spec, config, onProgress) {
        var _a, _b, _c, _d;
        const startTime = Date.now();
        const generationId = this.generateId();
        console.log(`[SDKGenerator] Starting generation ${generationId}`);
        console.log(`  Package: ${config.packageName}@${config.packageVersion}`);
        console.log(`  Language: ${config.language}`);
        console.log(`  Spec Info: ${((_a = spec.info) === null || _a === void 0 ? void 0 : _a.title) || "Unknown"} v${((_b = spec.info) === null || _b === void 0 ? void 0 : _b.version) || "Unknown"}`);
        // Check if OpenAPI Generator is available
        const isAvailable = await this.checkOpenAPIGeneratorAvailable();
        if (!isAvailable) {
            const errorMessage = this.getOpenAPIGeneratorInstallInstructions();
            console.error("[SDKGenerator] OpenAPI Generator not available");
            this.logGenerationMetrics(generationId, startTime, false, "OpenAPI Generator not available");
            return {
                success: false,
                error: errorMessage,
            };
        }
        // Validate configuration before starting generation
        const validationResult = this.configValidator.validateConfig(config);
        if (!validationResult.valid) {
            const errorMessage = this.formatValidationErrors(validationResult.errors);
            console.error("[SDKGenerator] Configuration validation failed");
            console.error(`  Errors: ${JSON.stringify(validationResult.errors, null, 2)}`);
            this.logGenerationMetrics(generationId, startTime, false, "Configuration validation failed");
            return {
                success: false,
                error: errorMessage,
            };
        }
        // Check concurrent generation limit
        if (this.activeGenerations.size >= this.MAX_CONCURRENT_GENERATIONS) {
            const errorMessage = `Maximum concurrent generations (${this.MAX_CONCURRENT_GENERATIONS}) reached. Please try again later.`;
            console.warn(`[SDKGenerator] ${errorMessage}`);
            console.warn(`  Active generations: ${this.activeGenerations.size}`);
            this.logGenerationMetrics(generationId, startTime, false, errorMessage);
            return {
                success: false,
                error: errorMessage,
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
        console.log(`[SDKGenerator] Generation state initialized for ${generationId}`);
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
            // Generate and write README
            updateProgress({
                stage: "generating",
                progress: 82,
                message: "Generating README...",
            });
            await this.generateAndWriteReadme(spec, config, outputPath);
            updateProgress({
                stage: "generating",
                progress: 85,
                message: "README generated",
            });
            // Stage 3: Package (85-100%)
            updateProgress({
                stage: "packaging",
                progress: 88,
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
            // Log successful generation metrics
            this.logGenerationMetrics(generationId, startTime, true);
            console.log(`[SDKGenerator] Generation ${generationId} completed successfully`);
            console.log(`  Output: ${zipPath}`);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            // Log detailed error information
            if (error instanceof Error) {
                this.logError("SDK Generation Failed", error, {
                    generationId,
                    packageName: config.packageName,
                    packageVersion: config.packageVersion,
                    specTitle: (_c = spec.info) === null || _c === void 0 ? void 0 : _c.title,
                    specVersion: (_d = spec.info) === null || _d === void 0 ? void 0 : _d.version,
                });
            }
            else {
                console.error(`[SDKGenerator] Unknown error during generation ${generationId}`);
                console.error(`  Error: ${errorMessage}`);
            }
            const result = {
                success: false,
                error: errorMessage,
            };
            state.result = result;
            // Log failed generation metrics
            this.logGenerationMetrics(generationId, startTime, false, errorMessage);
            return result;
        }
        finally {
            // Cleanup after a delay to allow status checks
            setTimeout(() => {
                console.log(`[SDKGenerator] Cleaning up generation state for ${generationId}`);
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
        const validationErrors = [];
        // Check for required fields
        if (!spec.openapi && !spec.swagger) {
            validationErrors.push("Missing OpenAPI version field (openapi or swagger)");
        }
        if (!spec.info) {
            validationErrors.push("Missing info object");
        }
        else {
            if (!spec.info.title) {
                validationErrors.push("Missing info.title");
            }
            if (!spec.info.version) {
                validationErrors.push("Missing info.version");
            }
        }
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            validationErrors.push("No paths defined - at least one path is required");
        }
        // Validate path structure
        if (spec.paths) {
            for (const [path, pathItem] of Object.entries(spec.paths)) {
                if (!path.startsWith("/")) {
                    validationErrors.push(`Path "${path}" must start with /`);
                }
                // Check if at least one operation is defined
                const operations = [
                    "get",
                    "post",
                    "put",
                    "patch",
                    "delete",
                    "options",
                    "head",
                    "trace",
                ];
                const hasOperation = operations.some((op) => pathItem[op]);
                if (!hasOperation) {
                    validationErrors.push(`Path "${path}" has no operations defined`);
                }
            }
        }
        // If we have validation errors, throw with formatted message
        if (validationErrors.length > 0) {
            const errorMessage = this.formatSpecValidationErrors(validationErrors);
            throw new Error(errorMessage);
        }
        // Skip additional validation with OpenAPI Generator as specs are already validated during upload
        // This avoids potential command not found issues and redundant validation
        // If needed in the future, ensure the command uses npx properly
        /*
        try {
          await this.validateSpecWithGenerator(spec);
        } catch (error) {
          // If generator validation fails, include those errors
          throw error;
        }
        */
    }
    /**
     * Validate spec using OpenAPI Generator's validate command
     * @param spec - OpenAPI specification to validate
     * @throws Error if validation fails
     */
    async validateSpecWithGenerator(spec) {
        // Write spec to temporary file for validation
        const tempDir = "/tmp/splice-specs";
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempSpecPath = path.join(tempDir, `validate-${Date.now()}.json`);
        try {
            fs.writeFileSync(tempSpecPath, JSON.stringify(spec, null, 2));
            // Run OpenAPI Generator validate command using npx to ensure we use the local version
            const { stdout, stderr } = await execAsync(`npx openapi-generator-cli validate -i ${tempSpecPath}`);
            console.log("[SDKGenerator] Spec validation passed");
            // Clean up temp file
            fs.unlinkSync(tempSpecPath);
        }
        catch (error) {
            // Clean up temp file
            if (fs.existsSync(tempSpecPath)) {
                fs.unlinkSync(tempSpecPath);
            }
            // Parse validation errors from OpenAPI Generator output
            if (error instanceof Error && "stderr" in error) {
                const stderr = error.stderr || "";
                const stdout = error.stdout || "";
                const output = stderr || stdout;
                // Extract meaningful error messages
                const errorLines = output
                    .split("\n")
                    .filter((line) => line.includes("error") ||
                    line.includes("Error") ||
                    line.includes("invalid") ||
                    line.includes("Invalid"))
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);
                if (errorLines.length > 0) {
                    throw new Error(`OpenAPI specification validation failed:\n\n${errorLines.join("\n")}\n\nPlease fix these issues and try again.`);
                }
            }
            // Generic validation error
            throw new Error(`OpenAPI specification validation failed. Please ensure your spec is valid according to the OpenAPI specification.\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Format spec validation errors into a user-friendly message
     * @param errors - Array of validation error messages
     * @returns Formatted error message
     */
    formatSpecValidationErrors(errors) {
        return `OpenAPI specification validation failed:

${errors.map((error, index) => `  ${index + 1}. ${error}`).join("\n")}

Please fix these issues and try again.`;
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
            var _a, _b;
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
                reject(new Error(`SDK generation timed out after ${this.GENERATION_TIMEOUT_MS / 1000} seconds. Try simplifying your OpenAPI specification or breaking it into smaller parts.`));
            }, this.GENERATION_TIMEOUT_MS);
            // Prepare paths
            const outputPath = `/tmp/splice-sdks/${generationId}`;
            const specPath = `/tmp/splice-specs/${generationId}.json`;
            try {
                // Ensure directories exist
                const specsDir = "/tmp/splice-specs";
                const sdksDir = "/tmp/splice-sdks";
                if (!fs.existsSync(specsDir)) {
                    fs.mkdirSync(specsDir, { recursive: true });
                }
                if (!fs.existsSync(sdksDir)) {
                    fs.mkdirSync(sdksDir, { recursive: true });
                }
                // Write spec to temp file
                fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
                // Build OpenAPI Generator command arguments
                // Configure additional properties for enhanced SDK quality
                const additionalProps = [
                    `npmName=${config.packageName}`,
                    `npmVersion=${config.packageVersion}`,
                    `supportsES6=true`, // Enable ES6 features (arrow functions, const/let, etc.)
                    `withInterfaces=true`, // Generate TypeScript interfaces for all models
                    `useSingleRequestParameter=true`, // Simplify API method signatures
                    `npmRepository=https://registry.npmjs.org`, // Set NPM registry
                    `snapshot=false`, // Generate stable release version
                    `ensureUniqueParams=true`, // Ensure parameter names are unique
                    `sortParamsByRequiredFlag=true`, // Sort parameters (required first)
                    `sortModelPropertiesByRequiredFlag=true`, // Sort model properties
                    `prependFormOrBodyParameters=false`, // Keep natural parameter order
                    `withSeparateModelsAndApi=true`, // Separate models and API files for better organization
                    `modelPropertyNaming=original`, // Preserve original property names from spec
                    `paramNaming=camelCase`, // Use camelCase for parameter names
                ];
                // Add optional author if provided
                if (config.author) {
                    additionalProps.push(`npmAuthor=${config.author}`);
                }
                // Add optional description if provided
                if (config.description) {
                    additionalProps.push(`npmDescription=${config.description}`);
                }
                const args = [
                    "generate",
                    "-i",
                    specPath,
                    "-g",
                    "typescript-fetch",
                    "-o",
                    outputPath,
                    "--additional-properties",
                    additionalProps.join(","),
                ];
                // Note: JSDoc comments are automatically generated by the typescript-fetch generator
                // from the OpenAPI spec's description fields (operation summaries, descriptions,
                // schema descriptions, and property descriptions). No additional configuration needed.
                // Resolve path to openapi-generator-cli main.js
                // We use direct Node execution instead of the shell wrapper to avoid path issues
                let mainJsPath = null;
                const possibleMainJsPaths = [
                    // From apps/web (cwd) -> root node_modules
                    path.resolve(process.cwd(), "../../node_modules/@openapitools/openapi-generator-cli/main.js"),
                    // From root (cwd) -> node_modules
                    path.resolve(process.cwd(), "node_modules/@openapitools/openapi-generator-cli/main.js"),
                    // From apps/web (cwd) -> packages/openapi (legacy)
                    path.resolve(process.cwd(), "../../packages/openapi/node_modules/@openapitools/openapi-generator-cli/main.js"),
                    // From root (cwd) -> packages/openapi (legacy)
                    path.resolve(process.cwd(), "packages/openapi/node_modules/@openapitools/openapi-generator-cli/main.js"),
                ];
                console.log("[SDKGenerator] Searching for openapi-generator-cli main.js:");
                console.log(`  Current working directory: ${process.cwd()}`);
                for (const p of possibleMainJsPaths) {
                    console.log(`  Checking: ${p}`);
                    if (fs.existsSync(p)) {
                        mainJsPath = p;
                        console.log(`  ✓ Found main.js at: ${p}`);
                        break;
                    }
                }
                if (!mainJsPath) {
                    throw new Error("Could not find openapi-generator-cli. Please ensure @openapitools/openapi-generator-cli is installed.");
                }
                // Spawn OpenAPI Generator process using Node directly
                const command = "node";
                const finalArgs = [mainJsPath, ...args];
                console.log(`[SDKGenerator] Executing: ${command} ${finalArgs.join(" ")}`);
                const processChild = spawn(command, finalArgs);
                state.process = processChild;
                let stdout = "";
                let stderr = "";
                // Capture stdout
                (_a = processChild.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
                    const output = data.toString();
                    stdout += output;
                    // Parse progress from output if available
                    // OpenAPI Generator doesn't provide detailed progress, so we estimate
                    if (output.includes("writing file")) {
                        if (onProgress) {
                            onProgress(Math.min(90, (stdout.match(/writing file/g) || []).length * 5));
                        }
                    }
                });
                // Capture stderr
                (_b = processChild.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (data) => {
                    const output = data.toString();
                    stderr += output;
                });
                // Handle process completion
                processChild.on("close", (code) => {
                    clearTimeout(timeout);
                    // Clean up spec file
                    if (fs.existsSync(specPath)) {
                        fs.unlinkSync(specPath);
                    }
                    if (code === 0) {
                        resolve(outputPath);
                    }
                    else {
                        console.error(`[SDKGenerator] Generation failed with code ${code}`);
                        // Parse error output for unsupported features
                        const unsupportedFeatures = this.parseUnsupportedFeatures(stdout, stderr);
                        if (unsupportedFeatures.length > 0) {
                            reject(new Error(this.formatUnsupportedFeaturesError(unsupportedFeatures)));
                        }
                        else {
                            // Generic error with full output
                            const errorOutput = stderr || stdout;
                            reject(new Error(`SDK generation failed:\n\n${errorOutput}\n\nPlease check your OpenAPI specification and try again.`));
                        }
                    }
                });
                // Handle process errors
                processChild.on("error", (error) => {
                    clearTimeout(timeout);
                    // Clean up spec file
                    if (fs.existsSync(specPath)) {
                        fs.unlinkSync(specPath);
                    }
                    reject(new Error(`Failed to execute OpenAPI Generator: ${error.message}\n\nPlease ensure openapi-generator-cli is installed and available in PATH.`));
                });
            }
            catch (error) {
                clearTimeout(timeout);
                // Clean up spec file
                if (fs.existsSync(specPath)) {
                    fs.unlinkSync(specPath);
                }
                reject(new Error(`Failed to prepare SDK generation: ${error instanceof Error ? error.message : "Unknown error"}`));
            }
        });
    }
    /**
     * Parse unsupported features from OpenAPI Generator output
     * @param stdout - Standard output from generator
     * @param stderr - Standard error from generator
     * @returns Array of unsupported feature descriptions
     */
    parseUnsupportedFeatures(stdout, stderr) {
        const unsupportedFeatures = [];
        const output = `${stdout}\n${stderr}`;
        // Common patterns for unsupported features
        const patterns = [
            /not supported/i,
            /unsupported/i,
            /not implemented/i,
            /cannot handle/i,
            /unable to process/i,
        ];
        const lines = output.split("\n");
        for (const line of lines) {
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    // Extract the feature description
                    const trimmedLine = line.trim();
                    if (trimmedLine && !unsupportedFeatures.includes(trimmedLine)) {
                        unsupportedFeatures.push(trimmedLine);
                    }
                }
            }
        }
        return unsupportedFeatures;
    }
    /**
     * Format unsupported features error message
     * @param features - Array of unsupported feature descriptions
     * @returns Formatted error message with suggestions
     */
    formatUnsupportedFeaturesError(features) {
        return `SDK generation failed due to unsupported OpenAPI features:

${features.map((feature, index) => `  ${index + 1}. ${feature}`).join("\n")}

Suggestions:
  - Remove or simplify the unsupported features in your OpenAPI specification
  - Use a different generator template that supports these features
  - Check the OpenAPI Generator documentation for feature support: https://openapi-generator.tech/docs/generators/typescript-fetch
  - Consider using a more recent version of OpenAPI Generator

If you believe this is an error, please check the OpenAPI Generator logs for more details.`;
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
     * Generate README and write it to the output directory
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     * @param outputPath - Path to the generated SDK directory
     */
    async generateAndWriteReadme(spec, config, outputPath) {
        // Generate README content
        const readmeContent = this.readmeGenerator.generate(spec, config);
        // Ensure output directory exists
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        // Write README.md to output directory
        const readmePath = path.join(outputPath, "README.md");
        fs.writeFileSync(readmePath, readmeContent, "utf-8");
        console.log(`[SDKGenerator] README generated: ${readmePath}`);
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
            const archive = archiver("zip", {
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

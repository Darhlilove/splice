/**
 * SDK Generator implementation
 * Orchestrates SDK generation using OpenAPI Generator CLI
 */
import type { OpenAPISpec } from "./types.js";
/**
 * SDK configuration options
 */
export interface SDKConfig {
    packageName: string;
    packageVersion: string;
    author?: string;
    description?: string;
    language: "typescript";
}
/**
 * Generation result
 */
export interface GenerationResult {
    success: boolean;
    outputPath?: string;
    downloadUrl?: string;
    error?: string;
    warnings?: string[];
}
/**
 * Generation progress information
 */
export interface GenerationProgress {
    stage: "validating" | "generating" | "packaging" | "complete";
    progress: number;
    message: string;
}
/**
 * SDK Generator class
 * Handles SDK generation orchestration with progress tracking and resource management
 */
export declare class SDKGenerator {
    private activeGenerations;
    private readonly MAX_CONCURRENT_GENERATIONS;
    private readonly GENERATION_TIMEOUT_MS;
    private readonly configValidator;
    private readonly readmeGenerator;
    private openAPIGeneratorAvailable;
    /**
     * Log error with detailed information
     * @param context - Context where error occurred
     * @param error - Error object
     * @param additionalInfo - Additional information to log
     */
    private logError;
    /**
     * Log generation metrics
     * @param generationId - Generation ID
     * @param startTime - Start timestamp
     * @param success - Whether generation succeeded
     * @param error - Error if generation failed
     */
    private logGenerationMetrics;
    /**
     * Check if OpenAPI Generator CLI is available
     * @returns True if available, false otherwise
     */
    private checkOpenAPIGeneratorAvailable;
    /**
     * Get installation instructions for OpenAPI Generator
     * @returns Formatted installation instructions
     */
    private getOpenAPIGeneratorInstallInstructions;
    /**
     * Generate an SDK from an OpenAPI specification
     * @param spec - OpenAPI specification object
     * @param config - SDK configuration
     * @param onProgress - Optional progress callback
     * @returns Generation result with output path or error
     */
    generateSDK(spec: OpenAPISpec, config: SDKConfig, onProgress?: (progress: GenerationProgress) => void): Promise<GenerationResult>;
    /**
     * Cancel an ongoing generation
     * @param generationId - ID of the generation to cancel
     */
    cancelGeneration(generationId: string): Promise<void>;
    /**
     * Get the status of a generation
     * @param generationId - ID of the generation
     * @returns Current generation progress or null if not found
     */
    getGenerationStatus(generationId: string): GenerationProgress | null;
    /**
     * Validate OpenAPI specification
     * @param spec - OpenAPI specification to validate
     * @throws Error if validation fails
     */
    private validateSpec;
    /**
     * Validate spec using OpenAPI Generator's validate command
     * @param spec - OpenAPI specification to validate
     * @throws Error if validation fails
     */
    private validateSpecWithGenerator;
    /**
     * Format spec validation errors into a user-friendly message
     * @param errors - Array of validation error messages
     * @returns Formatted error message
     */
    private formatSpecValidationErrors;
    /**
     * Execute OpenAPI Generator CLI
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     * @param generationId - Unique generation ID
     * @param onProgress - Progress callback (0-100)
     * @returns Path to generated SDK
     */
    private executeOpenAPIGenerator;
    /**
     * Parse unsupported features from OpenAPI Generator output
     * @param stdout - Standard output from generator
     * @param stderr - Standard error from generator
     * @returns Array of unsupported feature descriptions
     */
    private parseUnsupportedFeatures;
    /**
     * Format unsupported features error message
     * @param features - Array of unsupported feature descriptions
     * @returns Formatted error message with suggestions
     */
    private formatUnsupportedFeaturesError;
    /**
     * Generate a unique ID for a generation
     * @returns Unique generation ID
     */
    private generateId;
    /**
     * Get count of active generations
     * @returns Number of active generations
     */
    getActiveGenerationCount(): number;
    /**
     * Format validation errors into a user-friendly error message
     * @param errors - Array of validation errors
     * @returns Formatted error message
     */
    private formatValidationErrors;
    /**
     * Generate README and write it to the output directory
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     * @param outputPath - Path to the generated SDK directory
     */
    private generateAndWriteReadme;
    /**
     * Package generated SDK directory into a ZIP archive
     * @param outputPath - Path to the generated SDK directory
     * @returns Path to the created ZIP file
     */
    private packageAsZip;
}
//# sourceMappingURL=sdk-generator.d.ts.map
/**
 * SDK Enhancer
 * Injects additional files into generated SDKs for better developer experience
 * - Environment variable support
 * - Credential providers
 * - Enhanced HTTP client with interceptors
 * - Comprehensive README with security best practices
 */
import type { OpenAPISpec } from './types.js';
import type { SDKConfig } from './sdk-generator.js';
export declare class SDKEnhancer {
    private readonly templatesDir;
    constructor();
    /**
     * Enhance generated SDK with additional files
     * @param outputPath - Path to generated SDK directory
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     */
    enhanceSDK(outputPath: string, spec: OpenAPISpec, config: SDKConfig): Promise<void>;
    /**
     * Create placeholder replacements
     */
    private createPlaceholders;
    /**
     * Replace placeholders in template content
     */
    private replacePlaceholders;
    /**
     * Create organized folder structure
     */
    private createFolderStructure;
    /**
     * Inject client.ts file (main SDK entry point)
     */
    private injectClientFile;
    /**
     * Inject HTTP-related files (httpClient.ts, interceptors.ts)
     */
    private injectHttpFiles;
    /**
     * Inject auth-related files (credential providers)
     */
    private injectAuthFiles;
    /**
     * Inject utils files (error, logger, constants)
     */
    private injectUtilsFiles;
    /**
     * Inject config.ts file
     */
    private injectConfigFile;
    /**
     * Inject credentialProvider.ts file
     */
    private injectCredentialProviderFile;
    /**
     * Inject httpClient.ts file
     */
    private injectHttpClientFile;
    /**
     * Inject .env.example file
     */
    private injectEnvExample;
    /**
     * Enhance README.md with security best practices
     */
    private enhanceReadme;
    /**
     * Update package.json with additional exports
     */
    private updatePackageJson;
}
//# sourceMappingURL=sdk-enhancer.d.ts.map
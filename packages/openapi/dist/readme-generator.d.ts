/**
 * README Generator for SDK packages
 * Generates comprehensive README.md files with installation, usage, and examples
 */
import type { OpenAPISpec, SDKConfig } from "./index.js";
/**
 * README Generator class
 * Creates comprehensive README documentation for generated SDKs
 */
export declare class ReadmeGenerator {
    /**
     * Generate a complete README.md content
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     * @returns README content as markdown string
     */
    generate(spec: OpenAPISpec, config: SDKConfig): string;
    /**
     * Generate header with title and description
     */
    private generateHeader;
    /**
     * Generate installation section with package name
     * Validates: Requirements 6.1
     */
    private generateInstallSection;
    /**
     * Generate quick start section with API initialization
     * Validates: Requirements 6.2
     */
    private generateQuickStartSection;
    /**
     * Generate authentication section based on spec security schemes
     * Validates: Requirements 6.3
     */
    private generateAuthenticationSection;
    /**
     * Generate code examples for 3 sample endpoints
     * Validates: Requirements 6.4
     */
    private generateExamplesSection;
    /**
     * Generate API reference section
     */
    private generateApiReferenceSection;
    /**
     * Get base URL from spec
     */
    private getBaseUrl;
    /**
     * Check if spec has authentication
     */
    private hasAuthentication;
    /**
     * Get sample endpoints from spec
     */
    private getSampleEndpoints;
    /**
     * Generate function name from endpoint
     */
    private generateFunctionName;
    /**
     * Generate method call code
     */
    private generateMethodCall;
}
//# sourceMappingURL=readme-generator.d.ts.map
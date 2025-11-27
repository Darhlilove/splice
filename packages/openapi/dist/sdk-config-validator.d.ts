/**
 * SDK Configuration Validator
 * Validates SDK configuration parameters according to NPM and semantic versioning rules
 */
import type { SDKConfig } from "./sdk-generator.js";
/**
 * Validation error for a specific field
 */
export interface ValidationError {
    field: string;
    message: string;
}
/**
 * Validation result containing validity status and any errors
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
/**
 * SDK Configuration Validator
 * Validates package names, versions, and other configuration parameters
 */
export declare class SDKConfigValidator {
    private readonly PACKAGE_NAME_MIN_LENGTH;
    private readonly PACKAGE_NAME_MAX_LENGTH;
    private readonly PACKAGE_NAME_REGEX;
    private readonly SEMVER_REGEX;
    private readonly DESCRIPTION_MAX_LENGTH;
    /**
     * Validate package name according to NPM naming rules
     * @param name - Package name to validate
     * @returns Validation error if invalid, null if valid
     */
    validatePackageName(name: string): ValidationError | null;
    /**
     * Validate version according to semantic versioning rules
     * @param version - Version string to validate
     * @returns Validation error if invalid, null if valid
     */
    validateVersion(version: string): ValidationError | null;
    /**
     * Validate author field
     * @param author - Author string to validate
     * @returns Validation error if invalid, null if valid
     */
    validateAuthor(author: string | undefined): ValidationError | null;
    /**
     * Validate description field
     * @param description - Description string to validate
     * @returns Validation error if invalid, null if valid
     */
    validateDescription(description: string | undefined): ValidationError | null;
    /**
     * Validate language field
     * @param language - Language to validate
     * @returns Validation error if invalid, null if valid
     */
    validateLanguage(language: string): ValidationError | null;
    /**
     * Validate complete SDK configuration
     * @param config - SDK configuration to validate
     * @returns Validation result with all errors
     */
    validateConfig(config: SDKConfig): ValidationResult;
}
//# sourceMappingURL=sdk-config-validator.d.ts.map
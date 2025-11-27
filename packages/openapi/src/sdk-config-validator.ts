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
export class SDKConfigValidator {
  // NPM package name rules
  private readonly PACKAGE_NAME_MIN_LENGTH = 1;
  private readonly PACKAGE_NAME_MAX_LENGTH = 214;
  private readonly PACKAGE_NAME_REGEX =
    /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

  // Semantic versioning regex (supports major.minor.patch with optional pre-release and build metadata)
  private readonly SEMVER_REGEX =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  // Description max length
  private readonly DESCRIPTION_MAX_LENGTH = 500;

  /**
   * Validate package name according to NPM naming rules
   * @param name - Package name to validate
   * @returns Validation error if invalid, null if valid
   */
  validatePackageName(name: string): ValidationError | null {
    if (!name || typeof name !== "string") {
      return {
        field: "packageName",
        message: "Package name is required and must be a string",
      };
    }

    // Check length
    if (name.length < this.PACKAGE_NAME_MIN_LENGTH) {
      return {
        field: "packageName",
        message: "Package name cannot be empty",
      };
    }

    if (name.length > this.PACKAGE_NAME_MAX_LENGTH) {
      return {
        field: "packageName",
        message: `Package name cannot exceed ${this.PACKAGE_NAME_MAX_LENGTH} characters`,
      };
    }

    // Check for invalid characters and format
    if (!this.PACKAGE_NAME_REGEX.test(name)) {
      return {
        field: "packageName",
        message:
          "Package name must be lowercase and can only contain letters, numbers, hyphens, underscores, and periods. Scoped packages must start with @",
      };
    }

    // Check for leading/trailing spaces
    if (name !== name.trim()) {
      return {
        field: "packageName",
        message: "Package name cannot have leading or trailing spaces",
      };
    }

    // Check for reserved names
    const reservedNames = ["node_modules", "favicon.ico"];
    if (reservedNames.includes(name.toLowerCase())) {
      return {
        field: "packageName",
        message: `Package name "${name}" is reserved and cannot be used`,
      };
    }

    // Check for URL-unsafe characters
    if (name !== encodeURIComponent(name)) {
      return {
        field: "packageName",
        message: "Package name cannot contain URL-unsafe characters",
      };
    }

    return null;
  }

  /**
   * Validate version according to semantic versioning rules
   * @param version - Version string to validate
   * @returns Validation error if invalid, null if valid
   */
  validateVersion(version: string): ValidationError | null {
    if (!version || typeof version !== "string") {
      return {
        field: "packageVersion",
        message: "Package version is required and must be a string",
      };
    }

    // Check semantic versioning format
    if (!this.SEMVER_REGEX.test(version)) {
      return {
        field: "packageVersion",
        message:
          "Package version must follow semantic versioning format (e.g., 1.0.0, 2.1.3-beta, 1.0.0+build.123)",
      };
    }

    return null;
  }

  /**
   * Validate author field
   * @param author - Author string to validate
   * @returns Validation error if invalid, null if valid
   */
  validateAuthor(author: string | undefined): ValidationError | null {
    // Author is optional
    if (author === undefined || author === null) {
      return null;
    }

    if (typeof author !== "string") {
      return {
        field: "author",
        message: "Author must be a string",
      };
    }

    // Author can be any non-empty string if provided
    if (author.trim().length === 0) {
      return {
        field: "author",
        message: "Author cannot be an empty string if provided",
      };
    }

    return null;
  }

  /**
   * Validate description field
   * @param description - Description string to validate
   * @returns Validation error if invalid, null if valid
   */
  validateDescription(description: string | undefined): ValidationError | null {
    // Description is optional
    if (description === undefined || description === null) {
      return null;
    }

    if (typeof description !== "string") {
      return {
        field: "description",
        message: "Description must be a string",
      };
    }

    // Description can be any string, but has a max length
    if (description.length > this.DESCRIPTION_MAX_LENGTH) {
      return {
        field: "description",
        message: `Description cannot exceed ${this.DESCRIPTION_MAX_LENGTH} characters`,
      };
    }

    return null;
  }

  /**
   * Validate language field
   * @param language - Language to validate
   * @returns Validation error if invalid, null if valid
   */
  validateLanguage(language: string): ValidationError | null {
    if (!language || typeof language !== "string") {
      return {
        field: "language",
        message: "Language is required and must be a string",
      };
    }

    // Currently only TypeScript is supported
    if (language !== "typescript") {
      return {
        field: "language",
        message: 'Only "typescript" language is currently supported',
      };
    }

    return null;
  }

  /**
   * Validate complete SDK configuration
   * @param config - SDK configuration to validate
   * @returns Validation result with all errors
   */
  validateConfig(config: SDKConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    const packageNameError = this.validatePackageName(config.packageName);
    if (packageNameError) {
      errors.push(packageNameError);
    }

    const versionError = this.validateVersion(config.packageVersion);
    if (versionError) {
      errors.push(versionError);
    }

    const languageError = this.validateLanguage(config.language);
    if (languageError) {
      errors.push(languageError);
    }

    // Validate optional fields
    const authorError = this.validateAuthor(config.author);
    if (authorError) {
      errors.push(authorError);
    }

    const descriptionError = this.validateDescription(config.description);
    if (descriptionError) {
      errors.push(descriptionError);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

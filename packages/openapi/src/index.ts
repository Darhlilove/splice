/**
 * OpenAPI Parser - Public API
 *
 * This module provides a simple interface for parsing OpenAPI/Swagger specifications
 * and extracting structured data for use in API tooling.
 */

// Export main parser function
export { parseOpenAPISpec } from "./parser.js";

// Export all type definitions
export type {
  ParsedSpec,
  APIInfo,
  Server,
  Contact,
  License,
  Endpoint,
  HTTPMethod,
  Parameter,
  RequestBody,
  Response,
  MediaType,
  SchemaObject,
  OpenAPISpec,
} from "./types.js";

// Export error class
export { ParserError } from "./types.js";

// Export store functions
export {
  generateSpecId,
  saveSpec,
  getSpec,
  deleteSpec,
  clearAllSpecs,
  getStoreSize,
  getAllSpecIds,
} from "./store.js";

// Export utility functions
export { removeCircularReferences, safeStringify } from "./utils.js";

// Export mock server manager
export { MockServerManager, getMockServerManager } from "./mock-manager.js";

// Export mock server types
export type { MockServerConfig, MockServerInfo } from "./mock-manager.js";

// Export SDK generator
export { SDKGenerator } from "./sdk-generator.js";

// Export SDK generator types
export type {
  SDKConfig,
  GenerationResult,
  GenerationProgress,
} from "./sdk-generator.js";

// Export SDK config validator
export { SDKConfigValidator } from "./sdk-config-validator.js";

// Export SDK config validator types
export type {
  ValidationError,
  ValidationResult,
} from "./sdk-config-validator.js";

// Export file manager
export { FileManager } from "./file-manager.js";

// Export file manager types
export type { StoredFile } from "./file-manager.js";

// Export file manager singleton
export {
  getFileManager,
  shutdownFileManager,
  resetFileManager,
} from "./file-manager-instance.js";

// Export README generator
export { ReadmeGenerator } from "./readme-generator.js";

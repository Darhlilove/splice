/**
 * OpenAPI Parser - Public API
 *
 * This module provides a simple interface for parsing OpenAPI/Swagger specifications
 * and extracting structured data for use in API tooling.
 */
// Export main parser function
export { parseOpenAPISpec } from "./parser.js";
// Export error class
export { ParserError } from "./types.js";
// Export store functions
export { generateSpecId, saveSpec, getSpec, deleteSpec, clearAllSpecs, getStoreSize, getAllSpecIds, } from "./store.js";
// Export utility functions
export { removeCircularReferences, safeStringify } from "./utils.js";

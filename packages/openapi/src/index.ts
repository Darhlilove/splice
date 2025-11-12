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
} from "./types.js";

// Export error class
export { ParserError } from "./types.js";

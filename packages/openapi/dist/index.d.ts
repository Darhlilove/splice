/**
 * OpenAPI Parser - Public API
 *
 * This module provides a simple interface for parsing OpenAPI/Swagger specifications
 * and extracting structured data for use in API tooling.
 */
export { parseOpenAPISpec } from "./parser.js";
export type { ParsedSpec, APIInfo, Server, Contact, License, Endpoint, HTTPMethod, Parameter, RequestBody, Response, MediaType, SchemaObject, } from "./types.js";
export { ParserError } from "./types.js";
export { generateSpecId, saveSpec, getSpec, deleteSpec, clearAllSpecs, getStoreSize, getAllSpecIds, } from "./store.js";
//# sourceMappingURL=index.d.ts.map
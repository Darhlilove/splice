"use strict";
/**
 * OpenAPI specification parser implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpenAPISpec = parseOpenAPISpec;
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const types_js_1 = require("./types.js");
/**
 * Parse an OpenAPI specification from a file path or URL
 * @param source - File path or URL to the OpenAPI specification
 * @returns Parsed specification with structured data
 * @throws ParserError if parsing fails
 */
async function parseOpenAPISpec(source) {
    try {
        // Use bundle() to preserve internal $refs (especially in schemas)
        // This keeps references like {"$ref": "#/components/schemas/Pet"} intact
        const bundledApi = (await swagger_parser_1.default.bundle(source));
        // Also dereference to get a fully resolved version for extracting requestBodies
        const dereferencedApi = (await swagger_parser_1.default.dereference(source));
        // Extract info from bundled (doesn't matter which)
        const info = extractInfo(bundledApi);
        // Extract schemas from bundled to preserve $refs within schemas
        const schemas = extractSchemas(bundledApi);
        // Extract endpoints using both versions:
        // - Use dereferenced for requestBody/response content extraction
        // - But preserve $refs in the actual schema objects
        const endpoints = extractEndpointsHybrid(bundledApi, dereferencedApi);
        return {
            info,
            endpoints,
            schemas,
        };
    }
    catch (error) {
        throw handleParserError(error, source);
    }
}
/**
 * Extract API metadata from the specification
 */
function extractInfo(api) {
    const info = {
        title: api.info?.title || "Untitled API",
        version: api.info?.version || "1.0.0",
    };
    // Add optional description
    if (api.info?.description) {
        info.description = api.info.description;
    }
    // Handle servers for OpenAPI 3.x
    if (api.openapi && api.servers && Array.isArray(api.servers)) {
        info.servers = api.servers.map((server) => ({
            url: server.url,
            ...(server.description && { description: server.description }),
        }));
    }
    // Construct servers from Swagger 2.0 host/basePath/schemes
    else if (api.swagger === "2.0") {
        const schemes = api.schemes || ["https"];
        const host = api.host || "";
        const basePath = api.basePath || "";
        if (host) {
            info.servers = schemes.map((scheme) => ({
                url: `${scheme}://${host}${basePath}`,
            }));
        }
    }
    // Extract contact information
    if (api.info?.contact) {
        info.contact = {};
        if (api.info.contact.name)
            info.contact.name = api.info.contact.name;
        if (api.info.contact.email)
            info.contact.email = api.info.contact.email;
        if (api.info.contact.url)
            info.contact.url = api.info.contact.url;
    }
    // Extract license information
    if (api.info?.license?.name) {
        info.license = {
            name: api.info.license.name,
            ...(api.info.license.url && { url: api.info.license.url }),
        };
    }
    return info;
}
/**
 * Extract all endpoints using a hybrid approach
 * Uses bundled API for schema $refs and dereferenced API for requestBody/response content
 */
function extractEndpointsHybrid(bundledApi, dereferencedApi) {
    const endpoints = [];
    if (!bundledApi.paths) {
        return endpoints;
    }
    // Iterate through all paths
    for (const [path, pathItem] of Object.entries(bundledApi.paths)) {
        if (!pathItem || typeof pathItem !== "object")
            continue;
        // Get the dereferenced version of this path
        const dereferencedPathItem = dereferencedApi.paths?.[path];
        // Iterate through HTTP methods
        const methods = [
            "get",
            "post",
            "put",
            "patch",
            "delete",
            "options",
            "head",
            "trace",
        ];
        for (const method of methods) {
            const operation = pathItem[method];
            const dereferencedOperation = dereferencedPathItem?.[method];
            if (!operation)
                continue;
            const endpoint = {
                path,
                method,
                responses: {},
            };
            // Extract operationId, summary, description
            if (operation.operationId)
                endpoint.operationId = operation.operationId;
            if (operation.summary)
                endpoint.summary = operation.summary;
            if (operation.description)
                endpoint.description = operation.description;
            // Extract tags
            if (operation.tags && Array.isArray(operation.tags)) {
                endpoint.tags = operation.tags;
            }
            // Extract parameters (use bundled - parameters usually don't have complex refs)
            if (operation.parameters && Array.isArray(operation.parameters)) {
                endpoint.parameters = operation.parameters.map((param) => {
                    const parameter = {
                        name: param.name || "",
                        in: param.in || "query",
                        required: param.required || false,
                        schema: (param.schema || param),
                    };
                    if (param.description) {
                        parameter.description = param.description;
                    }
                    return parameter;
                });
            }
            // Extract requestBody - use dereferenced to resolve requestBodies refs
            // but use bundled schemas to preserve schema $refs
            if (dereferencedOperation?.requestBody) {
                const rb = dereferencedOperation.requestBody;
                endpoint.requestBody = {
                    required: rb.required || false,
                    content: {},
                };
                if (rb.description) {
                    endpoint.requestBody.description = rb.description;
                }
                if (rb.content && typeof rb.content === "object") {
                    for (const [contentType, mediaTypeObj] of Object.entries(rb.content)) {
                        if (mediaTypeObj &&
                            typeof mediaTypeObj === "object" &&
                            "schema" in mediaTypeObj) {
                            // Use the bundled version's schema if available to preserve $refs
                            const bundledSchema = operation.requestBody?.content?.[contentType]?.schema;
                            endpoint.requestBody.content[contentType] = {
                                schema: (bundledSchema ||
                                    mediaTypeObj.schema ||
                                    {}),
                            };
                        }
                    }
                }
            }
            // Extract responses - use dereferenced for content but bundled for schemas
            if (dereferencedOperation?.responses) {
                for (const [statusCode, responseObj] of Object.entries(dereferencedOperation.responses)) {
                    const response = {
                        description: responseObj.description || "",
                    };
                    // Handle content for OpenAPI 3.x
                    if (responseObj.content) {
                        response.content = {};
                        for (const [contentType, mediaTypeObj] of Object.entries(responseObj.content)) {
                            // Try to get the bundled version's schema to preserve $refs
                            const bundledSchema = operation.responses?.[statusCode]?.content?.[contentType]
                                ?.schema;
                            response.content[contentType] = {
                                schema: (bundledSchema ||
                                    mediaTypeObj.schema ||
                                    {}),
                            };
                        }
                    }
                    // Handle schema for Swagger 2.0
                    else if (responseObj.schema) {
                        const bundledSchema = operation.responses?.[statusCode]?.schema;
                        response.content = {
                            "application/json": {
                                schema: (bundledSchema || responseObj.schema),
                            },
                        };
                    }
                    endpoint.responses[statusCode] = response;
                }
            }
            endpoints.push(endpoint);
        }
    }
    return endpoints;
}
/**
 * Extract all endpoints from the specification (legacy - kept for reference)
 */
function extractEndpoints(api) {
    const endpoints = [];
    if (!api.paths) {
        return endpoints;
    }
    // Iterate through all paths
    for (const [path, pathItem] of Object.entries(api.paths)) {
        if (!pathItem || typeof pathItem !== "object")
            continue;
        // Iterate through HTTP methods
        const methods = [
            "get",
            "post",
            "put",
            "patch",
            "delete",
            "options",
            "head",
            "trace",
        ];
        for (const method of methods) {
            const operation = pathItem[method];
            if (!operation)
                continue;
            const endpoint = {
                path,
                method,
                responses: {},
            };
            // Extract operationId, summary, description
            if (operation.operationId)
                endpoint.operationId = operation.operationId;
            if (operation.summary)
                endpoint.summary = operation.summary;
            if (operation.description)
                endpoint.description = operation.description;
            // Extract tags
            if (operation.tags && Array.isArray(operation.tags)) {
                endpoint.tags = operation.tags;
            }
            // Extract parameters
            if (operation.parameters && Array.isArray(operation.parameters)) {
                endpoint.parameters = operation.parameters.map((param) => {
                    const parameter = {
                        name: param.name || "",
                        in: param.in || "query",
                        required: param.required || false,
                        schema: (param.schema || param),
                    };
                    if (param.description) {
                        parameter.description = param.description;
                    }
                    return parameter;
                });
            }
            // Extract requestBody (OpenAPI 3.x)
            if (operation.requestBody) {
                const rb = operation.requestBody;
                // Skip if requestBody is just a $ref (shouldn't happen with dereference, but just in case)
                if (rb.$ref) {
                    console.warn(`Unresolved requestBody $ref: ${rb.$ref} at ${method.toUpperCase()} ${path}`);
                    continue;
                }
                endpoint.requestBody = {
                    required: rb.required || false,
                    content: {},
                };
                if (rb.description) {
                    endpoint.requestBody.description = rb.description;
                }
                if (rb.content && typeof rb.content === "object") {
                    for (const [contentType, mediaTypeObj] of Object.entries(rb.content)) {
                        if (mediaTypeObj &&
                            typeof mediaTypeObj === "object" &&
                            "schema" in mediaTypeObj) {
                            endpoint.requestBody.content[contentType] = {
                                schema: (mediaTypeObj.schema || {}),
                            };
                        }
                    }
                }
            }
            // Extract responses
            if (operation.responses) {
                for (const [statusCode, responseObj] of Object.entries(operation.responses)) {
                    const response = {
                        description: responseObj.description || "",
                    };
                    // Handle content for OpenAPI 3.x
                    if (responseObj.content) {
                        response.content = {};
                        for (const [contentType, mediaTypeObj] of Object.entries(responseObj.content)) {
                            response.content[contentType] = {
                                schema: (mediaTypeObj.schema || {}),
                            };
                        }
                    }
                    // Handle schema for Swagger 2.0
                    else if (responseObj.schema) {
                        response.content = {
                            "application/json": {
                                schema: responseObj.schema,
                            },
                        };
                    }
                    endpoint.responses[statusCode] = response;
                }
            }
            endpoints.push(endpoint);
        }
    }
    return endpoints;
}
/**
 * Extract schema definitions from the specification
 */
function extractSchemas(api) {
    const schemas = {};
    // OpenAPI 3.x: schemas are in components.schemas
    if (api.components?.schemas) {
        for (const [name, schema] of Object.entries(api.components.schemas)) {
            schemas[name] = schema;
        }
    }
    // Swagger 2.0: schemas are in definitions
    else if (api.definitions) {
        for (const [name, schema] of Object.entries(api.definitions)) {
            schemas[name] = schema;
        }
    }
    return schemas;
}
/**
 * Handle and categorize parser errors
 */
function handleParserError(error, source) {
    const errorMessage = error.message || "";
    // File access errors
    if (errorMessage.includes("ENOENT") ||
        errorMessage.includes("no such file")) {
        return new types_js_1.ParserError(`Failed to access spec at ${source}: File not found`, error);
    }
    // Syntax errors
    if (errorMessage.includes("Syntax error") ||
        errorMessage.includes("JSON") ||
        errorMessage.includes("YAML") ||
        errorMessage.includes("parse")) {
        return new types_js_1.ParserError(`Syntax error in spec: ${errorMessage}`, error);
    }
    // Validation errors
    if (errorMessage.includes("validation") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("does not conform")) {
        return new types_js_1.ParserError(`Spec validation failed: ${errorMessage}`, error);
    }
    // Unexpected errors
    return new types_js_1.ParserError(`Unexpected error parsing spec: ${errorMessage}`, error);
}

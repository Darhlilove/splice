/**
 * OpenAPI specification parser implementation
 */
import SwaggerParser from "@apidevtools/swagger-parser";
import { ParserError } from "./types.js";
/**
 * Parse an OpenAPI specification from a file path or URL
 * @param source - File path or URL to the OpenAPI specification
 * @returns Parsed specification with structured data
 * @throws ParserError if parsing fails
 */
export async function parseOpenAPISpec(source) {
    try {
        // Use bundle() to preserve internal $refs (especially in schemas)
        // This keeps references like {"$ref": "#/components/schemas/Pet"} intact
        const bundledApi = (await SwaggerParser.bundle(source));
        // Also dereference to get a fully resolved version for extracting requestBodies
        const dereferencedApi = (await SwaggerParser.dereference(source));
        // Extract info from bundled (doesn't matter which)
        const info = extractInfo(bundledApi);
        // Extract schemas from bundled to preserve $refs within schemas
        const schemas = extractSchemas(bundledApi);
        // Extract endpoints using both versions:
        // - Use dereferenced for requestBody/response content extraction
        // - But preserve $refs in the actual schema objects
        // Extract endpoints using both versions:
        // - Use dereferenced for requestBody/response content extraction
        // - But preserve $refs in the actual schema objects
        const endpoints = extractEndpointsHybrid(bundledApi, dereferencedApi);
        // Extract security schemes
        const securitySchemes = extractSecuritySchemes(bundledApi);
        return {
            info,
            endpoints,
            schemas,
            securitySchemes,
            originalSpec: bundledApi, // Return bundled for Prism
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
    var _a, _b, _c, _d, _e, _f;
    const info = {
        title: ((_a = api.info) === null || _a === void 0 ? void 0 : _a.title) || "Untitled API",
        version: ((_b = api.info) === null || _b === void 0 ? void 0 : _b.version) || "1.0.0",
    };
    // Add optional description
    if ((_c = api.info) === null || _c === void 0 ? void 0 : _c.description) {
        info.description = api.info.description;
    }
    // Handle servers for OpenAPI 3.x
    if (api.openapi && api.servers && Array.isArray(api.servers)) {
        info.servers = api.servers.map((server) => (Object.assign({ url: server.url }, (server.description && { description: server.description }))));
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
    if ((_d = api.info) === null || _d === void 0 ? void 0 : _d.contact) {
        info.contact = {};
        if (api.info.contact.name)
            info.contact.name = api.info.contact.name;
        if (api.info.contact.email)
            info.contact.email = api.info.contact.email;
        if (api.info.contact.url)
            info.contact.url = api.info.contact.url;
    }
    // Extract license information
    if ((_f = (_e = api.info) === null || _e === void 0 ? void 0 : _e.license) === null || _f === void 0 ? void 0 : _f.name) {
        info.license = Object.assign({ name: api.info.license.name }, (api.info.license.url && { url: api.info.license.url }));
    }
    return info;
}
/**
 * Extract all endpoints using a hybrid approach
 * Uses bundled API for schema $refs and dereferenced API for requestBody/response content
 */
function extractEndpointsHybrid(bundledApi, dereferencedApi) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const endpoints = [];
    if (!bundledApi.paths) {
        return endpoints;
    }
    // Iterate through all paths
    for (const [path, pathItem] of Object.entries(bundledApi.paths)) {
        if (!pathItem || typeof pathItem !== "object")
            continue;
        // Get the dereferenced version of this path
        const dereferencedPathItem = (_a = dereferencedApi.paths) === null || _a === void 0 ? void 0 : _a[path];
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
            const dereferencedOperation = dereferencedPathItem === null || dereferencedPathItem === void 0 ? void 0 : dereferencedPathItem[method];
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
            // Extract security
            if (operation.security && Array.isArray(operation.security)) {
                endpoint.security = operation.security;
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
            if (dereferencedOperation === null || dereferencedOperation === void 0 ? void 0 : dereferencedOperation.requestBody) {
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
                            const bundledSchema = (_d = (_c = (_b = operation.requestBody) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c[contentType]) === null || _d === void 0 ? void 0 : _d.schema;
                            endpoint.requestBody.content[contentType] = {
                                schema: (bundledSchema ||
                                    mediaTypeObj.schema ||
                                    {}),
                            };
                        }
                    }
                }
            }
            else if (dereferencedOperation === null || dereferencedOperation === void 0 ? void 0 : dereferencedOperation.parameters) {
                // Fallback for Swagger 2.0: Check for 'body' parameter
                const bodyParam = dereferencedOperation.parameters.find((p) => p.in === "body");
                if (bodyParam && bodyParam.schema) {
                    // Find the bundled version of this parameter to preserve $refs
                    const bundledBodyParam = (_e = operation.parameters) === null || _e === void 0 ? void 0 : _e.find((p) => p.in === "body" || p.name === bodyParam.name);
                    const schema = (bundledBodyParam === null || bundledBodyParam === void 0 ? void 0 : bundledBodyParam.schema) ||
                        bodyParam.schema;
                    endpoint.requestBody = {
                        required: bodyParam.required || false,
                        description: bodyParam.description,
                        content: {
                            "application/json": {
                                schema: schema,
                            },
                        },
                    };
                }
            }
            // Extract responses - use dereferenced for content but bundled for schemas
            if (dereferencedOperation === null || dereferencedOperation === void 0 ? void 0 : dereferencedOperation.responses) {
                for (const [statusCode, responseObj] of Object.entries(dereferencedOperation.responses)) {
                    const response = {
                        description: responseObj.description || "",
                    };
                    // Handle content for OpenAPI 3.x
                    if (responseObj.content) {
                        response.content = {};
                        for (const [contentType, mediaTypeObj] of Object.entries(responseObj.content)) {
                            // Try to get the bundled version's schema to preserve $refs
                            const bundledSchema = (_j = (_h = (_g = (_f = operation.responses) === null || _f === void 0 ? void 0 : _f[statusCode]) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h[contentType]) === null || _j === void 0 ? void 0 : _j.schema;
                            response.content[contentType] = {
                                schema: (bundledSchema ||
                                    mediaTypeObj.schema ||
                                    {}),
                            };
                        }
                    }
                    // Handle schema for Swagger 2.0
                    else if (responseObj.schema) {
                        const bundledSchema = (_l = (_k = operation.responses) === null || _k === void 0 ? void 0 : _k[statusCode]) === null || _l === void 0 ? void 0 : _l.schema;
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
    var _a;
    const schemas = {};
    // OpenAPI 3.x: schemas are in components.schemas
    if ((_a = api.components) === null || _a === void 0 ? void 0 : _a.schemas) {
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
 * Extract security schemes from the specification
 */
function extractSecuritySchemes(api) {
    var _a;
    const schemes = {};
    // OpenAPI 3.x
    if ((_a = api.components) === null || _a === void 0 ? void 0 : _a.securitySchemes) {
        Object.entries(api.components.securitySchemes).forEach(([key, scheme]) => {
            schemes[key] = scheme;
        });
    }
    // Swagger 2.0
    else if (api.securityDefinitions) {
        Object.entries(api.securityDefinitions).forEach(([key, scheme]) => {
            schemes[key] = scheme;
        });
    }
    return Object.keys(schemes).length > 0 ? schemes : undefined;
}
/**
 * Handle and categorize parser errors
 */
function handleParserError(error, source) {
    const errorMessage = error.message || "";
    // File access errors
    if (errorMessage.includes("ENOENT") ||
        errorMessage.includes("no such file")) {
        return new ParserError(`Failed to access spec at ${source}: File not found`, error);
    }
    // Syntax errors
    if (errorMessage.includes("Syntax error") ||
        errorMessage.includes("JSON") ||
        errorMessage.includes("YAML") ||
        errorMessage.includes("parse")) {
        return new ParserError(`Syntax error in spec: ${errorMessage}`, error);
    }
    // Validation errors
    if (errorMessage.includes("validation") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("does not conform")) {
        return new ParserError(`Spec validation failed: ${errorMessage}`, error);
    }
    // Unexpected errors
    return new ParserError(`Unexpected error parsing spec: ${errorMessage}`, error);
}

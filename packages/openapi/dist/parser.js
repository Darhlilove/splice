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
        // Parse and dereference the spec using SwaggerParser
        const api = (await SwaggerParser.validate(source));
        // Extract info, endpoints, and schemas
        const info = extractInfo(api);
        const endpoints = extractEndpoints(api);
        const schemas = extractSchemas(api);
        return { info, endpoints, schemas };
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
 * Extract all endpoints from the specification
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
                endpoint.requestBody = {
                    required: rb.required || false,
                    content: {},
                };
                if (rb.description) {
                    endpoint.requestBody.description = rb.description;
                }
                if (rb.content) {
                    for (const [contentType, mediaTypeObj] of Object.entries(rb.content)) {
                        endpoint.requestBody.content[contentType] = {
                            schema: (mediaTypeObj.schema || {}),
                        };
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

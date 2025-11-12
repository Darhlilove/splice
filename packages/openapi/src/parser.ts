/**
 * OpenAPI specification parser implementation
 */

import SwaggerParser from "@apidevtools/swagger-parser";
import type {
  ParsedSpec,
  APIInfo,
  Endpoint,
  SchemaObject,
  HTTPMethod,
  Parameter,
  Response,
  OpenAPISpec,
} from "./types.js";
import { ParserError } from "./types.js";

/**
 * Parse an OpenAPI specification from a file path or URL
 * @param source - File path or URL to the OpenAPI specification
 * @returns Parsed specification with structured data
 * @throws ParserError if parsing fails
 */
export async function parseOpenAPISpec(source: string): Promise<ParsedSpec> {
  try {
    // Parse and dereference the spec using SwaggerParser
    const api = (await SwaggerParser.validate(source)) as OpenAPISpec;

    // Extract info, endpoints, and schemas
    const info = extractInfo(api);
    const endpoints = extractEndpoints(api);
    const schemas = extractSchemas(api);

    return { info, endpoints, schemas };
  } catch (error) {
    throw handleParserError(error as Error, source);
  }
}

/**
 * Extract API metadata from the specification
 */
function extractInfo(api: OpenAPISpec): APIInfo {
  const info: APIInfo = {
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
    if (api.info.contact.name) info.contact.name = api.info.contact.name;
    if (api.info.contact.email) info.contact.email = api.info.contact.email;
    if (api.info.contact.url) info.contact.url = api.info.contact.url;
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
 * Extract all endpoints from the specification
 */
function extractEndpoints(api: OpenAPISpec): Endpoint[] {
  const endpoints: Endpoint[] = [];

  if (!api.paths) {
    return endpoints;
  }

  // Iterate through all paths
  for (const [path, pathItem] of Object.entries(api.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    // Iterate through HTTP methods
    const methods: HTTPMethod[] = [
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
      if (!operation) continue;

      const endpoint: Endpoint = {
        path,
        method,
        responses: {},
      };

      // Extract operationId, summary, description
      if (operation.operationId) endpoint.operationId = operation.operationId;
      if (operation.summary) endpoint.summary = operation.summary;
      if (operation.description) endpoint.description = operation.description;

      // Extract tags
      if (operation.tags && Array.isArray(operation.tags)) {
        endpoint.tags = operation.tags;
      }

      // Extract parameters
      if (operation.parameters && Array.isArray(operation.parameters)) {
        endpoint.parameters = operation.parameters.map((param) => {
          const parameter: Parameter = {
            name: param.name || "",
            in: (param.in as Parameter["in"]) || "query",
            required: param.required || false,
            schema: (param.schema || param) as SchemaObject,
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
          for (const [contentType, mediaTypeObj] of Object.entries(
            rb.content
          )) {
            endpoint.requestBody.content[contentType] = {
              schema: (mediaTypeObj.schema || {}) as SchemaObject,
            };
          }
        }
      }

      // Extract responses
      if (operation.responses) {
        for (const [statusCode, responseObj] of Object.entries(
          operation.responses
        )) {
          const response: Response = {
            description: responseObj.description || "",
          };

          // Handle content for OpenAPI 3.x
          if (responseObj.content) {
            response.content = {};
            for (const [contentType, mediaTypeObj] of Object.entries(
              responseObj.content
            )) {
              response.content[contentType] = {
                schema: (mediaTypeObj.schema || {}) as SchemaObject,
              };
            }
          }
          // Handle schema for Swagger 2.0
          else if (responseObj.schema) {
            response.content = {
              "application/json": {
                schema: responseObj.schema as SchemaObject,
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
function extractSchemas(api: OpenAPISpec): Record<string, SchemaObject> {
  const schemas: Record<string, SchemaObject> = {};

  // OpenAPI 3.x: schemas are in components.schemas
  if (api.components?.schemas) {
    for (const [name, schema] of Object.entries(api.components.schemas)) {
      schemas[name] = schema as SchemaObject;
    }
  }
  // Swagger 2.0: schemas are in definitions
  else if (api.definitions) {
    for (const [name, schema] of Object.entries(api.definitions)) {
      schemas[name] = schema as SchemaObject;
    }
  }

  return schemas;
}

/**
 * Handle and categorize parser errors
 */
function handleParserError(error: Error, source: string): ParserError {
  const errorMessage = error.message || "";

  // File access errors
  if (
    errorMessage.includes("ENOENT") ||
    errorMessage.includes("no such file")
  ) {
    return new ParserError(
      `Failed to access spec at ${source}: File not found`,
      error
    );
  }

  // Syntax errors
  if (
    errorMessage.includes("Syntax error") ||
    errorMessage.includes("JSON") ||
    errorMessage.includes("YAML") ||
    errorMessage.includes("parse")
  ) {
    return new ParserError(`Syntax error in spec: ${errorMessage}`, error);
  }

  // Validation errors
  if (
    errorMessage.includes("validation") ||
    errorMessage.includes("invalid") ||
    errorMessage.includes("does not conform")
  ) {
    return new ParserError(`Spec validation failed: ${errorMessage}`, error);
  }

  // Unexpected errors
  return new ParserError(
    `Unexpected error parsing spec: ${errorMessage}`,
    error
  );
}

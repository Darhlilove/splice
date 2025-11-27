/**
 * TypeScript type definitions for OpenAPI parser
 */
export interface OpenAPIInfo {
    title?: string;
    version?: string;
    description?: string;
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    license?: {
        name?: string;
        url?: string;
    };
}
export interface OpenAPIServer {
    url: string;
    description?: string;
}
export interface OpenAPIParameter {
    name?: string;
    in?: string;
    description?: string;
    required?: boolean;
    schema?: unknown;
    type?: string;
    format?: string;
}
export interface OpenAPIRequestBody {
    description?: string;
    required?: boolean;
    content?: Record<string, {
        schema?: unknown;
    }>;
}
export interface OpenAPIResponse {
    description?: string;
    content?: Record<string, {
        schema?: unknown;
    }>;
    schema?: unknown;
}
export interface OpenAPIOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses?: Record<string, OpenAPIResponse>;
    security?: Record<string, string[]>[];
}
export interface OpenAPIPathItem {
    get?: OpenAPIOperation;
    post?: OpenAPIOperation;
    put?: OpenAPIOperation;
    patch?: OpenAPIOperation;
    delete?: OpenAPIOperation;
    options?: OpenAPIOperation;
    head?: OpenAPIOperation;
    trace?: OpenAPIOperation;
}
export interface OpenAPISpec {
    openapi?: string;
    swagger?: string;
    info?: OpenAPIInfo;
    servers?: OpenAPIServer[];
    host?: string;
    basePath?: string;
    schemes?: string[];
    paths?: Record<string, OpenAPIPathItem>;
    components?: {
        schemas?: Record<string, unknown>;
        securitySchemes?: Record<string, unknown>;
    };
    definitions?: Record<string, unknown>;
    securityDefinitions?: Record<string, unknown>;
    security?: Array<Record<string, string[]>>;
}
export interface ParsedSpec {
    info: APIInfo;
    endpoints: Endpoint[];
    schemas: Record<string, SchemaObject>;
    securitySchemes?: Record<string, SecurityScheme>;
}
export interface SecurityScheme {
    type: "apiKey" | "http" | "oauth2" | "openIdConnect";
    description?: string;
    name?: string;
    in?: "query" | "header" | "cookie";
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlows;
    openIdConnectUrl?: string;
}
export interface OAuthFlows {
    implicit?: OAuthFlow;
    password?: OAuthFlow;
    clientCredentials?: OAuthFlow;
    authorizationCode?: OAuthFlow;
}
export interface OAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
export interface APIInfo {
    title: string;
    version: string;
    description?: string;
    servers?: Server[];
    contact?: Contact;
    license?: License;
}
export interface Server {
    url: string;
    description?: string;
}
export interface Contact {
    name?: string;
    email?: string;
    url?: string;
}
export interface License {
    name: string;
    url?: string;
}
export type HTTPMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head" | "trace";
export interface Endpoint {
    path: string;
    method: HTTPMethod;
    operationId?: string;
    summary?: string;
    description?: string;
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    tags?: string[];
    security?: Record<string, string[]>[];
}
export interface Parameter {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required: boolean;
    schema: SchemaObject;
}
export interface RequestBody {
    description?: string;
    required: boolean;
    content: Record<string, MediaType>;
}
export interface Response {
    description: string;
    content?: Record<string, MediaType>;
}
export interface MediaType {
    schema: SchemaObject;
}
export interface SchemaObject {
    type?: string;
    format?: string;
    properties?: Record<string, SchemaObject>;
    items?: SchemaObject;
    required?: string[];
    description?: string;
    enum?: unknown[];
    $ref?: string;
    [key: string]: unknown;
}
export declare class ParserError extends Error {
    readonly cause?: Error | undefined;
    constructor(message: string, cause?: Error | undefined);
}
//# sourceMappingURL=types.d.ts.map
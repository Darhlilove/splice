# Design Document

## Overview

The OpenAPI Parser module is a TypeScript utility that provides a clean, type-safe interface for parsing and extracting structured data from OpenAPI specifications. It wraps the @apidevtools/swagger-parser library to handle the complexity of spec validation, dereferencing, and normalization, exposing a simple API that returns consistently structured data regardless of the OpenAPI version (2.0, 3.0, or 3.1).

The module will be implemented as a standalone package within the monorepo structure at `packages/openapi`, making it reusable across different parts of the Splice application (Schema Explorer, Mock Server, SDK Generator).

## Architecture

### Module Structure

```
packages/openapi/
├── src/
│   ├── parser.ts          # Main parser implementation
│   ├── types.ts           # TypeScript type definitions
│   └── index.ts           # Public API exports
├── package.json           # Package configuration
└── tsconfig.json          # TypeScript configuration
```

### Dependencies

- **@apidevtools/swagger-parser**: Core parsing and validation library (already installed at root)
- **TypeScript**: Type definitions and compilation

### Integration Points

The parser module will be consumed by:

1. Schema Explorer UI components (for displaying API documentation)
2. Mock Server Generator (for extracting endpoint definitions)
3. SDK Generator (for generating type-safe client code)

## Components and Interfaces

### Public API

The module exports a single primary function:

```typescript
export async function parseOpenAPISpec(source: string): Promise<ParsedSpec>;
```

**Parameters:**

- `source`: File path or URL to the OpenAPI specification

**Returns:**

- `ParsedSpec`: Structured object containing extracted API information

**Throws:**

- `ParserError`: Custom error with descriptive message for all failure scenarios

### Type Definitions

```typescript
// Main output structure
export interface ParsedSpec {
  info: APIInfo;
  endpoints: Endpoint[];
  schemas: Record<string, SchemaObject>;
}

// API metadata
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

// Endpoint definition
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
}

export type HTTPMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head"
  | "trace";

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

// Schema definition (simplified JSON Schema)
export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  description?: string;
  enum?: any[];
  $ref?: string;
  [key: string]: any; // Allow additional JSON Schema properties
}

// Error handling
export class ParserError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ParserError";
  }
}
```

## Data Models

### Parsing Flow

1. **Input Validation**: Check if source is a valid file path or URL
2. **Spec Loading**: Use SwaggerParser to load and dereference the spec
3. **Version Detection**: Identify OpenAPI version (2.0, 3.0, or 3.1)
4. **Data Extraction**: Extract info, endpoints, and schemas using version-specific logic
5. **Normalization**: Convert all data to consistent output format
6. **Return**: Provide ParsedSpec object to caller

### Version-Specific Handling

**OpenAPI 3.x:**

- Info from `info` object
- Servers from `servers` array
- Endpoints from `paths` object
- Schemas from `components.schemas`

**Swagger 2.0:**

- Info from `info` object
- Servers constructed from `host`, `basePath`, and `schemes`
- Endpoints from `paths` object
- Schemas from `definitions` object

## Error Handling

### Error Categories

1. **Access Errors**: File not found, network errors, permission issues

   - Message: "Failed to access spec at {source}: {reason}"

2. **Syntax Errors**: Invalid JSON/YAML

   - Message: "Syntax error in spec: {details}"

3. **Validation Errors**: Spec doesn't conform to OpenAPI standard

   - Message: "Spec validation failed: {validation errors}"

4. **Unexpected Errors**: Any other runtime errors
   - Message: "Unexpected error parsing spec: {error message}"

### Error Handling Strategy

```typescript
try {
  // Parsing logic
} catch (error) {
  if (error.message.includes("ENOENT")) {
    throw new ParserError(
      `Failed to access spec at ${source}: File not found`,
      error
    );
  } else if (error.message.includes("Syntax error")) {
    throw new ParserError(`Syntax error in spec: ${error.message}`, error);
  } else if (error.message.includes("validation")) {
    throw new ParserError(`Spec validation failed: ${error.message}`, error);
  } else {
    throw new ParserError(
      `Unexpected error parsing spec: ${error.message}`,
      error
    );
  }
}
```

## Implementation Details

### Core Parser Logic

```typescript
export async function parseOpenAPISpec(source: string): Promise<ParsedSpec> {
  try {
    // Parse and dereference the spec
    const api = await SwaggerParser.validate(source);

    // Extract info
    const info = extractInfo(api);

    // Extract endpoints
    const endpoints = extractEndpoints(api);

    // Extract schemas
    const schemas = extractSchemas(api);

    return { info, endpoints, schemas };
  } catch (error) {
    throw handleParserError(error, source);
  }
}
```

### Helper Functions

- `extractInfo(api)`: Extracts API metadata from info object
- `extractEndpoints(api)`: Iterates through paths and methods to build endpoint array
- `extractSchemas(api)`: Extracts schemas from components/definitions
- `handleParserError(error, source)`: Categorizes and wraps errors in ParserError
- `normalizeMethod(method)`: Converts method strings to lowercase HTTPMethod type
- `isOpenAPI3(api)`: Checks if spec is OpenAPI 3.x vs Swagger 2.0

## Testing Strategy

### Unit Tests

1. **Successful Parsing**

   - Test with valid OpenAPI 3.0 spec (JSON)
   - Test with valid OpenAPI 3.1 spec (YAML)
   - Test with valid Swagger 2.0 spec
   - Verify all fields are correctly extracted

2. **Error Handling**

   - Test with non-existent file path
   - Test with invalid URL
   - Test with malformed JSON/YAML
   - Test with invalid OpenAPI structure
   - Verify error messages are descriptive

3. **Edge Cases**
   - Test with minimal spec (only required fields)
   - Test with spec containing $ref references
   - Test with spec containing no endpoints
   - Test with spec containing complex nested schemas

### Test Data

Use existing test specs from `public/test-specs/`:

- `petstore-openapi-spec.yaml` (simple example)
- `stripe-spec.yaml` (complex real-world API)
- `twilio_accounts_v1.json` (JSON format)

### Testing Approach

- Use Node.js built-in test runner or Jest
- Mock file system access for error scenarios
- Test both file paths and URLs
- Validate output structure matches TypeScript interfaces

## Package Configuration

### package.json

```json
{
  "name": "@splice/openapi",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@apidevtools/swagger-parser": "^12.1.0"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Performance Considerations

- SwaggerParser caches parsed specs, reducing redundant parsing
- Dereferencing happens once during parsing, not on every access
- Large specs (1000+ endpoints) should parse in under 2 seconds
- Memory usage scales with spec size; typical specs use <10MB

## Security Considerations

- Validate source parameter to prevent path traversal attacks
- Use HTTPS for URL sources when possible
- SwaggerParser handles malicious $ref cycles automatically
- Don't expose raw error stack traces to end users in production

/**
 * README Generator for SDK packages
 * Generates comprehensive README.md files with installation, usage, and examples
 */

import type { OpenAPISpec, SDKConfig } from "./index.js";
import type { OpenAPIOperation, OpenAPIPathItem } from "./types.js";

/**
 * README Generator class
 * Creates comprehensive README documentation for generated SDKs
 */
export class ReadmeGenerator {
  /**
   * Generate a complete README.md content
   * @param spec - OpenAPI specification
   * @param config - SDK configuration
   * @returns README content as markdown string
   */
  generate(spec: OpenAPISpec, config: SDKConfig): string {
    const sections: string[] = [];

    // Title and description
    sections.push(this.generateHeader(spec, config));

    // Installation
    sections.push(this.generateInstallSection(config));

    // Quick start
    sections.push(this.generateQuickStartSection(spec, config));

    // Authentication
    const authSection = this.generateAuthenticationSection(spec);
    if (authSection) {
      sections.push(authSection);
    }

    // Examples
    sections.push(this.generateExamplesSection(spec, config));

    // API Reference
    sections.push(this.generateApiReferenceSection());

    return sections.join("\n\n");
  }

  /**
   * Generate header with title and description
   */
  private generateHeader(spec: OpenAPISpec, config: SDKConfig): string {
    const title = config.packageName;
    const description =
      config.description ||
      spec.info?.description ||
      `TypeScript SDK for ${spec.info?.title || "API"}`;

    return `# ${title}\n\n${description}`;
  }

  /**
   * Generate installation section with package name
   * Validates: Requirements 6.1
   */
  private generateInstallSection(config: SDKConfig): string {
    return `## Installation

\`\`\`bash
npm install ${config.packageName}
\`\`\`

Or using yarn:

\`\`\`bash
yarn add ${config.packageName}
\`\`\`

Or using pnpm:

\`\`\`bash
pnpm add ${config.packageName}
\`\`\``;
  }

  /**
   * Generate quick start section with API initialization
   * Validates: Requirements 6.2
   */
  private generateQuickStartSection(
    spec: OpenAPISpec,
    config: SDKConfig
  ): string {
    const baseUrl = this.getBaseUrl(spec);
    const hasAuth = this.hasAuthentication(spec);

    let quickStart = `## Quick Start

\`\`\`typescript
import { Configuration, DefaultApi } from '${config.packageName}';

// Initialize the API client
const config = new Configuration({
  basePath: '${baseUrl}'`;

    if (hasAuth) {
      quickStart += `,
  apiKey: 'your-api-key-here' // Replace with your actual API key`;
    }

    quickStart += `
});

const api = new DefaultApi(config);

// Make your first API call
async function example() {
  try {
    const response = await api.someMethod();
    console.log(response);
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
\`\`\``;

    return quickStart;
  }

  /**
   * Generate authentication section based on spec security schemes
   * Validates: Requirements 6.3
   */
  private generateAuthenticationSection(spec: OpenAPISpec): string | null {
    if (!this.hasAuthentication(spec)) {
      return null;
    }

    let authSection = `## Authentication

This API requires authentication. `;

    // Check for security schemes in OpenAPI 3.x
    const securitySchemes =
      spec.components?.securitySchemes || (spec as any).securityDefinitions;

    if (securitySchemes) {
      const schemes = Object.entries(securitySchemes);

      if (schemes.length > 0) {
        authSection += `The following authentication methods are supported:\n\n`;

        for (const [name, scheme] of schemes) {
          const schemeObj = scheme as any;

          if (schemeObj.type === "apiKey") {
            authSection += `### API Key Authentication\n\n`;
            authSection += `Pass your API key in the ${
              schemeObj.in || "header"
            } named \`${schemeObj.name || "Authorization"}\`:\n\n`;
            authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  apiKey: 'your-api-key-here'
});
\`\`\`\n\n`;
          } else if (
            schemeObj.type === "http" &&
            schemeObj.scheme === "bearer"
          ) {
            authSection += `### Bearer Token Authentication\n\n`;
            authSection += `Pass your bearer token:\n\n`;
            authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  accessToken: 'your-bearer-token-here'
});
\`\`\`\n\n`;
          } else if (schemeObj.type === "oauth2") {
            authSection += `### OAuth 2.0 Authentication\n\n`;
            authSection += `This API uses OAuth 2.0. Configure your access token:\n\n`;
            authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  accessToken: 'your-oauth-token-here'
});
\`\`\`\n\n`;
          } else if (
            schemeObj.type === "http" &&
            schemeObj.scheme === "basic"
          ) {
            authSection += `### Basic Authentication\n\n`;
            authSection += `Pass your username and password:\n\n`;
            authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  username: 'your-username',
  password: 'your-password'
});
\`\`\`\n\n`;
          }
        }
      }
    } else {
      authSection += `Configure your credentials when initializing the API client.\n\n`;
      authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  apiKey: 'your-api-key-here'
});
\`\`\``;
    }

    return authSection;
  }

  /**
   * Generate code examples for 3 sample endpoints
   * Validates: Requirements 6.4
   */
  private generateExamplesSection(
    spec: OpenAPISpec,
    config: SDKConfig
  ): string {
    const examples = this.getSampleEndpoints(spec, 3);

    if (examples.length === 0) {
      return `## Examples

No example endpoints available. Please refer to the API documentation for available methods.`;
    }

    let examplesSection = `## Examples\n\n`;

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      examplesSection += `### Example ${i + 1}: ${
        example.summary || example.operationId || example.path
      }\n\n`;

      if (example.description) {
        examplesSection += `${example.description}\n\n`;
      }

      examplesSection += `\`\`\`typescript
import { Configuration, DefaultApi } from '${config.packageName}';

const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}'`;

      if (this.hasAuthentication(spec)) {
        examplesSection += `,
  apiKey: 'your-api-key-here'`;
      }

      examplesSection += `
});

const api = new DefaultApi(config);

async function ${this.generateFunctionName(example)}() {
  try {`;

      // Generate method call based on operation
      const methodCall = this.generateMethodCall(example);
      examplesSection += `
    ${methodCall}`;

      examplesSection += `
  } catch (error) {
    console.error('Error:', error);
  }
}

${this.generateFunctionName(example)}();
\`\`\`\n\n`;
    }

    return examplesSection;
  }

  /**
   * Generate API reference section
   */
  private generateApiReferenceSection(): string {
    return `## API Reference

For detailed information about all available methods, parameters, and response types, please refer to the generated TypeScript types and JSDoc comments in the source code.

All API methods are fully typed and include inline documentation.`;
  }

  /**
   * Get base URL from spec
   */
  private getBaseUrl(spec: OpenAPISpec): string {
    // OpenAPI 3.x servers
    if (spec.servers && spec.servers.length > 0) {
      return spec.servers[0].url;
    }

    // Swagger 2.0 host/basePath
    if (spec.host) {
      const scheme = spec.schemes?.[0] || "https";
      const basePath = spec.basePath || "";
      return `${scheme}://${spec.host}${basePath}`;
    }

    return "https://api.example.com";
  }

  /**
   * Check if spec has authentication
   */
  private hasAuthentication(spec: OpenAPISpec): boolean {
    // Check OpenAPI 3.x security schemes
    if (spec.components?.securitySchemes) {
      return Object.keys(spec.components.securitySchemes).length > 0;
    }

    // Check Swagger 2.0 security definitions
    if ((spec as any).securityDefinitions) {
      return Object.keys((spec as any).securityDefinitions).length > 0;
    }

    // Check for global security requirements
    if ((spec as any).security && Array.isArray((spec as any).security)) {
      return (spec as any).security.length > 0;
    }

    return false;
  }

  /**
   * Get sample endpoints from spec
   */
  private getSampleEndpoints(
    spec: OpenAPISpec,
    count: number
  ): Array<{
    path: string;
    method: string;
    operation: OpenAPIOperation;
    operationId?: string;
    summary?: string;
    description?: string;
  }> {
    const endpoints: Array<{
      path: string;
      method: string;
      operation: OpenAPIOperation;
      operationId?: string;
      summary?: string;
      description?: string;
    }> = [];

    if (!spec.paths) {
      return endpoints;
    }

    // Collect all endpoints
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = ["get", "post", "put", "patch", "delete"] as const;

      for (const method of methods) {
        const operation = (pathItem as OpenAPIPathItem)[method];

        if (operation) {
          endpoints.push({
            path,
            method,
            operation,
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
          });

          if (endpoints.length >= count) {
            return endpoints;
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Generate function name from endpoint
   */
  private generateFunctionName(endpoint: {
    operationId?: string;
    method: string;
    path: string;
  }): string {
    if (endpoint.operationId) {
      return `example${endpoint.operationId
        .charAt(0)
        .toUpperCase()}${endpoint.operationId.slice(1)}`;
    }

    // Generate from method and path
    const pathParts = endpoint.path
      .split("/")
      .filter((p) => p && !p.startsWith("{"));
    const name = pathParts.join("_") || endpoint.method;

    return `example${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }

  /**
   * Generate method call code
   */
  private generateMethodCall(endpoint: {
    operationId?: string;
    method: string;
    path: string;
    operation: OpenAPIOperation;
  }): string {
    const methodName = endpoint.operationId || `${endpoint.method}Request`;

    // Check if operation has parameters
    const hasParams =
      endpoint.operation.parameters && endpoint.operation.parameters.length > 0;
    const hasBody = !!endpoint.operation.requestBody;

    if (hasParams || hasBody) {
      return `const response = await api.${methodName}({ /* parameters */ });
    console.log(response);`;
    }

    return `const response = await api.${methodName}();
    console.log(response);`;
  }
}

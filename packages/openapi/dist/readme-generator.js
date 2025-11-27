/**
 * README Generator for SDK packages
 * Generates comprehensive README.md files with installation, usage, and examples
 */
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
    generate(spec, config) {
        const sections = [];
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
    generateHeader(spec, config) {
        var _a, _b;
        const title = config.packageName;
        const description = config.description ||
            ((_a = spec.info) === null || _a === void 0 ? void 0 : _a.description) ||
            `TypeScript SDK for ${((_b = spec.info) === null || _b === void 0 ? void 0 : _b.title) || "API"}`;
        return `# ${title}\n\n${description}`;
    }
    /**
     * Generate installation section with package name
     * Validates: Requirements 6.1
     */
    generateInstallSection(config) {
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
    generateQuickStartSection(spec, config) {
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
    generateAuthenticationSection(spec) {
        var _a;
        if (!this.hasAuthentication(spec)) {
            return null;
        }
        let authSection = `## Authentication

This API requires authentication. `;
        // Check for security schemes in OpenAPI 3.x
        const securitySchemes = ((_a = spec.components) === null || _a === void 0 ? void 0 : _a.securitySchemes) || spec.securityDefinitions;
        if (securitySchemes) {
            const schemes = Object.entries(securitySchemes);
            if (schemes.length > 0) {
                authSection += `The following authentication methods are supported:\n\n`;
                for (const [name, scheme] of schemes) {
                    const schemeObj = scheme;
                    if (schemeObj.type === "apiKey") {
                        authSection += `### API Key Authentication\n\n`;
                        authSection += `Pass your API key in the ${schemeObj.in || "header"} named \`${schemeObj.name || "Authorization"}\`:\n\n`;
                        authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  apiKey: 'your-api-key-here'
});
\`\`\`\n\n`;
                    }
                    else if (schemeObj.type === "http" &&
                        schemeObj.scheme === "bearer") {
                        authSection += `### Bearer Token Authentication\n\n`;
                        authSection += `Pass your bearer token:\n\n`;
                        authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  accessToken: 'your-bearer-token-here'
});
\`\`\`\n\n`;
                    }
                    else if (schemeObj.type === "oauth2") {
                        authSection += `### OAuth 2.0 Authentication\n\n`;
                        authSection += `This API uses OAuth 2.0. Configure your access token:\n\n`;
                        authSection += `\`\`\`typescript
const config = new Configuration({
  basePath: '${this.getBaseUrl(spec)}',
  accessToken: 'your-oauth-token-here'
});
\`\`\`\n\n`;
                    }
                    else if (schemeObj.type === "http" &&
                        schemeObj.scheme === "basic") {
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
        }
        else {
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
    generateExamplesSection(spec, config) {
        const examples = this.getSampleEndpoints(spec, 3);
        if (examples.length === 0) {
            return `## Examples

No example endpoints available. Please refer to the API documentation for available methods.`;
        }
        let examplesSection = `## Examples\n\n`;
        for (let i = 0; i < examples.length; i++) {
            const example = examples[i];
            examplesSection += `### Example ${i + 1}: ${example.summary || example.operationId || example.path}\n\n`;
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
    generateApiReferenceSection() {
        return `## API Reference

For detailed information about all available methods, parameters, and response types, please refer to the generated TypeScript types and JSDoc comments in the source code.

All API methods are fully typed and include inline documentation.`;
    }
    /**
     * Get base URL from spec
     */
    getBaseUrl(spec) {
        var _a;
        // OpenAPI 3.x servers
        if (spec.servers && spec.servers.length > 0) {
            return spec.servers[0].url;
        }
        // Swagger 2.0 host/basePath
        if (spec.host) {
            const scheme = ((_a = spec.schemes) === null || _a === void 0 ? void 0 : _a[0]) || "https";
            const basePath = spec.basePath || "";
            return `${scheme}://${spec.host}${basePath}`;
        }
        return "https://api.example.com";
    }
    /**
     * Check if spec has authentication
     */
    hasAuthentication(spec) {
        var _a;
        // Check OpenAPI 3.x security schemes
        if ((_a = spec.components) === null || _a === void 0 ? void 0 : _a.securitySchemes) {
            return Object.keys(spec.components.securitySchemes).length > 0;
        }
        // Check Swagger 2.0 security definitions
        if (spec.securityDefinitions) {
            return Object.keys(spec.securityDefinitions).length > 0;
        }
        // Check for global security requirements
        if (spec.security && Array.isArray(spec.security)) {
            return spec.security.length > 0;
        }
        return false;
    }
    /**
     * Get sample endpoints from spec
     */
    getSampleEndpoints(spec, count) {
        const endpoints = [];
        if (!spec.paths) {
            return endpoints;
        }
        // Collect all endpoints
        for (const [path, pathItem] of Object.entries(spec.paths)) {
            const methods = ["get", "post", "put", "patch", "delete"];
            for (const method of methods) {
                const operation = pathItem[method];
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
    generateFunctionName(endpoint) {
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
    generateMethodCall(endpoint) {
        const methodName = endpoint.operationId || `${endpoint.method}Request`;
        // Check if operation has parameters
        const hasParams = endpoint.operation.parameters && endpoint.operation.parameters.length > 0;
        const hasBody = !!endpoint.operation.requestBody;
        if (hasParams || hasBody) {
            return `const response = await api.${methodName}({ /* parameters */ });
    console.log(response);`;
        }
        return `const response = await api.${methodName}();
    console.log(response);`;
    }
}

/**
 * Test script for README Generator
 * Run with: node dist-test/test-readme-generator.js
 */

import { ReadmeGenerator } from "./src/readme-generator.js";
import type { OpenAPISpec, SDKConfig } from "./src/index.js";

// Test spec with authentication
const testSpecWithAuth: OpenAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "Pet Store API",
    version: "1.0.0",
    description: "A sample Pet Store API to demonstrate SDK generation",
  },
  servers: [
    {
      url: "https://api.petstore.com/v1",
      description: "Production server",
    },
  ],
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List all pets",
        description: "Returns a list of all pets in the store",
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
      post: {
        operationId: "createPet",
        summary: "Create a pet",
        description: "Add a new pet to the store",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  species: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      },
    },
    "/pets/{petId}": {
      get: {
        operationId: "getPetById",
        summary: "Get a pet by ID",
        description: "Returns a single pet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
  },
  security: [{ apiKey: [] }],
};

// Test spec without authentication
const testSpecNoAuth: OpenAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "Simple API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://api.example.com",
    },
  ],
  paths: {
    "/health": {
      get: {
        operationId: "healthCheck",
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
  },
};

// Test Swagger 2.0 spec
const testSwagger2Spec: OpenAPISpec = {
  swagger: "2.0",
  info: {
    title: "Legacy API",
    version: "2.0.0",
  },
  host: "api.legacy.com",
  basePath: "/v2",
  schemes: ["https"],
  paths: {
    "/users": {
      get: {
        operationId: "getUsers",
        summary: "Get users",
        responses: {
          "200": {
            description: "Success",
          },
        },
      },
    },
  },
  securityDefinitions: {
    bearer: {
      type: "http",
      scheme: "bearer",
    },
  },
};

const testConfig: SDKConfig = {
  packageName: "petstore-api-client",
  packageVersion: "1.0.0",
  author: "Test Author",
  description: "A TypeScript SDK for the Pet Store API",
  language: "typescript",
};

function testReadmeGeneration() {
  console.log("🧪 Testing README Generator...\n");

  const generator = new ReadmeGenerator();

  console.log("📝 Test 1: Generate README with authentication");
  console.log("=".repeat(60));

  const readme1 = generator.generate(testSpecWithAuth, testConfig);
  console.log(readme1);

  console.log("\n\n📝 Test 2: Generate README without authentication");
  console.log("=".repeat(60));

  const readme2 = generator.generate(testSpecNoAuth, {
    ...testConfig,
    packageName: "simple-api-client",
  });
  console.log(readme2);

  console.log("\n\n📝 Test 3: Generate README for Swagger 2.0 spec");
  console.log("=".repeat(60));

  const readme3 = generator.generate(testSwagger2Spec, {
    ...testConfig,
    packageName: "legacy-api-client",
  });
  console.log(readme3);

  console.log("\n\n✅ All README generation tests completed!");
}

function testReadmeValidation() {
  console.log("\n\n🧪 Testing README Content Validation...\n");

  const generator = new ReadmeGenerator();
  const readme = generator.generate(testSpecWithAuth, testConfig);

  // Check for required sections
  const requiredSections = [
    "# petstore-api-client",
    "## Installation",
    "## Quick Start",
    "## Authentication",
    "## Examples",
    "## API Reference",
  ];

  console.log("✓ Checking for required sections:");
  let allSectionsPresent = true;

  for (const section of requiredSections) {
    const present = readme.includes(section);
    console.log(`  ${present ? "✅" : "❌"} ${section}`);
    if (!present) allSectionsPresent = false;
  }

  // Check for installation commands
  console.log("\n✓ Checking for installation commands:");
  const installCommands = ["npm install", "yarn add", "pnpm add"];

  for (const cmd of installCommands) {
    const present = readme.includes(cmd);
    console.log(`  ${present ? "✅" : "❌"} ${cmd}`);
  }

  // Check for code examples
  console.log("\n✓ Checking for code examples:");
  const codeBlocks = readme.match(/```typescript/g);
  console.log(`  Found ${codeBlocks?.length || 0} TypeScript code blocks`);

  // Check for authentication details
  console.log("\n✓ Checking for authentication details:");
  const hasApiKey = readme.includes("apiKey");
  console.log(`  ${hasApiKey ? "✅" : "❌"} API Key configuration`);

  // Check for endpoint examples
  console.log("\n✓ Checking for endpoint examples:");
  const hasExamples =
    readme.includes("Example 1:") && readme.includes("Example 2:");
  console.log(`  ${hasExamples ? "✅" : "❌"} Multiple examples present`);

  if (allSectionsPresent) {
    console.log("\n✨ README validation passed!");
  } else {
    console.log("\n❌ README validation failed - missing sections");
  }
}

// Run all tests
async function runTests() {
  try {
    testReadmeGeneration();
    testReadmeValidation();

    console.log("\n\n✨ All tests completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();

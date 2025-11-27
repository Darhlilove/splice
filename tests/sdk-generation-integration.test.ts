/**
 * Integration tests for SDK generation
 * Tests end-to-end generation, download, ZIP extraction, and generated content
 *
 * Note: These tests require openapi-generator-cli to be installed
 * If not installed, tests will be skipped
 */

import { describe, test, expect, beforeAll } from "vitest";
import { SDKGenerator } from "../packages/openapi/src/sdk-generator";
import type {
  OpenAPISpec,
  SDKConfig,
} from "../packages/openapi/src/sdk-generator";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Check if OpenAPI Generator is available
let openAPIGeneratorAvailable = false;

beforeAll(async () => {
  try {
    await execAsync("openapi-generator-cli version");
    openAPIGeneratorAvailable = true;
    console.log("OpenAPI Generator CLI detected - integration tests will run");
  } catch (error) {
    console.warn(
      "OpenAPI Generator CLI not found - integration tests will be skipped"
    );
    console.warn(
      "Install with: npm install -g @openapitools/openapi-generator-cli"
    );
  }
});

describe("SDK Generation Integration", () => {
  const generator = new SDKGenerator();

  // Simple Petstore spec for testing
  const petstoreSpec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title: "Petstore API",
      version: "1.0.0",
      description: "A simple pet store API",
    },
    paths: {
      "/pets": {
        get: {
          summary: "List all pets",
          operationId: "listPets",
          responses: {
            "200": {
              description: "A list of pets",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Pet",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: {
              type: "integer",
              format: "int64",
            },
            name: {
              type: "string",
            },
            tag: {
              type: "string",
            },
          },
        },
      },
    },
  };

  test.skipIf(!openAPIGeneratorAvailable)(
    "should generate SDK from Petstore spec",
    async () => {
      const config: SDKConfig = {
        packageName: "petstore-client",
        packageVersion: "1.0.0",
        author: "Test Author",
        description: "Petstore API client",
        language: "typescript",
      };

      const result = await generator.generateSDK(petstoreSpec, config);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBeTruthy();
      expect(result.error).toBeUndefined();

      // Clean up
      if (result.outputPath && fs.existsSync(result.outputPath)) {
        fs.rmSync(result.outputPath, { recursive: true, force: true });
      }
    },
    120000 // 2 minute timeout for generation
  );

  test.skipIf(!openAPIGeneratorAvailable)(
    "should create ZIP archive",
    async () => {
      const config: SDKConfig = {
        packageName: "petstore-zip-test",
        packageVersion: "1.0.0",
        language: "typescript",
      };

      const result = await generator.generateSDK(petstoreSpec, config);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBeTruthy();

      if (result.outputPath) {
        // Check that ZIP file exists
        expect(fs.existsSync(result.outputPath)).toBe(true);

        // Check that it's a ZIP file
        expect(result.outputPath.endsWith(".zip")).toBe(true);

        // Check file size is reasonable (> 0 bytes)
        const stats = fs.statSync(result.outputPath);
        expect(stats.size).toBeGreaterThan(0);

        // Clean up
        fs.rmSync(result.outputPath, { force: true });
        const dirPath = result.outputPath.replace(".zip", "");
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    },
    120000
  );

  test.skipIf(!openAPIGeneratorAvailable)(
    "should generate package.json with correct values",
    async () => {
      const config: SDKConfig = {
        packageName: "test-package-json",
        packageVersion: "2.5.0",
        author: "Integration Test",
        description: "Test package description",
        language: "typescript",
      };

      const result = await generator.generateSDK(petstoreSpec, config);

      expect(result.success).toBe(true);

      if (result.outputPath) {
        // Extract directory path (remove .zip extension)
        const dirPath = result.outputPath.replace(".zip", "");

        // Check package.json exists
        const packageJsonPath = path.join(dirPath, "package.json");
        expect(fs.existsSync(packageJsonPath)).toBe(true);

        // Read and parse package.json
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );

        // Verify values
        expect(packageJson.name).toBe(config.packageName);
        expect(packageJson.version).toBe(config.packageVersion);

        // Clean up
        fs.rmSync(result.outputPath, { force: true });
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    },
    120000
  );

  test.skipIf(!openAPIGeneratorAvailable)(
    "should generate TypeScript types",
    async () => {
      const config: SDKConfig = {
        packageName: "test-types",
        packageVersion: "1.0.0",
        language: "typescript",
      };

      const result = await generator.generateSDK(petstoreSpec, config);

      expect(result.success).toBe(true);

      if (result.outputPath) {
        const dirPath = result.outputPath.replace(".zip", "");

        // Check for TypeScript files
        const hasTypeScriptFiles = fs
          .readdirSync(dirPath, { recursive: true })
          .some((file) => String(file).endsWith(".ts"));

        expect(hasTypeScriptFiles).toBe(true);

        // Clean up
        fs.rmSync(result.outputPath, { force: true });
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    },
    120000
  );

  test.skipIf(!openAPIGeneratorAvailable)(
    "should generate README with content",
    async () => {
      const config: SDKConfig = {
        packageName: "test-readme",
        packageVersion: "1.0.0",
        language: "typescript",
      };

      const result = await generator.generateSDK(petstoreSpec, config);

      expect(result.success).toBe(true);

      if (result.outputPath) {
        const dirPath = result.outputPath.replace(".zip", "");

        // Check README exists
        const readmePath = path.join(dirPath, "README.md");
        expect(fs.existsSync(readmePath)).toBe(true);

        // Read README content
        const readmeContent = fs.readFileSync(readmePath, "utf-8");

        // Verify README contains expected sections
        expect(readmeContent).toContain("Installation");
        expect(readmeContent).toContain("Quick Start");
        expect(readmeContent).toContain(config.packageName);

        // Clean up
        fs.rmSync(result.outputPath, { force: true });
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    },
    120000
  );
});

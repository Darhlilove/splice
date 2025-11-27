/**
 * Test script for SDK Generator
 * Run with: pnpm test:sdk-generator
 */

import { SDKGenerator } from "./src/sdk-generator.js";
import type { OpenAPISpec, SDKConfig } from "./src/index.js";

// Simple test spec
const testSpec: OpenAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
    description: "A test API for SDK generation",
  },
  paths: {
    "/users": {
      get: {
        operationId: "getUsers",
        summary: "Get all users",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const testConfig: SDKConfig = {
  packageName: "test-api-client",
  packageVersion: "1.0.0",
  author: "Test Author",
  description: "Test API Client SDK",
  language: "typescript",
};

async function testSDKGenerator() {
  console.log("🧪 Testing SDK Generator...\n");

  const generator = new SDKGenerator();

  console.log("📊 Active generations:", generator.getActiveGenerationCount());

  console.log("\n🚀 Starting SDK generation...");

  const result = await generator.generateSDK(
    testSpec,
    testConfig,
    (progress) => {
      console.log(
        `   [${progress.stage}] ${progress.progress}% - ${progress.message}`
      );
    }
  );

  console.log("\n✅ Generation Result:");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n✨ SDK generated successfully!");
    console.log(`   Output path: ${result.outputPath}`);
  } else {
    console.log("\n❌ SDK generation failed!");
    console.log(`   Error: ${result.error}`);
  }

  console.log("\n📊 Active generations:", generator.getActiveGenerationCount());
}

// Test concurrent generation limiting
async function testConcurrentLimit() {
  console.log("\n\n🧪 Testing Concurrent Generation Limit...\n");

  const generator = new SDKGenerator();

  console.log("🚀 Starting 5 concurrent generations...");

  const promises = Array.from({ length: 5 }, (_, i) =>
    generator.generateSDK(
      testSpec,
      { ...testConfig, packageName: `test-api-client-${i}` },
      (progress) => {
        console.log(`   [Gen ${i}] [${progress.stage}] ${progress.progress}%`);
      }
    )
  );

  const results = await Promise.all(promises);

  console.log("\n✅ Results:");
  results.forEach((result, i) => {
    if (result.success) {
      console.log(`   Gen ${i}: ✅ Success`);
    } else {
      console.log(`   Gen ${i}: ❌ ${result.error}`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log(`\n📊 Summary: ${successCount} succeeded, ${failedCount} failed`);
  console.log(
    `   Expected: Max 3 concurrent (some should have been queued/rejected)`
  );
}

// Test spec validation
async function testSpecValidation() {
  console.log("\n\n🧪 Testing Spec Validation...\n");

  const generator = new SDKGenerator();

  // Test with invalid spec (missing paths)
  const invalidSpec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title: "Invalid API",
      version: "1.0.0",
    },
    paths: {},
  };

  console.log("🚀 Testing with invalid spec (no paths)...");

  const result = await generator.generateSDK(invalidSpec, testConfig);

  if (!result.success) {
    console.log("✅ Correctly rejected invalid spec");
    console.log(`   Error: ${result.error}`);
  } else {
    console.log("❌ Should have rejected invalid spec");
  }
}

// Run all tests
async function runTests() {
  try {
    await testSDKGenerator();
    await testConcurrentLimit();
    await testSpecValidation();

    console.log("\n\n✨ All tests completed!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();

/**
 * Test script for mock server
 *
 * This script:
 * 1. Loads a valid OpenAPI spec
 * 2. Starts a mock server
 * 3. Makes test requests to the mock server
 * 4. Displays the responses
 * 5. Stops the mock server
 */

import { getMockServerManager } from "../packages/openapi/src/mock-manager";
import { readFileSync } from "fs";
import { join } from "path";
import axios from "axios";

async function testMockServer() {
  console.log("🚀 Starting Mock Server Test\n");

  // Load the spec
  console.log("📄 Loading OpenAPI spec...");
  const specPath = join(
    process.cwd(),
    "public/test-specs/simple-petstore.json"
  );
  const spec = JSON.parse(readFileSync(specPath, "utf-8"));
  console.log(`✅ Loaded spec: ${spec.info.title} v${spec.info.version}\n`);

  // Get mock server manager
  const manager = getMockServerManager();

  // Check if Prism is installed
  if (!manager.isPrismInstalled()) {
    console.error("❌ Prism CLI is not installed!");
    console.log("\nInstall it with:");
    console.log("  npm install -g @stoplight/prism-cli");
    console.log("  yarn global add @stoplight/prism-cli");
    console.log("  pnpm add -g @stoplight/prism-cli");
    process.exit(1);
  }
  console.log("✅ Prism CLI is installed\n");

  try {
    // Start the mock server
    console.log("🔧 Starting mock server...");
    const serverInfo = await manager.startServer("test-petstore", {
      specPath,
      port: 4010,
    });

    console.log(`✅ Mock server started successfully!`);
    console.log(`   URL: ${serverInfo.url}`);
    console.log(`   Port: ${serverInfo.port}`);
    console.log(`   PID: ${serverInfo.pid}\n`);

    // Wait a moment for the server to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 1: GET /pets
    console.log("📡 Test 1: GET /pets");
    try {
      const response1 = await axios.get(`${serverInfo.url}/pets`);
      console.log(`   Status: ${response1.status} ${response1.statusText}`);
      console.log(`   Response:`, JSON.stringify(response1.data, null, 2));
      console.log("   ✅ Success!\n");
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 2: GET /pets/1
    console.log("📡 Test 2: GET /pets/1");
    try {
      const response2 = await axios.get(`${serverInfo.url}/pets/1`);
      console.log(`   Status: ${response2.status} ${response2.statusText}`);
      console.log(`   Response:`, JSON.stringify(response2.data, null, 2));
      console.log("   ✅ Success!\n");
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 3: POST /pets
    console.log("📡 Test 3: POST /pets");
    try {
      const response3 = await axios.post(`${serverInfo.url}/pets`, {
        name: "Rex",
        tag: "dog",
      });
      console.log(`   Status: ${response3.status} ${response3.statusText}`);
      console.log(`   Response:`, JSON.stringify(response3.data, null, 2));
      console.log("   ✅ Success!\n");
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 4: GET /pets with query parameter
    console.log("📡 Test 4: GET /pets?limit=5");
    try {
      const response4 = await axios.get(`${serverInfo.url}/pets?limit=5`);
      console.log(`   Status: ${response4.status} ${response4.statusText}`);
      console.log(`   Response:`, JSON.stringify(response4.data, null, 2));
      console.log("   ✅ Success!\n");
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Stop the mock server
    console.log("🛑 Stopping mock server...");
    await manager.stopServer("test-petstore");
    console.log("✅ Mock server stopped successfully!\n");

    console.log("🎉 All tests completed!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    // Try to stop the server if it's running
    try {
      await manager.stopServer("test-petstore");
    } catch (stopError) {
      // Ignore stop errors
    }

    process.exit(1);
  }
}

// Run the test
testMockServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

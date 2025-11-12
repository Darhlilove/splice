/**
 * Simple test script to verify OpenAPI parser functionality
 * Loads the Petstore spec and logs parsed endpoints
 */

import { parseOpenAPISpec } from "./src/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParser() {
  try {
    console.log("🔍 Testing OpenAPI Parser...\n");

    // Path to the Petstore spec
    const specPath = path.join(
      __dirname,
      "../../public/test-specs/petstore-openapi-spec.json"
    );
    console.log(`📄 Loading spec from: ${specPath}\n`);

    // Parse the specification
    const parsed = await parseOpenAPISpec(specPath);

    // Log API info
    console.log("📋 API Information:");
    console.log(`   Title: ${parsed.info.title}`);
    console.log(`   Version: ${parsed.info.version}`);
    console.log(`   Description: ${parsed.info.description || "N/A"}\n`);

    // Log servers
    if (parsed.info.servers && parsed.info.servers.length > 0) {
      console.log("🌐 Servers:");
      parsed.info.servers.forEach((server) => {
        console.log(
          `   - ${server.url}${
            server.description ? ` (${server.description})` : ""
          }`
        );
      });
      console.log();
    }

    // Log endpoints
    console.log(`🔗 Endpoints (${parsed.endpoints.length} total):\n`);
    parsed.endpoints.forEach((endpoint) => {
      console.log(
        `   ${endpoint.method.toUpperCase().padEnd(7)} ${endpoint.path}`
      );
      if (endpoint.summary) {
        console.log(`           ${endpoint.summary}`);
      }
      if (endpoint.tags && endpoint.tags.length > 0) {
        console.log(`           Tags: ${endpoint.tags.join(", ")}`);
      }
      console.log();
    });

    console.log("✅ Parser test completed successfully!");
  } catch (error) {
    console.error("❌ Parser test failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testParser();

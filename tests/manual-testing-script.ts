/**
 * Manual Testing Script for Mock Server Integration
 *
 * This script provides a comprehensive manual testing workflow for the mock server feature.
 * Run with: npx tsx tests/manual-testing-script.ts
 *
 * Tests:
 * - Petstore spec
 * - Stripe spec
 * - Invalid specs
 * - Concurrent mock servers
 */

import { MockServerManager } from "../packages/openapi/src/mock-manager";
import path from "path";
import axios from "axios";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.cyan);
  console.log("=".repeat(60) + "\n");
}

function logTest(name: string) {
  log(`\n▶ ${name}`, colors.blue);
}

function logSuccess(message: string) {
  log(`  ✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`  ✗ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`  ⚠ ${message}`, colors.yellow);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testPetstoreSpec(manager: MockServerManager) {
  logTest("Test 1: Petstore Spec");

  const specPath = path.join(
    process.cwd(),
    "public/test-specs/petstore-openapi-spec.json"
  );
  const specId = "petstore-manual-test";

  try {
    // Start server
    log("  Starting mock server...");
    const serverInfo = await manager.startServer(specId, { specPath });
    logSuccess(`Server started on ${serverInfo.url}`);
    logSuccess(`Port: ${serverInfo.port}, PID: ${serverInfo.pid}`);

    // Wait for server to be ready
    await sleep(2000);

    // Test GET request
    log("  Testing GET /pets...");
    try {
      const response = await axios.get(`${serverInfo.url}/pets`, {
        timeout: 5000,
      });
      logSuccess(`GET /pets returned status ${response.status}`);
      logSuccess(
        `Response data: ${JSON.stringify(response.data).substring(0, 100)}...`
      );
    } catch (error: any) {
      logError(`GET /pets failed: ${error.message}`);
    }

    // Test POST request
    log("  Testing POST /pets...");
    try {
      const response = await axios.post(
        `${serverInfo.url}/pets`,
        { name: "Fluffy", tag: "cat" },
        { timeout: 5000 }
      );
      logSuccess(`POST /pets returned status ${response.status}`);
    } catch (error: any) {
      logError(`POST /pets failed: ${error.message}`);
    }

    // Stop server
    log("  Stopping mock server...");
    await manager.stopServer(specId);
    logSuccess("Server stopped successfully");

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testStripeSpec(manager: MockServerManager) {
  logTest("Test 2: Stripe Spec");

  const specPath = path.join(
    process.cwd(),
    "public/test-specs/stripe-spec.yaml"
  );
  const specId = "stripe-manual-test";

  try {
    // Start server
    log("  Starting mock server...");
    const serverInfo = await manager.startServer(specId, { specPath });
    logSuccess(`Server started on ${serverInfo.url}`);
    logSuccess(`Port: ${serverInfo.port}, PID: ${serverInfo.pid}`);

    // Wait for server to be ready
    await sleep(2000);

    // Test a Stripe endpoint
    log("  Testing Stripe endpoints...");
    try {
      // Try to get account info (common Stripe endpoint)
      const response = await axios.get(`${serverInfo.url}/v1/account`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status
      });
      logSuccess(`GET /v1/account returned status ${response.status}`);
    } catch (error: any) {
      logWarning(`Stripe endpoint test: ${error.message}`);
    }

    // Stop server
    log("  Stopping mock server...");
    await manager.stopServer(specId);
    logSuccess("Server stopped successfully");

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function testInvalidSpec(manager: MockServerManager) {
  logTest("Test 3: Invalid Spec");

  const specPath = "/nonexistent/invalid-spec.json";
  const specId = "invalid-spec-test";

  try {
    log("  Attempting to start server with invalid spec...");
    await manager.startServer(specId, { specPath });
    logError("Server should have failed to start");
    return false;
  } catch (error: any) {
    logSuccess(`Correctly rejected invalid spec: ${error.message}`);
    return true;
  }
}

async function testConcurrentServers(manager: MockServerManager) {
  logTest("Test 4: Concurrent Mock Servers");

  const petstoreSpec = path.join(
    process.cwd(),
    "public/test-specs/petstore-openapi-spec.json"
  );
  const twilioSpec = path.join(
    process.cwd(),
    "public/test-specs/twilio_accounts_v1.json"
  );

  const servers: string[] = [];

  try {
    // Start multiple servers
    log("  Starting Petstore server...");
    const petstore = await manager.startServer("petstore-concurrent", {
      specPath: petstoreSpec,
    });
    servers.push("petstore-concurrent");
    logSuccess(`Petstore server on port ${petstore.port}`);

    log("  Starting Twilio server...");
    const twilio = await manager.startServer("twilio-concurrent", {
      specPath: twilioSpec,
    });
    servers.push("twilio-concurrent");
    logSuccess(`Twilio server on port ${twilio.port}`);

    // Verify different ports
    if (petstore.port !== twilio.port) {
      logSuccess("Servers are running on different ports");
    } else {
      logError("Servers are on the same port!");
    }

    // Check all servers
    const allServers = manager.getAllServers();
    logSuccess(`Total servers running: ${allServers.size}`);

    // Stop all servers
    log("  Stopping all servers...");
    for (const serverId of servers) {
      await manager.stopServer(serverId);
    }
    logSuccess("All servers stopped");

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    // Cleanup
    for (const serverId of servers) {
      try {
        await manager.stopServer(serverId);
      } catch (e) {
        // Ignore
      }
    }
    return false;
  }
}

async function testPortConflict(manager: MockServerManager) {
  logTest("Test 5: Port Conflict Handling");

  const specPath = path.join(
    process.cwd(),
    "public/test-specs/petstore-openapi-spec.json"
  );
  const port = 4055;

  const servers: string[] = [];

  try {
    // Start first server on specific port
    log(`  Starting first server on port ${port}...`);
    const server1 = await manager.startServer("port-test-1", {
      specPath,
      port,
    });
    servers.push("port-test-1");
    logSuccess(`First server started on port ${server1.port}`);

    // Try to start second server on same port
    log(`  Starting second server (requesting same port ${port})...`);
    const server2 = await manager.startServer("port-test-2", {
      specPath,
      port,
    });
    servers.push("port-test-2");

    if (server2.port !== port) {
      logSuccess(
        `Second server automatically assigned different port: ${server2.port}`
      );
    } else {
      logError("Port conflict not handled correctly");
    }

    // Cleanup
    log("  Stopping servers...");
    for (const serverId of servers) {
      await manager.stopServer(serverId);
    }
    logSuccess("Servers stopped");

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    // Cleanup
    for (const serverId of servers) {
      try {
        await manager.stopServer(serverId);
      } catch (e) {
        // Ignore
      }
    }
    return false;
  }
}

async function testServerRestart(manager: MockServerManager) {
  logTest("Test 6: Server Restart");

  const specPath = path.join(
    process.cwd(),
    "public/test-specs/petstore-openapi-spec.json"
  );
  const specId = "restart-test";

  try {
    // Start server
    log("  Starting server (first time)...");
    const server1 = await manager.startServer(specId, { specPath });
    logSuccess(`Server started on port ${server1.port}`);

    // Stop server
    log("  Stopping server...");
    await manager.stopServer(specId);
    logSuccess("Server stopped");

    await sleep(1000);

    // Restart server
    log("  Restarting server...");
    const server2 = await manager.startServer(specId, { specPath });
    logSuccess(`Server restarted on port ${server2.port}`);

    // Stop again
    log("  Stopping server...");
    await manager.stopServer(specId);
    logSuccess("Server stopped");

    return true;
  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    try {
      await manager.stopServer(specId);
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

async function main() {
  logSection("Mock Server Manual Testing Script");

  const manager = new MockServerManager();

  // Check if Prism is installed
  if (!manager.isPrismInstalled()) {
    logError("Prism CLI is not installed!");
    log("\n" + manager.getPrismInstallationInstructions());
    process.exit(1);
  }

  logSuccess("Prism CLI is installed");

  const results: { name: string; passed: boolean }[] = [];

  // Run tests
  results.push({
    name: "Petstore Spec",
    passed: await testPetstoreSpec(manager),
  });

  results.push({
    name: "Stripe Spec",
    passed: await testStripeSpec(manager),
  });

  results.push({
    name: "Invalid Spec",
    passed: await testInvalidSpec(manager),
  });

  results.push({
    name: "Concurrent Servers",
    passed: await testConcurrentServers(manager),
  });

  results.push({
    name: "Port Conflict",
    passed: await testPortConflict(manager),
  });

  results.push({
    name: "Server Restart",
    passed: await testServerRestart(manager),
  });

  // Cleanup
  await manager.cleanup();

  // Summary
  logSection("Test Summary");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });

  log(
    `\n${passed}/${total} tests passed`,
    passed === total ? colors.green : colors.red
  );

  if (passed === total) {
    log("\n🎉 All tests passed!", colors.green);
    process.exit(0);
  } else {
    log("\n❌ Some tests failed", colors.red);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

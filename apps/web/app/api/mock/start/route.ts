import { NextRequest, NextResponse } from "next/server";
import { getMockServerManager, getSpec, saveSpec } from "@splice/openapi";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specId, port } = body;

    // Validate required fields
    if (!specId) {
      return NextResponse.json(
        { success: false, error: "specId is required" },
        { status: 400 }
      );
    }

    // Get the original spec from the store
    let storedSpec = await getSpec(specId);

    // If spec not found in store but provided in body (client-side fallback), use it
    if (!storedSpec && body.spec) {
      console.log(`[Mock Server] Spec ${specId} not found in store, using client-provided spec`);

      // We need to re-save it to the store for future use
      // Note: body.spec is likely the parsed spec, so we treat it as both parsed and original for now
      // Ideally the client should send originalSpec too if available, but parsed spec usually works for Prism
      // unless it has circular refs that were handled in a specific way

      // Extract originalSpec if it exists in the body, otherwise use the spec itself
      const originalSpec = body.spec.originalSpec || body.spec;

      await saveSpec(specId, body.spec, {
        source: "client-fallback",
      }, originalSpec);

      storedSpec = await getSpec(specId);
    }

    if (!storedSpec) {
      return NextResponse.json(
        { success: false, error: "Spec not found in store" },
        { status: 404 }
      );
    }

    // Use the originalSpec if available, otherwise fall back to the parsed spec
    // (though the parsed spec won't work with Prism)
    const specForPrism = storedSpec.originalSpec || storedSpec.spec;

    if (!specForPrism) {
      return NextResponse.json(
        { success: false, error: "No valid spec data found" },
        { status: 400 }
      );
    }

    // Create temp directory for specs if it doesn't exist
    const tempDir = join(tmpdir(), "splice-specs");
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write spec to temp file
    const specPath = join(tempDir, `${specId}.json`);

    await writeFile(specPath, JSON.stringify(specForPrism, null, 2), "utf-8");
    console.log("[Mock Server] Spec written to:", specPath);

    // Get mock server manager instance
    const manager = getMockServerManager();

    // Start the mock server
    const serverInfo = await manager.startServer(specId, {
      specPath,
      port,
    });

    return NextResponse.json({
      success: true,
      serverInfo,
    });
  } catch (error) {
    console.error("Mock server start error:", error);

    // Handle specific error types
    let errorMessage = "Failed to start mock server";
    let statusCode = 500;
    let errorType = "UNKNOWN_ERROR";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error conditions and categorize them
      if (
        error.message.includes("Prism CLI is not installed") ||
        error.message.includes("Prism is not installed")
      ) {
        statusCode = 503;
        errorType = "PRISM_NOT_INSTALLED";
      } else if (
        error.message.includes("No available ports") ||
        error.message.includes("Could not find available port")
      ) {
        statusCode = 503;
        errorType = "NO_PORTS_AVAILABLE";
      } else if (
        error.message.includes("Invalid OpenAPI specification") ||
        error.message.includes("Missing schema reference") ||
        error.message.includes("OpenAPI specification error") ||
        error.message.includes("YAML parsing error") ||
        error.message.includes("JSON parsing error")
      ) {
        statusCode = 400;
        errorType = "INVALID_SPEC";
      } else if (error.message.includes("timeout")) {
        statusCode = 504;
        errorType = "STARTUP_TIMEOUT";
      } else if (error.message.includes("EADDRINUSE")) {
        statusCode = 503;
        errorType = "PORT_CONFLICT";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorType,
      },
      { status: statusCode }
    );
  }
}

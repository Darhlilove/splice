import { NextRequest, NextResponse } from "next/server";
import { getMockServerManager } from "@splice/openapi";
import { unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specId } = body;

    // Validate required fields
    if (!specId) {
      return NextResponse.json(
        { success: false, error: "specId is required" },
        { status: 400 }
      );
    }

    // Get mock server manager instance
    const manager = getMockServerManager();

    // Stop the mock server
    await manager.stopServer(specId);

    // Clean up temp spec file
    const tempDir = join(tmpdir(), "splice-specs");
    const specPath = join(tempDir, `${specId}.json`);

    try {
      await unlink(specPath);
    } catch (error) {
      // File might not exist or already deleted, log but don't fail
      console.warn(`Failed to delete temp spec file: ${specPath}`, error);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Mock server stop error:", error);

    let errorMessage = "Failed to stop mock server";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

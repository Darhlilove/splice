import { NextRequest, NextResponse } from "next/server";
import { getMockServerManager } from "@splice/openapi";

export async function GET(request: NextRequest) {
  try {
    // Get specId from query parameters
    const { searchParams } = new URL(request.url);
    const specId = searchParams.get("specId");

    // Validate required fields
    if (!specId) {
      return NextResponse.json(
        { success: false, error: "specId query parameter is required" },
        { status: 400 }
      );
    }

    // Get mock server manager instance
    const manager = getMockServerManager();

    // Debug: Log all available servers
    const allServers = manager.getAllServers();
    console.log(`[Mock Status] All server IDs:`, Array.from(allServers.keys()));
    console.log(`[Mock Status] Requested specId: ${specId}`);

    // Get server info
    const serverInfo = manager.getServerInfo(specId);

    console.log(`[Mock Status] specId: ${specId}, serverInfo:`, serverInfo);

    return NextResponse.json({
      success: true,
      serverInfo,
    });
  } catch (error) {
    console.error("Mock server status error:", error);

    let errorMessage = "Failed to get mock server status";

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

import { parseOpenAPISpec, generateSpecId, saveSpec } from "@splice/openapi";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Parse the OpenAPI spec from URL
    const parsedSpec = await parseOpenAPISpec(url);

    // Generate spec ID and save to store
    const specId = generateSpecId();
    saveSpec(specId, parsedSpec, {
      source: url,
    });

    // Return the parsed spec with spec ID
    return NextResponse.json({
      success: true,
      specId,
      data: parsedSpec,
      metadata: {
        source: url,
      },
    });
  } catch (error) {
    console.error("URL Parse error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse OpenAPI specification from URL",
      },
      { status: 500 }
    );
  }
}

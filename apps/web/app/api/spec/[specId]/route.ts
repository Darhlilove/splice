import { getSpec } from "@splice/openapi";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params;

    if (!specId) {
      return NextResponse.json(
        { success: false, error: "Spec ID is required" },
        { status: 400 }
      );
    }

    console.log("Retrieving spec with ID:", specId);
    const stored = getSpec(specId);

    if (!stored) {
      return NextResponse.json(
        {
          success: false,
          error: "Specification not found or expired",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stored.spec,
      metadata: stored.metadata,
    });
  } catch (error) {
    console.error("Retrieve spec error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve specification",
      },
      { status: 500 }
    );
  }
}

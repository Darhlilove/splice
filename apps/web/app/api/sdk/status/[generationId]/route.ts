import { NextRequest, NextResponse } from "next/server";
import { getFileManager } from "@splice/openapi";

// In-memory store for generation status
// In a production environment, this would be stored in a database or cache like Redis
interface GenerationStatus {
  status: "pending" | "generating" | "complete" | "failed";
  progress?: {
    stage: "validating" | "generating" | "packaging" | "complete";
    progress: number;
    message: string;
  };
  downloadUrl?: string;
  packageName?: string;
  packageVersion?: string;
  fileSize?: number;
  codeSamples?: Array<{
    title: string;
    code: string;
    language: string;
  }>;
  error?: string;
  createdAt: number;
}

// Global status store (would be replaced with Redis/database in production)
const globalStore = global as unknown as { generationStatusStore: Map<string, GenerationStatus> };
if (!globalStore.generationStatusStore) {
  globalStore.generationStatusStore = new Map<string, GenerationStatus>();
}
const generationStatusStore = globalStore.generationStatusStore;

// Helper function to get or create status
export function getGenerationStatus(
  generationId: string
): GenerationStatus | null {
  return generationStatusStore.get(generationId) || null;
}

// Helper function to update status (used by generate endpoint)
export function updateGenerationStatus(
  generationId: string,
  status: GenerationStatus
): void {
  generationStatusStore.set(generationId, status);

  // Clean up old statuses after 1 hour
  setTimeout(() => {
    generationStatusStore.delete(generationId);
  }, 3600000);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    const { generationId } = await params;

    // Validate generation ID parameter
    if (!generationId || typeof generationId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid generation ID",
        },
        { status: 400 }
      );
    }

    // Validate generation ID format
    if (!/^gen-\d+-[a-z0-9]+$/.test(generationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid generation ID format",
        },
        { status: 400 }
      );
    }

    // Query generation status
    const status = getGenerationStatus(generationId);

    // Check if generation exists
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Generation not found or has expired",
        },
        { status: 404 }
      );
    }

    console.log(
      `[SDK Status API] Status for ${generationId}: ${status.status}`
    );

    // Return status information
    return NextResponse.json({
      success: true,
      status: status.status,
      progress: status.progress,
      downloadUrl: status.downloadUrl,
      packageName: status.packageName,
      packageVersion: status.packageVersion,
      fileSize: status.fileSize,
      codeSamples: status.codeSamples,
      error: status.error,
    });
  } catch (error) {
    console.error("[SDK Status API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while checking generation status",
      },
      { status: 500 }
    );
  }
}

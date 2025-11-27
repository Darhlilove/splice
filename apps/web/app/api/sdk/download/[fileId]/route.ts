import { NextRequest, NextResponse } from "next/server";
import { getFileManager } from "@splice/openapi";
import { createReadStream, statSync } from "fs";
import { basename } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Validate file ID parameter
    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file ID",
        },
        { status: 400 }
      );
    }

    // Validate file ID format (should be hex string)
    if (!/^[a-f0-9]{32}$/.test(fileId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file ID format",
        },
        { status: 400 }
      );
    }

    // Get file manager instance
    const fileManager = getFileManager();

    // Retrieve file path
    const filePath = await fileManager.getFile(fileId);

    // Check if file exists and not expired
    if (!filePath) {
      return NextResponse.json(
        {
          success: false,
          error: "File not found or has expired",
        },
        { status: 404 }
      );
    }

    // Get file stats
    let stats;
    try {
      stats = statSync(filePath);
    } catch (error) {
      console.error(`[SDK Download API] Error reading file stats:`, error);
      return NextResponse.json(
        {
          success: false,
          error: "File not found",
        },
        { status: 404 }
      );
    }

    // Get filename from path
    const fileName = basename(filePath);

    console.log(`[SDK Download API] Streaming file: ${fileName} (${fileId})`);

    // Create read stream
    const fileStream = createReadStream(filePath);

    // Convert Node.js stream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk: string | Buffer) => {
          const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buffer));
        });

        fileStream.on("end", () => {
          controller.close();
        });

        fileStream.on("error", (error) => {
          console.error(`[SDK Download API] Stream error:`, error);
          controller.error(error);
        });
      },
      cancel() {
        fileStream.destroy();
      },
    });

    // Return file stream with appropriate headers
    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[SDK Download API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while downloading the file",
      },
      { status: 500 }
    );
  }
}

import { parseOpenAPISpec, generateSpecId, saveSpec } from "@splice/openapi";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = [".json", ".yaml", ".yml"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload a JSON or YAML file.",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 10MB limit.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file path
    const tempFilePath = join(tmpdir(), `openapi-${Date.now()}-${file.name}`);

    try {
      // Write the file to temp directory
      await writeFile(tempFilePath, buffer);

      // Parse the OpenAPI spec
      const parsedSpec = await parseOpenAPISpec(tempFilePath);

      // Clean up temp file
      await unlink(tempFilePath);

      // Generate spec ID and save to store
      const specId = generateSpecId();
      console.log("Generated specId:", specId);

      const savedId = saveSpec(specId, parsedSpec, {
        fileName: file.name,
        fileSize: file.size,
      }, parsedSpec.originalSpec);
      console.log("Saved spec with ID:", savedId);

      // Return the parsed spec with spec ID
      return NextResponse.json({
        success: true,
        specId,
        data: parsedSpec,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
    } catch (parseError) {
      // Clean up temp file if it exists
      try {
        await unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }

      throw parseError;
    }
  } catch (error) {
    console.error("Upload/Parse error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse OpenAPI specification",
      },
      { status: 500 }
    );
  }
}

// Note: Next.js App Router handles multipart/form-data automatically
// No need for bodyParser configuration

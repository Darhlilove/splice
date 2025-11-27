import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: only allow specific filenames
    const allowedFiles = [
      "simple-petstore.json",
      "petstore-openapi-spec.json",
      "petstore-openapi-spec.yaml",
      "stripe-spec.yaml",
      "twilio_accounts_v1.json",
      "twilio_accounts_v1.yaml",
    ];

    if (!allowedFiles.includes(filename)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read from the public directory
    // Try multiple possible paths since process.cwd() can vary
    const possiblePaths = [
      join(process.cwd(), "public/test-specs", filename),
      join(process.cwd(), "../../public/test-specs", filename),
      join(process.cwd(), "../../../public/test-specs", filename),
    ];

    console.log("[Test Specs API] process.cwd():", process.cwd());

    let content: string | null = null;
    let successPath: string | null = null;

    for (const path of possiblePaths) {
      try {
        content = await readFile(path, "utf-8");
        successPath = path;
        console.log("[Test Specs API] Successfully read from:", path);
        break;
      } catch (error) {
        // Try next path
        continue;
      }
    }

    if (!content || !successPath) {
      console.error(
        "[Test Specs API] File not found in any of:",
        possiblePaths
      );
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Parse and return as JSON
    const spec = JSON.parse(content);

    return NextResponse.json(spec);
  } catch (error) {
    console.error("Error loading test spec:", error);
    return NextResponse.json({ error: "Failed to load spec" }, { status: 500 });
  }
}

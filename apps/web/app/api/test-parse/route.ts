/**
 * Test API endpoint for OpenAPI parser
 * GET /api/test-parse - Parse the Petstore spec and return structured data
 */

import { parseOpenAPISpec } from "@splice/openapi";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    // Path to the Petstore test spec in root public directory
    const specPath = path.join(
      process.cwd(),
      "../../public/test-specs/petstore-openapi-spec.json"
    );

    console.log("Parsing OpenAPI spec from:", specPath);

    // Parse the specification
    const parsed = await parseOpenAPISpec(specPath);

    // Return the parsed data
    return NextResponse.json({
      success: true,
      data: {
        info: parsed.info,
        endpointCount: parsed.endpoints.length,
        endpoints: parsed.endpoints,
        schemaCount: Object.keys(parsed.schemas).length,
        schemas: parsed.schemas,
      },
    });
  } catch (error) {
    console.error("Parser error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

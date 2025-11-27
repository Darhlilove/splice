import { NextRequest, NextResponse } from "next/server";
import {
  SDKGenerator,
  getFileManager,
  type SDKConfig,
  type OpenAPISpec,
  type GenerationProgress,
} from "@splice/openapi";
import { updateGenerationStatus } from "../status/[generationId]/route";

// Create a singleton SDK generator instance
let sdkGeneratorInstance: SDKGenerator | null = null;

function getSDKGenerator(): SDKGenerator {
  if (!sdkGeneratorInstance) {
    sdkGeneratorInstance = new SDKGenerator();
  }
  return sdkGeneratorInstance;
}

/**
 * Generate code samples for preview
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
function generateCodeSamples(
  spec: OpenAPISpec,
  config: SDKConfig
): Array<{ title: string; code: string; language: string }> {
  const apiTitle = spec.info?.title || "API";
  const baseUrl =
    spec.servers?.[0]?.url ||
    (spec.host
      ? `${spec.schemes?.[0] || "https"}://${spec.host}${spec.basePath || ""}`
      : "https://api.example.com");

  // Get first endpoint for example
  const paths = spec.paths || {};
  const firstPath = Object.keys(paths)[0] || "/example";
  const firstPathItem = paths[firstPath];
  const firstMethod =
    (firstPathItem?.get && "get") ||
    (firstPathItem?.post && "post") ||
    (firstPathItem?.put && "put") ||
    "get";
  const firstOperation = firstPathItem?.[
    firstMethod as keyof typeof firstPathItem
  ] as any;
  const operationId = firstOperation?.operationId || "exampleOperation";

  // Sample 1: API Client initialization
  const apiClientSample = `import { Configuration, DefaultApi } from "${config.packageName}";

const config = new Configuration({
  basePath: "${baseUrl}",
  apiKey: "your-api-key",
});

const api = new DefaultApi(config);`;

  // Sample 2: Type definitions (extract from schemas)
  const schemas = spec.components?.schemas || spec.definitions || {};
  const schemaNames = Object.keys(schemas).slice(0, 3);
  let typeDefinitions = "";

  if (schemaNames.length > 0) {
    typeDefinitions = schemaNames
      .map((name) => {
        const schema = schemas[name] as any;
        const properties = schema.properties || {};
        const propertyLines = Object.keys(properties)
          .slice(0, 5)
          .map((propName) => {
            const prop = properties[propName];
            const type =
              prop.type === "integer" ? "number" : prop.type || "any";
            const required = schema.required?.includes(propName);
            return `  ${propName}${required ? "" : "?"}: ${type};`;
          })
          .join("\n");

        return `export interface ${name} {\n${propertyLines}\n}`;
      })
      .join("\n\n");
  } else {
    // Default type definitions if no schemas
    typeDefinitions = `export interface ApiResponse {
  code: number;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}`;
  }

  // Sample 3: Usage example
  const usageExample = `// Initialize the API client
const api = new DefaultApi(config);

// Make an API call
async function ${operationId}() {
  try {
    const response = await api.${operationId}();
    console.log("Response:", response);
    return response;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Use the function
${operationId}().then(result => {
  console.log("Success:", result);
});`;

  return [
    {
      title: "API Client",
      code: apiClientSample,
      language: "typescript",
    },
    {
      title: "Type Definitions",
      code: typeDefinitions,
      language: "typescript",
    },
    {
      title: "Usage Example",
      code: usageExample,
      language: "typescript",
    },
  ];
}

export async function POST(request: NextRequest) {
  // Generate unique generation ID at the start so it's available in catch
  const generationId = `gen-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  try {
    const body = await request.json();
    const { specId, spec, config } = body;

    // Validate required fields
    if (!spec) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAPI specification is required",
        },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: "SDK configuration is required",
        },
        { status: 400 }
      );
    }

    // Validate config structure
    if (!config.packageName || !config.packageVersion || !config.language) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SDK configuration must include packageName, packageVersion, and language",
        },
        { status: 400 }
      );
    }

    // Get SDK generator and file manager instances
    const generator = getSDKGenerator();
    const fileManager = getFileManager();

    console.log(`[SDK Generate API] Starting generation ${generationId}`);
    console.log(`[SDK Generate API] Config:`, JSON.stringify(config, null, 2));

    // Initialize generation status
    updateGenerationStatus(generationId, {
      status: "pending",
      createdAt: Date.now(),
    });

    // Generate SDK with progress tracking
    const result = await generator.generateSDK(
      spec as OpenAPISpec,
      config as SDKConfig,
      (progress: GenerationProgress) => {
        console.log(
          `[SDK Generate API] Progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`
        );

        // Update status based on progress
        const status =
          progress.stage === "complete"
            ? "complete"
            : progress.stage === "validating"
            ? "pending"
            : "generating";

        updateGenerationStatus(generationId, {
          status,
          progress,
          createdAt: Date.now(),
        });
      }
    );

    // Handle generation failure
    if (!result.success) {
      console.error(`[SDK Generate API] Generation failed:`, result.error);

      // Update status to failed
      updateGenerationStatus(generationId, {
        status: "failed",
        error: result.error || "SDK generation failed",
        createdAt: Date.now(),
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || "SDK generation failed",
          warnings: result.warnings,
        },
        { status: 500 }
      );
    }

    // Store the generated ZIP file with FileManager
    if (!result.outputPath) {
      return NextResponse.json(
        {
          success: false,
          error: "SDK generation completed but no output path was provided",
        },
        { status: 500 }
      );
    }

    // Store the file with 1 hour TTL
    const fileId = await fileManager.storeFile(result.outputPath, 3600000);
    const downloadUrl = fileManager.getDownloadUrl(fileId);

    // Get file size
    const fs = await import("fs");
    const stats = fs.statSync(result.outputPath);
    const fileSize = stats.size;

    // Generate code samples for preview
    const codeSamples = generateCodeSamples(spec, config);

    console.log(`[SDK Generate API] Generation complete: ${downloadUrl}`);

    // Update status to complete with download URL and metadata
    updateGenerationStatus(generationId, {
      status: "complete",
      downloadUrl,
      packageName: config.packageName,
      packageVersion: config.packageVersion,
      fileSize,
      codeSamples,
      createdAt: Date.now(),
    });

    // Return success response with download URL
    return NextResponse.json({
      success: true,
      generationId,
      downloadUrl,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("[SDK Generate API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Update status to failed
    updateGenerationStatus(generationId, {
      status: "failed",
      error: errorMessage,
      createdAt: Date.now(),
    });

    // Handle specific error types
    if (error instanceof Error) {
      // Check for validation errors
      if (error.message.includes("validation")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      // Check for timeout errors
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 408 }
        );
      }

      // Check for concurrent generation limit
      if (error.message.includes("Maximum concurrent")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 429 }
        );
      }

      // Check for OpenAPI Generator not found
      if (
        error.message.includes("OpenAPI Generator") ||
        error.message.includes("not found")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during SDK generation",
      },
      { status: 500 }
    );
  }
}

/**
 * Mock Server Error Utilities
 *
 * Provides helper functions for handling and displaying mock server errors
 */

export interface MockServerError {
  message: string;
  type: string;
  suggestions?: string[];
  links?: Array<{ text: string; url: string }>;
}

/**
 * Parse and categorize mock server errors for user-friendly display
 */
export function parseMockServerError(
  error: string,
  errorType?: string
): MockServerError {
  const result: MockServerError = {
    message: error,
    type: errorType || "UNKNOWN_ERROR",
    suggestions: [],
    links: [],
  };

  // Prism not installed
  if (
    error.includes("Prism CLI is not installed") ||
    errorType === "PRISM_NOT_INSTALLED"
  ) {
    result.suggestions = [
      "Install Prism CLI globally using npm, yarn, or pnpm",
      "npm install -g @stoplight/prism-cli",
      "yarn global add @stoplight/prism-cli",
      "pnpm add -g @stoplight/prism-cli",
    ];
    result.links = [
      {
        text: "View Prism Documentation",
        url: "https://docs.stoplight.io/docs/prism/674b27b261c3c-prism-overview",
      },
    ];
  }

  // Invalid spec - missing schema reference
  else if (
    error.includes("Missing schema reference") ||
    errorType === "INVALID_SPEC"
  ) {
    result.suggestions = [
      "Check that all $ref pointers point to valid schema definitions",
      "Ensure all referenced schemas exist in the components/schemas section",
      "Validate your spec using an online validator",
    ];
    result.links = [
      {
        text: "Open Swagger Editor",
        url: "https://editor.swagger.io/",
      },
      {
        text: "OpenAPI Specification Guide",
        url: "https://swagger.io/specification/",
      },
    ];
  }

  // YAML/JSON parsing errors
  else if (
    error.includes("YAML parsing error") ||
    error.includes("JSON parsing error")
  ) {
    result.suggestions = [
      "Check your spec for syntax errors",
      "Validate your spec using an online validator",
      "Ensure proper indentation and formatting",
    ];
    result.links = [
      {
        text: "Open Swagger Editor",
        url: "https://editor.swagger.io/",
      },
    ];
  }

  // No available ports
  else if (
    error.includes("No available ports") ||
    errorType === "NO_PORTS_AVAILABLE"
  ) {
    result.suggestions = [
      "Stop other mock servers or services using ports 4010-4099",
      "Check for other applications using these ports",
      "Try restarting the application",
    ];
  }

  // Port conflict
  else if (error.includes("EADDRINUSE") || errorType === "PORT_CONFLICT") {
    result.suggestions = [
      "The requested port is already in use",
      "The system will automatically try alternative ports",
      "If the issue persists, stop other services using the port range",
    ];
  }

  // Startup timeout
  else if (error.includes("timeout") || errorType === "STARTUP_TIMEOUT") {
    result.suggestions = [
      "The mock server took too long to start",
      "This may be due to a large or complex spec",
      "Try simplifying your spec or check system resources",
    ];
  }

  return result;
}

/**
 * Get a user-friendly title for an error type
 */
export function getErrorTitle(errorType: string): string {
  switch (errorType) {
    case "PRISM_NOT_INSTALLED":
      return "Prism CLI Not Installed";
    case "INVALID_SPEC":
      return "Invalid OpenAPI Specification";
    case "NO_PORTS_AVAILABLE":
      return "No Available Ports";
    case "PORT_CONFLICT":
      return "Port Already in Use";
    case "STARTUP_TIMEOUT":
      return "Server Startup Timeout";
    default:
      return "Error Starting Mock Server";
  }
}

/**
 * API Proxy endpoint
 * Proxies HTTP requests to avoid CORS issues
 */

import { NextRequest, NextResponse } from "next/server";

// Maximum timeout for proxied requests (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Blocked URL patterns for security
const BLOCKED_PATTERNS = [
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i, // Local addresses
  /^https?:\/\/192\.168\./i, // Private network
  /^https?:\/\/10\./i, // Private network
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./i, // Private network
];

/**
 * Validates that the target URL is safe to proxy
 */
function isValidProxyTarget(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check against blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/proxy
 * Proxies an HTTP request to the specified URL
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { url, method, headers, body: requestBody } = body;

    // Validate required fields
    if (!url || !method) {
      return NextResponse.json(
        { error: "Missing required fields: url and method" },
        { status: 400 }
      );
    }

    // Validate URL
    if (!isValidProxyTarget(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid or blocked URL. Cannot proxy to local or private network addresses.",
        },
        { status: 400 }
      );
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: headers || {},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    };

    // Add body if present and method supports it
    if (
      requestBody &&
      ["POST", "PUT", "PATCH"].includes(method.toUpperCase())
    ) {
      // If body is FormData, we need to handle it specially
      if (requestBody instanceof FormData) {
        fetchOptions.body = requestBody;
      } else if (typeof requestBody === "string") {
        fetchOptions.body = requestBody;
      } else {
        fetchOptions.body = JSON.stringify(requestBody);
      }
    }

    // Record start time for duration measurement
    const startTime = Date.now();

    // Make the proxied request
    const response = await fetch(url, fetchOptions);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Get response body
    const contentType = response.headers.get("content-type") || "";
    let responseBody: unknown;

    if (contentType.includes("application/json")) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    // Return proxied response
    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        {
          error: "Request timeout",
          message: `Request exceeded ${
            REQUEST_TIMEOUT / 1000
          } second timeout. The server may be slow or unresponsive.`,
          type: "timeout",
        },
        { status: 504 }
      );
    }

    // Handle abort errors (also timeout related)
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Request timeout",
          message: `Request was aborted after ${
            REQUEST_TIMEOUT / 1000
          } seconds.`,
          type: "timeout",
        },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      let type = "network";
      let message =
        "Failed to connect to the target server. Please check the URL and try again.";

      // Detect specific network error types
      if (errorMessage.includes("fetch failed")) {
        message =
          "Network request failed. The server may be unreachable or the URL may be incorrect.";
      } else if (errorMessage.includes("cors")) {
        type = "cors";
        message =
          "CORS error: The server does not allow requests from this origin.";
      }

      return NextResponse.json(
        {
          error: "Network error",
          message,
          type,
          details: error.message,
        },
        { status: 502 }
      );
    }

    // Handle other errors
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Proxy error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while processing the request.",
        type: "unknown",
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/proxy
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

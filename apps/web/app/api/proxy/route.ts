/**
 * API Proxy endpoint
 * Proxies HTTP requests to avoid CORS issues
 */

import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

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

    // Log incoming request for debugging
    console.log("[Proxy] Incoming request:", {
      url,
      method,
      hasHeaders: !!headers,
      hasBody: !!requestBody,
    });

    // Validate required fields
    if (!url || !method) {
      console.error("[Proxy] Missing required fields:", { url, method });
      return NextResponse.json(
        { error: "Missing required fields: url and method" },
        { status: 400 }
      );
    }

    // Validate URL
    if (!isValidProxyTarget(url)) {
      console.error("[Proxy] Invalid URL:", url);
      return NextResponse.json(
        {
          error:
            "Invalid or blocked URL. Cannot proxy to local or private network addresses.",
        },
        { status: 400 }
      );
    }

    // Record start time for duration measurement
    const startTime = performance.now();

    // Make the proxied request using axios
    const response = await axios({
      url,
      method: method.toUpperCase(),
      headers: headers || {},
      data: requestBody,
      timeout: REQUEST_TIMEOUT,
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
    });

    // Calculate response time
    const responseTime = Math.round(performance.now() - startTime);

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    Object.entries(response.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        responseHeaders[key] = value;
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(", ");
      }
    });

    // Check if response is an error status (4xx or 5xx)
    const isErrorStatus = response.status >= 400;

    // Return proxied response
    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: response.data,
        responseTime,
        timestamp: new Date().toISOString(),
        // Include error information for 4xx/5xx responses
        ...(isErrorStatus && {
          error: true,
          errorType: response.status >= 500 ? "server" : "client",
          errorMessage: `${response.status} ${response.statusText}`,
        }),
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
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Handle timeout errors
      if (
        axiosError.code === "ECONNABORTED" ||
        axiosError.code === "ETIMEDOUT"
      ) {
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

      // Handle network errors
      if (
        axiosError.code === "ENOTFOUND" ||
        axiosError.code === "ECONNREFUSED"
      ) {
        return NextResponse.json(
          {
            error: "Network error",
            message:
              "Failed to connect to the target server. The server may be unreachable or the URL may be incorrect.",
            type: "network",
            details: axiosError.message,
          },
          { status: 502 }
        );
      }

      // Handle other network errors
      if (!axiosError.response) {
        return NextResponse.json(
          {
            error: "Network error",
            message:
              "Network request failed. Please check the URL and your internet connection.",
            type: "network",
            details: axiosError.message,
          },
          { status: 502 }
        );
      }

      // If we have a response, it means the request went through but got an error status
      // This shouldn't happen since we use validateStatus: () => true
      // But handle it just in case
      return NextResponse.json(
        {
          error: "Request error",
          message: axiosError.message,
          type: "server",
          details: axiosError.response?.data,
        },
        { status: axiosError.response?.status || 500 }
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

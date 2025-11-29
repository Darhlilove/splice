import { NextRequest, NextResponse } from "next/server";
import { getMockServerManager } from "@splice/openapi";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "GET");
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "POST");
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "PUT");
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "PATCH");
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "DELETE");
}

export async function OPTIONS(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "OPTIONS");
}

export async function HEAD(
    request: NextRequest,
    { params }: { params: Promise<{ specId: string; path: string[] }> }
) {
    return handleRequest(request, params, "HEAD");
}

async function handleRequest(
    request: NextRequest,
    params: Promise<{ specId: string; path: string[] }>,
    method: string
) {
    try {
        const { specId, path } = await params;

        if (!specId) {
            return NextResponse.json(
                { error: "Spec ID is required" },
                { status: 400 }
            );
        }

        // Get mock server manager
        const manager = getMockServerManager();
        const serverInfo = manager.getServerInfo(specId);

        if (!serverInfo || serverInfo.status !== "running") {
            return new NextResponse(
                JSON.stringify({
                    error: "Mock Server Not Found",
                    message: `No running mock server found for spec ID: ${specId}`,
                    details: {
                        specId,
                        status: serverInfo?.status || "not_found",
                        hint: "Please start the mock server from the Mock Server page first",
                    },
                    instructions: [
                        "1. Go to the Mock Server page",
                        "2. Upload or select your OpenAPI specification",
                        "3. Click 'Start Mock Server'",
                        "4. Use the gateway URL provided",
                    ],
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // Build the target URL
        const targetPath = path ? `/${path.join("/")}` : "/";
        const searchParams = request.nextUrl.searchParams.toString();
        const targetUrl = `http://localhost:${serverInfo.port}${targetPath}${searchParams ? `?${searchParams}` : ""
            }`;

        console.log(`[Mock Gateway] Proxying ${method} ${targetUrl}`);

        // Prepare headers (exclude host and other problematic headers)
        const headers = new Headers();
        request.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey !== "host" &&
                lowerKey !== "connection" &&
                lowerKey !== "content-length"
            ) {
                headers.set(key, value);
            }
        });

        // Prepare request options
        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        // Add body for methods that support it
        if (method !== "GET" && method !== "HEAD") {
            try {
                const body = await request.text();
                if (body) {
                    fetchOptions.body = body;
                }
            } catch (error) {
                // No body or error reading body, continue without it
            }
        }

        // Forward the request to the mock server
        const response = await fetch(targetUrl, fetchOptions);

        // Get response body
        const responseBody = await response.text();

        // Create response with same status and headers
        const proxyResponse = new NextResponse(responseBody, {
            status: response.status,
            statusText: response.statusText,
        });

        // Copy response headers
        response.headers.forEach((value, key) => {
            proxyResponse.headers.set(key, value);
        });

        // Add CORS headers to allow external access
        proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
        proxyResponse.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
        );
        proxyResponse.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );

        return proxyResponse;
    } catch (error) {
        console.error("[Mock Gateway] Error:", error);

        return NextResponse.json(
            {
                error: "Failed to proxy request to mock server",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

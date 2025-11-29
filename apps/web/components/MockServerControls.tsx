"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockServer, MockServerInfo } from "@/contexts/mock-server-context";
import type { OpenAPISpec } from "@splice/openapi";
import { toast } from "sonner";

interface MockServerControlsProps {
  specId: string;
  spec: OpenAPISpec;
  onServerStart?: (info: MockServerInfo) => void;
  onServerStop?: () => void;
}

export function MockServerControls({
  specId,
  spec,
  onServerStart,
  onServerStop,
}: MockServerControlsProps) {
  const { mockServerInfo, setMockServerInfo } = useMockServer();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Poll for status updates
  React.useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/mock/status?specId=${encodeURIComponent(specId)}`
        );
        const data = await response.json();

        if (data.success && data.serverInfo) {
          setMockServerInfo(data.serverInfo);
        } else if (data.success && !data.serverInfo) {
          // Server not found, set to null
          setMockServerInfo(null);
        }
      } catch (err) {
        console.error("Failed to poll server status:", err);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [specId, setMockServerInfo]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mock/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specId,
          spec,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Create a more detailed error object
        const error: any = new Error(
          data.error || "Failed to start mock server"
        );
        error.type = data.errorType;
        throw error;
      }

      setMockServerInfo(data.serverInfo);
      onServerStart?.(data.serverInfo);
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start mock server";
      setError(errorMessage);
      console.error("Mock server start error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mock/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to stop mock server");
      }

      setMockServerInfo(null);
      onServerStop?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stop mock server";
      setError(errorMessage);
      console.error("Mock server stop error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!mockServerInfo) {
      return (
        <Badge variant="secondary" className="bg-gray-500 text-white">
          Stopped
        </Badge>
      );
    }

    switch (mockServerInfo.status) {
      case "running":
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            Running
          </Badge>
        );
      case "starting":
        return (
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            Starting
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-600 text-white">
            Error
          </Badge>
        );
      case "stopped":
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            Stopped
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            Unknown
          </Badge>
        );
    }
  };

  const isRunning = mockServerInfo?.status === "running";
  const isStopped = !mockServerInfo || mockServerInfo.status === "stopped";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mock Server</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server URL */}
        {isRunning && mockServerInfo && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Public Gateway URL:</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/mock-gateway/${specId}`
                  : `/api/mock-gateway/${specId}`}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/api/mock-gateway/${specId}`
                      : `/api/mock-gateway/${specId}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Gateway URL copied to clipboard!");
                }}
              >
                Copy
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Internal Port: {mockServerInfo.port} • Accessible externally via
              gateway
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            <div className="font-semibold mb-2">
              {error.includes("Invalid OpenAPI specification")
                ? "Invalid OpenAPI Specification"
                : "Error Starting Mock Server"}
            </div>
            <div className="whitespace-pre-wrap">{error}</div>

            {/* Helpful links and suggestions based on error type */}
            {error.includes("Prism CLI is not installed") && (
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-2">
                <div className="text-xs font-semibold">
                  Installation Instructions:
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    npm:{" "}
                    <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                      npm install -g @stoplight/prism-cli
                    </code>
                  </div>
                  <div>
                    yarn:{" "}
                    <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                      yarn global add @stoplight/prism-cli
                    </code>
                  </div>
                  <div>
                    pnpm:{" "}
                    <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                      pnpm add -g @stoplight/prism-cli
                    </code>
                  </div>
                </div>
                <a
                  href="https://docs.stoplight.io/docs/prism/674b27b261c3c-prism-overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  View Prism Documentation →
                </a>
              </div>
            )}

            {error.includes("Missing schema reference") && (
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-2">
                <div className="text-xs font-semibold">How to fix:</div>
                <div className="text-xs">
                  Your OpenAPI spec references a schema component that doesn't
                  exist. Check that all{" "}
                  <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                    $ref
                  </code>{" "}
                  pointers point to valid schema definitions in the{" "}
                  <code className="bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                    components/schemas
                  </code>{" "}
                  section.
                </div>
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {(error.includes("YAML parsing error") ||
              error.includes("JSON parsing error")) && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-2">
                  <div className="text-xs font-semibold">How to fix:</div>
                  <div className="text-xs">
                    Your OpenAPI spec has syntax errors. Validate your spec using
                    an online validator:
                  </div>
                  <a
                    href="https://editor.swagger.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    Open Swagger Editor →
                  </a>
                </div>
              )}

            {error.includes("No available ports") && (
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-2">
                <div className="text-xs">
                  All ports in the range 4010-4099 are in use. Try stopping
                  other mock servers or services.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Server Error or Crash */}
        {(mockServerInfo?.status === "error" ||
          (mockServerInfo?.status === "stopped" && mockServerInfo.error)) &&
          mockServerInfo.error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
              <div className="font-semibold mb-2">
                {mockServerInfo.status === "error"
                  ? "Server Error"
                  : "Server Crashed"}
              </div>
              <div className="whitespace-pre-wrap">{mockServerInfo.error}</div>
              {mockServerInfo.status === "stopped" && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 text-xs">
                  The mock server has stopped unexpectedly. You can try
                  restarting it using the button below.
                </div>
              )}
            </div>
          )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={loading || isRunning}
            variant="default"
            className="flex-1"
          >
            {loading && !isRunning ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Starting...
              </>
            ) : (
              "Start Mock Server"
            )}
          </Button>

          <Button
            onClick={handleStop}
            disabled={loading || isStopped}
            variant="destructive"
            className="flex-1"
          >
            {loading && isRunning ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Stopping...
              </>
            ) : (
              "Stop Mock Server"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflow } from "@/contexts/workflow-context";
import { useMockServer } from "@/contexts/mock-server-context";
import { toast } from "sonner";

/**
 * MockServerStatus component
 * Displays mock server status in the application header
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function MockServerStatus() {
  const { state, setMockServerStatus } = useWorkflow();
  const { mockServerInfo, setMockServerInfo } = useMockServer();
  const [isCopying, setIsCopying] = React.useState(false);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  // Poll for status updates - Requirement 4.4
  React.useEffect(() => {
    // Only poll if we have a spec loaded
    if (!state.specId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/mock/status?specId=${encodeURIComponent(state.specId!)}`
        );
        const data = await response.json();

        if (data.success && data.serverInfo) {
          // Update both contexts with server info
          setMockServerInfo(data.serverInfo);
          setMockServerStatus({
            isRunning: data.serverInfo.status === "running",
            url: data.serverInfo.url,
            port: data.serverInfo.port,
          });
        } else if (data.success && !data.serverInfo) {
          // Server not found, set to stopped
          setMockServerInfo(null);
          setMockServerStatus({
            isRunning: false,
          });
        }
      } catch (err) {
        console.error("Failed to poll server status:", err);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [state.specId, setMockServerInfo, setMockServerStatus]);

  // Determine if server is running based on workflow state and mock server context
  const isRunning =
    state.mockServer.isRunning || mockServerInfo?.status === "running";
  const serverUrl = state.mockServer.url || mockServerInfo?.url;

  // Handle copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!state.specId) return;

    try {
      const gatewayUrl = `${window.location.origin}/api/mock-gateway/${state.specId}`;
      await navigator.clipboard.writeText(gatewayUrl);
      setIsCopying(true);
      toast.success("Gateway URL copied to clipboard");
      setTimeout(() => setIsCopying(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
    }
  };

  // Handle quick start action
  const handleQuickStart = async () => {
    if (!state.currentSpec || !state.specId) {
      toast.error("No spec loaded. Please upload a spec first.");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch("/api/mock/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specId: state.specId,
          spec: state.currentSpec,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start mock server");
      }

      // Update contexts with server info
      if (data.serverInfo) {
        setMockServerInfo(data.serverInfo);
        setMockServerStatus({
          isRunning: data.serverInfo.status === "running",
          url: data.serverInfo.url,
          port: data.serverInfo.port,
        });
      }

      toast.success("Mock server started successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start mock server";
      toast.error(errorMessage);
      console.error("Mock server start error:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle quick stop action
  const handleQuickStop = async () => {
    if (!state.specId) {
      toast.error("No spec loaded");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch("/api/mock/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specId: state.specId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to stop mock server");
      }

      toast.success("Mock server stopped");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop mock server";
      toast.error(errorMessage);
      console.error("Mock server stop error:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Don't render if no spec is loaded
  if (!state.currentSpec) {
    return null;
  }

  return (
    <TooltipProvider>
      {/* Screen reader announcement for status changes */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Mock server is {isRunning ? "running" : "stopped"}.
        {isRunning && serverUrl && ` Available at ${serverUrl}.`}
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 ml-2 rounded-lg border border-border bg-background/50">
        {/* Status Badge - Requirements 4.1, 4.2, 4.3 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {isRunning ? (
                <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs h-7 px-2.5 rounded-lg transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2">
                  <span className="mr-1 text-sm">🟢</span>
                  <span className="hidden sm:inline font-medium">Running</span>
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-gray-500 text-white hover:bg-gray-600 text-xs h-7 px-2.5 rounded-full transition-all duration-300 ease-in-out"
                >
                  <span className="mr-1 text-sm">⚫</span>
                  <span className="hidden sm:inline font-medium">Stopped</span>
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isRunning
                ? "Mock server is running"
                : "Mock server is not running"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Server URL - Requirement 4.2 - Hidden on mobile */}
        {isRunning && serverUrl && (
          <>


            {/* Copy URL Button - Requirement 4.3 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={handleCopyUrl}
                  disabled={isCopying}
                >
                  {isCopying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopying ? "Copied!" : "Copy URL"}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Quick Actions - Requirement 4.3 */}
        {isRunning ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs rounded-full font-medium"
                onClick={handleQuickStop}
                disabled={isActionLoading}
                aria-busy={isActionLoading}
              >
                {isActionLoading ? (
                  <div
                    className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Stop"
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isActionLoading ? "Stopping..." : "Stop mock server"}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs rounded-full font-medium"
                onClick={handleQuickStart}
                disabled={isActionLoading}
                aria-busy={isActionLoading}
              >
                {isActionLoading ? (
                  <div
                    className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Start"
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isActionLoading ? "Starting..." : "Start mock server"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

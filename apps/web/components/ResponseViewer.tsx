"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { APIResponse, RequestError } from "@/lib/request-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  AlertCircle,
  WifiOff,
  Timer,
  XCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ResponseFormatter, ResponseFormat } from "./ResponseFormatter";

// Lazy load Monaco Editor for better syntax highlighting
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => <ResponseBodySkeleton />,
  ssr: false,
});

/**
 * Props for the ResponseViewer component
 */
export interface ResponseViewerProps {
  response: (APIResponse | ResponseData) | null;
  loading?: boolean;
  error?: RequestError;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

// Import ResponseData type for compatibility
import type { ResponseData } from "@/types/request-builder";

/**
 * Get status code color based on HTTP status
 */
function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-green-500/10 text-green-500 border-green-500/20";
  } else if (status >= 400 && status < 500) {
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  } else if (status >= 500) {
    return "bg-red-500/10 text-red-500 border-red-500/20";
  }
  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
}

/**
 * Get error icon based on error type
 */
function getErrorIcon(type: RequestError["type"]) {
  switch (type) {
    case "network":
      return <WifiOff className="h-5 w-5" />;
    case "timeout":
      return <Timer className="h-5 w-5" />;
    case "validation":
      return <AlertCircle className="h-5 w-5" />;
    case "server":
      return <XCircle className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
}

/**
 * Format response time in milliseconds
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Loading skeleton for response body
 */
function ResponseBodySkeleton() {
  return (
    <div className="rounded-md border bg-muted/50 p-4 space-y-2 animate-pulse">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-4/5"></div>
    </div>
  );
}

/**
 * Loading skeleton for entire response viewer
 */
function ResponseViewerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 bg-muted-foreground/20 rounded animate-pulse"></div>
        <Separator />
        <ResponseBodySkeleton />
      </CardContent>
    </Card>
  );
}

/**
 * ResponseViewer component (memoized for performance)
 * Displays API responses with syntax highlighting, headers, and error handling
 */
export const ResponseViewer = React.memo(function ResponseViewer({
  response,
  loading = false,
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: ResponseViewerProps) {
  const [headersOpen, setHeadersOpen] = React.useState(false);
  const [errorDetailsOpen, setErrorDetailsOpen] = React.useState(false);
  const [format, setFormat] = React.useState<ResponseFormat>("pretty");

  // Show loading state with skeleton
  if (loading) {
    return <ResponseViewerSkeleton />;
  }

  // Get user-friendly error message based on error type
  const getErrorMessage = (error: RequestError): string => {
    switch (error.type) {
      case "timeout":
        return "The request took too long to complete. The server may be slow or unresponsive.";
      case "network":
        return "Unable to connect to the server. Please check your internet connection and the URL.";
      case "validation":
        return "Please fix the validation errors before executing the request.";
      case "server":
        return error.message || "The server returned an error response.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  };

  // Show error state
  if (error) {
    const canRetry =
      (error.type === "network" || error.type === "timeout") &&
      retryCount < maxRetries;

    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="text-destructive mt-0.5">
              {getErrorIcon(error.type)}
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-destructive text-lg">
                Request Failed
              </CardTitle>
              <p className="text-sm text-destructive/90 font-medium">
                {getErrorMessage(error)}
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details */}
          {error.details && (
            <Collapsible
              open={errorDetailsOpen}
              onOpenChange={setErrorDetailsOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {errorDetailsOpen ? "Hide" : "Show"} Error Details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-xs overflow-auto">
                    {typeof error.details === "string"
                      ? error.details
                      : JSON.stringify(error.details, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Retry Button */}
          {onRetry && (
            <div className="space-y-2">
              <Button
                onClick={onRetry}
                variant="outline"
                className="w-full"
                disabled={!canRetry}
              >
                {canRetry
                  ? "Retry Request"
                  : `Max retries reached (${maxRetries})`}
              </Button>
              {canRetry && (
                <p className="text-xs text-center text-muted-foreground">
                  The request will be retried automatically with exponential
                  backoff
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!response) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Execute a request to see the response
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detect content type and format body
  const contentType = (response.contentType || "").toLowerCase();
  const isJson =
    contentType.includes("application/json") ||
    contentType.includes("application/vnd.api+json");
  const isXml =
    contentType.includes("text/xml") || contentType.includes("application/xml");
  const isHtml = contentType.includes("text/html");

  console.log("[ResponseViewer] Response data:", {
    contentType,
    bodyType: typeof response.body,
    body: response.body,
    isJson,
  });

  let bodyContent: string;
  let language: string;

  try {
    if (isJson && typeof response.body === "object") {
      // Check if body is empty
      const isEmpty =
        response.body === null ||
        response.body === undefined ||
        (typeof response.body === "object" &&
          Object.keys(response.body).length === 0);

      if (isEmpty) {
        bodyContent = "{}";
      } else {
        // Apply formatting based on format state
        if (format === "minified") {
          bodyContent = JSON.stringify(response.body);
        } else {
          bodyContent = JSON.stringify(response.body, null, 2);
        }
      }
      language = "json";
    } else if (isJson && typeof response.body === "string") {
      // Try to parse and re-stringify for formatting
      try {
        const parsed = JSON.parse(response.body);
        if (format === "minified") {
          bodyContent = JSON.stringify(parsed);
        } else {
          bodyContent = JSON.stringify(parsed, null, 2);
        }
      } catch {
        bodyContent = response.body;
      }
      language = "json";
    } else if (isXml) {
      bodyContent =
        typeof response.body === "string"
          ? response.body
          : String(response.body);
      language = "xml";
    } else if (isHtml) {
      bodyContent =
        typeof response.body === "string"
          ? response.body
          : String(response.body);
      language = "html";
    } else {
      bodyContent =
        typeof response.body === "string"
          ? response.body
          : JSON.stringify(response.body, null, 2);
      language = "text";
    }
  } catch (err) {
    bodyContent = String(response.body);
    language = "text";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`${getStatusColor(
                response.status
              )} font-mono text-sm px-3 py-1`}
            >
              {response.status} {response.statusText}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono">
                {formatResponseTime(response.responseTime)}
              </span>
            </div>
          </div>
          <ResponseFormatter
            response={response}
            format={format}
            onFormatChange={setFormat}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Response Headers */}
        <Collapsible open={headersOpen} onOpenChange={setHeadersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              Headers ({Object.keys(response.headers).length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="rounded-md border bg-muted/50 p-4">
              <div className="space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-mono font-medium text-foreground min-w-[200px]">
                      {key}:
                    </span>
                    <span className="font-mono text-muted-foreground break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Response Body */}
        <div>
          <h3 className="text-sm font-medium mb-3">Response Body</h3>
          <div className="rounded-md overflow-hidden border">
            {bodyContent ? (
              <React.Suspense fallback={<ResponseBodySkeleton />}>
                <MonacoEditor
                  height="auto"
                  language={language}
                  value={bodyContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollbar: {
                      vertical: "hidden",
                      horizontal: "hidden",
                      useShadows: false,
                      alwaysConsumeMouseWheel: false,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    folding: true,
                    renderLineHighlight: "none",
                    contextmenu: false,
                    padding: { top: 12, bottom: 12 },
                    lineHeight: 20,
                    fixedOverflowWidgets: true,
                  }}
                  onMount={(editor) => {
                    // Auto-size the editor to fit content
                    const updateHeight = () => {
                      const contentHeight = editor.getContentHeight();
                      const container = editor.getContainerDomNode();
                      if (container) {
                        container.style.height = `${contentHeight}px`;
                      }
                      editor.layout();
                    };

                    // Update height after content is loaded
                    setTimeout(updateHeight, 100);

                    // Update on content changes
                    editor.onDidContentSizeChange(updateHeight);
                  }}
                />
              </React.Suspense>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No response body
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

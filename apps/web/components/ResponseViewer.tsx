"use client";

import * as React from "react";
import { ResponseData } from "@/types/request-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileText,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ResponseViewerProps {
  response: ResponseData;
}

/**
 * Gets the appropriate color variant for the status code badge
 */
function getStatusColor(
  status: number
): "default" | "secondary" | "destructive" {
  if (status >= 200 && status < 300) return "default"; // Green for 2xx
  if (status >= 400 && status < 500) return "secondary"; // Orange for 4xx
  if (status >= 500) return "destructive"; // Red for 5xx
  return "default";
}

/**
 * Determines the language for syntax highlighting based on content type
 */
function getLanguageFromContentType(contentType?: string): string {
  if (!contentType) return "text";

  if (contentType.includes("json")) return "json";
  if (contentType.includes("xml")) return "xml";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("javascript")) return "javascript";
  if (contentType.includes("css")) return "css";

  return "text";
}

/**
 * Formats the response body for display
 */
function formatResponseBody(body: unknown, isPretty: boolean): string {
  if (body === null || body === undefined) return "";

  if (typeof body === "string") {
    if (!isPretty) return body;

    try {
      // Try to parse and prettify JSON
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return as-is if not valid JSON
      return body;
    }
  }

  if (typeof body === "object") {
    return isPretty ? JSON.stringify(body, null, 2) : JSON.stringify(body);
  }

  return String(body);
}

/**
 * ResponseViewer component
 * Displays HTTP response with status, headers, and body with syntax highlighting
 */
export function ResponseViewer({ response }: ResponseViewerProps) {
  const [isHeadersOpen, setIsHeadersOpen] = React.useState(false);
  const [isPrettyPrint, setIsPrettyPrint] = React.useState(true);
  const [copySuccess, setCopySuccess] = React.useState(false);

  const contentType =
    response.headers["content-type"] || response.headers["Content-Type"] || "";
  const language = getLanguageFromContentType(contentType);
  const formattedBody = React.useMemo(
    () => formatResponseBody(response.body, isPrettyPrint),
    [response.body, isPrettyPrint]
  );

  /**
   * Copy response body to clipboard
   */
  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(formattedBody);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy response:", err);
    }
  };

  /**
   * Download response as a file
   */
  const handleDownloadResponse = () => {
    const blob = new Blob([formattedBody], {
      type: contentType || "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Determine file extension based on content type
    let extension = "txt";
    if (contentType.includes("json")) extension = "json";
    else if (contentType.includes("xml")) extension = "xml";
    else if (contentType.includes("html")) extension = "html";

    a.download = `response-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Toggle between pretty print and raw view
   */
  const handleTogglePrettyPrint = () => {
    setIsPrettyPrint(!isPrettyPrint);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <CardTitle className="text-base">Response</CardTitle>
            <Badge
              variant={getStatusColor(response.status)}
              className="font-mono text-xs sm:text-sm"
            >
              {response.status} {response.statusText}
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {response.duration}ms
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {language === "json" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePrettyPrint}
                className="h-8"
                aria-label={
                  isPrettyPrint ? "Show raw JSON" : "Show pretty JSON"
                }
              >
                {isPrettyPrint ? (
                  <>
                    <FileText className="h-3 w-3 sm:mr-1" aria-hidden="true" />
                    <span className="hidden sm:inline">Raw</span>
                  </>
                ) : (
                  <>
                    <FileJson className="h-3 w-3 sm:mr-1" aria-hidden="true" />
                    <span className="hidden sm:inline">Pretty</span>
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyResponse}
              className="h-8"
              aria-label="Copy response to clipboard"
            >
              <Copy className="h-3 w-3 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">
                {copySuccess ? "Copied!" : "Copy"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadResponse}
              className="h-8"
              aria-label="Download response as file"
            >
              <Download className="h-3 w-3 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Response Headers */}
        <Collapsible open={isHeadersOpen} onOpenChange={setIsHeadersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Headers</span>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(response.headers).length}
              </Badge>
            </div>
            {isHeadersOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            {Object.keys(response.headers).length > 0 ? (
              <div className="bg-muted rounded p-3 space-y-1">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="text-sm font-mono flex gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="break-all">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic p-2">
                No headers
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Response Body */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Body</span>
          {formattedBody ? (
            <div className="rounded overflow-hidden border">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "0.875rem",
                  maxHeight: "500px",
                  overflow: "auto",
                }}
                showLineNumbers={language === "json" || language === "xml"}
              >
                {formattedBody}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic p-4 border rounded">
              No response body
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

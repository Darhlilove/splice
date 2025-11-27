"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { HTTPMethod } from "@/packages/openapi/src/types";
import { AuthConfig, ParameterValue } from "@/types/request-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Terminal,
  ChevronDown,
  ChevronUp,
  Server,
  Globe,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center border rounded-md bg-muted">
      <p className="text-sm text-muted-foreground">Loading editor...</p>
    </div>
  ),
});

interface RequestPreviewProps {
  method: HTTPMethod;
  baseUrl: string;
  path: string;
  parameters: Record<string, ParameterValue>;
  parameterLocations: Record<string, "query" | "path" | "header" | "cookie">;
  body?: string | Record<string, unknown>;
  contentType?: string;
  authentication?: AuthConfig;
  isMockMode?: boolean;
  realBaseUrl?: string;
}

/**
 * Builds the full URL with query parameters and path parameters replaced
 */
function buildFullUrl(
  baseUrl: string,
  path: string,
  parameters: Record<string, ParameterValue>,
  parameterLocations: Record<string, "query" | "path" | "header" | "cookie">
): string {
  let url = baseUrl + path;

  // Replace path parameters
  Object.entries(parameters).forEach(([name, value]) => {
    if (
      parameterLocations[name] === "path" &&
      value !== null &&
      value !== undefined
    ) {
      url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
    }
  });

  // Build query string
  const queryParams: string[] = [];
  Object.entries(parameters).forEach(([name, value]) => {
    if (
      parameterLocations[name] === "query" &&
      value !== null &&
      value !== undefined
    ) {
      if (Array.isArray(value)) {
        // Handle array parameters
        value.forEach((v) => {
          queryParams.push(
            `${encodeURIComponent(name)}=${encodeURIComponent(String(v))}`
          );
        });
      } else {
        queryParams.push(
          `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`
        );
      }
    }
  });

  // Append query string if there are query parameters
  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  return url;
}

/**
 * Builds headers object including authentication and parameter headers
 */
function buildHeaders(
  parameters: Record<string, ParameterValue>,
  parameterLocations: Record<string, "query" | "path" | "header" | "cookie">,
  authentication?: AuthConfig,
  contentType?: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add content type if body exists
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // Add header parameters
  Object.entries(parameters).forEach(([name, value]) => {
    if (
      parameterLocations[name] === "header" &&
      value !== null &&
      value !== undefined
    ) {
      headers[name] = String(value);
    }
  });

  // Add authentication headers
  if (authentication) {
    if (authentication.type === "apiKey" && authentication.apiKey) {
      if (
        authentication.apiKeyLocation === "header" &&
        authentication.apiKeyName
      ) {
        headers[authentication.apiKeyName] = authentication.apiKey;
      }
    } else if (authentication.type === "bearer" && authentication.bearerToken) {
      headers["Authorization"] = `Bearer ${authentication.bearerToken}`;
    } else if (
      authentication.type === "basic" &&
      authentication.username &&
      authentication.password
    ) {
      const credentials = btoa(
        `${authentication.username}:${authentication.password}`
      );
      headers["Authorization"] = `Basic ${credentials}`;
    } else if (authentication.type === "oauth2" && authentication.bearerToken) {
      headers["Authorization"] = `Bearer ${authentication.bearerToken}`;
    }
  }

  return headers;
}

/**
 * Formats the request body for display
 */
function formatBody(
  body: string | Record<string, unknown> | undefined
): string {
  if (!body) return "";

  if (typeof body === "string") {
    try {
      // Try to parse and prettify JSON
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return as-is if not valid JSON
      return body;
    }
  }

  return JSON.stringify(body, null, 2);
}

/**
 * Generates a cURL command from the request
 */
function generateCurlCommand(
  method: HTTPMethod,
  url: string,
  headers: Record<string, string>,
  body?: string | Record<string, unknown>
): string {
  let curl = `curl -X ${method.toUpperCase()} '${url}'`;

  // Add headers
  Object.entries(headers).forEach(([key, value]) => {
    curl += ` \\\n  -H '${key}: ${value}'`;
  });

  // Add body
  if (body) {
    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
    curl += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
  }

  return curl;
}

/**
 * Gets the appropriate color for the HTTP method badge
 */
function getMethodColor(
  method: HTTPMethod
): "default" | "secondary" | "destructive" | "outline" {
  switch (method.toUpperCase()) {
    case "GET":
      return "default";
    case "POST":
      return "secondary";
    case "PUT":
    case "PATCH":
      return "outline";
    case "DELETE":
      return "destructive";
    default:
      return "default";
  }
}

/**
 * RequestPreview component
 * Displays a live preview of the HTTP request with copy and export functionality
 */
export function RequestPreview({
  method,
  baseUrl,
  path,
  parameters,
  parameterLocations,
  body,
  contentType,
  authentication,
  isMockMode = false,
  realBaseUrl,
}: RequestPreviewProps) {
  const [isHeadersOpen, setIsHeadersOpen] = React.useState(true);
  const [isBodyOpen, setIsBodyOpen] = React.useState(true);
  const [copySuccess, setCopySuccess] = React.useState<"url" | "curl" | null>(
    null
  );

  // Build the full URL and headers with debouncing
  const [debouncedUrl, setDebouncedUrl] = React.useState("");
  const [debouncedHeaders, setDebouncedHeaders] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const url = buildFullUrl(baseUrl, path, parameters, parameterLocations);
      const headers = buildHeaders(
        parameters,
        parameterLocations,
        authentication,
        contentType
      );
      setDebouncedUrl(url);
      setDebouncedHeaders(headers);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    baseUrl,
    path,
    parameters,
    parameterLocations,
    authentication,
    contentType,
  ]);

  const formattedBody = React.useMemo(() => formatBody(body), [body]);

  // Calculate dynamic height based on content
  const editorHeight = React.useMemo(() => {
    if (!formattedBody) return "100px";

    const lineCount = formattedBody.split("\n").length;
    const lineHeight = 19; // Monaco's default line height
    const padding = 20; // Top and bottom padding
    const calculatedHeight = lineCount * lineHeight + padding;

    // Set minimum and maximum heights
    const minHeight = 100;
    const maxHeight = 600;

    return `${Math.min(Math.max(calculatedHeight, minHeight), maxHeight)}px`;
  }, [formattedBody]);

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string, type: "url" | "curl") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Handle copy URL
   */
  const handleCopyUrl = () => {
    copyToClipboard(debouncedUrl, "url");
  };

  /**
   * Handle export as cURL
   */
  const handleExportCurl = () => {
    const curlCommand = generateCurlCommand(
      method,
      debouncedUrl,
      debouncedHeaders,
      body
    );
    copyToClipboard(curlCommand, "curl");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Request Preview</CardTitle>
            {isMockMode ? (
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
              >
                <Server className="w-3 h-3 mr-1" />
                Mock
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
              >
                <Globe className="w-3 h-3 mr-1" />
                Real API
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copySuccess === "url" ? "Copied!" : "Copy URL"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCurl}
              className="h-8"
            >
              <Terminal className="h-3 w-3 mr-1" />
              {copySuccess === "curl" ? "Copied!" : "Export cURL"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Method and URL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getMethodColor(method)} className="font-mono">
              {method.toUpperCase()}
            </Badge>
            <code className="text-sm flex-1 break-all bg-muted px-2 py-1 rounded">
              {debouncedUrl || `${baseUrl}${path}`}
            </code>
          </div>
        </div>

        <Separator />

        {/* Headers */}
        <Collapsible open={isHeadersOpen} onOpenChange={setIsHeadersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Headers</span>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(debouncedHeaders).length}
              </Badge>
            </div>
            {isHeadersOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            {Object.keys(debouncedHeaders).length > 0 ? (
              <div className="bg-muted rounded p-3 space-y-1">
                {Object.entries(debouncedHeaders).map(([key, value]) => (
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

        {/* Body */}
        {(body || formattedBody) && (
          <>
            <Separator />
            <Collapsible open={isBodyOpen} onOpenChange={setIsBodyOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded transition-colors">
                <span className="text-sm font-medium">Body</span>
                {isBodyOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="border rounded-md overflow-hidden relative isolate">
                  <Editor
                    height={editorHeight}
                    language={contentType?.includes("json") ? "json" : "text"}
                    theme="vs-dark"
                    value={formattedBody}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      lineNumbers: "on",
                      renderLineHighlight: "none",
                      automaticLayout: true,
                      wordWrap: "on",
                      folding: true,
                      contextmenu: false,
                      scrollbar: {
                        vertical: "visible",
                        horizontal: "visible",
                      },
                    }}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}

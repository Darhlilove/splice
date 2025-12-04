"use client";

import * as React from "react";
import { Endpoint, SchemaObject } from "@/packages/openapi/src/types";
import {
  ParameterValue,
  AuthConfig,
  ResponseData,
  ValidationError,
  PresetConfig,
  SecurityScheme,
} from "@/types/request-builder";
import { ParameterForm } from "@/components/ParameterForm";
import { RequestBodyEditor } from "@/components/RequestBodyEditor";
import { AuthenticationSection } from "@/components/AuthenticationSection";
import { RequestPreview } from "@/components/RequestPreview";
import { PresetManager } from "@/components/PresetManager";
import { ResponseViewer } from "@/components/ResponseViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { executeRequestWithState } from "@/lib/request-executor";
import { Loader2, Play, AlertCircle, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";
import { useMockServer } from "@/contexts/mock-server-context";

interface RequestBuilderProps {
  endpoint: Endpoint;
  allSchemas: Record<string, SchemaObject>;
  baseUrl?: string;
  securitySchemes?: Record<string, SecurityScheme>;
}

/**
 * Gets the appropriate color for the HTTP method badge
 */
function getMethodColor(
  method: string
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
 * RequestBuilder component
 * Main component that orchestrates all sub-components for building and executing API requests
 */
export function RequestBuilder({
  endpoint,
  allSchemas,
  baseUrl = "",
  securitySchemes,
}: RequestBuilderProps) {
  // Mock server context
  const { isMockMode, setMockMode, mockServerInfo } = useMockServer();

  // Determine the effective base URL (mock or real)
  const effectiveBaseUrl =
    isMockMode && mockServerInfo?.url ? mockServerInfo.url : baseUrl;

  // Check if mock server is running
  const isMockServerRunning =
    mockServerInfo?.status === "running" && mockServerInfo?.url;

  // State for parameters
  const [parameters, setParameters] = React.useState<
    Record<string, ParameterValue>
  >({});

  // State for request body
  const [requestBody, setRequestBody] = React.useState<
    string | Record<string, unknown>
  >("");

  // State for content type
  const [contentType, setContentType] = React.useState<string>(() => {
    // Initialize with first available content type
    if (endpoint.requestBody) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      return contentTypes[0] || "application/json";
    }
    return "application/json";
  });

  // State for authentication
  const [authentication, setAuthentication] = React.useState<AuthConfig>({
    type: "none",
  });

  // State for response
  const [response, setResponse] = React.useState<ResponseData | null>(null);

  // State for execution
  const [isExecuting, setIsExecuting] = React.useState(false);

  // State for validation errors
  const [validationErrors, setValidationErrors] = React.useState<
    ValidationError[]
  >([]);

  // State for error message
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // State for last request config (for retry)
  const [lastRequestFailed, setLastRequestFailed] = React.useState(false);

  // Clear response and errors when endpoint changes
  React.useEffect(() => {
    setResponse(null);
    setValidationErrors([]);
    setErrorMessage(null);
    setLastRequestFailed(false);
    setParameters({});
    setRequestBody("");

    // Reset content type to first available
    if (endpoint.requestBody) {
      const contentTypes = Object.keys(endpoint.requestBody.content);
      setContentType(contentTypes[0] || "application/json");
    } else {
      setContentType("application/json");
    }
  }, [endpoint]);

  // State for auto-fill API key checkbox
  const [autoFillApiKey, setAutoFillApiKey] = React.useState(false);

  // Validate API key matches the generated one
  const isApiKeyValid = React.useMemo(() => {
    if (!isMockMode || !mockServerInfo?.requiresAuth || !mockServerInfo?.apiKey) {
      return true; // No validation needed if not in auth mode
    }

    if (authentication.type === "apiKey" && authentication.apiKey) {
      return authentication.apiKey === mockServerInfo.apiKey;
    }

    if ((authentication.type === "bearer" || authentication.type === "oauth2") && authentication.bearerToken) {
      return authentication.bearerToken === mockServerInfo.apiKey;
    }

    return false; // Invalid if auth required but no key provided
  }, [isMockMode, mockServerInfo?.requiresAuth, mockServerInfo?.apiKey, authentication]);


  // Create parameter locations map for RequestPreview
  const parameterLocations = React.useMemo(() => {
    const locations: Record<string, "query" | "path" | "header" | "cookie"> =
      {};
    endpoint.parameters?.forEach((param) => {
      locations[param.name] = param.in;
    });
    return locations;
  }, [endpoint.parameters]);

  /**
   * Handle parameter value change
   */
  const handleParameterChange = React.useCallback(
    (name: string, value: ParameterValue) => {
      setParameters((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  /**
   * Handle parameter validation change
   */
  const handleParameterValidationChange = React.useCallback(
    (name: string, error: string | undefined) => {
      setValidationErrors((prev) => {
        // Remove existing error for this field
        const filtered = prev.filter((err) => err.field !== name);

        // Add new error if exists
        if (error) {
          filtered.push({
            field: name,
            message: error,
            type: "required",
          });
        }

        return filtered;
      });
    },
    []
  );

  /**
   * Handle request body change
   */
  const handleBodyChange = React.useCallback(
    (body: string | Record<string, unknown>) => {
      setRequestBody(body);
    },
    []
  );

  /**
   * Handle content type change
   */
  const handleContentTypeChange = React.useCallback(
    (newContentType: string) => {
      setContentType(newContentType);
    },
    []
  );

  /**
   * Handle authentication change
   */
  const handleAuthChange = React.useCallback((auth: AuthConfig) => {
    setAuthentication(auth);
  }, []);

  /**
   * Handle preset load
   */
  const handleLoadPreset = React.useCallback((preset: PresetConfig) => {
    // Load parameters
    setParameters(preset.parameters);

    // Load request body
    if (preset.requestBody) {
      setRequestBody(preset.requestBody);
    }

    // Load authentication
    if (preset.authentication) {
      setAuthentication(preset.authentication);
    }
  }, []);

  /**
   * Handle request execution
   */
  const handleExecuteRequest = React.useCallback(async () => {
    // Clear previous error message
    setErrorMessage(null);
    setLastRequestFailed(false);

    // Execute request with state management
    await executeRequestWithState(
      endpoint,
      effectiveBaseUrl,
      parameters,
      requestBody,
      contentType,
      authentication,
      setIsExecuting,
      setResponse,
      setValidationErrors,
      (error) => {
        setErrorMessage(error);
        setLastRequestFailed(true);

        // Show error toast with appropriate message
        if (error.toLowerCase().includes("timeout")) {
          toast.error("Request Timeout", {
            description:
              "The request took too long to complete. Please try again.",
            duration: 5000,
          });
        } else if (error.toLowerCase().includes("network")) {
          toast.error("Network Error", {
            description:
              "Failed to connect to the server. Check your connection and try again.",
            duration: 5000,
          });
        } else if (error.toLowerCase().includes("cors")) {
          toast.error("CORS Error", {
            description:
              "The server blocked the request due to CORS policy. Using proxy to retry...",
            duration: 5000,
          });
        } else {
          toast.error("Request Failed", {
            description: error,
            duration: 5000,
          });
        }
      },
      (responseData) => {
        // Success callback - save to history
        setLastRequestFailed(false);

        // Import and save to history store
        const { getHistoryStore } = require("@/lib/history-store");
        const historyStore = getHistoryStore();
        historyStore.addEntry(
          endpoint.method,
          endpoint.path,
          parameters,
          responseData,
          requestBody,
          authentication
        );

        console.log("[RequestBuilder] Saved to history");

        toast.success("Request Successful", {
          description: "The API request completed successfully.",
          duration: 3000,
        });
      },
      isMockMode,
      mockServerInfo?.url
    );
  }, [
    endpoint,
    effectiveBaseUrl,
    parameters,
    requestBody,
    contentType,
    authentication,
    isMockMode,
    mockServerInfo?.url,
  ]);

  /**
   * Handle retry request
   */
  const handleRetryRequest = React.useCallback(() => {
    handleExecuteRequest();
  }, [handleExecuteRequest]);

  // Check if there are validation errors
  const hasValidationErrors = validationErrors.length > 0;

  // Check if execution should be disabled
  const isExecutionDisabled =
    hasValidationErrors || isExecuting || (isMockMode && !isMockServerRunning);

  // Add keyboard shortcut for executing request (Ctrl/Cmd + Enter)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isExecutionDisabled) {
          handleExecuteRequest();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExecutionDisabled, handleExecuteRequest]);

  // Focus on first error when validation fails
  React.useEffect(() => {
    if (validationErrors.length > 0) {
      const firstError = validationErrors[0];
      const errorElement = document.querySelector(
        `[aria-labelledby="param-${firstError.field}"]`
      );
      if (errorElement) {
        const input = errorElement.querySelector("input, select, textarea");
        if (input instanceof HTMLElement) {
          input.focus();
        }
      }
    }
  }, [validationErrors]);

  return (
    <div className="space-y-4 md:space-y-6 pb-8 px-2 md:px-0">
      {/* Skip links for keyboard navigation */}
      <div className="sr-only">
        <a
          href="#execute-button"
          className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to execute button
        </a>
      </div>

      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isExecuting && "Executing API request..."}
        {response && !isExecuting && "Request completed successfully"}
        {errorMessage && !isExecuting && `Request failed: ${errorMessage}`}
      </div>

      {/* Endpoint Header */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant={getMethodColor(endpoint.method)}
                className="font-mono text-sm px-3 py-1"
              >
                {endpoint.method.toUpperCase()}
              </Badge>
              <code className="text-lg font-mono">{endpoint.path}</code>
              {isMockMode && mockServerInfo && (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                >
                  <Server className="w-3 h-3 mr-1" />
                  Mock Server
                </Badge>
              )}
            </div>
            {endpoint.summary && (
              <CardTitle className="text-xl">{endpoint.summary}</CardTitle>
            )}
            {endpoint.description && (
              <p className="text-sm text-muted-foreground">
                {endpoint.description}
              </p>
            )}
            {isMockMode && mockServerInfo && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <Server className="w-4 h-4 text-purple-700 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-purple-700 dark:text-purple-400">
                    Using Mock Server
                  </p>
                  <p className="text-muted-foreground">
                    Requests will be sent to{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {mockServerInfo.url}
                    </code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Mock Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="mock-mode-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                Use Mock Server
              </Label>
              <p className="text-xs text-muted-foreground">
                {isMockServerRunning
                  ? "Route requests to the mock server instead of the real API"
                  : "Start the mock server to enable this option"}
              </p>
            </div>
            <Switch
              id="mock-mode-toggle"
              checked={isMockMode}
              onCheckedChange={setMockMode}
              disabled={!isMockServerRunning}
              aria-label="Toggle mock server mode"
            />
          </div>
          {!isMockServerRunning && isMockMode && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-700 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Mock Server Not Running
                </p>
                <p className="text-muted-foreground">
                  The mock server is not running. Start it to use mock mode.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parameter Form */}
      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterForm
              parameters={endpoint.parameters}
              values={parameters}
              errors={validationErrors.reduce((acc, err) => {
                if (err.field !== "body") {
                  acc[err.field] = err.message;
                }
                return acc;
              }, {} as Record<string, string>)}
              onChange={handleParameterChange}
              onValidationChange={handleParameterValidationChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Request Body Editor */}
      {endpoint.requestBody && (
        <Card>
          <CardHeader>
            <CardTitle>Request Body</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestBodyEditor
              requestBody={endpoint.requestBody}
              value={requestBody}
              contentType={contentType}
              allSchemas={allSchemas}
              onChange={handleBodyChange}
              onContentTypeChange={handleContentTypeChange}
              errors={validationErrors.filter((err) => err.field === "body")}
            />
          </CardContent>
        </Card>
      )}

      {/* Authentication Section */}
      <AuthenticationSection
        endpoint={endpoint}
        securitySchemes={securitySchemes}
        value={authentication}
        onChange={handleAuthChange}
        autoFillApiKey={autoFillApiKey}
        onAutoFillChange={setAutoFillApiKey}
        isMockMode={isMockMode}
        mockServerInfo={mockServerInfo}
        isApiKeyValid={isApiKeyValid}
      />

      {/* Request Preview */}
      <RequestPreview
        method={endpoint.method}
        baseUrl={effectiveBaseUrl}
        path={endpoint.path}
        parameters={parameters}
        parameterLocations={parameterLocations}
        body={requestBody}
        contentType={contentType}
        authentication={authentication}
        isMockMode={isMockMode}
        realBaseUrl={baseUrl}
      />

      {/* Preset Manager */}
      <PresetManager
        method={endpoint.method}
        path={endpoint.path}
        currentValues={{
          parameters,
          requestBody,
          authentication,
        }}
        onLoadPreset={handleLoadPreset}
      />

      {/* Validation Errors Summary */}
      {hasValidationErrors && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-destructive">
                  Please fix the following errors before executing:
                </p>
                <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>
                      <span className="font-medium">{error.field}:</span>{" "}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-3 flex-1">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Request Failed
                  </p>
                  <p className="text-sm text-destructive">{errorMessage}</p>

                  {/* Helpful tips based on error type */}
                  {errorMessage.toLowerCase().includes("timeout") && (
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <p className="font-medium mb-1">Troubleshooting tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Check if the API server is running</li>
                        <li>Verify the base URL is correct</li>
                        <li>The server might be experiencing high load</li>
                      </ul>
                    </div>
                  )}

                  {errorMessage.toLowerCase().includes("network") && (
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <p className="font-medium mb-1">Troubleshooting tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Check your internet connection</li>
                        <li>Verify the API URL is correct</li>
                        <li>The server might be down or unreachable</li>
                      </ul>
                    </div>
                  )}

                  {errorMessage.toLowerCase().includes("cors") && (
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <p className="font-medium mb-1">About CORS:</p>
                      <p>
                        Cross-Origin Resource Sharing (CORS) is a security
                        feature that prevents unauthorized access. The proxy
                        endpoint should handle this automatically.
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryRequest}
                  disabled={isExecuting}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Retry failed request"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Retry Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execute Button */}
      <div
        id="execute-button"
        className="sticky bottom-0 bg-background pt-4 pb-2 border-t -mx-2 px-2 md:mx-0 md:px-0 z-10"
      >
        <div className="space-y-2">
          <Button
            onClick={handleExecuteRequest}
            disabled={isExecutionDisabled}
            size="lg"
            className="w-full"
            aria-label={
              isExecuting ? "Executing request" : "Execute API request"
            }
            aria-busy={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2
                  className="mr-2 h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                Execute Request
              </>
            )}
          </Button>
          {!isExecuting && (
            <p className="text-xs text-center text-muted-foreground">
              Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
                {typeof navigator !== "undefined" &&
                  navigator.platform.toLowerCase().includes("mac")
                  ? "⌘"
                  : "Ctrl"}
              </kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
                Enter
              </kbd>{" "}
              to execute
            </p>
          )}
        </div>
      </div>

      {/* Response Viewer */}
      {response && (
        <div className="pt-4">
          <ResponseViewer response={response} />
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Endpoint } from "@/packages/openapi/src/types";
import {
  ParameterValue,
  AuthConfig,
  ValidationError,
  ResponseData,
} from "@/types/request-builder";
import { APIResponse, RequestError } from "@/lib/request-state";
import { Button } from "@/components/ui/button";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getHistoryStore } from "@/lib/history-store";

/**
 * Props for the ExecuteButton component
 */
export interface ExecuteButtonProps {
  endpoint: Endpoint;
  parameters: Record<string, ParameterValue>;
  authentication: AuthConfig;
  requestBody?: string | Record<string, unknown>;
  contentType?: string;
  baseUrl?: string;
  onExecute: (response: APIResponse) => void;
  onError: (error: RequestError) => void;
  disabled?: boolean;
}

/**
 * Interface for request parameters organized by location
 */
interface RequestParameters {
  path: Record<string, string>;
  query: Record<string, string>;
  header: Record<string, string>;
  cookie: Record<string, string>;
}

/**
 * ExecuteButton component
 * Validates parameters and executes API requests through the proxy
 */
export function ExecuteButton({
  endpoint,
  parameters,
  authentication,
  requestBody,
  contentType = "application/json",
  baseUrl = "",
  onExecute,
  onError,
  disabled = false,
}: ExecuteButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<
    ValidationError[]
  >([]);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;

  /**
   * Validate required parameters
   */
  const validateParameters = React.useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!endpoint.parameters) {
      return errors;
    }

    // Check each required parameter
    endpoint.parameters.forEach((param) => {
      if (param.required) {
        const value = parameters[param.name];

        // Check if value is missing or empty
        if (value === undefined || value === null || value === "") {
          errors.push({
            field: param.name,
            message: `Required parameter '${param.name}' is missing`,
            type: "required",
          });
        }
        // Check for empty arrays
        else if (Array.isArray(value) && value.length === 0) {
          errors.push({
            field: param.name,
            message: `Required parameter '${param.name}' cannot be empty`,
            type: "required",
          });
        }
      }
    });

    return errors;
  }, [endpoint.parameters, parameters]);

  /**
   * Organize parameters by location (path, query, header, cookie)
   */
  const organizeParameters = React.useCallback((): RequestParameters => {
    const organized: RequestParameters = {
      path: {},
      query: {},
      header: {},
      cookie: {},
    };

    if (!endpoint.parameters) {
      return organized;
    }

    endpoint.parameters.forEach((param) => {
      const value = parameters[param.name];

      // Skip undefined or null values
      if (value === undefined || value === null) {
        return;
      }

      // Convert value to string
      const stringValue = Array.isArray(value)
        ? value.join(",")
        : String(value);

      // Add to appropriate location
      if (param.in === "path") {
        organized.path[param.name] = stringValue;
      } else if (param.in === "query") {
        organized.query[param.name] = stringValue;
      } else if (param.in === "header") {
        organized.header[param.name] = stringValue;
      } else if (param.in === "cookie") {
        organized.cookie[param.name] = stringValue;
      }
    });

    return organized;
  }, [endpoint.parameters, parameters]);

  /**
   * Build the full URL with path parameters replaced
   */
  const buildUrl = React.useCallback(
    (pathParams: Record<string, string>): string => {
      let url = endpoint.path;

      // Replace path parameters
      Object.entries(pathParams).forEach(([name, value]) => {
        url = url.replace(`{${name}}`, encodeURIComponent(value));
      });

      // Prepend base URL
      if (baseUrl) {
        // Remove trailing slash from baseUrl and leading slash from path
        const cleanBaseUrl = baseUrl.replace(/\/$/, "");
        const cleanPath = url.replace(/^\//, "");
        url = `${cleanBaseUrl}/${cleanPath}`;
      }

      return url;
    },
    [endpoint.path, baseUrl]
  );

  /**
   * Build request headers including authentication
   */
  const buildHeaders = React.useCallback(
    (headerParams: Record<string, string>): Record<string, string> => {
      const headers: Record<string, string> = {
        ...headerParams,
      };

      // Add content type for requests with body
      if (
        requestBody &&
        (endpoint.method === "post" ||
          endpoint.method === "put" ||
          endpoint.method === "patch")
      ) {
        headers["Content-Type"] = contentType;
      }

      // Add authentication headers
      if (
        authentication.type === "apiKey" &&
        authentication.apiKeyLocation === "header"
      ) {
        headers[authentication.apiKeyName || "X-API-Key"] =
          authentication.apiKey || "";
      } else if (authentication.type === "bearer") {
        headers["Authorization"] = `Bearer ${authentication.bearerToken || ""}`;
      } else if (authentication.type === "basic") {
        const credentials = btoa(
          `${authentication.username || ""}:${authentication.password || ""}`
        );
        headers["Authorization"] = `Basic ${credentials}`;
      }

      return headers;
    },
    [authentication, contentType, endpoint.method, requestBody]
  );

  /**
   * Execute the API request with retry logic
   */
  const executeRequest = React.useCallback(
    async (isRetry: boolean = false) => {
      // Validate parameters first
      const errors = validateParameters();
      setValidationErrors(errors);

      if (errors.length > 0) {
        // Don't execute if there are validation errors
        const validationError: RequestError = {
          type: "validation",
          message:
            "Please fix the validation errors before executing the request",
          details: errors,
        };
        onError(validationError);
        return;
      }

      // Reset retry count if this is a new request (not a retry)
      if (!isRetry) {
        setRetryCount(0);
      }

      setIsLoading(true);

      try {
        // Organize parameters by location
        const organizedParams = organizeParameters();

        // Build URL with path parameters
        const url = buildUrl(organizedParams.path);

        // Build headers
        const headers = buildHeaders(organizedParams.header);

        // Add query parameters to URL
        const urlWithQuery = new URL(url, window.location.origin);
        Object.entries(organizedParams.query).forEach(([key, value]) => {
          urlWithQuery.searchParams.append(key, value);
        });

        // Add API key to query if needed
        if (
          authentication.type === "apiKey" &&
          authentication.apiKeyLocation === "query"
        ) {
          urlWithQuery.searchParams.append(
            authentication.apiKeyName || "api_key",
            authentication.apiKey || ""
          );
        }

        // Prepare request body
        let body: string | undefined;
        if (
          requestBody &&
          (endpoint.method === "post" ||
            endpoint.method === "put" ||
            endpoint.method === "patch")
        ) {
          if (typeof requestBody === "string") {
            body = requestBody;
          } else {
            body = JSON.stringify(requestBody);
          }
        }

        // Record start time
        const startTime = performance.now();

        // Make request to proxy
        const response = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: urlWithQuery.toString(),
            method: endpoint.method.toUpperCase(),
            headers,
            body,
            timeout: 30000, // 30 second timeout
          }),
        });

        // Calculate response time
        const responseTime = performance.now() - startTime;

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          // Handle error response from proxy
          const error: RequestError = {
            type: data.type || "server",
            message:
              data.message || `Request failed with status ${response.status}`,
            details: data.details,
          };

          // Implement retry logic for network and timeout errors
          if (
            (error.type === "network" || error.type === "timeout") &&
            retryCount < maxRetries
          ) {
            setRetryCount((prev) => prev + 1);
            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            await new Promise((resolve) => setTimeout(resolve, delay));
            // Retry the request
            return executeRequest(true);
          }

          onError(error);
        } else {
          // Handle successful response
          const apiResponse: APIResponse = {
            status: data.status,
            statusText: data.statusText,
            headers: data.headers || {},
            body: data.body,
            responseTime: data.responseTime || responseTime,
            timestamp: new Date(),
            contentType: data.headers?.["content-type"] || "application/json",
          };

          // Add to history store
          try {
            const historyStore = getHistoryStore();
            const responseData: ResponseData = {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              headers: apiResponse.headers,
              body: apiResponse.body,
              duration: apiResponse.responseTime,
              responseTime: apiResponse.responseTime,
              timestamp: apiResponse.timestamp,
              contentType: apiResponse.contentType,
            };

            historyStore.addEntry(
              endpoint.method,
              urlWithQuery.toString(),
              parameters,
              responseData,
              requestBody,
              authentication
            );
          } catch (historyError) {
            // Don't fail the request if history storage fails
            console.error("Failed to add entry to history:", historyError);
          }

          onExecute(apiResponse);
        }
      } catch (error) {
        // Handle network or other errors
        const requestError: RequestError = {
          type: "network",
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          details: error,
        };

        // Implement retry logic for network errors
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          // Retry the request
          return executeRequest(true);
        }

        onError(requestError);
      } finally {
        setIsLoading(false);
      }
    },
    [
      validateParameters,
      organizeParameters,
      buildUrl,
      buildHeaders,
      endpoint.method,
      requestBody,
      authentication,
      onExecute,
      onError,
      retryCount,
      maxRetries,
    ]
  );

  // Check if button should be disabled
  const isDisabled = disabled || isLoading || validationErrors.length > 0;

  return (
    <div className="space-y-4">
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
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

      {/* Execute Button */}
      <Button
        onClick={executeRequest}
        disabled={isDisabled}
        size="lg"
        className="w-full"
        aria-label={isLoading ? "Executing request" : "Execute API request"}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Executing...
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
            Execute Request
          </>
        )}
      </Button>

      {!isLoading && (
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
  );
}

/**
 * Request executor utility
 * Handles validation and execution of HTTP requests through the proxy
 */

import type { Endpoint, Parameter } from "@/packages/openapi/src/types";
import type {
  RequestConfig,
  ResponseData,
  ValidationError,
  ParameterValue,
  AuthConfig,
} from "@/types/request-builder";
import { buildFinalRequest } from "./request-builder";
import { validateParameter } from "./parameter-validation";
import { validateRequestBody } from "./body-validation";

/**
 * Result of request execution
 */
export interface ExecuteRequestResult {
  success: boolean;
  response?: ResponseData;
  error?: string;
  validationErrors?: ValidationError[];
}

/**
 * Validates all inputs before request execution
 */
export function validateInputs(
  endpoint: Endpoint,
  parameters: Record<string, ParameterValue>,
  requestBody: string | Record<string, unknown> | undefined,
  contentType: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate parameters
  if (endpoint.parameters) {
    endpoint.parameters.forEach((param) => {
      // Skip body parameters in Swagger 2.0 - they're validated separately via requestBody
      // @ts-ignore - Swagger 2.0 specs can have 'in: body' even though OpenAPI 3.0 types don't include it
      if (param.in === "body") {
        return;
      }

      const value: ParameterValue = parameters[param.name];
      const result = validateParameter(param, value);

      if (!result.isValid && result.error) {
        errors.push({
          field: param.name,
          message: result.error,
          type: result.type || "required",
        });
      }
    });
  }

  // Validate request body
  if (endpoint.requestBody) {
    const bodySchema = endpoint.requestBody.content[contentType]?.schema;

    // Check if body is truly missing (undefined or null) vs just empty
    const isBodyMissing = requestBody === undefined || requestBody === null;
    const isBodyEmpty =
      requestBody === "" ||
      (typeof requestBody === "object" && Object.keys(requestBody || {}).length === 0);

    if (endpoint.requestBody.required && (isBodyMissing || isBodyEmpty)) {
      errors.push({
        field: "body",
        message: "This field is required and cannot be empty",
        type: "required",
      });
    } else if (requestBody && !isBodyEmpty && bodySchema) {
      const bodyValidation = validateRequestBody(
        requestBody,
        bodySchema,
        contentType
      );

      if (!bodyValidation.isValid) {
        bodyValidation.errors.forEach((error) => {
          errors.push({
            field: "body",
            message: error,
            type: "json",
          });
        });
      }
    }
  }

  console.log("[DEBUG] validateInputs returning errors:", errors);

  return errors;
}

/**
 * Executes an HTTP request through the proxy endpoint
 */
export async function executeRequest(
  endpoint: Endpoint,
  baseUrl: string,
  parameters: Record<string, ParameterValue>,
  requestBody: string | Record<string, unknown> | undefined,
  contentType: string,
  authentication: AuthConfig,
  useMock?: boolean,
  mockServerUrl?: string
): Promise<ExecuteRequestResult> {
  // Validate all inputs first
  const validationErrors = validateInputs(
    endpoint,
    parameters,
    requestBody,
    contentType
  );

  if (validationErrors.length > 0) {
    return {
      success: false,
      validationErrors,
      error: "Validation failed. Please fix the errors and try again.",
    };
  }

  try {
    // Build the final request configuration
    const requestConfig = buildFinalRequest(
      endpoint,
      baseUrl,
      parameters,
      requestBody,
      contentType,
      authentication
    );

    // Log request config for debugging
    console.log("[Request Executor] Request config:", {
      url: requestConfig.url,
      method: requestConfig.method,
      headers: requestConfig.headers,
      hasBody: !!requestConfig.body,
      bodyType: typeof requestConfig.body,
    });

    // Record start time for duration measurement
    const startTime = Date.now();

    // Prepare proxy payload
    const proxyPayload = {
      url: requestConfig.url,
      method: requestConfig.method,
      headers: requestConfig.headers,
      body: requestConfig.body,
      useMock,
      mockServerUrl,
    };

    console.log("[Request Executor] Sending to proxy:", proxyPayload);

    // Call the proxy endpoint
    const proxyResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proxyPayload),
    });

    // Calculate duration
    const duration = Date.now() - startTime;

    // Parse proxy response
    const proxyData = await proxyResponse.json();

    // Check if proxy request failed
    if (!proxyResponse.ok) {
      return {
        success: false,
        error: proxyData.error || "Request failed",
      };
    }

    // Extract response data from proxy response
    const responseDuration = proxyData.duration || duration;
    const responseData: ResponseData = {
      status: proxyData.status,
      statusText: proxyData.statusText,
      headers: proxyData.headers,
      body: proxyData.body,
      duration: responseDuration,
      responseTime: responseDuration, // Alias for compatibility with APIResponse
      timestamp: proxyData.timestamp
        ? new Date(proxyData.timestamp)
        : new Date(),
      contentType:
        proxyData.headers?.["content-type"] ||
        proxyData.headers?.["Content-Type"] ||
        "text/plain",
    };

    console.log("[Request Executor] Response data created:", {
      status: responseData.status,
      bodyType: typeof responseData.body,
      body: responseData.body,
      contentType: responseData.contentType,
    });

    return {
      success: true,
      response: responseData,
    };
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      return {
        success: false,
        error: "Network error: Failed to connect to the proxy server",
      };
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Request timeout: The request took too long to complete",
      };
    }

    // Handle other errors
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Executes a request with loading state management
 * This is a convenience wrapper that can be used in React components
 */
export async function executeRequestWithState(
  endpoint: Endpoint,
  baseUrl: string,
  parameters: Record<string, ParameterValue>,
  requestBody: string | Record<string, unknown> | undefined,
  contentType: string,
  authentication: AuthConfig,
  setIsExecuting: (isExecuting: boolean) => void,
  setResponse: (response: ResponseData | null) => void,
  setValidationErrors: (errors: ValidationError[]) => void,
  onError?: (error: string) => void,
  onSuccess?: (response: ResponseData) => void,
  useMock?: boolean,
  mockServerUrl?: string
): Promise<void> {
  // Set loading state
  setIsExecuting(true);
  setResponse(null);
  setValidationErrors([]);

  try {
    // Execute the request
    const result = await executeRequest(
      endpoint,
      baseUrl,
      parameters,
      requestBody,
      contentType,
      authentication,
      useMock,
      mockServerUrl
    );

    if (result.success && result.response) {
      // Update response state
      setResponse(result.response);

      // Call success callback if provided with the response
      if (onSuccess) {
        onSuccess(result.response);
      }
    } else {
      // Handle validation errors
      if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
      }

      // Call error callback if provided
      if (result.error && onError) {
        onError(result.error);
      }
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    // Clear loading state
    setIsExecuting(false);
  }
}

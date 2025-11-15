/**
 * Request builder utility
 * Constructs final HTTP request configuration from request builder state
 */

import type { Endpoint, Parameter } from "@/packages/openapi/src/types";
import type {
  RequestConfig,
  ParameterValue,
  AuthConfig,
} from "@/types/request-builder";

/**
 * Builds the final request configuration from request builder state
 */
export function buildFinalRequest(
  endpoint: Endpoint,
  baseUrl: string,
  parameters: Record<string, ParameterValue>,
  requestBody: string | Record<string, unknown> | undefined,
  contentType: string,
  authentication: AuthConfig
): RequestConfig {
  // Build URL with path and query parameters
  const url = buildURL(baseUrl, endpoint.path, parameters, endpoint.parameters);

  // Build headers including auth headers
  const headers = buildHeaders(
    parameters,
    endpoint.parameters,
    contentType,
    authentication
  );

  // Format request body
  const body = formatRequestBody(requestBody, contentType);

  return {
    method: endpoint.method,
    url,
    headers,
    body,
    timeout: 30000, // 30 second default timeout
  };
}

/**
 * Builds the full URL with query parameters and path parameters replaced
 */
function buildURL(
  baseUrl: string,
  path: string,
  parameters: Record<string, ParameterValue>,
  parameterDefs?: Parameter[]
): string {
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");

  // Replace path parameters
  let finalPath = path;
  if (parameterDefs) {
    const pathParams = parameterDefs.filter((p) => p.in === "path");
    pathParams.forEach((param) => {
      const value = parameters[param.name];
      if (value !== null && value !== undefined) {
        // Replace {paramName} or :paramName with actual value
        finalPath = finalPath.replace(
          new RegExp(`\\{${param.name}\\}|:${param.name}`, "g"),
          encodeURIComponent(String(value))
        );
      }
    });
  }

  // Build query string
  const queryParams: string[] = [];
  if (parameterDefs) {
    const queryParamDefs = parameterDefs.filter((p) => p.in === "query");
    queryParamDefs.forEach((param) => {
      const value = parameters[param.name];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach((v) => {
            queryParams.push(
              `${encodeURIComponent(param.name)}=${encodeURIComponent(
                String(v)
              )}`
            );
          });
        } else {
          queryParams.push(
            `${encodeURIComponent(param.name)}=${encodeURIComponent(
              String(value)
            )}`
          );
        }
      }
    });
  }

  // Construct final URL
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  return `${cleanBaseUrl}${finalPath}${queryString}`;
}

/**
 * Builds headers object including auth headers and header parameters
 */
function buildHeaders(
  parameters: Record<string, ParameterValue>,
  parameterDefs: Parameter[] | undefined,
  contentType: string,
  authentication: AuthConfig
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add Content-Type header if there's a request body
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  // Add header parameters
  if (parameterDefs) {
    const headerParams = parameterDefs.filter((p) => p.in === "header");
    headerParams.forEach((param) => {
      const value = parameters[param.name];
      if (value !== null && value !== undefined && value !== "") {
        headers[param.name] = String(value);
      }
    });
  }

  // Add authentication headers
  addAuthHeaders(headers, authentication, parameters, parameterDefs);

  return headers;
}

/**
 * Adds authentication headers based on auth configuration
 */
function addAuthHeaders(
  headers: Record<string, string>,
  authentication: AuthConfig,
  parameters: Record<string, ParameterValue>,
  parameterDefs: Parameter[] | undefined
): void {
  switch (authentication.type) {
    case "apiKey":
      if (authentication.apiKey && authentication.apiKeyLocation === "header") {
        const keyName = authentication.apiKeyName || "X-API-Key";
        headers[keyName] = authentication.apiKey;
      }
      break;

    case "bearer":
      if (authentication.bearerToken) {
        headers["Authorization"] = `Bearer ${authentication.bearerToken}`;
      }
      break;

    case "basic":
      if (authentication.username && authentication.password) {
        const credentials = btoa(
          `${authentication.username}:${authentication.password}`
        );
        headers["Authorization"] = `Basic ${credentials}`;
      }
      break;

    case "oauth2":
      if (authentication.bearerToken) {
        headers["Authorization"] = `Bearer ${authentication.bearerToken}`;
      }
      break;

    case "none":
    default:
      // No authentication headers
      break;
  }
}

/**
 * Formats request body based on content type
 */
function formatRequestBody(
  requestBody: string | Record<string, unknown> | undefined,
  contentType: string
): string | FormData | undefined {
  if (!requestBody) {
    return undefined;
  }

  // If it's already a string, return as-is (JSON)
  if (typeof requestBody === "string") {
    return requestBody;
  }

  // Handle form-data
  if (contentType === "multipart/form-data") {
    const formData = new FormData();
    Object.entries(requestBody).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    return formData;
  }

  // Handle URL-encoded form data
  if (contentType === "application/x-www-form-urlencoded") {
    const params = new URLSearchParams();
    Object.entries(requestBody).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }

  // Default: JSON stringify
  return JSON.stringify(requestBody);
}

/**
 * TypeScript type definitions for Request Builder
 */

import type {
  Endpoint,
  SchemaObject,
  HTTPMethod,
  SecurityScheme,
} from "@/packages/openapi/src/types";

export type { SecurityScheme };

// Parameter value types
export type ParameterValue = string | number | boolean | string[] | null;

export interface ParameterState {
  name: string;
  value: ParameterValue;
  isValid: boolean;
  error?: string;
}

// Authentication configuration
export interface AuthConfig {
  type: "apiKey" | "bearer" | "basic" | "oauth2" | "none";
  apiKey?: string;
  apiKeyLocation?: "header" | "query" | "cookie";
  apiKeyName?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
}

// Validation error
export interface ValidationError {
  field: string; // Parameter name or 'body'
  message: string;
  type: "required" | "type" | "pattern" | "min" | "max" | "enum" | "json";
}

// Request configuration for execution
export interface RequestConfig {
  method: HTTPMethod;
  url: string; // Full URL with query params and path params replaced
  headers: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
}

// Response data
export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  responseTime: number; // Alias for duration to match APIResponse
  timestamp: Date;
  contentType: string;
}

// Preset configuration
export interface PresetConfig {
  name: string;
  parameters: Record<string, ParameterValue>;
  requestBody?: string | Record<string, unknown>;
  authentication?: AuthConfig;
  createdAt: Date;
}

// Request builder state
export interface RequestBuilderState {
  endpoint: Endpoint | null;
  parameters: Record<string, ParameterValue>;
  requestBody: string | Record<string, unknown>;
  contentType: string;
  authentication: AuthConfig;
  presets: Record<string, PresetConfig>;
  response: ResponseData | null;
  isExecuting: boolean;
  validationErrors: ValidationError[];
}

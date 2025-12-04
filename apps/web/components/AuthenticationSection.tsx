"use client";

import * as React from "react";
import { Endpoint } from "@/packages/openapi/src/types";
import { AuthConfig, SecurityScheme } from "@/types/request-builder";
import {
  saveAuthCredentials,
  loadAuthCredentials,
  clearAuthCredentials,
} from "@/lib/request-storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Lock, Trash2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { MockServerInfo } from "@/contexts/mock-server-context";
import { Check, X, AlertCircle } from "lucide-react";

interface AuthenticationSectionProps {
  endpoint: Endpoint;
  securitySchemes?: Record<string, SecurityScheme>;
  value: AuthConfig;
  onChange: (auth: AuthConfig) => void;
  autoFillApiKey?: boolean;
  onAutoFillChange?: (checked: boolean) => void;
  isMockMode?: boolean;
  mockServerInfo?: MockServerInfo | null;
  isApiKeyValid?: boolean;
}

/**
 * Detects security requirements from endpoint and spec
 * Returns the appropriate security scheme to use
 */
function detectSecurityScheme(
  endpoint: Endpoint,
  securitySchemes?: Record<string, SecurityScheme>
): SecurityScheme | null {
  // Check if endpoint has specific security requirements
  if (endpoint.security && endpoint.security.length > 0) {
    // Get the first security requirement object (e.g., { "api_key": [] })
    const securityRequirement = endpoint.security[0];
    const schemeNames = Object.keys(securityRequirement);

    if (schemeNames.length > 0) {
      const schemeName = schemeNames[0];
      // Return the matching scheme definition
      return securitySchemes?.[schemeName] || null;
    }
  }

  // Fallback: Check if securitySchemes exist and return the first one
  // This handles cases where security might be defined globally but not on the endpoint
  // (Note: Ideally we should pass global security down to the endpoint)
  if (!securitySchemes || Object.keys(securitySchemes).length === 0) {
    return null;
  }

  // Get the first security scheme
  const firstSchemeKey = Object.keys(securitySchemes)[0];
  return securitySchemes[firstSchemeKey];
}

/**
 * Determines the auth type from a security scheme
 */
function getAuthType(
  scheme: SecurityScheme
): "apiKey" | "bearer" | "basic" | "oauth2" | "none" {
  if (scheme.type === "apiKey") {
    return "apiKey";
  }

  if (scheme.type === "http") {
    if (scheme.scheme === "bearer") {
      return "bearer";
    }
    if (scheme.scheme === "basic") {
      return "basic";
    }
  }

  if (scheme.type === "oauth2") {
    return "oauth2";
  }

  return "none";
}

/**
 * AuthenticationSection component
 * Handles authentication credential input based on OpenAPI security schemes
 */
export function AuthenticationSection({
  endpoint,
  securitySchemes,
  value,
  onChange,
  autoFillApiKey,
  onAutoFillChange,
  isMockMode,
  mockServerInfo,
  isApiKeyValid,
}: AuthenticationSectionProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showToken, setShowToken] = React.useState(false);

  // Load saved credentials on mount
  React.useEffect(() => {
    const savedAuth = loadAuthCredentials();
    if (savedAuth) {
      onChange(savedAuth);
    }
  }, []);

  // Save credentials whenever they change
  React.useEffect(() => {
    if (value.type !== "none") {
      saveAuthCredentials(value);
    }
  }, [value]);

  // Detect security scheme
  const securityScheme = detectSecurityScheme(endpoint, securitySchemes);

  // If no security required, don't render anything
  if (!securityScheme) {
    return null;
  }

  const authType = getAuthType(securityScheme);

  // Initialize auth config if needed
  React.useEffect(() => {
    if (value.type === "none" && authType !== "none") {
      const initialAuth: AuthConfig = { type: authType };

      if (authType === "apiKey") {
        initialAuth.apiKeyName = securityScheme.name || "api_key";
        initialAuth.apiKeyLocation = securityScheme.in || "header";
      }

      onChange(initialAuth);
    }
  }, [authType, value.type, securityScheme, onChange]);

  // Handle auto-fill logic
  React.useEffect(() => {
    if (!isMockMode || !mockServerInfo?.requiresAuth || !mockServerInfo?.apiKey) {
      return;
    }

    if (autoFillApiKey) {
      if (authType === "apiKey") {
        // Only update if not already set to avoid infinite loop
        if (value.apiKey !== mockServerInfo.apiKey) {
          onChange({
            type: "apiKey",
            apiKey: mockServerInfo.apiKey,
            apiKeyName: securityScheme.name || "api_key",
            apiKeyLocation: securityScheme.in || "header",
          });
        }
      } else if (authType === "bearer" || authType === "oauth2") {
        // Only update if not already set
        if (value.bearerToken !== mockServerInfo.apiKey) {
          onChange({
            type: authType,
            bearerToken: mockServerInfo.apiKey,
          });
        }
      }
    } else {
      // If unchecked, we might want to clear the auto-filled value
      // But only if it matches the mock key (to avoid clearing user's manual input)
      if (authType === "apiKey" && value.apiKey === mockServerInfo.apiKey) {
        onChange({ ...value, apiKey: "" });
      } else if ((authType === "bearer" || authType === "oauth2") && value.bearerToken === mockServerInfo.apiKey) {
        onChange({ ...value, bearerToken: "" });
      }
    }
  }, [autoFillApiKey, isMockMode, mockServerInfo, authType, securityScheme, onChange, value]);

  /**
   * Handle clearing credentials
   */
  const handleClear = () => {
    clearAuthCredentials();
    onChange({
      type: authType,
      ...(authType === "apiKey" && {
        apiKeyName: securityScheme.name || "api_key",
        apiKeyLocation: securityScheme.in || "header",
      }),
    });
    // Also uncheck auto-fill if it was checked
    if (onAutoFillChange) {
      onAutoFillChange(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <CardTitle>Authentication</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-2"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
        {securityScheme.description && (
          <CardDescription>{securityScheme.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Authentication */}
        {authType === "apiKey" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {securityScheme.in?.toUpperCase() || "HEADER"}
                </Badge>
                <span>
                  Key name: <code className="text-xs">{securityScheme.name}</code>
                </span>
              </div>

              {/* Auto-fill Checkbox */}
              {isMockMode && mockServerInfo?.requiresAuth && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-fill-api-key"
                    checked={autoFillApiKey}
                    onCheckedChange={(checked) => onAutoFillChange?.(checked as boolean)}
                  />
                  <Label
                    htmlFor="auto-fill-api-key"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto-fill Mock Key
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type="text"
                  placeholder="Enter your API key"
                  value={value.apiKey || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      apiKey: e.target.value,
                    })
                  }
                  className={isMockMode && mockServerInfo?.requiresAuth ? (isApiKeyValid ? "border-green-500 pr-10" : "border-red-500 pr-10") : ""}
                />

                {/* Validation Feedback Icon */}
                {isMockMode && mockServerInfo?.requiresAuth && value.apiKey && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isApiKeyValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Validation Message */}
              {isMockMode && mockServerInfo?.requiresAuth && value.apiKey && !isApiKeyValid && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Key does not match the generated mock server key
                </p>
              )}

              {isMockMode && mockServerInfo?.requiresAuth && value.apiKey && isApiKeyValid && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <Check className="h-3 w-3" />
                  Valid mock server key
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bearer Token Authentication */}
        {authType === "bearer" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">BEARER</Badge>
              {securityScheme.bearerFormat && (
                <span>Format: {securityScheme.bearerFormat}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bearer-token">Bearer Token</Label>
              <div className="relative">
                <Input
                  id="bearer-token"
                  type={showToken ? "text" : "password"}
                  placeholder="Enter your bearer token"
                  value={value.bearerToken || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bearerToken: e.target.value,
                    })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Authentication */}
        {authType === "basic" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">BASIC</Badge>
              <span>Username and password</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={value.username || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    username: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={value.password || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      password: e.target.value,
                    })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OAuth2 Authentication */}
        {authType === "oauth2" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">OAUTH2</Badge>
              </div>

              {/* Auto-fill Checkbox */}
              {isMockMode && mockServerInfo?.requiresAuth && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-fill-oauth"
                    checked={autoFillApiKey}
                    onCheckedChange={(checked) => onAutoFillChange?.(checked as boolean)}
                  />
                  <Label
                    htmlFor="auto-fill-oauth"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto-fill Mock Key
                  </Label>
                </div>
              )}
            </div>

            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="text-muted-foreground">
                {isMockMode ? (
                  "In mock mode, you can use the generated API key as your OAuth2 access token."
                ) : (
                  "OAuth2 authentication requires a separate authorization flow. Please obtain an access token through your OAuth2 provider and enter it below."
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oauth-token">Access Token</Label>
              <div className="relative">
                <Input
                  id="oauth-token"
                  type={showToken ? "text" : "password"}
                  placeholder="Enter your access token"
                  value={value.bearerToken || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      bearerToken: e.target.value,
                    })
                  }
                  className={`pr-10 ${isMockMode && mockServerInfo?.requiresAuth ? (isApiKeyValid ? "border-green-500" : "border-red-500") : ""}`}
                />

                {/* Validation Feedback Icon */}
                {isMockMode && mockServerInfo?.requiresAuth && value.bearerToken && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {isApiKeyValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Validation Message */}
              {isMockMode && mockServerInfo?.requiresAuth && value.bearerToken && !isApiKeyValid && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Key does not match the generated mock server key
                </p>
              )}

              {isMockMode && mockServerInfo?.requiresAuth && value.bearerToken && isApiKeyValid && (
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <Check className="h-3 w-3" />
                  Valid mock server key
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

interface AuthenticationSectionProps {
  endpoint: Endpoint;
  securitySchemes?: Record<string, SecurityScheme>;
  value: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

/**
 * Detects security requirements from endpoint and spec
 * Returns the appropriate security scheme to use
 */
function detectSecurityScheme(
  endpoint: Endpoint,
  securitySchemes?: Record<string, SecurityScheme>
): SecurityScheme | null {
  // For now, we'll check if securitySchemes exist and return the first one
  // In a full implementation, we'd parse endpoint.security array
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {securityScheme.in?.toUpperCase() || "HEADER"}
              </Badge>
              <span>
                Key name: <code className="text-xs">{securityScheme.name}</code>
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
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
              />
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">OAUTH2</Badge>
            </div>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="text-muted-foreground">
                OAuth2 authentication requires a separate authorization flow.
                Please obtain an access token through your OAuth2 provider and
                enter it below.
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
      </CardContent>
    </Card>
  );
}

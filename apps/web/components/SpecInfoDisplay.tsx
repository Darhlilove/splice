"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import type { ParsedSpec } from "@splice/openapi";

interface SpecInfoDisplayProps {
  spec: ParsedSpec;
  onBackToExplorer?: () => void;
}

/**
 * Displays OpenAPI specification information including title, version,
 * endpoint count, base URL, and authentication requirements.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function SpecInfoDisplay({
  spec,
  onBackToExplorer,
}: SpecInfoDisplayProps) {
  // Extract base URL from servers
  const baseUrl = spec.info.servers?.[0]?.url || "No base URL specified";

  // Check if authentication is required
  const hasAuthentication = spec.info.servers && spec.info.servers.length > 0;

  // Truncate long URLs for display
  const displayUrl =
    baseUrl.length > 50 ? `${baseUrl.substring(0, 47)}...` : baseUrl;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Spec Icon */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon icon="lucide:file-code" className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Spec Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2">
              <div className="flex-1 min-w-0">
                {/* Title and Version - Requirement 6.1 */}
                <h2 className="text-xl sm:text-2xl font-bold mb-2 truncate">
                  {spec.info.title}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-mono text-xs">
                    v{spec.info.version}
                  </Badge>
                  {/* Endpoint Count - Requirement 6.2 */}
                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <Icon icon="lucide:list" className="w-3 h-3" />
                    {spec.endpoints.length}{" "}
                    {spec.endpoints.length === 1 ? "endpoint" : "endpoints"}
                  </Badge>
                  {/* Authentication Badge - Requirement 6.4 */}
                  {hasAuthentication && (
                    <Badge variant="default" className="gap-1.5 text-xs">
                      <Icon icon="lucide:shield-check" className="w-3 h-3" />
                      Authenticated
                    </Badge>
                  )}
                </div>
              </div>

              {/* Back to Explorer Link - Requirement 6.5 */}
              {onBackToExplorer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToExplorer}
                  className="flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
                  Back to Explorer
                </Button>
              )}
            </div>

            {/* API Base URL - Requirement 6.3 */}
            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="lucide:globe"
                    className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  />
                  <span className="text-muted-foreground font-medium">
                    Base URL:
                  </span>
                </div>
                <code
                  className="text-xs bg-muted px-2 py-1 rounded font-mono truncate block sm:inline-block"
                  title={baseUrl}
                >
                  {displayUrl}
                </code>
              </div>
            </div>

            {/* Optional Description */}
            {spec.info.description && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {spec.info.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

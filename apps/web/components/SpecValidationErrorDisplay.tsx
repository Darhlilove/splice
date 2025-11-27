"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

/**
 * SpecValidationErrorDisplay Component
 *
 * Displays OpenAPI specification validation errors in a readable format.
 * Shows a list of validation errors and provides a link back to spec upload.
 *
 * Requirements: 5.4
 *
 * @example
 * ```tsx
 * <SpecValidationErrorDisplay
 *   errors={[
 *     { path: "/paths/users", message: "Missing required field 'responses'" },
 *     { path: "/info", message: "Invalid version format" }
 *   ]}
 *   onRetry={() => handleRetry()}
 * />
 * ```
 */

interface ValidationError {
  path?: string;
  message: string;
  keyword?: string;
}

interface SpecValidationErrorDisplayProps {
  errors: ValidationError[] | string;
  onRetry?: () => void;
  showUploadLink?: boolean;
}

export function SpecValidationErrorDisplay({
  errors,
  onRetry,
  showUploadLink = true,
}: SpecValidationErrorDisplayProps) {
  const router = useRouter();

  // Parse errors if it's a string
  const errorList: ValidationError[] =
    typeof errors === "string" ? [{ message: errors }] : errors;

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon
            icon="lucide:alert-triangle"
            className="w-6 h-6 text-destructive mt-1"
          />
          <div className="flex-1">
            <CardTitle className="text-destructive">
              OpenAPI Specification Validation Failed
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              The provided OpenAPI specification contains validation errors.
              Please fix these issues and try again.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error List */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {errorList.length} {errorList.length === 1 ? "Error" : "Errors"}{" "}
            Found:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errorList.map((error, index) => (
              <Alert key={index} variant="destructive" className="py-3">
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    {error.path && (
                      <p className="font-mono text-xs text-destructive/80">
                        {error.path}
                      </p>
                    )}
                    <p>{error.message}</p>
                    {error.keyword && (
                      <p className="text-xs text-destructive/70">
                        Validation keyword: {error.keyword}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {showUploadLink && (
            <Button onClick={() => router.push("/upload")} variant="outline">
              <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
              Upload New Spec
            </Button>
          )}
          <Button onClick={() => router.push("/explorer")} variant="outline">
            <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
            Back to Explorer
          </Button>
        </div>

        {/* Help Text */}
        <Alert>
          <Icon icon="lucide:info" className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-semibold mb-1">Need help?</p>
            <p>
              Make sure your OpenAPI specification follows the{" "}
              <a
                href="https://swagger.io/specification/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                OpenAPI 3.0 specification
              </a>
              . Common issues include missing required fields, invalid data
              types, or incorrect schema references.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

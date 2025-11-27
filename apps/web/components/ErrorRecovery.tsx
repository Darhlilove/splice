"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";

/**
 * ErrorRecovery Component
 *
 * Comprehensive error display with multiple recovery options.
 * Provides retry, go back, and reset functionality based on error severity.
 *
 * Requirements: 7.1, 7.2, 7.3
 *
 * @example
 * ```tsx
 * <ErrorRecovery
 *   error={new Error("Failed to generate SDK")}
 *   onRetry={() => handleRetry()}
 *   onGoBack={() => router.back()}
 *   onReset={() => resetWorkflow()}
 * />
 * ```
 */

export interface ErrorRecoveryOptions {
  retry?: () => void;
  goBack?: () => void;
  reset?: () => void;
}

interface ErrorRecoveryProps {
  error: Error | string;
  title?: string;
  options?: ErrorRecoveryOptions;
  variant?: "card" | "alert";
  severity?: "error" | "warning" | "critical";
}

export function ErrorRecovery({
  error,
  title,
  options = {},
  variant = "card",
  severity = "error",
}: ErrorRecoveryProps) {
  const errorMessage = typeof error === "string" ? error : error.message;
  const defaultTitle =
    severity === "critical"
      ? "Critical Error"
      : severity === "warning"
      ? "Warning"
      : "Error";

  const displayTitle = title || defaultTitle;

  if (variant === "alert") {
    return (
      <Alert
        variant={severity === "warning" ? "default" : "destructive"}
        className="relative"
      >
        <Icon
          icon={
            severity === "critical"
              ? "lucide:alert-triangle"
              : "lucide:alert-circle"
          }
          className="h-4 w-4"
        />
        <AlertDescription className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-1">{displayTitle}</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {options.retry && (
              <Button
                onClick={options.retry}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon icon="lucide:refresh-cw" className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            {options.goBack && (
              <Button
                onClick={options.goBack}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon icon="lucide:arrow-left" className="w-3 h-3 mr-1" />
                Go Back
              </Button>
            )}
            {options.reset && (
              <Button
                onClick={options.reset}
                variant="destructive"
                size="sm"
                className="h-8"
              >
                <Icon icon="lucide:rotate-ccw" className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card
      className={
        severity === "critical"
          ? "border-destructive bg-destructive/5"
          : "border-destructive"
      }
    >
      <CardContent className="py-8">
        <div className="text-center space-y-4">
          <Icon
            icon={
              severity === "critical"
                ? "lucide:alert-triangle"
                : "lucide:alert-circle"
            }
            className={`w-12 h-12 mx-auto ${
              severity === "critical"
                ? "text-destructive animate-pulse"
                : "text-destructive"
            }`}
          />
          <div>
            <p className="text-lg font-semibold mb-2">{displayTitle}</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {errorMessage}
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            {options.retry && (
              <Button onClick={options.retry}>
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {options.goBack && (
              <Button onClick={options.goBack} variant="outline">
                <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
            {options.reset && (
              <Button onClick={options.reset} variant="destructive">
                <Icon icon="lucide:rotate-ccw" className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@iconify/react";

/**
 * ErrorDisplay Component
 *
 * Displays error messages with retry and dismiss functionality.
 * Used for showing generation errors, validation errors, and other failures.
 *
 * Requirements: 5.1, 5.2
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error="Failed to generate SDK"
 *   onRetry={() => handleRetry()}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "card" | "alert";
}

export function ErrorDisplay({
  error,
  title = "Error",
  onRetry,
  onDismiss,
  variant = "card",
}: ErrorDisplayProps) {
  if (variant === "alert") {
    return (
      <Alert variant="destructive" className="relative">
        <Icon icon="lucide:alert-circle" className="h-4 w-4" />
        <AlertDescription className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-1">{title}</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Icon icon="lucide:refresh-cw" className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <Icon icon="lucide:x" className="w-3 h-3" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-destructive">
      <CardContent className="py-8">
        <div className="text-center space-y-4">
          <Icon
            icon="lucide:alert-circle"
            className="w-12 h-12 mx-auto text-destructive"
          />
          <div>
            <p className="text-lg font-semibold mb-2">{title}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry}>
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} variant="outline">
                <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

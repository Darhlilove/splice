"use client";

import React, { Component, ReactNode } from "react";
import { ErrorRecovery, ErrorRecoveryOptions } from "./ErrorRecovery";

/**
 * ErrorBoundary Component
 *
 * React error boundary that catches errors in child components
 * and displays them with recovery options.
 *
 * Requirements: 7.1, 7.5
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onReset={() => window.location.href = '/'}
 *   fallback={(error, reset) => <CustomError error={error} onReset={reset} />}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  onGoBack?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Import error logging utility dynamically
    import("@/lib/error-recovery").then(({ logError, getErrorSeverity }) => {
      // Log error with full context and stack trace
      logError(error, getErrorSeverity(error), {
        component: "ErrorBoundary",
        componentStack: errorInfo.componentStack,
        digest: errorInfo.digest,
      });
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoBack = () => {
    if (this.props.onGoBack) {
      this.props.onGoBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error recovery UI
      const options: ErrorRecoveryOptions = {
        retry: this.handleReset,
        goBack: this.handleGoBack,
        reset: this.props.onReset,
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <ErrorRecovery
              error={this.state.error}
              options={options}
              severity="critical"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PageErrorBoundary Component
 *
 * Specialized error boundary for page-level errors with workflow-aware recovery.
 *
 * Requirements: 7.1, 7.5
 */

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
  onNavigateHome?: () => void;
}

export function PageErrorBoundary({
  children,
  pageName,
  onNavigateHome,
}: PageErrorBoundaryProps) {
  const handleReset = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <ErrorBoundary
      onReset={handleReset}
      onGoBack={handleGoBack}
      fallback={(error, reset) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <ErrorRecovery
              error={error}
              title={pageName ? `Error in ${pageName}` : "Page Error"}
              options={{
                retry: reset,
                goBack: handleGoBack,
                reset: handleReset,
              }}
              severity="critical"
            />
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

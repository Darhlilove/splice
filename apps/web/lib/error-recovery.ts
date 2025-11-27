/**
 * Error Recovery Utilities
 *
 * Utilities for error logging, recovery, and state preservation.
 *
 * Requirements: 7.4, 7.5
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "critical";

/**
 * Error context for logging
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Logged error structure
 */
export interface LoggedError {
  error: Error | string;
  severity: ErrorSeverity;
  context: ErrorContext;
  stack?: string;
}

/**
 * Log an error with context and stack trace
 * Requirements: 7.5
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = "error",
  context: Partial<ErrorContext> = {}
): void {
  const errorObj = typeof error === "string" ? new Error(error) : error;

  const fullContext: ErrorContext = {
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    ...context,
  };

  const loggedError: LoggedError = {
    error: errorObj,
    severity,
    context: fullContext,
    stack: errorObj.stack,
  };

  // Log to console with appropriate level
  switch (severity) {
    case "critical":
      console.error("🔴 CRITICAL ERROR:", loggedError);
      break;
    case "error":
      console.error("❌ ERROR:", loggedError);
      break;
    case "warning":
      console.warn("⚠️ WARNING:", loggedError);
      break;
  }

  // In production, you might want to send to an error tracking service
  // e.g., Sentry, LogRocket, etc.
  if (typeof window !== "undefined" && (window as any).errorTracker) {
    (window as any).errorTracker.captureError(loggedError);
  }
}

/**
 * Get user-friendly error message
 * Requirements: 7.5
 */
export function getUserFriendlyMessage(error: Error | string): string {
  const errorMessage = typeof error === "string" ? error : error.message;

  // Map technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    "Network Error":
      "Unable to connect. Please check your internet connection.",
    "Failed to fetch": "Unable to reach the server. Please try again.",
    Timeout: "The request took too long. Please try again.",
    "Invalid JSON": "Received invalid data from the server.",
    Unauthorized: "You don't have permission to perform this action.",
    "Not Found": "The requested resource was not found.",
    "Internal Server Error":
      "Something went wrong on our end. Please try again later.",
  };

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      return message;
    }
  }

  // Return original message if no mapping found
  return errorMessage;
}

/**
 * Determine if an error is recoverable
 * Requirements: 7.2
 */
export function isRecoverableError(error: Error | string): boolean {
  const errorMessage = typeof error === "string" ? error : error.message;

  const recoverablePatterns = [
    "Network Error",
    "Failed to fetch",
    "Timeout",
    "ECONNREFUSED",
    "ETIMEDOUT",
  ];

  return recoverablePatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Determine error severity
 * Requirements: 7.1
 */
export function getErrorSeverity(error: Error | string): ErrorSeverity {
  const errorMessage = typeof error === "string" ? error : error.message;

  // Critical errors that require reset
  const criticalPatterns = [
    "Cannot read property",
    "undefined is not a function",
    "Maximum call stack",
    "Out of memory",
  ];

  if (criticalPatterns.some((pattern) => errorMessage.includes(pattern))) {
    return "critical";
  }

  // Warnings
  const warningPatterns = ["deprecated", "warning"];

  if (
    warningPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern)
    )
  ) {
    return "warning";
  }

  return "error";
}

/**
 * Create error recovery options based on error type
 * Requirements: 7.1, 7.2, 7.3
 */
export interface ErrorRecoveryOptions {
  retry?: () => void;
  goBack?: () => void;
  reset?: () => void;
}

export function createRecoveryOptions(
  error: Error | string,
  handlers: {
    onRetry?: () => void;
    onGoBack?: () => void;
    onReset?: () => void;
  }
): ErrorRecoveryOptions {
  const severity = getErrorSeverity(error);
  const recoverable = isRecoverableError(error);

  const options: ErrorRecoveryOptions = {};

  // Add retry for recoverable errors
  if (recoverable && handlers.onRetry) {
    options.retry = handlers.onRetry;
  }

  // Always allow going back
  if (handlers.onGoBack) {
    options.goBack = handlers.onGoBack;
  }

  // Add reset for critical errors
  if (severity === "critical" && handlers.onReset) {
    options.reset = handlers.onReset;
  }

  return options;
}

/**
 * Preserve state before risky operation
 * Requirements: 7.4
 */
export function preserveState<T>(key: string, state: T): void {
  try {
    const stateData = {
      data: state,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(`error-recovery-${key}`, JSON.stringify(stateData));
  } catch (error) {
    console.error("Failed to preserve state:", error);
  }
}

/**
 * Restore preserved state after error
 * Requirements: 7.4
 */
export function restoreState<T>(key: string): T | null {
  try {
    const saved = sessionStorage.getItem(`error-recovery-${key}`);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return parsed.data as T;
  } catch (error) {
    console.error("Failed to restore state:", error);
    return null;
  }
}

/**
 * Clear preserved state
 * Requirements: 7.4
 */
export function clearPreservedState(key: string): void {
  try {
    sessionStorage.removeItem(`error-recovery-${key}`);
  } catch (error) {
    console.error("Failed to clear preserved state:", error);
  }
}

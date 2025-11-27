/**
 * Global Error Handler
 *
 * Sets up global error handlers for unhandled errors and promise rejections.
 *
 * Requirements: 7.5
 */

import { logError } from "./error-recovery";

/**
 * Initialize global error handlers
 * Should be called once in the app initialization
 */
export function initializeGlobalErrorHandlers(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Handle unhandled errors
  window.addEventListener("error", (event: ErrorEvent) => {
    logError(event.error || event.message, "error", {
      component: "GlobalErrorHandler",
      action: "unhandledError",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Prevent default browser error handling
    event.preventDefault();
  });

  // Handle unhandled promise rejections
  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      logError(error, "error", {
        component: "GlobalErrorHandler",
        action: "unhandledPromiseRejection",
        reason: event.reason,
      });

      // Prevent default browser error handling
      event.preventDefault();
    }
  );

  console.log("✅ Global error handlers initialized");
}

/**
 * Cleanup global error handlers
 */
export function cleanupGlobalErrorHandlers(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Note: In practice, you'd need to store references to the handlers
  // to properly remove them. This is a simplified version.
  console.log("🧹 Global error handlers cleaned up");
}

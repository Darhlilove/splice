# Error Recovery System

Comprehensive error handling and recovery system for the Splice application.

## Overview

The error recovery system provides:

- **Error Boundaries**: Catch and handle React component errors
- **Error Recovery UI**: User-friendly error displays with recovery options
- **Form State Preservation**: Save and restore form data after errors
- **Error Logging**: Comprehensive error logging with context and stack traces
- **Global Error Handlers**: Catch unhandled errors and promise rejections

## Components

### ErrorRecovery

Main component for displaying errors with recovery options.

```tsx
import { ErrorRecovery } from "@/components/ErrorRecovery";

<ErrorRecovery
  error={error}
  title="Custom Error Title"
  variant="card" // or "alert"
  severity="error" // "error" | "warning" | "critical"
  options={{
    retry: () => handleRetry(),
    goBack: () => router.back(),
    reset: () => router.push("/"),
  }}
/>;
```

**Props:**

- `error`: Error object or string message
- `title`: Optional custom title
- `variant`: Display style - "card" (default) or "alert"
- `severity`: Error severity - "error" (default), "warning", or "critical"
- `options`: Recovery actions
  - `retry`: Function to retry the failed operation
  - `goBack`: Function to navigate back
  - `reset`: Function to reset/start over (shown for critical errors)

### ErrorBoundary

React error boundary for catching component errors.

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary
  onReset={() => router.push("/")}
  onGoBack={() => router.back()}
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  <YourComponent />
</ErrorBoundary>;
```

**Props:**

- `onReset`: Called when user clicks reset
- `onGoBack`: Called when user clicks go back
- `onError`: Custom error handler
- `fallback`: Custom error UI renderer

### PageErrorBoundary

Specialized error boundary for page-level errors.

```tsx
import { PageErrorBoundary } from "@/components/ErrorBoundary";

<PageErrorBoundary
  pageName="SDK Generator"
  onNavigateHome={() => router.push("/")}
>
  <PageContent />
</PageErrorBoundary>;
```

## Hooks

### useFormRecovery

Hook for preserving and restoring form state.

```tsx
import { useFormRecovery } from "@/hooks/use-form-recovery";

const { saveFormState, restoreFormState, clearFormState, hasSavedState } =
  useFormRecovery<FormData>("my-form");

// Save before risky operation
const handleSubmit = async (data) => {
  saveFormState(data);
  try {
    await submitForm(data);
    clearFormState(); // Clear on success
  } catch (error) {
    // State is preserved, user can retry
  }
};

// Restore on mount
useEffect(() => {
  const saved = restoreFormState();
  if (saved) {
    setFormData(saved);
  }
}, []);
```

### FormRecoveryNotification

Component to notify users of saved form state.

```tsx
import { FormRecoveryNotification } from "@/hooks/use-form-recovery";

{
  hasSavedState() && (
    <FormRecoveryNotification
      onRestore={() => {
        const saved = restoreFormState();
        if (saved) setFormData(saved);
      }}
      onDismiss={() => clearFormState()}
      timestamp={getSavedStateMetadata()?.timestamp}
    />
  );
}
```

## Utilities

### Error Logging

```tsx
import { logError } from "@/lib/error-recovery";

try {
  await riskyOperation();
} catch (error) {
  logError(error, "error", {
    component: "MyComponent",
    action: "riskyOperation",
    userId: user.id,
  });
}
```

**Severity Levels:**

- `"error"`: Standard errors (logged with console.error)
- `"warning"`: Warnings (logged with console.warn)
- `"critical"`: Critical errors requiring reset (logged with console.error)

### Error Recovery Options

```tsx
import { createRecoveryOptions } from "@/lib/error-recovery";

const options = createRecoveryOptions(error, {
  onRetry: () => handleRetry(),
  onGoBack: () => router.back(),
  onReset: () => router.push("/"),
});

// Automatically determines which options to show based on error type
```

### User-Friendly Messages

```tsx
import { getUserFriendlyMessage } from "@/lib/error-recovery";

const friendlyMessage = getUserFriendlyMessage(error);
// "Network Error" → "Unable to connect. Please check your internet connection."
```

### State Preservation

```tsx
import {
  preserveState,
  restoreState,
  clearPreservedState,
} from "@/lib/error-recovery";

// Before risky operation
preserveState("my-data", data);

// After error
const restored = restoreState("my-data");

// On success
clearPreservedState("my-data");
```

## Global Error Handlers

Automatically initialized in the app providers. Catches:

- Unhandled JavaScript errors
- Unhandled promise rejections

All errors are logged with full context and stack traces.

## Requirements Mapping

- **7.1**: Clear error messages with recovery options
- **7.2**: Retry button for recoverable errors
- **7.3**: Go back and reset buttons
- **7.4**: Form state preservation
- **7.5**: Error logging with context and stack traces

## Best Practices

1. **Always provide recovery options**: Give users a way to recover from errors
2. **Log errors with context**: Include component name, action, and relevant data
3. **Preserve user input**: Save form state before risky operations
4. **Use appropriate severity**: Critical errors should offer reset, recoverable errors should offer retry
5. **Show user-friendly messages**: Map technical errors to understandable messages
6. **Wrap pages with error boundaries**: Prevent entire app crashes

## Examples

See `ErrorRecovery.example.tsx` for comprehensive usage examples including:

- Basic error recovery
- Alert variant errors
- Critical errors with reset
- Error boundaries
- Form recovery
- State preservation

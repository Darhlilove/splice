/**
 * ErrorRecovery Component Usage Examples
 *
 * This file demonstrates how to use the error recovery components
 * and utilities throughout the application.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorRecovery } from "./ErrorRecovery";
import { ErrorBoundary } from "./ErrorBoundary";
import { useFormRecovery } from "@/hooks/use-form-recovery";
import { FormRecoveryNotification } from "./FormRecoveryNotification";
import {
  logError,
  createRecoveryOptions,
  preserveState,
  restoreState,
} from "@/lib/error-recovery";
import { Button } from "./ui/button";

/**
 * Example 1: Basic Error Recovery with Card Variant
 */
export function BasicErrorRecoveryExample() {
  const [error, setError] = useState<Error | null>(null);

  const handleRiskyOperation = async () => {
    try {
      // Simulate an operation that might fail
      throw new Error("Failed to load data from server");
    } catch (err) {
      setError(err as Error);
      logError(err as Error, "error", {
        component: "BasicErrorRecoveryExample",
        action: "handleRiskyOperation",
      });
    }
  };

  if (error) {
    return (
      <ErrorRecovery
        error={error}
        options={{
          retry: () => {
            setError(null);
            handleRiskyOperation();
          },
          goBack: () => window.history.back(),
        }}
      />
    );
  }

  return <Button onClick={handleRiskyOperation}>Trigger Error</Button>;
}

/**
 * Example 2: Alert Variant Error Recovery
 */
export function AlertErrorRecoveryExample() {
  const [error, setError] = useState<string | null>(null);

  const handleOperation = async () => {
    try {
      throw new Error("Network connection failed");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <ErrorRecovery
          error={error}
          variant="alert"
          severity="warning"
          options={{
            retry: () => {
              setError(null);
              handleOperation();
            },
          }}
        />
      )}
      <Button onClick={handleOperation}>Test Network Operation</Button>
    </div>
  );
}

/**
 * Example 3: Critical Error with Reset
 */
export function CriticalErrorExample() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);

  const handleCriticalOperation = () => {
    try {
      throw new Error("Critical system error occurred");
    } catch (err) {
      setError(err as Error);
      logError(err as Error, "critical", {
        component: "CriticalErrorExample",
        action: "handleCriticalOperation",
      });
    }
  };

  if (error) {
    return (
      <ErrorRecovery
        error={error}
        severity="critical"
        options={{
          retry: () => setError(null),
          goBack: () => router.back(),
          reset: () => router.push("/"),
        }}
      />
    );
  }

  return (
    <Button onClick={handleCriticalOperation}>Trigger Critical Error</Button>
  );
}

/**
 * Example 4: Error Boundary Usage
 */
function ComponentThatMightError() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("Component crashed!");
  }

  return (
    <div>
      <p>This component is working fine</p>
      <Button onClick={() => setShouldError(true)}>Crash Component</Button>
    </div>
  );
}

export function ErrorBoundaryExample() {
  const router = useRouter();

  return (
    <ErrorBoundary
      onReset={() => router.push("/")}
      onGoBack={() => router.back()}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

/**
 * Example 5: Form Recovery with State Preservation
 */
interface FormData {
  name: string;
  email: string;
  message: string;
}

export function FormRecoveryExample() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    saveFormState,
    restoreFormState,
    clearFormState,
    hasSavedState,
    getSavedStateMetadata,
  } = useFormRecovery<FormData>("contact-form");

  // Check for saved state on mount
  useState(() => {
    if (hasSavedState()) {
      setShowRecovery(true);
    }
  });

  const handleRestore = () => {
    const saved = restoreFormState();
    if (saved) {
      setFormData(saved);
    }
    setShowRecovery(false);
  };

  const handleSubmit = async () => {
    // Save form state before risky operation
    saveFormState(formData);

    try {
      // Simulate API call that might fail
      throw new Error("Failed to submit form");
    } catch (err) {
      setError(err as Error);
      logError(err as Error, "error", {
        component: "FormRecoveryExample",
        action: "handleSubmit",
      });
      // Form state is preserved, user can retry
    }
  };

  const handleSuccess = () => {
    // Clear saved state on success
    clearFormState();
  };

  return (
    <div className="space-y-4">
      {showRecovery && (
        <FormRecoveryNotification
          onRestore={handleRestore}
          onDismiss={() => {
            clearFormState();
            setShowRecovery(false);
          }}
          timestamp={getSavedStateMetadata()?.timestamp}
        />
      )}

      {error && (
        <ErrorRecovery
          error={error}
          variant="alert"
          options={{
            retry: () => {
              setError(null);
              handleSubmit();
            },
          }}
        />
      )}

      {/* Form fields would go here */}
      <Button onClick={handleSubmit}>Submit Form</Button>
    </div>
  );
}

/**
 * Example 6: Using Error Recovery Options Helper
 */
export function ErrorRecoveryOptionsExample() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);

  const handleOperation = async () => {
    try {
      throw new Error("Network Error: Failed to fetch");
    } catch (err) {
      const error = err as Error;
      setError(error);

      // Create recovery options based on error type
      const options = createRecoveryOptions(error, {
        onRetry: () => {
          setError(null);
          handleOperation();
        },
        onGoBack: () => router.back(),
        onReset: () => router.push("/"),
      });

      // Options will automatically include retry for recoverable errors
      console.log("Recovery options:", options);
    }
  };

  if (error) {
    const options = createRecoveryOptions(error, {
      onRetry: () => {
        setError(null);
        handleOperation();
      },
      onGoBack: () => router.back(),
      onReset: () => router.push("/"),
    });

    return <ErrorRecovery error={error} options={options} />;
  }

  return <Button onClick={handleOperation}>Test Operation</Button>;
}

/**
 * Example 7: State Preservation Utilities
 */
export function StatePreservationExample() {
  const [data, setData] = useState({ count: 0 });
  const [error, setError] = useState<Error | null>(null);

  const handleRiskyOperation = async () => {
    // Preserve state before operation
    preserveState("counter-state", data);

    try {
      // Simulate operation that might fail
      throw new Error("Operation failed");
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleRestore = () => {
    // Restore state after error
    const restored = restoreState<typeof data>("counter-state");
    if (restored) {
      setData(restored);
    }
    setError(null);
  };

  if (error) {
    return (
      <ErrorRecovery
        error={error}
        options={{
          retry: handleRestore,
        }}
      />
    );
  }

  return (
    <div>
      <p>Count: {data.count}</p>
      <Button onClick={() => setData({ count: data.count + 1 })}>
        Increment
      </Button>
      <Button onClick={handleRiskyOperation}>Risky Operation</Button>
    </div>
  );
}

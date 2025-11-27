"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * useFormRecovery Hook
 *
 * Preserves form state in sessionStorage to allow recovery after errors.
 * Automatically saves form state and provides methods to restore or clear it.
 *
 * Requirements: 7.4
 *
 * @example
 * ```tsx
 * const { saveFormState, restoreFormState, clearFormState } = useFormRecovery('sdk-config');
 *
 * // Save before risky operation
 * const handleSubmit = async (data) => {
 *   saveFormState(data);
 *   try {
 *     await riskyOperation(data);
 *     clearFormState();
 *   } catch (error) {
 *     // Form state is preserved, user can retry
 *   }
 * };
 *
 * // Restore on mount
 * useEffect(() => {
 *   const saved = restoreFormState();
 *   if (saved) {
 *     setFormData(saved);
 *   }
 * }, []);
 * ```
 */

interface FormRecoveryOptions {
  autoSave?: boolean;
  debounceMs?: number;
}

export function useFormRecovery<T = any>(
  formId: string,
  options: FormRecoveryOptions = {}
) {
  const { autoSave = false, debounceMs = 500 } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `form-recovery-${formId}`;

  /**
   * Save form state to sessionStorage
   */
  const saveFormState = useCallback(
    (formData: T) => {
      try {
        const dataToSave = {
          data: formData,
          timestamp: new Date().toISOString(),
          formId,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save form state:", error);
      }
    },
    [storageKey, formId]
  );

  /**
   * Save form state with debouncing (for auto-save)
   */
  const saveFormStateDebounced = useCallback(
    (formData: T) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveFormState(formData);
      }, debounceMs);
    },
    [saveFormState, debounceMs]
  );

  /**
   * Restore form state from sessionStorage
   */
  const restoreFormState = useCallback((): T | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return parsed.data as T;
    } catch (error) {
      console.error("Failed to restore form state:", error);
      return null;
    }
  }, [storageKey]);

  /**
   * Clear saved form state
   */
  const clearFormState = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Failed to clear form state:", error);
    }
  }, [storageKey]);

  /**
   * Check if there's saved form state
   */
  const hasSavedState = useCallback((): boolean => {
    try {
      return sessionStorage.getItem(storageKey) !== null;
    } catch (error) {
      return false;
    }
  }, [storageKey]);

  /**
   * Get metadata about saved state
   */
  const getSavedStateMetadata = useCallback((): {
    timestamp: string;
    formId: string;
  } | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return {
        timestamp: parsed.timestamp,
        formId: parsed.formId,
      };
    } catch (error) {
      return null;
    }
  }, [storageKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveFormState,
    saveFormStateDebounced,
    restoreFormState,
    clearFormState,
    hasSavedState,
    getSavedStateMetadata,
  };
}

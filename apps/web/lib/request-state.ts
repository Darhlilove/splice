import { useState, useCallback } from "react";

/**
 * Represents an API response with all relevant details
 */
export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  timestamp: Date;
  contentType: string;
}

/**
 * Represents different types of request errors
 */
export interface RequestError {
  type: "network" | "timeout" | "validation" | "server";
  message: string;
  details?: any;
}

/**
 * Represents the result of schema validation
 */
export interface ValidationResult {
  valid: boolean;
  matchingFields: string[];
  extraFields: string[];
  missingFields: string[];
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  expected: string;
  actual: string;
  message: string;
}

/**
 * Complete state for request execution
 */
export interface RequestState {
  loading: boolean;
  response: APIResponse | null;
  error: RequestError | null;
  validationResult: ValidationResult | null;
}

/**
 * Manages the state of API request execution
 */
export class RequestStateManager {
  private state: RequestState;
  private listeners: Set<(state: RequestState) => void>;

  constructor() {
    this.state = {
      loading: false,
      response: null,
      error: null,
      validationResult: null,
    };
    this.listeners = new Set();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: RequestState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.state = {
      ...this.state,
      loading,
    };
    this.notify();
  }

  /**
   * Set response data
   */
  setResponse(response: APIResponse): void {
    this.state = {
      ...this.state,
      loading: false,
      response,
      error: null,
    };
    this.notify();
  }

  /**
   * Set error state
   */
  setError(error: RequestError): void {
    this.state = {
      ...this.state,
      loading: false,
      error,
      response: null,
    };
    this.notify();
  }

  /**
   * Set validation result
   */
  setValidationResult(validationResult: ValidationResult): void {
    this.state = {
      ...this.state,
      validationResult,
    };
    this.notify();
  }

  /**
   * Reset all state to initial values
   */
  reset(): void {
    this.state = {
      loading: false,
      response: null,
      error: null,
      validationResult: null,
    };
    this.notify();
  }

  /**
   * Get current state
   */
  getState(): RequestState {
    return { ...this.state };
  }
}

/**
 * React hook for managing request state in components
 */
export function useRequestState() {
  const [state, setState] = useState<RequestState>({
    loading: false,
    response: null,
    error: null,
    validationResult: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }));
  }, []);

  const setResponse = useCallback((response: APIResponse) => {
    setState({
      loading: false,
      response,
      error: null,
      validationResult: null,
    });
  }, []);

  const setError = useCallback((error: RequestError) => {
    setState({
      loading: false,
      response: null,
      error,
      validationResult: null,
    });
  }, []);

  const setValidationResult = useCallback(
    (validationResult: ValidationResult) => {
      setState((prev) => ({
        ...prev,
        validationResult,
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      response: null,
      error: null,
      validationResult: null,
    });
  }, []);

  return {
    state,
    setLoading,
    setResponse,
    setError,
    setValidationResult,
    reset,
  };
}

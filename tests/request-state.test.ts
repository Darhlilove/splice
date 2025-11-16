/**
 * Tests for request state management
 */

import { describe, test, expect, beforeEach } from "vitest";
import { RequestStateManager } from "@/lib/request-state";
import type {
  APIResponse,
  RequestError,
  ValidationResult,
} from "@/lib/request-state";

describe("RequestStateManager", () => {
  let manager: RequestStateManager;

  beforeEach(() => {
    manager = new RequestStateManager();
  });

  describe("Initial State", () => {
    test("should initialize with default state", () => {
      const state = manager.getState();

      expect(state.loading).toBe(false);
      expect(state.response).toBeNull();
      expect(state.error).toBeNull();
      expect(state.validationResult).toBeNull();
    });
  });

  describe("setLoading", () => {
    test("should update loading state to true", () => {
      manager.setLoading(true);
      const state = manager.getState();

      expect(state.loading).toBe(true);
    });

    test("should update loading state to false", () => {
      manager.setLoading(true);
      manager.setLoading(false);
      const state = manager.getState();

      expect(state.loading).toBe(false);
    });
  });

  describe("setResponse", () => {
    const mockResponse: APIResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: { id: 1, name: "Test" },
      responseTime: 245,
      timestamp: new Date(),
      contentType: "application/json",
    };

    test("should set response and clear error", () => {
      manager.setResponse(mockResponse);
      const state = manager.getState();

      expect(state.response).toEqual(mockResponse);
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });

    test("should clear previous error when setting response", () => {
      const mockError: RequestError = {
        type: "network",
        message: "Connection failed",
      };

      manager.setError(mockError);
      manager.setResponse(mockResponse);
      const state = manager.getState();

      expect(state.error).toBeNull();
      expect(state.response).toEqual(mockResponse);
    });
  });

  describe("setError", () => {
    const mockError: RequestError = {
      type: "timeout",
      message: "Request timed out after 30 seconds",
      details: { timeout: 30000 },
    };

    test("should set error and clear response", () => {
      manager.setError(mockError);
      const state = manager.getState();

      expect(state.error).toEqual(mockError);
      expect(state.response).toBeNull();
      expect(state.loading).toBe(false);
    });

    test("should clear previous response when setting error", () => {
      const mockResponse: APIResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      manager.setResponse(mockResponse);
      manager.setError(mockError);
      const state = manager.getState();

      expect(state.response).toBeNull();
      expect(state.error).toEqual(mockError);
    });
  });

  describe("setValidationResult", () => {
    const mockValidation: ValidationResult = {
      valid: true,
      matchingFields: ["id", "name"],
      extraFields: [],
      missingFields: [],
      errors: [],
    };

    test("should set validation result", () => {
      manager.setValidationResult(mockValidation);
      const state = manager.getState();

      expect(state.validationResult).toEqual(mockValidation);
    });

    test("should preserve other state when setting validation", () => {
      const mockResponse: APIResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      manager.setResponse(mockResponse);
      manager.setValidationResult(mockValidation);
      const state = manager.getState();

      expect(state.response).toEqual(mockResponse);
      expect(state.validationResult).toEqual(mockValidation);
    });
  });

  describe("reset", () => {
    test("should reset all state to initial values", () => {
      const mockResponse: APIResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      manager.setLoading(true);
      manager.setResponse(mockResponse);
      manager.reset();

      const state = manager.getState();

      expect(state.loading).toBe(false);
      expect(state.response).toBeNull();
      expect(state.error).toBeNull();
      expect(state.validationResult).toBeNull();
    });
  });

  describe("State Subscription", () => {
    test("should notify listeners on state change", () => {
      let notificationCount = 0;
      let lastState = manager.getState();

      const unsubscribe = manager.subscribe((state) => {
        notificationCount++;
        lastState = state;
      });

      manager.setLoading(true);

      expect(notificationCount).toBe(1);
      expect(lastState.loading).toBe(true);

      unsubscribe();
    });

    test("should stop notifying after unsubscribe", () => {
      let notificationCount = 0;

      const unsubscribe = manager.subscribe(() => {
        notificationCount++;
      });

      manager.setLoading(true);
      expect(notificationCount).toBe(1);

      unsubscribe();
      manager.setLoading(false);

      expect(notificationCount).toBe(1);
    });
  });
});

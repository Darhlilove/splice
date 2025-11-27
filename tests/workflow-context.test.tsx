/**
 * Tests for WorkflowContext
 * Validates state management, persistence, and all action functions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  WorkflowProvider,
  useWorkflow,
  type WorkflowState,
  type SpecMetadata,
} from "@/contexts/workflow-context";
import type { OpenAPISpec } from "@/packages/openapi/src/types";
import type { RequestConfig } from "@/types/request-builder";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("WorkflowContext", () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    localStorageMock.clear();
    vi.clearAllTimers();
  });

  describe("State Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      expect(result.current.state.currentSpec).toBeNull();
      expect(result.current.state.specId).toBeNull();
      expect(result.current.state.completedSteps).toEqual([]);
      expect(result.current.state.currentStep).toBe("upload");
      expect(result.current.state.mockServer.isRunning).toBe(false);
    });
  });

  describe("Spec Management Actions", () => {
    it("should set current spec and mark upload as completed", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-spec-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      expect(result.current.state.currentSpec).toEqual(mockSpec);
      expect(result.current.state.specId).toBe("test-spec-1");
      expect(result.current.state.specMetadata).toEqual(mockMetadata);
      expect(result.current.state.completedSteps).toContain("upload");
      expect(result.current.state.currentStep).toBe("explore");
    });

    it("should clear current spec and reset state", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-spec-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      act(() => {
        result.current.clearCurrentSpec();
      });

      expect(result.current.state.currentSpec).toBeNull();
      expect(result.current.state.specId).toBeNull();
      expect(result.current.state.completedSteps).toEqual([]);
      expect(result.current.state.currentStep).toBe("upload");
    });
  });

  describe("Explorer State Actions", () => {
    it("should set selected endpoint", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockEndpoint = {
        path: "/users",
        method: "get",
        summary: "Get users",
      };

      act(() => {
        result.current.setSelectedEndpoint(mockEndpoint);
      });

      expect(result.current.state.selectedEndpoint).toEqual(mockEndpoint);
    });

    it("should set request config", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockConfig: RequestConfig = {
        method: "get",
        url: "https://api.example.com/users",
        headers: { "Content-Type": "application/json" },
      };

      act(() => {
        result.current.setRequestConfig(mockConfig);
      });

      expect(result.current.state.requestConfig).toEqual(mockConfig);
    });
  });

  describe("Mock Server State Actions", () => {
    it("should set mock server status and mark step as completed", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      expect(result.current.state.mockServer.isRunning).toBe(true);
      expect(result.current.state.mockServer.url).toBe("http://localhost:4010");
      expect(result.current.state.mockServer.port).toBe(4010);
      expect(result.current.state.completedSteps).toContain("mock");
    });

    it("should not duplicate mock step in completedSteps", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      act(() => {
        result.current.setMockServerStatus({
          isRunning: false,
        });
      });

      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      const mockSteps = result.current.state.completedSteps.filter(
        (step) => step === "mock"
      );
      expect(mockSteps.length).toBe(1);
    });
  });

  describe("SDK Generator State Actions", () => {
    it("should set SDK config", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockConfig = {
        language: "typescript" as const,
        packageName: "test-sdk",
        packageVersion: "1.0.0",
      };

      act(() => {
        result.current.setSdkConfig(mockConfig);
      });

      expect(result.current.state.sdkConfig).toEqual(mockConfig);
    });

    it("should set generated SDK and mark step as completed", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSdk = {
        downloadUrl: "/api/sdk/download/abc123",
        packageName: "test-sdk",
      };

      act(() => {
        result.current.setGeneratedSdk(mockSdk);
      });

      expect(result.current.state.generatedSdk).toEqual(mockSdk);
      expect(result.current.state.completedSteps).toContain("generate");
    });
  });

  describe("Workflow Progress Actions", () => {
    it("should complete a workflow step", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      act(() => {
        result.current.completeStep("explore");
      });

      expect(result.current.state.completedSteps).toContain("explore");
    });

    it("should not duplicate completed steps", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      act(() => {
        result.current.completeStep("explore");
        result.current.completeStep("explore");
      });

      const exploreSteps = result.current.state.completedSteps.filter(
        (step) => step === "explore"
      );
      expect(exploreSteps.length).toBe(1);
    });

    it("should set current step", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      act(() => {
        result.current.setCurrentStep("generate");
      });

      expect(result.current.state.currentStep).toBe("generate");
    });

    it("should reset workflow", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Set up some state
      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-spec-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
        result.current.completeStep("explore");
        result.current.setCurrentStep("mock");
      });

      // Reset
      act(() => {
        result.current.resetWorkflow();
      });

      expect(result.current.state.currentSpec).toBeNull();
      expect(result.current.state.completedSteps).toEqual([]);
      expect(result.current.state.currentStep).toBe("upload");
    });
  });

  describe("Recent Specs Actions", () => {
    it("should add a recent spec", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockMetadata: SpecMetadata = {
        id: "test-spec-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.addRecentSpec(mockMetadata);
      });

      expect(result.current.state.recentSpecs).toHaveLength(1);
      expect(result.current.state.recentSpecs[0].id).toBe(mockMetadata.id);
      expect(result.current.state.recentSpecs[0].name).toBe(mockMetadata.name);
      expect(result.current.state.recentSpecs[0].version).toBe(
        mockMetadata.version
      );
      expect(result.current.state.recentSpecs[0].lastAccessedAt).toBeInstanceOf(
        Date
      );
    });

    it("should limit recent specs to 5", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Add 6 specs
      for (let i = 1; i <= 6; i++) {
        act(() => {
          result.current.addRecentSpec({
            id: `spec-${i}`,
            name: `API ${i}`,
            version: "1.0.0",
            uploadedAt: new Date(),
          });
        });
      }

      expect(result.current.state.recentSpecs).toHaveLength(5);
      // Most recent should be first
      expect(result.current.state.recentSpecs[0].id).toBe("spec-6");
    });

    it("should update lastAccessedAt for existing spec", async () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockMetadata: SpecMetadata = {
        id: "test-spec-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.addRecentSpec(mockMetadata);
      });

      const firstAccessTime =
        result.current.state.recentSpecs[0].lastAccessedAt;

      // Wait a bit and add again
      await new Promise((resolve) => setTimeout(resolve, 10));

      act(() => {
        result.current.addRecentSpec(mockMetadata);
      });

      expect(result.current.state.recentSpecs).toHaveLength(1);
      expect(result.current.state.recentSpecs[0].lastAccessedAt).not.toBe(
        firstAccessTime
      );
    });
  });
});

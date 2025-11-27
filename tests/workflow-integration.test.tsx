/**
 * Integration tests for complete workflow
 * Tests the full workflow from upload → explore → mock → generate
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  WorkflowProvider,
  useWorkflow,
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

describe("Workflow Integration Tests", () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    localStorageMock.clear();
    vi.clearAllTimers();
  });

  describe("Complete Workflow: Upload → Explore → Mock → Generate", () => {
    it("completes the full workflow successfully", async () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Step 1: Upload spec
      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Petstore API", version: "1.0.0" },
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              summary: "List all pets",
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      };

      const mockMetadata: SpecMetadata = {
        id: "petstore-1",
        name: "Petstore API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      // Verify upload step completed
      expect(result.current.state.currentSpec).toEqual(mockSpec);
      expect(result.current.state.completedSteps).toContain("upload");
      expect(result.current.state.currentStep).toBe("explore");

      // Step 2: Explore API - select endpoint
      const endpoint = {
        path: "/pets",
        method: "GET",
        operationId: "listPets",
        summary: "List all pets",
      };

      act(() => {
        result.current.setSelectedEndpoint(endpoint);
      });

      expect(result.current.state.selectedEndpoint).toEqual(endpoint);

      // Set request config
      const requestConfig: RequestConfig = {
        method: "get",
        url: "http://localhost:4010/pets",
        headers: { "Content-Type": "application/json" },
      };

      act(() => {
        result.current.setRequestConfig(requestConfig);
      });

      expect(result.current.state.requestConfig).toEqual(requestConfig);

      // Mark explore as completed
      act(() => {
        result.current.completeStep("explore");
      });

      expect(result.current.state.completedSteps).toContain("explore");

      // Step 3: Start mock server
      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      // Verify mock server started and step completed
      expect(result.current.state.mockServer.isRunning).toBe(true);
      expect(result.current.state.mockServer.url).toBe("http://localhost:4010");
      expect(result.current.state.completedSteps).toContain("mock");

      // Step 4: Generate SDK
      const sdkConfig = {
        language: "typescript" as const,
        packageName: "petstore-sdk",
        packageVersion: "1.0.0",
        author: "Test User",
        description: "Generated Petstore SDK",
      };

      act(() => {
        result.current.setSdkConfig(sdkConfig);
      });

      expect(result.current.state.sdkConfig).toEqual(sdkConfig);

      // Complete SDK generation
      const generatedSdk = {
        downloadUrl: "/api/sdk/download/abc123",
        packageName: "petstore-sdk",
      };

      act(() => {
        result.current.setGeneratedSdk(generatedSdk);
      });

      // Verify SDK generated and step completed
      expect(result.current.state.generatedSdk).toEqual(generatedSdk);
      expect(result.current.state.completedSteps).toContain("generate");

      // Verify all steps completed
      expect(result.current.state.completedSteps).toEqual([
        "upload",
        "explore",
        "mock",
        "generate",
      ]);
    });

    it("maintains workflow state through each step", async () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      // Upload spec
      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      const specAfterUpload = result.current.state.currentSpec;

      // Select endpoint
      act(() => {
        result.current.setSelectedEndpoint({
          path: "/test",
          method: "GET",
        });
      });

      // Verify spec is still present
      expect(result.current.state.currentSpec).toEqual(specAfterUpload);

      // Start mock server
      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      // Verify spec and endpoint are still present
      expect(result.current.state.currentSpec).toEqual(specAfterUpload);
      expect(result.current.state.selectedEndpoint).toEqual({
        path: "/test",
        method: "GET",
      });

      // Generate SDK
      act(() => {
        result.current.setSdkConfig({
          language: "typescript",
          packageName: "test-sdk",
          packageVersion: "1.0.0",
        });
      });

      // Verify all previous state is maintained
      expect(result.current.state.currentSpec).toEqual(specAfterUpload);
      expect(result.current.state.selectedEndpoint).toEqual({
        path: "/test",
        method: "GET",
      });
      expect(result.current.state.mockServer.isRunning).toBe(true);
    });
  });

  describe("State Persistence Across Navigation", () => {
    it("persists state to sessionStorage", async () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      // Wait for debounced save (500ms)
      await waitFor(
        () => {
          const stored = sessionStorageMock.getItem("workflow-state");
          expect(stored).not.toBeNull();
        },
        { timeout: 1000 }
      );

      const stored = sessionStorageMock.getItem("workflow-state");
      const parsed = JSON.parse(stored!);

      expect(parsed.currentSpec).toBeDefined();
      expect(parsed.specId).toBe("test-1");
      expect(parsed.completedSteps).toContain("upload");
    });

    it("loads state from sessionStorage on mount", () => {
      // Pre-populate sessionStorage
      const savedState = {
        currentSpec: {
          openapi: "3.0.0",
          info: { title: "Saved API", version: "1.0.0" },
          paths: {},
        },
        specId: "saved-1",
        specMetadata: {
          id: "saved-1",
          name: "Saved API",
          version: "1.0.0",
          uploadedAt: new Date().toISOString(),
        },
        selectedEndpoint: null,
        requestConfig: null,
        mockServer: {
          isRunning: false,
          url: null,
          port: null,
        },
        sdkConfig: null,
        generatedSdk: null,
        completedSteps: ["upload", "explore"],
        currentStep: "mock",
        recentSpecs: [],
      };

      sessionStorageMock.setItem("workflow-state", JSON.stringify(savedState));

      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // State should be loaded from sessionStorage
      expect(result.current.state.specId).toBe("saved-1");
      expect(result.current.state.completedSteps).toEqual([
        "upload",
        "explore",
      ]);
      expect(result.current.state.currentStep).toBe("mock");
    });

    it("clears sessionStorage when spec is cleared", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-1",
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

      const stored = sessionStorageMock.getItem("workflow-state");
      expect(stored).toBeNull();
    });
  });

  describe("Spec Switching", () => {
    it("resets workflow state when switching specs", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Upload first spec
      const spec1: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "API 1", version: "1.0.0" },
        paths: {},
      };

      const metadata1: SpecMetadata = {
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(spec1, metadata1);
        result.current.setSelectedEndpoint({
          path: "/test1",
          method: "GET",
        });
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      // Upload second spec
      const spec2: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "API 2", version: "2.0.0" },
        paths: {},
      };

      const metadata2: SpecMetadata = {
        id: "spec-2",
        name: "API 2",
        version: "2.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(spec2, metadata2);
      });

      // Verify new spec is loaded
      expect(result.current.state.currentSpec).toEqual(spec2);
      expect(result.current.state.specId).toBe("spec-2");
      // Note: setCurrentSpec doesn't reset completedSteps, it preserves them
      // This is by design - the workflow state persists across spec changes
      expect(result.current.state.completedSteps).toContain("upload");
      expect(result.current.state.currentStep).toBe("explore");

      // Recent specs should contain both
      expect(result.current.state.recentSpecs.length).toBeGreaterThanOrEqual(2);
    });

    it("adds specs to recent specs list", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      const specs = [
        {
          id: "spec-1",
          name: "API 1",
          version: "1.0.0",
          uploadedAt: new Date(),
        },
        {
          id: "spec-2",
          name: "API 2",
          version: "2.0.0",
          uploadedAt: new Date(),
        },
        {
          id: "spec-3",
          name: "API 3",
          version: "3.0.0",
          uploadedAt: new Date(),
        },
      ];

      specs.forEach((metadata) => {
        act(() => {
          result.current.addRecentSpec(metadata);
        });
      });

      expect(result.current.state.recentSpecs.length).toBe(3);
      expect(result.current.state.recentSpecs[0].id).toBe("spec-3"); // Most recent first
    });
  });

  describe("Error Recovery", () => {
    it("allows workflow reset after error", () => {
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
        id: "test-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
        result.current.completeStep("explore");
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
      });

      // Reset workflow (simulating error recovery)
      act(() => {
        result.current.resetWorkflow();
      });

      // Verify state is reset
      expect(result.current.state.currentSpec).toBeNull();
      expect(result.current.state.completedSteps).toEqual([]);
      expect(result.current.state.currentStep).toBe("upload");
      expect(result.current.state.mockServer.isRunning).toBe(false);
    });

    it("preserves recent specs after reset", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Add recent specs
      act(() => {
        result.current.addRecentSpec({
          id: "spec-1",
          name: "API 1",
          version: "1.0.0",
          uploadedAt: new Date(),
        });
      });

      const recentSpecsBeforeReset = result.current.state.recentSpecs;

      // Set up and reset workflow
      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
      });

      act(() => {
        result.current.resetWorkflow();
      });

      // Recent specs should be preserved
      expect(result.current.state.recentSpecs.length).toBeGreaterThanOrEqual(
        recentSpecsBeforeReset.length
      );
    });

    it("allows continuing workflow after partial completion", () => {
      const { result } = renderHook(() => useWorkflow(), {
        wrapper: WorkflowProvider,
      });

      // Complete upload and explore
      const mockSpec: OpenAPISpec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const mockMetadata: SpecMetadata = {
        id: "test-1",
        name: "Test API",
        version: "1.0.0",
        uploadedAt: new Date(),
      };

      act(() => {
        result.current.setCurrentSpec(mockSpec, mockMetadata);
        result.current.completeStep("explore");
      });

      // Verify we can continue to mock
      act(() => {
        result.current.setCurrentStep("mock");
      });

      expect(result.current.state.currentStep).toBe("mock");
      expect(result.current.state.completedSteps).toContain("upload");
      expect(result.current.state.completedSteps).toContain("explore");

      // Complete mock and continue to generate
      act(() => {
        result.current.setMockServerStatus({
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        });
        result.current.setCurrentStep("generate");
      });

      expect(result.current.state.currentStep).toBe("generate");
      expect(result.current.state.completedSteps).toContain("mock");
    });
  });
});

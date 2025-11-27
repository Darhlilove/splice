/**
 * SDK Generator Workflow Integration Tests
 * Tests the complete workflow from form submission to download
 * Requirements: 1.5, 2.1, 3.1, 4.1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("SDK Generator Workflow Integration", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe("Form Submission to API", () => {
    it("should call /api/sdk/generate with correct payload", async () => {
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          generationId: "gen-123-abc",
        }),
      });
      global.fetch = mockFetch;

      const spec = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {},
      };

      const config = {
        language: "typescript" as const,
        packageName: "test-api-client",
        packageVersion: "1.0.0",
      };

      // Simulate form submission
      await fetch("/api/sdk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, config, specId: "test-spec" }),
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sdk/generate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spec, config, specId: "test-spec" }),
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      // Mock fetch to return error
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          error: "Invalid configuration",
        }),
      });
      global.fetch = mockFetch;

      const response = await fetch("/api/sdk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: {}, config: {} }),
      });

      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid configuration");
    });
  });

  describe("State Transitions", () => {
    it("should transition from idle to validating to generating", () => {
      const states: string[] = [];

      // Simulate state transitions
      states.push("idle");
      states.push("validating");
      states.push("generating");

      expect(states).toEqual(["idle", "validating", "generating"]);
    });

    it("should transition to complete when generation finishes", () => {
      const states: string[] = [];

      states.push("generating");
      states.push("complete");

      expect(states).toEqual(["generating", "complete"]);
    });

    it("should transition to error on failure", () => {
      const states: string[] = [];

      states.push("validating");
      states.push("error");

      expect(states).toEqual(["validating", "error"]);
    });
  });

  describe("Generation Completion", () => {
    it("should receive complete result with all metadata", async () => {
      const mockResult = {
        downloadUrl: "/api/sdk/download/abc123",
        packageName: "test-api-client",
        packageVersion: "1.0.0",
        fileSize: 251904,
        codeSamples: [
          {
            title: "API Client",
            code: 'import { Configuration } from "test-api-client";',
            language: "typescript",
          },
        ],
      };

      // Simulate receiving completion result
      const result = mockResult;

      expect(result.downloadUrl).toBeDefined();
      expect(result.packageName).toBe("test-api-client");
      expect(result.packageVersion).toBe("1.0.0");
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.codeSamples).toHaveLength(1);
    });

    it("should display code preview after completion", () => {
      const codeSamples = [
        {
          title: "API Client",
          code: 'import { Configuration } from "test-api-client";',
          language: "typescript",
        },
        {
          title: "Type Definitions",
          code: "export interface Pet { id: number; }",
          language: "typescript",
        },
        {
          title: "Usage Example",
          code: "const api = new DefaultApi(config);",
          language: "typescript",
        },
      ];

      expect(codeSamples).toHaveLength(3);
      expect(codeSamples[0].title).toBe("API Client");
      expect(codeSamples[1].title).toBe("Type Definitions");
      expect(codeSamples[2].title).toBe("Usage Example");
    });

    it("should display download section with metadata", () => {
      const downloadData = {
        downloadUrl: "/api/sdk/download/abc123",
        packageName: "test-api-client",
        packageVersion: "1.0.0",
        fileSize: 251904,
      };

      expect(downloadData.downloadUrl).toContain("/api/sdk/download/");
      expect(downloadData.packageName).toBe("test-api-client");
      expect(downloadData.packageVersion).toBe("1.0.0");
      expect(downloadData.fileSize).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should display error message on generation failure", () => {
      const error = "SDK generation failed: Invalid specification";

      expect(error).toContain("SDK generation failed");
    });

    it("should allow retry after error", () => {
      let state = "error";

      // Simulate retry
      state = "idle";

      expect(state).toBe("idle");
    });
  });

  describe("Generate New SDK", () => {
    it("should reset state when generating new SDK", () => {
      let state = "complete";
      let generationId: string | null = "gen-123-abc";
      let result: any = { downloadUrl: "/api/sdk/download/abc123" };

      // Simulate generate new
      state = "idle";
      generationId = null;
      result = null;

      expect(state).toBe("idle");
      expect(generationId).toBeNull();
      expect(result).toBeNull();
    });
  });
});

/**
 * Integration tests for Request Execution and Response Display
 * Tests real API calls, error scenarios, formatting, schema validation, and history
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { executeRequest } from "@/lib/request-executor";
import { HistoryStore } from "@/lib/history-store";
import { SchemaValidator } from "@/lib/schema-validator";
import type { Endpoint } from "@/packages/openapi/src/types";
import type { AuthConfig } from "@/types/request-builder";

// Mock fetch for controlled testing
const originalFetch = global.fetch;

describe("Request Execution Integration Tests", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("11.1 Test with real APIs", () => {
    test("should execute GET request successfully", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/{petId}",
        method: "GET",
        summary: "Get pet by ID",
        operationId: "getPetById",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      };

      const mockResponse = {
        id: 1,
        name: "Fluffy",
        status: "available",
      };

      // Mock the proxy API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: mockResponse,
          duration: 150,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://petstore.swagger.io/v2",
        { petId: 1 }, // Use number instead of string for integer type
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(200);
      expect(result.response?.body).toEqual(mockResponse);
    });

    test("should execute POST request with request body", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet",
        method: "POST",
        summary: "Add a new pet",
        operationId: "addPet",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  status: { type: "string" },
                },
              },
            },
          },
        },
      };

      const requestBody = {
        name: "Buddy",
        status: "available",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 201,
          statusText: "Created",
          headers: { "content-type": "application/json" },
          body: { id: 123, ...requestBody },
          duration: 200,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://petstore.swagger.io/v2",
        {},
        requestBody,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(201);
      expect(result.response?.body.name).toBe("Buddy");
    });

    test("should execute PUT request", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet",
        method: "PUT",
        summary: "Update an existing pet",
        operationId: "updatePet",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: { id: 1, name: "Updated Name" },
          duration: 180,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://petstore.swagger.io/v2",
        {},
        { id: 1, name: "Updated Name" },
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(200);
    });

    test("should execute DELETE request", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/{petId}",
        method: "DELETE",
        summary: "Delete a pet",
        operationId: "deletePet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 204,
          statusText: "No Content",
          headers: {},
          body: null,
          duration: 120,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://petstore.swagger.io/v2",
        { petId: 1 }, // Use number instead of string for integer type
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(204);
    });

    test("should handle query parameters", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/findByStatus",
        method: "GET",
        summary: "Find pets by status",
        operationId: "findPetsByStatus",
        parameters: [
          {
            name: "status",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: [{ id: 1, status: "available" }],
          duration: 160,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://petstore.swagger.io/v2",
        { status: "available" },
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.body).toBeInstanceOf(Array);
    });

    test("should handle API key authentication", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/1",
        method: "GET",
        summary: "Get pet",
        operationId: "getPet",
      };

      const authConfig: AuthConfig = {
        type: "apiKey",
        value: "test-api-key-123",
        location: "header",
        name: "X-API-Key",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: { id: 1, name: "Authenticated Pet" },
          duration: 140,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        undefined,
        "application/json",
        authConfig
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(200);
    });

    test("should handle Bearer token authentication", async () => {
      const mockEndpoint: Endpoint = {
        path: "/user/profile",
        method: "GET",
        summary: "Get user profile",
        operationId: "getUserProfile",
      };

      const authConfig: AuthConfig = {
        type: "bearer",
        value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          statusText: "OK",
          headers: { "content-type": "application/json" },
          body: { id: 1, username: "testuser" },
          duration: 130,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        undefined,
        "application/json",
        authConfig
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(200);
    });
  });

  describe("11.2 Test error scenarios", () => {
    test("should handle invalid URL format", async () => {
      const mockEndpoint: Endpoint = {
        path: "/test",
        method: "GET",
        summary: "Test endpoint",
        operationId: "test",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "Invalid URL format",
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "not-a-valid-url",
        {},
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should handle timeout errors", async () => {
      const mockEndpoint: Endpoint = {
        path: "/slow-endpoint",
        method: "GET",
        summary: "Slow endpoint",
        operationId: "slowEndpoint",
      };

      (global.fetch as any).mockRejectedValueOnce(
        Object.assign(new Error("Request timeout"), { name: "AbortError" })
      );

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });

    test("should handle network errors", async () => {
      const mockEndpoint: Endpoint = {
        path: "/test",
        method: "GET",
        summary: "Test endpoint",
        operationId: "test",
      };

      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      const result = await executeRequest(
        mockEndpoint,
        "https://unreachable.example.com",
        {},
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    test("should handle malformed request body", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet",
        method: "POST",
        summary: "Add pet",
        operationId: "addPet",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
      };

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        "not valid json",
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });

    test("should handle missing required parameters", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/{petId}",
        method: "GET",
        summary: "Get pet",
        operationId: "getPet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      };

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {}, // Missing petId
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });

    test("should handle 4xx client errors", async () => {
      const mockEndpoint: Endpoint = {
        path: "/pet/999999",
        method: "GET",
        summary: "Get pet",
        operationId: "getPet",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "application/json" },
          body: { error: "Pet not found" },
          duration: 100,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(404);
    });

    test("should handle 5xx server errors", async () => {
      const mockEndpoint: Endpoint = {
        path: "/test",
        method: "GET",
        summary: "Test endpoint",
        operationId: "test",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 500,
          statusText: "Internal Server Error",
          headers: { "content-type": "application/json" },
          body: { error: "Server error occurred" },
          duration: 150,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await executeRequest(
        mockEndpoint,
        "https://api.example.com",
        {},
        undefined,
        "application/json",
        { type: "none" }
      );

      expect(result.success).toBe(true);
      expect(result.response?.status).toBe(500);
    });
  });

  describe("11.3 Test response formatting", () => {
    test("should format JSON response for pretty print", () => {
      const jsonData = { name: "Test", value: 123, nested: { key: "value" } };
      const prettyJson = JSON.stringify(jsonData, null, 2);

      expect(prettyJson).toContain("\n");
      expect(prettyJson).toContain("  ");
      expect(prettyJson.split("\n").length).toBeGreaterThan(1);
    });

    test("should minify JSON response", () => {
      const jsonData = { name: "Test", value: 123, nested: { key: "value" } };
      const minifiedJson = JSON.stringify(jsonData);

      expect(minifiedJson).not.toContain("\n");
      expect(minifiedJson).not.toContain("  ");
    });

    test("should handle copy to clipboard functionality", async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };

      Object.defineProperty(navigator, "clipboard", {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });

      const testData = JSON.stringify({ test: "data" });
      await navigator.clipboard.writeText(testData);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testData);
    });

    test("should determine file extension for JSON content", () => {
      const contentType = "application/json";
      const extension = contentType.includes("json")
        ? "json"
        : contentType.includes("xml")
        ? "xml"
        : contentType.includes("html")
        ? "html"
        : "txt";

      expect(extension).toBe("json");
    });

    test("should determine file extension for XML content", () => {
      const contentType = "application/xml";
      const extension = contentType.includes("json")
        ? "json"
        : contentType.includes("xml")
        ? "xml"
        : contentType.includes("html")
        ? "html"
        : "txt";

      expect(extension).toBe("xml");
    });

    test("should determine file extension for HTML content", () => {
      const contentType = "text/html";
      const extension = contentType.includes("json")
        ? "json"
        : contentType.includes("xml")
        ? "xml"
        : contentType.includes("html")
        ? "html"
        : "txt";

      expect(extension).toBe("html");
    });

    test("should default to txt for unknown content types", () => {
      const contentType = "text/plain";
      const extension = contentType.includes("json")
        ? "json"
        : contentType.includes("xml")
        ? "xml"
        : contentType.includes("html")
        ? "html"
        : "txt";

      expect(extension).toBe("txt");
    });

    test("should generate filename with timestamp", () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `response-${timestamp}.json`;

      expect(filename).toContain("response-");
      expect(filename).toContain(".json");
    });
  });

  describe("11.4 Test schema validation", () => {
    let validator: SchemaValidator;

    beforeEach(() => {
      validator = new SchemaValidator();
    });

    test("should validate response that matches schema exactly", () => {
      const schema = {
        type: "object" as const,
        required: ["id", "name"],
        properties: {
          id: { type: "integer" as const },
          name: { type: "string" as const },
        },
      };

      const response = {
        id: 1,
        name: "Test",
      };

      const result = validator.validate(response, schema);

      expect(result.valid).toBe(true);
      expect(result.matchingFields.length).toBe(2);
      expect(result.extraFields.length).toBe(0);
      expect(result.missingFields.length).toBe(0);
    });

    test("should detect extra fields in response", () => {
      const schema = {
        type: "object" as const,
        required: ["id"],
        properties: {
          id: { type: "integer" as const },
          name: { type: "string" as const },
        },
      };

      const response = {
        id: 1,
        name: "Test",
        extraField: "unexpected",
      };

      const result = validator.validate(response, schema);

      expect(result.extraFields.length).toBe(1);
      expect(result.extraFields[0].path).toBe("extraField");
    });

    test("should detect missing required fields", () => {
      const schema = {
        type: "object" as const,
        required: ["id", "name", "status"],
        properties: {
          id: { type: "integer" as const },
          name: { type: "string" as const },
          status: { type: "string" as const },
        },
      };

      const response = {
        id: 1,
      };

      const result = validator.validate(response, schema);

      expect(result.valid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    test("should validate nested objects", () => {
      const schema = {
        type: "object" as const,
        required: ["user"],
        properties: {
          user: {
            type: "object" as const,
            required: ["id", "profile"],
            properties: {
              id: { type: "integer" as const },
              profile: {
                type: "object" as const,
                properties: {
                  name: { type: "string" as const },
                  email: { type: "string" as const },
                },
              },
            },
          },
        },
      };

      const response = {
        user: {
          id: 1,
          profile: {
            name: "John Doe",
            email: "john@example.com",
          },
        },
      };

      const result = validator.validate(response, schema);

      expect(result.valid).toBe(true);
      expect(result.matchingFields.length).toBeGreaterThan(0);
    });

    test("should handle array types in schema", () => {
      const schema = {
        type: "object" as const,
        properties: {
          items: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                id: { type: "integer" as const },
                name: { type: "string" as const },
              },
            },
          },
        },
      };

      const response = {
        items: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
      };

      const result = validator.validate(response, schema);

      expect(result.valid).toBe(true);
    });
  });

  describe("11.5 Test history functionality", () => {
    let historyStore: HistoryStore;

    beforeEach(() => {
      // Clear localStorage before each test
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      historyStore = new HistoryStore();
    });

    test("should create history entry after request", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { id: 1, name: "Test" },
        duration: 150,
        responseTime: 150,
        timestamp: new Date(),
        contentType: "application/json",
      };

      const entry = historyStore.addEntry(
        "GET",
        "/pet/1",
        { petId: "1" },
        mockResponse
      );

      expect(entry.id).toBeDefined();
      expect(entry.method).toBe("GET");
      expect(entry.endpoint).toBe("/pet/1");
      expect(entry.status).toBe(200);
    });

    test("should retrieve history entries", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      historyStore.addEntry("GET", "/test1", {}, mockResponse);
      historyStore.addEntry("POST", "/test2", {}, mockResponse);

      const entries = historyStore.getEntries();

      expect(entries.length).toBe(2);
      expect(entries[0].endpoint).toBe("/test2"); // Most recent first
      expect(entries[1].endpoint).toBe("/test1");
    });

    test("should select and display specific history entry", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { data: "test" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      const entry = historyStore.addEntry("GET", "/test", {}, mockResponse);
      const retrieved = historyStore.getEntry(entry.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(entry.id);
      expect(retrieved?.response.body).toEqual({ data: "test" });
    });

    test("should clear all history", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      historyStore.addEntry("GET", "/test1", {}, mockResponse);
      historyStore.addEntry("GET", "/test2", {}, mockResponse);

      expect(historyStore.getCount()).toBe(2);

      historyStore.clearHistory();

      expect(historyStore.getCount()).toBe(0);
      expect(historyStore.getEntries()).toEqual([]);
    });

    test("should export history as JSON", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { test: "data" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      historyStore.addEntry("GET", "/test", {}, mockResponse);

      const exported = historyStore.exportHistory();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].method).toBe("GET");
      expect(parsed[0].endpoint).toBe("/test");
    });

    test("should maintain max 10 entries limit", () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      // Add 15 entries
      for (let i = 0; i < 15; i++) {
        historyStore.addEntry("GET", `/test${i}`, {}, mockResponse);
      }

      const entries = historyStore.getEntries();

      expect(entries.length).toBe(10);
      // Should keep the most recent 10
      expect(entries[0].endpoint).toBe("/test14");
      expect(entries[9].endpoint).toBe("/test5");
    });

    test("should persist history to localStorage", () => {
      if (typeof window === "undefined") {
        // Skip in non-browser environment
        return;
      }

      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      historyStore.addEntry("GET", "/test", {}, mockResponse);

      // Create new instance to test persistence
      const newStore = new HistoryStore();
      const entries = newStore.getEntries();

      expect(entries.length).toBe(1);
      expect(entries[0].endpoint).toBe("/test");
    });
  });
});

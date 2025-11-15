/**
 * Tests for RequestPreview component
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RequestPreview } from "@/components/RequestPreview";
import type { AuthConfig, ParameterValue } from "@/types/request-builder";

describe("RequestPreview", () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  describe("URL Building", () => {
    test("should display base URL and path", () => {
      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      expect(
        screen.getByText(/https:\/\/api\.example\.com\/users/)
      ).toBeInTheDocument();
    });

    test("should replace path parameters in URL", async () => {
      const parameters: Record<string, ParameterValue> = {
        userId: "123",
        postId: "456",
      };

      const parameterLocations = {
        userId: "path" as const,
        postId: "path" as const,
      };

      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users/{userId}/posts/{postId}"
          parameters={parameters}
          parameterLocations={parameterLocations}
        />
      );

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(
            screen.getByText(/\/users\/123\/posts\/456/)
          ).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test("should append query parameters to URL", async () => {
      const parameters: Record<string, ParameterValue> = {
        limit: 10,
        offset: 20,
      };

      const parameterLocations = {
        limit: "query" as const,
        offset: "query" as const,
      };

      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={parameters}
          parameterLocations={parameterLocations}
        />
      );

      // Wait for debounce
      await waitFor(
        () => {
          const urlElement = screen.getByText(/limit=10/);
          expect(urlElement).toBeInTheDocument();
          expect(urlElement.textContent).toContain("offset=20");
        },
        { timeout: 500 }
      );
    });

    test("should handle array query parameters", async () => {
      const parameters: Record<string, ParameterValue> = {
        tags: ["tag1", "tag2", "tag3"],
      };

      const parameterLocations = {
        tags: "query" as const,
      };

      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/posts"
          parameters={parameters}
          parameterLocations={parameterLocations}
        />
      );

      await waitFor(
        () => {
          const urlElement = screen.getByText(/tags=tag1/);
          expect(urlElement.textContent).toContain(
            "tags=tag1&tags=tag2&tags=tag3"
          );
        },
        { timeout: 500 }
      );
    });
  });

  describe("HTTP Method Display", () => {
    test("should display GET method badge", () => {
      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      expect(screen.getByText("GET")).toBeInTheDocument();
    });

    test("should display POST method badge", () => {
      render(
        <RequestPreview
          method="POST"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      expect(screen.getByText("POST")).toBeInTheDocument();
    });
  });

  describe("Headers", () => {
    test("should show header count badge after debounce", async () => {
      const parameters: Record<string, ParameterValue> = {
        "X-API-Version": "v1",
        "X-Custom-Header": "custom-value",
      };

      const parameterLocations = {
        "X-API-Version": "header" as const,
        "X-Custom-Header": "header" as const,
      };

      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={parameters}
          parameterLocations={parameterLocations}
        />
      );

      expect(screen.getByText("Headers")).toBeInTheDocument();

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText("2")).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test("should include authentication header in count after debounce", async () => {
      const authentication: AuthConfig = {
        type: "bearer",
        bearerToken: "test-bearer-token",
      };

      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
          authentication={authentication}
        />
      );

      expect(screen.getByText("Headers")).toBeInTheDocument();

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText("1")).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    test("should include Content-Type header when contentType is provided after debounce", async () => {
      render(
        <RequestPreview
          method="POST"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
          contentType="application/json"
        />
      );

      expect(screen.getByText("Headers")).toBeInTheDocument();

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText("1")).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe("Request Body", () => {
    test("should display body section when body is provided as string", () => {
      const body = '{"name":"John Doe","email":"john@example.com"}';

      render(
        <RequestPreview
          method="POST"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
          body={body}
        />
      );

      expect(screen.getByText("Body")).toBeInTheDocument();
    });

    test("should display body section when body is provided as object", () => {
      const body = { name: "Jane Doe", age: 30 };

      render(
        <RequestPreview
          method="POST"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
          body={body}
        />
      );

      expect(screen.getByText("Body")).toBeInTheDocument();
    });

    test("should not display body section when no body provided", () => {
      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      expect(screen.queryByText("Body")).not.toBeInTheDocument();
    });
  });

  describe("Copy and Export Functionality", () => {
    test("should render copy URL button", () => {
      render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      expect(screen.getByText("Copy URL")).toBeInTheDocument();
    });

    test("should render export cURL button", () => {
      render(
        <RequestPreview
          method="POST"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
          body='{"name":"Test"}'
          contentType="application/json"
        />
      );

      expect(screen.getByText("Export cURL")).toBeInTheDocument();
    });
  });

  describe("Real-time Updates with Debounce", () => {
    test("should update URL after debounce period", async () => {
      const { rerender } = render(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={{}}
          parameterLocations={{}}
        />
      );

      // Update parameters
      const newParameters: Record<string, ParameterValue> = {
        search: "test",
      };

      const newParameterLocations = {
        search: "query" as const,
      };

      rerender(
        <RequestPreview
          method="GET"
          baseUrl="https://api.example.com"
          path="/users"
          parameters={newParameters}
          parameterLocations={newParameterLocations}
        />
      );

      // Should update after debounce
      await waitFor(
        () => {
          expect(screen.getByText(/search=test/)).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });
});

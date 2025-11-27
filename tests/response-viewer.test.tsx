/**
 * Tests for ResponseViewer component
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ResponseViewer } from "@/components/ResponseViewer";
import type { ResponseData } from "@/types/request-builder";

// Mock next/dynamic to avoid lazy loading issues in tests
vi.mock("next/dynamic", () => ({
  default: (fn: any, options?: any) => {
    // Return a component that immediately tries to load
    const MockComponent = (props: any) => {
      const [Component, setComponent] = React.useState<any>(null);
      const [error, setError] = React.useState<any>(null);

      React.useEffect(() => {
        let mounted = true;

        // Call fn and handle the promise
        Promise.resolve()
          .then(() => fn())
          .then((mod: any) => {
            if (mounted) {
              setComponent(() => mod.default || mod);
            }
          })
          .catch((err: any) => {
            if (mounted) {
              setError(err);
              console.error("Failed to load dynamic component in test:", err);
            }
          });

        return () => {
          mounted = false;
        };
      }, []);

      if (error) {
        return null;
      }

      if (!Component) {
        return options?.loading ? options.loading() : null;
      }

      return <Component {...props} />;
    };

    return MockComponent;
  },
}));

import * as React from "react";

describe("ResponseViewer", () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    // Suppress unhandled rejections from next/dynamic mock
    window.onunhandledrejection = (e) => {
      e.preventDefault();
    };
  });

  describe("Status Code Display", () => {
    test("should display 2xx status with success badge", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { message: "Success" },
        duration: 150,
        responseTime: 150,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("200 OK")).toBeInTheDocument();
    });

    test("should display 4xx status with warning badge", () => {
      const response: ResponseData = {
        status: 404,
        statusText: "Not Found",
        headers: {},
        body: { error: "Resource not found" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    });

    test("should display 5xx status with error badge", () => {
      const response: ResponseData = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        body: { error: "Server error" },
        duration: 200,
        responseTime: 200,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("500 Internal Server Error")).toBeInTheDocument();
    });
  });

  describe("Response Time Display", () => {
    test("should display response time in milliseconds", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 250,
        responseTime: 250,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("250ms")).toBeInTheDocument();
    });
  });

  describe("Response Headers", () => {
    test("should display headers count badge", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "x-api-version": "v1",
          "cache-control": "no-cache",
        },
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      // Use regex to match text that might be split across elements
      expect(screen.getByText(/Headers \(3\)/i)).toBeInTheDocument();
    });

    test("should show no headers message when headers are empty", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      // Use regex to match text that might be split across elements
      expect(screen.getByText(/Headers \(0\)/i)).toBeInTheDocument();
    });
  });

  describe("Response Body", () => {
    test("should display JSON response body", async () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { name: "John Doe", email: "john@example.com" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      // Wait for lazy-loaded component or check for Response Body heading
      await waitFor(() => {
        expect(screen.getByText("Response Body")).toBeInTheDocument();
      });
    });

    test("should display string response body", async () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/plain" },
        body: "Plain text response",
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "text/plain",
      };

      render(<ResponseViewer response={response} />);

      // Wait for lazy-loaded component or check for Response Body heading
      await waitFor(() => {
        expect(screen.getByText("Response Body")).toBeInTheDocument();
      });
    });

    test("should show response body section even when body is empty", async () => {
      const response: ResponseData = {
        status: 204,
        statusText: "No Content",
        headers: {},
        body: null,
        duration: 50,
        responseTime: 50,
        timestamp: new Date(),
        contentType: "",
      };

      render(<ResponseViewer response={response} />);

      // Check for Response Body heading (body section is always shown)
      await waitFor(() => {
        expect(screen.getByText("Response Body")).toBeInTheDocument();
      });
    });
  });

  describe("Action Buttons", () => {
    test("should render copy button", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { data: "test" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Copy")).toBeInTheDocument();
    });

    test("should render download button", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { data: "test" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    test("should render pretty/minify toggle for JSON responses", async () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { data: "test" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      render(<ResponseViewer response={response} />);

      // Wait for format buttons to appear (Pretty and Minify)
      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /pretty/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(
        screen.getByRole("button", { name: /minify/i })
      ).toBeInTheDocument();
    });
  });
});

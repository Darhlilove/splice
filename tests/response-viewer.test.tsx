/**
 * Tests for ResponseViewer component
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponseViewer } from "@/components/ResponseViewer";
import type { ResponseData } from "@/types/request-builder";

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
  });

  describe("Status Code Display", () => {
    test("should display 2xx status with success badge", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: { message: "Success" },
        duration: 150,
        timestamp: new Date(),
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
        timestamp: new Date(),
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
        timestamp: new Date(),
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
        timestamp: new Date(),
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
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Headers")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("should show no headers message when headers are empty", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Headers")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Response Body", () => {
    test("should display JSON response body", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { name: "John Doe", email: "john@example.com" },
        duration: 100,
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Body")).toBeInTheDocument();
    });

    test("should display string response body", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/plain" },
        body: "Plain text response",
        duration: 100,
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Body")).toBeInTheDocument();
    });

    test("should show no body message when body is empty", () => {
      const response: ResponseData = {
        status: 204,
        statusText: "No Content",
        headers: {},
        body: null,
        duration: 50,
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("No response body")).toBeInTheDocument();
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
        timestamp: new Date(),
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
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    test("should render pretty/raw toggle for JSON responses", () => {
      const response: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { data: "test" },
        duration: 100,
        timestamp: new Date(),
      };

      render(<ResponseViewer response={response} />);

      expect(screen.getByText("Raw")).toBeInTheDocument();
    });
  });
});

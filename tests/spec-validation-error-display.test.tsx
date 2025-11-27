/**
 * Tests for SpecValidationErrorDisplay component
 * Requirements: 5.4
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SpecValidationErrorDisplay } from "@/components/SpecValidationErrorDisplay";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SpecValidationErrorDisplay", () => {
  test("should render validation error title", () => {
    const errors = [
      { path: "/paths/users", message: "Missing required field 'responses'" },
    ];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(
      screen.getByText("OpenAPI Specification Validation Failed")
    ).toBeInTheDocument();
  });

  test("should display multiple validation errors", () => {
    const errors = [
      { path: "/paths/users", message: "Missing required field 'responses'" },
      { path: "/info", message: "Invalid version format" },
      { path: "/paths/posts", message: "Invalid schema reference" },
    ];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("3 Errors Found:")).toBeInTheDocument();
    expect(
      screen.getByText("Missing required field 'responses'")
    ).toBeInTheDocument();
    expect(screen.getByText("Invalid version format")).toBeInTheDocument();
    expect(screen.getByText("Invalid schema reference")).toBeInTheDocument();
  });

  test("should display error path when provided", () => {
    const errors = [
      { path: "/paths/users/get", message: "Missing operationId" },
    ];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("/paths/users/get")).toBeInTheDocument();
  });

  test("should display validation keyword when provided", () => {
    const errors = [
      {
        path: "/info/version",
        message: "Must be a string",
        keyword: "type",
      },
    ];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("Validation keyword: type")).toBeInTheDocument();
  });

  test("should handle string error input", () => {
    render(
      <SpecValidationErrorDisplay errors="Invalid OpenAPI specification format" />
    );

    expect(screen.getByText("1 Error Found:")).toBeInTheDocument();
    expect(
      screen.getByText("Invalid OpenAPI specification format")
    ).toBeInTheDocument();
  });

  test("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    const errors = [{ message: "Validation error" }];

    render(<SpecValidationErrorDisplay errors={errors} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("should show upload link by default", () => {
    const errors = [{ message: "Validation error" }];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(
      screen.getByRole("button", { name: /upload new spec/i })
    ).toBeInTheDocument();
  });

  test("should hide upload link when showUploadLink is false", () => {
    const errors = [{ message: "Validation error" }];

    render(
      <SpecValidationErrorDisplay errors={errors} showUploadLink={false} />
    );

    expect(
      screen.queryByRole("button", { name: /upload new spec/i })
    ).not.toBeInTheDocument();
  });

  test("should show back to explorer button", () => {
    const errors = [{ message: "Validation error" }];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(
      screen.getByRole("button", { name: /back to explorer/i })
    ).toBeInTheDocument();
  });

  test("should display help text with link to OpenAPI specification", () => {
    const errors = [{ message: "Validation error" }];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("Need help?")).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: /openapi 3.0 specification/i,
    });
    expect(link).toHaveAttribute("href", "https://swagger.io/specification/");
    expect(link).toHaveAttribute("target", "_blank");
  });

  test("should display singular 'Error' for single error", () => {
    const errors = [{ message: "Single validation error" }];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("1 Error Found:")).toBeInTheDocument();
  });

  test("should display plural 'Errors' for multiple errors", () => {
    const errors = [{ message: "Error 1" }, { message: "Error 2" }];

    render(<SpecValidationErrorDisplay errors={errors} />);

    expect(screen.getByText("2 Errors Found:")).toBeInTheDocument();
  });
});

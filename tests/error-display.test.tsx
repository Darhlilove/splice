/**
 * Tests for ErrorDisplay component
 * Requirements: 5.1, 5.2
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorDisplay } from "@/components/ErrorDisplay";

describe("ErrorDisplay", () => {
  test("should render error message in card variant", () => {
    render(
      <ErrorDisplay
        error="Failed to generate SDK"
        title="Generation Failed"
        variant="card"
      />
    );

    expect(screen.getByText("Generation Failed")).toBeInTheDocument();
    expect(screen.getByText("Failed to generate SDK")).toBeInTheDocument();
  });

  test("should render error message in alert variant", () => {
    render(
      <ErrorDisplay
        error="Invalid configuration"
        title="Configuration Error"
        variant="alert"
      />
    );

    expect(screen.getByText("Configuration Error")).toBeInTheDocument();
    expect(screen.getByText("Invalid configuration")).toBeInTheDocument();
  });

  test("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(
      <ErrorDisplay error="Network error" onRetry={onRetry} variant="card" />
    );

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("should call onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <ErrorDisplay
        error="Temporary error"
        onDismiss={onDismiss}
        variant="card"
      />
    );

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("should show both retry and dismiss buttons when both handlers provided", () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ErrorDisplay
        error="Error message"
        onRetry={onRetry}
        onDismiss={onDismiss}
        variant="card"
      />
    );

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dismiss/i })
    ).toBeInTheDocument();
  });

  test("should not show retry button when onRetry not provided", () => {
    render(<ErrorDisplay error="Error message" variant="card" />);

    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  test("should not show dismiss button when onDismiss not provided", () => {
    render(<ErrorDisplay error="Error message" variant="card" />);

    expect(
      screen.queryByRole("button", { name: /dismiss/i })
    ).not.toBeInTheDocument();
  });

  test("should use default title when not provided", () => {
    render(<ErrorDisplay error="Something went wrong" variant="card" />);

    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});

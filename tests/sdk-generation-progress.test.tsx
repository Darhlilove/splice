/**
 * Tests for SdkGenerationProgress component
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { SdkGenerationProgress } from "@/components/SdkGenerationProgress";

// Mock fetch
global.fetch = vi.fn();

describe("SdkGenerationProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should render progress indicator with title", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "validating",
          progress: 10,
          message: "Validating specification...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    expect(screen.getByText("Generating SDK")).toBeInTheDocument();
  });

  test("should display all stage labels", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 60,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    expect(
      screen.getAllByText("Validating specification...").length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Generating SDK code...").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Packaging files...")).toBeInTheDocument();
    expect(screen.getByText("SDK ready for download!")).toBeInTheDocument();
  });

  test("should call onComplete when generation completes", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "complete",
        progress: {
          stage: "complete",
          progress: 100,
          message: "SDK ready for download!",
        },
        downloadUrl: "/api/sdk/download/gen-123-abc",
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(
      () => {
        expect(onComplete).toHaveBeenCalledWith({
          downloadUrl: "/api/sdk/download/gen-123-abc",
        });
      },
      { timeout: 3000 }
    );

    expect(onError).not.toHaveBeenCalled();
  });

  test("should call onError when generation fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "failed",
        error: "Invalid OpenAPI specification",
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(
      () => {
        expect(onError).toHaveBeenCalledWith("Invalid OpenAPI specification");
      },
      { timeout: 3000 }
    );

    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should call onError when API returns error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: "Generation not found",
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(
      () => {
        expect(onError).toHaveBeenCalledWith("Generation not found");
      },
      { timeout: 3000 }
    );

    expect(onComplete).not.toHaveBeenCalled();
  });

  test("should display progress percentage", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 75,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(
      () => {
        expect(screen.getByText("75%")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("should call API with correct generation ID", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "validating",
          progress: 10,
          message: "Validating specification...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-456-xyz"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/sdk/status/gen-456-xyz");
    });
  });

  // Test stage transitions - Requirements: 2.2
  test("should display current stage with appropriate styling", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 60,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    // Wait for render
    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    // Verify all stages are displayed
    expect(
      screen.getAllByText(/validating specification/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/generating sdk code/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getByText(/packaging files/i)).toBeInTheDocument();
    expect(screen.getByText(/sdk ready for download/i)).toBeInTheDocument();
  });

  // Test progress bar updates - Requirements: 2.3
  test("should update progress bar with correct percentage", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 45,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "45");
    });
  });

  // Test ARIA attributes for accessibility - Requirements: 2.1, 2.3
  test("should have proper ARIA attributes", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 60,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  // Test stage list has proper ARIA - Requirements: 2.2
  test("should have accessible stage list", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "generating",
        progress: {
          stage: "generating",
          progress: 60,
          message: "Generating SDK code...",
        },
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      render(
        <SdkGenerationProgress
          generationId="gen-123-abc"
          onComplete={onComplete}
          onError={onError}
        />
      );
    });

    await waitFor(() => {
      const stageList = screen.getByRole("list", {
        name: /generation stages/i,
      });
      expect(stageList).toBeInTheDocument();
    });
  });
});

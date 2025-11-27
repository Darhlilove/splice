/**
 * Integration tests for SDK Generator UI workflow
 * Tests complete generation flow from form to download
 * Requirements: All
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SdkConfigForm } from "@/components/SdkConfigForm";
import { SdkGenerationProgress } from "@/components/SdkGenerationProgress";
import { SdkCodePreview } from "@/components/SdkCodePreview";
import { SdkDownloadSection } from "@/components/SdkDownloadSection";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock fetch
global.fetch = vi.fn();

describe("SDK Generator Workflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test complete generation flow - Requirements: All
  test("should complete full workflow from form submission to download", async () => {
    const user = userEvent.setup();

    // Step 1: Render and fill the config form
    const onSubmit = vi.fn();
    const { unmount: unmountForm } = render(
      <SdkConfigForm onSubmit={onSubmit} />
    );

    const packageNameInput = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(packageNameInput, "test-sdk");

    const submitButton = screen.getByRole("button", { name: /generate sdk/i });
    await user.click(submitButton);

    // Verify form submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        language: "typescript",
        packageName: "test-sdk",
        packageVersion: "1.0.0",
        author: undefined,
        description: undefined,
      });
    });

    unmountForm();

    // Step 2: Show progress indicator
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        status: "complete",
        progress: {
          stage: "complete",
          progress: 100,
          message: "SDK ready for download!",
        },
        downloadUrl: "/api/sdk/download/test-123",
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    const { unmount: unmountProgress } = render(
      <SdkGenerationProgress
        generationId="test-123"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Verify progress is shown
    expect(screen.getAllByText(/generating sdk/i).length).toBeGreaterThan(0);

    // Wait for completion
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        downloadUrl: "/api/sdk/download/test-123",
      });
    });

    unmountProgress();

    // Step 3: Show code preview
    const { unmount: unmountPreview } = render(
      <SdkCodePreview generationId="test-123" language="typescript" />
    );

    expect(screen.getByText(/code preview/i)).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /api client/i })
    ).toBeInTheDocument();

    unmountPreview();

    // Step 4: Show download section
    render(
      <SdkDownloadSection
        downloadUrl="/api/sdk/download/test-123"
        packageName="test-sdk"
        packageVersion="1.0.0"
        fileSize={250000}
      />
    );

    expect(
      screen.getByRole("button", { name: /download.*sdk/i })
    ).toBeInTheDocument();
    expect(screen.getByText("test-sdk")).toBeInTheDocument();
  });

  // Test error recovery scenario - Requirements: 5.1, 5.2
  test("should handle and recover from generation errors", async () => {
    const user = userEvent.setup();

    // Step 1: Submit form
    const onSubmit = vi.fn();
    const { unmount: unmountForm } = render(
      <SdkConfigForm onSubmit={onSubmit} />
    );

    const packageNameInput = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(packageNameInput, "test-sdk");

    const submitButton = screen.getByRole("button", { name: /generate sdk/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    unmountForm();

    // Step 2: Simulate generation error
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: "Invalid OpenAPI specification",
      }),
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    const onError = vi.fn();

    const { unmount: unmountProgress } = render(
      <SdkGenerationProgress
        generationId="test-123"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Wait for error
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Invalid OpenAPI specification");
    });

    expect(onComplete).not.toHaveBeenCalled();

    unmountProgress();

    // Step 3: User can retry by submitting form again
    const { unmount: unmountRetryForm } = render(
      <SdkConfigForm onSubmit={onSubmit} />
    );

    const retryPackageNameInput = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(retryPackageNameInput, "fixed-sdk");

    const retrySubmitButton = screen.getByRole("button", {
      name: /generate sdk/i,
    });
    await user.click(retrySubmitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });

    unmountRetryForm();
  });

  // Test multiple generation cycles - Requirements: 4.5
  test("should support multiple generation cycles", async () => {
    const user = userEvent.setup();

    // First generation
    const onSubmit = vi.fn();
    const { unmount: unmountForm1 } = render(
      <SdkConfigForm onSubmit={onSubmit} />
    );

    const packageNameInput1 = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(packageNameInput1, "first-sdk");

    const submitButton1 = screen.getByRole("button", {
      name: /generate sdk/i,
    });
    await user.click(submitButton1);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          packageName: "first-sdk",
        })
      );
    });

    unmountForm1();

    // Show download section with generate new button
    const onGenerateNew = vi.fn();
    const { unmount: unmountDownload } = render(
      <SdkDownloadSection
        downloadUrl="/api/sdk/download/first-123"
        packageName="first-sdk"
        packageVersion="1.0.0"
        fileSize={250000}
        onGenerateNew={onGenerateNew}
      />
    );

    // Click generate new
    const generateNewButton = screen.getByRole("button", {
      name: /generate new sdk/i,
    });
    await user.click(generateNewButton);

    expect(onGenerateNew).toHaveBeenCalled();

    unmountDownload();

    // Second generation
    const { unmount: unmountForm2 } = render(
      <SdkConfigForm onSubmit={onSubmit} />
    );

    const packageNameInput2 = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(packageNameInput2, "second-sdk");

    const submitButton2 = screen.getByRole("button", {
      name: /generate sdk/i,
    });
    await user.click(submitButton2);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          packageName: "second-sdk",
        })
      );
    });

    unmountForm2();
  });

  // Test form validation prevents invalid submissions - Requirements: 1.2, 1.3, 1.5
  test("should prevent submission with invalid form data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<SdkConfigForm onSubmit={onSubmit} />);

    // Try to submit with invalid package name
    const packageNameInput = screen.getByRole("textbox", {
      name: /package name/i,
    });
    await user.type(packageNameInput, "INVALID_NAME");
    await user.tab();

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText(/package name must be lowercase/i)
      ).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByRole("button", { name: /generate sdk/i });
    expect(submitButton).toBeDisabled();

    // onSubmit should not be called
    await user.click(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Test code preview and copy functionality - Requirements: 3.5
  test("should allow copying code samples from preview", async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    navigator.clipboard.writeText = mockWriteText;

    render(<SdkCodePreview generationId="test-123" language="typescript" />);

    // Find and click copy button
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    await user.click(copyButtons[0]);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  // Test progress updates during generation - Requirements: 2.1, 2.2, 2.3
  test("should show progress updates during generation", async () => {
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

    render(
      <SdkGenerationProgress
        generationId="test-123"
        onComplete={onComplete}
        onError={onError}
      />
    );

    // Should show progress
    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
    });

    // Should show current stage
    expect(screen.getAllByText(/generating sdk code/i).length).toBeGreaterThan(
      0
    );
  });
});

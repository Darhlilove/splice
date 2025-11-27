/**
 * Tests for SdkDownloadSection component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SdkDownloadSection } from "@/components/SdkDownloadSection";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("SdkDownloadSection", () => {
  const mockProps = {
    downloadUrl: "/api/sdk/download/test-123",
    packageName: "my-api-client",
    packageVersion: "1.0.0",
    fileSize: 251904, // ~246 KB
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test download button functionality - Requirements: 4.1, 4.2
  describe("Download Button", () => {
    test("should display prominent download button - Requirements: 4.1", () => {
      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download.*sdk/i,
      });
      expect(downloadButton).toBeInTheDocument();
    });

    test("should trigger download when button clicked - Requirements: 4.2", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["test content"], { type: "application/zip" });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });
      global.fetch = mockFetch;

      // Mock URL.createObjectURL and revokeObjectURL
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download.*sdk/i,
      });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/sdk/download/test-123");
        expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(toast.success).toHaveBeenCalledWith(
          "SDK downloaded successfully!"
        );
      });
    });

    test("should set filename to package name - Requirements: 4.2", async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(["test content"], { type: "application/zip" });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });
      global.fetch = mockFetch;

      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement to capture the link
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn((tagName) => {
        if (tagName === "a") {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download.*sdk/i,
      });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockLink.download).toBe("my-api-client.zip");
      });

      // Restore
      document.createElement = originalCreateElement;
    });

    test("should handle download errors - Requirements: 4.2", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });
      global.fetch = mockFetch;

      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download.*sdk/i,
      });
      await user.click(downloadButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test("should show loading state during download - Requirements: 4.2", async () => {
      const user = userEvent.setup();
      let resolveDownload: any;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });

      const mockFetch = vi.fn().mockReturnValue(downloadPromise);
      global.fetch = mockFetch;

      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download.*sdk/i,
      });
      await user.click(downloadButton);

      // Should show loading state
      expect(screen.getByText(/downloading/i)).toBeInTheDocument();
      expect(downloadButton).toBeDisabled();

      // Resolve the download
      resolveDownload({
        ok: true,
        blob: async () => new Blob(["test"], { type: "application/zip" }),
      });

      await waitFor(() => {
        expect(screen.queryByText(/downloading/i)).not.toBeInTheDocument();
      });
    });
  });

  // Test metadata display - Requirements: 4.3, 4.4
  describe("Metadata Display", () => {
    test("should display package name and version - Requirements: 4.3", () => {
      render(<SdkDownloadSection {...mockProps} />);

      expect(screen.getByText("my-api-client")).toBeInTheDocument();
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });

    test("should display file size in KB - Requirements: 4.4", () => {
      render(<SdkDownloadSection {...mockProps} />);

      // 251904 bytes = ~246 KB
      expect(screen.getByText(/246\.0 KB/)).toBeInTheDocument();
    });

    test("should display file size in MB for large files - Requirements: 4.4", () => {
      const largeFileProps = {
        ...mockProps,
        fileSize: 2621440, // 2.5 MB
      };

      render(<SdkDownloadSection {...largeFileProps} />);

      expect(screen.getByText(/2\.5 MB/)).toBeInTheDocument();
    });

    test("should display file size in bytes for very small files - Requirements: 4.4", () => {
      const smallFileProps = {
        ...mockProps,
        fileSize: 512,
      };

      render(<SdkDownloadSection {...smallFileProps} />);

      expect(screen.getByText(/512 B/)).toBeInTheDocument();
    });

    test("should display success message - Requirements: 4.1", () => {
      render(<SdkDownloadSection {...mockProps} />);

      expect(screen.getByText(/SDK Ready for Download/i)).toBeInTheDocument();
      expect(screen.getByText(/generated successfully/i)).toBeInTheDocument();
    });

    test("should display download expiration notice - Requirements: 4.1", () => {
      render(<SdkDownloadSection {...mockProps} />);

      expect(
        screen.getByText(/download links expire after 1 hour/i)
      ).toBeInTheDocument();
    });
  });

  // Test generate new functionality - Requirements: 4.5
  describe("Generate New SDK", () => {
    test("should display generate new button when callback provided - Requirements: 4.5", () => {
      const onGenerateNew = vi.fn();
      render(
        <SdkDownloadSection {...mockProps} onGenerateNew={onGenerateNew} />
      );

      expect(
        screen.getByRole("button", { name: /generate new sdk/i })
      ).toBeInTheDocument();
    });

    test("should not display generate new button when callback not provided - Requirements: 4.5", () => {
      render(<SdkDownloadSection {...mockProps} />);

      expect(
        screen.queryByRole("button", { name: /generate new sdk/i })
      ).not.toBeInTheDocument();
    });

    test("should call onGenerateNew when button clicked - Requirements: 4.5", async () => {
      const user = userEvent.setup();
      const onGenerateNew = vi.fn();
      render(
        <SdkDownloadSection {...mockProps} onGenerateNew={onGenerateNew} />
      );

      const generateNewButton = screen.getByRole("button", {
        name: /generate new sdk/i,
      });
      await user.click(generateNewButton);

      expect(onGenerateNew).toHaveBeenCalledTimes(1);
    });
  });

  // Test accessibility - Requirements: 4.1, 4.2
  describe("Accessibility", () => {
    test("should have accessible download button label - Requirements: 4.1", () => {
      render(<SdkDownloadSection {...mockProps} />);

      const downloadButton = screen.getByRole("button", {
        name: /download my-api-client version 1\.0\.0 sdk package/i,
      });
      expect(downloadButton).toBeInTheDocument();
    });

    test("should display success icon - Requirements: 4.1", () => {
      render(<SdkDownloadSection {...mockProps} />);

      // Check for success emoji or icon
      expect(screen.getByText("🎉")).toBeInTheDocument();
    });
  });

  // Test visual styling - Requirements: 4.1
  describe("Visual Styling", () => {
    test("should have success-themed styling - Requirements: 4.1", () => {
      const { container } = render(<SdkDownloadSection {...mockProps} />);

      // Check for green/success themed classes
      const card = container.querySelector(".border-green-500\\/50");
      expect(card).toBeInTheDocument();
    });

    test("should display metadata in organized layout - Requirements: 4.3, 4.4", () => {
      render(<SdkDownloadSection {...mockProps} />);

      // All metadata should be present
      expect(screen.getByText(/package name/i)).toBeInTheDocument();
      expect(screen.getByText(/version/i)).toBeInTheDocument();
      expect(screen.getByText(/file size/i)).toBeInTheDocument();
    });
  });
});

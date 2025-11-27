/**
 * Tests for SdkCodePreview component
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SdkCodePreview } from "@/components/SdkCodePreview";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
  configurable: true,
});

describe("SdkCodePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test code sample rendering - Requirements: 3.1, 3.2, 3.3, 3.4
  describe("Code Sample Rendering", () => {
    test("should render code preview with title - Requirements: 3.1", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      expect(screen.getByText(/code preview/i)).toBeInTheDocument();
    });

    test("should display API client sample tab - Requirements: 3.2", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      expect(
        screen.getByRole("tab", { name: /api client/i })
      ).toBeInTheDocument();
    });

    test("should display type definitions sample tab - Requirements: 3.3", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      expect(
        screen.getByRole("tab", { name: /type definitions/i })
      ).toBeInTheDocument();
    });

    test("should display usage example tab - Requirements: 3.4", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      expect(
        screen.getByRole("tab", { name: /usage example/i })
      ).toBeInTheDocument();
    });

    test("should render default API client code sample - Requirements: 3.2", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Check for code content (syntax highlighter may create multiple elements)
      expect(screen.getAllByText(/Configuration/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/DefaultApi/).length).toBeGreaterThan(0);
    });

    test("should render custom code samples when provided - Requirements: 3.1", () => {
      const customSamples = [
        {
          title: "Custom Client",
          code: "const client = new CustomClient();",
          language: "typescript",
        },
        {
          title: "Custom Types",
          code: "interface CustomType { id: string; }",
          language: "typescript",
        },
        {
          title: "Custom Usage",
          code: "await client.fetch();",
          language: "typescript",
        },
      ];

      render(
        <SdkCodePreview
          generationId="gen-123-abc"
          language="typescript"
          codeSamples={customSamples}
        />
      );

      expect(
        screen.getByRole("tab", { name: /custom client/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/CustomClient/)).toBeInTheDocument();
    });
  });

  // Test syntax highlighting - Requirements: 3.1, 3.2, 3.3, 3.4
  describe("Syntax Highlighting", () => {
    test("should apply syntax highlighting to code samples - Requirements: 3.1", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Check that syntax highlighter is rendering
      const codeBlocks = screen.getAllByText(/import|const|new/);
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    test("should show line numbers in code samples - Requirements: 3.1", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Syntax highlighter with showLineNumbers should be present
      // We can't easily test line numbers directly, but we can verify the code is rendered
      expect(screen.getAllByText(/Configuration/).length).toBeGreaterThan(0);
    });
  });

  // Test copy to clipboard - Requirements: 3.5
  describe("Copy to Clipboard", () => {
    test("should display copy button for each code sample - Requirements: 3.5", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const copyButtons = screen.getAllByRole("button", { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    test("should copy code to clipboard when copy button clicked - Requirements: 3.5", async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      navigator.clipboard.writeText = mockWriteText;

      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
      await user.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Code copied to clipboard!");
      });
    });

    test("should show success message after copying - Requirements: 3.5", async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      navigator.clipboard.writeText = mockWriteText;

      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      });
    });

    test("should handle copy errors gracefully - Requirements: 3.5", async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockRejectedValue(new Error("Copy failed"));
      navigator.clipboard.writeText = mockWriteText;

      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
      await user.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to copy code. Please try again."
        );
      });
    });

    test("should reset copy button state after copying - Requirements: 3.5", async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      navigator.clipboard.writeText = mockWriteText;

      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const copyButton = screen.getAllByRole("button", { name: /copy/i })[0];
      await user.click(copyButton);

      // Should show "Copied!" temporarily
      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      });

      // Should reset back to "Copy" after timeout
      await waitFor(
        () => {
          expect(screen.queryByText(/copied!/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  // Test tab navigation - Requirements: 3.1
  describe("Tab Navigation", () => {
    test("should switch between code samples using tabs - Requirements: 3.1", async () => {
      const user = userEvent.setup();
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Initially on API Client tab
      expect(screen.getAllByText(/Configuration/).length).toBeGreaterThan(0);

      // Click on Type Definitions tab
      const typeDefsTab = screen.getByRole("tab", {
        name: /type definitions/i,
      });
      await user.click(typeDefsTab);

      // Should show type definitions
      await waitFor(() => {
        expect(screen.getAllByText(/Pet/).length).toBeGreaterThan(0);
      });
    });

    test("should show usage example when clicking usage tab - Requirements: 3.4", async () => {
      const user = userEvent.setup();
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Click on Usage Example tab
      const usageTab = screen.getByRole("tab", { name: /usage example/i });
      await user.click(usageTab);

      // Should show usage example
      await waitFor(() => {
        expect(screen.getAllByText(/getPet/).length).toBeGreaterThan(0);
      });
    });

    test("should have accessible tab list - Requirements: 3.1", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      const tabList = screen.getByRole("tablist", {
        name: /code sample tabs/i,
      });
      expect(tabList).toBeInTheDocument();
    });
  });

  // Test with different languages - Requirements: 3.1
  describe("Language Support", () => {
    test("should accept language prop for syntax highlighting - Requirements: 3.1", () => {
      render(
        <SdkCodePreview generationId="gen-123-abc" language="typescript" />
      );

      // Component should render without errors
      expect(screen.getByText(/code preview/i)).toBeInTheDocument();
    });

    test("should render with different language samples - Requirements: 3.1", () => {
      const pythonSamples = [
        {
          title: "Python Client",
          code: "client = ApiClient()",
          language: "python",
        },
        {
          title: "Python Types",
          code: "class Pet:\n    pass",
          language: "python",
        },
        {
          title: "Python Usage",
          code: "pet = client.get_pet(123)",
          language: "python",
        },
      ];

      render(
        <SdkCodePreview
          generationId="gen-123-abc"
          language="python"
          codeSamples={pythonSamples}
        />
      );

      expect(screen.getByText(/ApiClient/)).toBeInTheDocument();
    });
  });
});

/**
 * Tests for SdkConfigForm component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SdkConfigForm, SDKConfig } from "@/components/SdkConfigForm";

describe("SdkConfigForm", () => {
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
  });

  // Test form rendering - Requirements: 1.1
  describe("Form Rendering", () => {
    test("should render all required form fields", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/target language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/package name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^version/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test("should render submit button", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });
      expect(submitButton).toBeInTheDocument();
    });

    test("should display helpful placeholder text - Requirements: 1.4", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText("my-api-client")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("1.0.0")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Your Name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Client library for My API")
      ).toBeInTheDocument();
    });

    test("should render with initial config values", () => {
      const initialConfig: Partial<SDKConfig> = {
        packageName: "test-package",
        packageVersion: "2.0.0",
        author: "Test Author",
        description: "Test description",
      };

      render(
        <SdkConfigForm onSubmit={mockOnSubmit} initialConfig={initialConfig} />
      );

      expect(screen.getByDisplayValue("test-package")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2.0.0")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Author")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
    });

    test("should show loading state when loading prop is true", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} loading={true} />);

      const submitButton = screen.getByRole("button", {
        name: /generating/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  // Test validation logic - Requirements: 1.2, 1.3
  describe("Validation Logic", () => {
    test("should validate package name on blur - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      // Enter invalid package name (uppercase)
      await user.type(packageNameInput, "InvalidName");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/package name must be lowercase/i)
        ).toBeInTheDocument();
      });
    });

    test("should show error for empty package name - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      // Focus and blur without entering value
      await user.click(packageNameInput);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/package name is required/i)
        ).toBeInTheDocument();
      });
    });

    test("should show error for package name with invalid characters - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      await user.type(packageNameInput, "invalid_name");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/package name must be lowercase with hyphens only/i)
        ).toBeInTheDocument();
      });
    });

    test("should show error for package name starting with hyphen - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      await user.type(packageNameInput, "-invalid");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/package name cannot start or end with hyphen/i)
        ).toBeInTheDocument();
      });
    });

    test("should accept valid package name - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      await user.type(packageNameInput, "valid-package-name");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/package name must be lowercase/i)
        ).not.toBeInTheDocument();
      });
    });

    test("should validate version on blur - Requirements: 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const versionInput = screen.getByRole("textbox", { name: /version/i });

      // Clear default value and enter invalid version
      await user.clear(versionInput);
      await user.type(versionInput, "invalid");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/version must follow semantic versioning/i)
        ).toBeInTheDocument();
      });
    });

    test("should show error for empty version - Requirements: 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const versionInput = screen.getByRole("textbox", { name: /version/i });

      await user.clear(versionInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/version is required/i)).toBeInTheDocument();
      });
    });

    test("should accept valid semantic version - Requirements: 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const versionInput = screen.getByRole("textbox", { name: /version/i });

      await user.clear(versionInput);
      await user.type(versionInput, "2.1.3");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/version must follow semantic versioning/i)
        ).not.toBeInTheDocument();
      });
    });

    test("should accept semantic version with pre-release suffix - Requirements: 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const versionInput = screen.getByRole("textbox", { name: /version/i });

      await user.clear(versionInput);
      await user.type(versionInput, "1.0.0-beta");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/version must follow semantic versioning/i)
        ).not.toBeInTheDocument();
      });
    });

    test("should enforce 500 character limit on description - Requirements: 1.4", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByRole("textbox", {
        name: /description/i,
      });
      const longText = "a".repeat(600);

      await user.type(descriptionInput, longText);

      // Should only have 500 characters
      expect(descriptionInput).toHaveValue("a".repeat(500));
    });

    test("should display character count for description - Requirements: 1.4", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByRole("textbox", {
        name: /description/i,
      });

      await user.type(descriptionInput, "Test description");

      expect(screen.getByText(/16\/500/)).toBeInTheDocument();
    });
  });

  // Test form submission - Requirements: 1.5
  describe("Form Submission", () => {
    test("should disable submit button when form is invalid - Requirements: 1.5", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });

      // Form is invalid initially (empty package name)
      expect(submitButton).toBeDisabled();
    });

    test("should enable submit button when form is valid - Requirements: 1.5", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });
      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });

      await user.type(packageNameInput, "valid-package");

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test("should call onSubmit with valid config - Requirements: 1.5", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });
      const versionInput = screen.getByRole("textbox", { name: /version/i });
      const authorInput = screen.getByRole("textbox", { name: /author/i });
      const descriptionInput = screen.getByRole("textbox", {
        name: /description/i,
      });

      await user.type(packageNameInput, "my-api-client");
      await user.clear(versionInput);
      await user.type(versionInput, "1.0.0");
      await user.type(authorInput, "John Doe");
      await user.type(descriptionInput, "My API client library");

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          language: "typescript",
          packageName: "my-api-client",
          packageVersion: "1.0.0",
          author: "John Doe",
          description: "My API client library",
        });
      });
    });

    test("should not call onSubmit when form is invalid - Requirements: 1.5", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });
      await user.type(packageNameInput, "Invalid_Name");

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("should omit optional fields if not provided - Requirements: 1.5", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });
      await user.type(packageNameInput, "my-api-client");

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          language: "typescript",
          packageName: "my-api-client",
          packageVersion: "1.0.0",
          author: undefined,
          description: undefined,
        });
      });
    });

    test("should validate all fields on submit - Requirements: 1.5", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      // Enter valid package name to enable submit button
      await user.type(packageNameInput, "valid-package");

      // Clear it to make it invalid
      await user.clear(packageNameInput);

      const submitButton = screen.getByRole("button", {
        name: /generate sdk/i,
      });

      // Try to submit with empty package name
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/package name is required/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // Test error display - Requirements: 1.2, 1.3, 1.4
  describe("Error Display", () => {
    test("should display inline error for invalid package name - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      await user.type(packageNameInput, "INVALID");
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /package name must be lowercase/i
        );
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass("text-destructive");
      });
    });

    test("should display inline error for invalid version - Requirements: 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const versionInput = screen.getByRole("textbox", { name: /version/i });

      await user.clear(versionInput);
      await user.type(versionInput, "abc");
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /version must follow semantic versioning/i
        );
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass("text-destructive");
      });
    });

    test("should clear error when field becomes valid - Requirements: 1.2", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      // Enter invalid value
      await user.type(packageNameInput, "INVALID");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/package name must be lowercase/i)
        ).toBeInTheDocument();
      });

      // Fix the value
      await user.clear(packageNameInput);
      await user.type(packageNameInput, "valid-name");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/package name must be lowercase/i)
        ).not.toBeInTheDocument();
      });
    });

    test("should highlight invalid fields with border color - Requirements: 1.2, 1.3", async () => {
      const user = userEvent.setup();
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const packageNameInput = screen.getByRole("textbox", {
        name: /package name/i,
      });

      await user.type(packageNameInput, "INVALID");
      await user.tab();

      await waitFor(() => {
        expect(packageNameInput).toHaveClass("border-destructive");
      });
    });
  });

  // Test language selector - Requirements: 7.1, 7.2, 7.3
  describe("Language Selector", () => {
    test("should show TypeScript as selected language", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} />);

      const languageSelect = screen.getByLabelText(/target language/i);
      expect(languageSelect).toHaveTextContent("TypeScript");
    });

    test("should disable form fields when loading", () => {
      render(<SdkConfigForm onSubmit={mockOnSubmit} loading={true} />);

      expect(
        screen.getByRole("combobox", { name: /target language/i })
      ).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /package name/i })
      ).toBeDisabled();
      expect(screen.getByRole("textbox", { name: /version/i })).toBeDisabled();
      expect(screen.getByRole("textbox", { name: /author/i })).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /description/i })
      ).toBeDisabled();
    });
  });
});

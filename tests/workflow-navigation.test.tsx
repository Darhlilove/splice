/**
 * Tests for WorkflowNavigation component
 * Validates next/back button logic, navigation guards, prerequisite checking, and redirects
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowNavigation } from "@/components/WorkflowNavigation";
import * as WorkflowContext from "@/contexts/workflow-context";
import type { WorkflowStep } from "@/contexts/workflow-context";

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = "/explorer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock workflow context
vi.mock("@/contexts/workflow-context", async () => {
  const actual = await vi.importActual("@/contexts/workflow-context");
  return {
    ...actual,
    useWorkflow: vi.fn(),
  };
});

// Mock breadcrumbs and hints components
vi.mock("@/components/WorkflowBreadcrumbs", () => ({
  WorkflowBreadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock("@/components/WorkflowHints", () => ({
  WorkflowHints: () => <div data-testid="hints">Hints</div>,
}));

describe("WorkflowNavigation Component", () => {
  const mockSetCurrentStep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockWorkflowState = (
    overrides: Partial<WorkflowContext.WorkflowContextValue["state"]> = {}
  ) => ({
    currentSpec: { info: { title: "Test API", version: "1.0.0" } },
    specId: "test-spec",
    specMetadata: null,
    selectedEndpoint: null,
    requestConfig: null,
    mockServer: {
      isRunning: false,
      url: null,
      port: null,
    },
    sdkConfig: null,
    generatedSdk: null,
    completedSteps: ["upload"] as WorkflowStep[],
    currentStep: "explore" as WorkflowStep,
    recentSpecs: [],
    ...overrides,
  });

  describe("Next/Back Button Logic", () => {
    it("displays next button when not on last step", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      expect(
        screen.getByRole("button", { name: /Continue to Mock Server/i })
      ).toBeInTheDocument();
    });

    it("displays back button when not on first step", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({ currentStep: "explore" }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      expect(
        screen.getByRole("button", { name: /Back to Upload Spec/i })
      ).toBeInTheDocument();
    });

    it("does not display back button on first step", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({ currentStep: "upload" }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="upload" />);

      expect(
        screen.queryByRole("button", { name: /Back to/i })
      ).not.toBeInTheDocument();
    });

    it("does not display next button on last step", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({ currentStep: "generate" }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="generate" />);

      expect(
        screen.queryByRole("button", { name: /Continue to/i })
      ).not.toBeInTheDocument();
    });

    it("calls onNext when next button is clicked", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" onNext={onNext} />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      await user.click(nextButton);

      expect(onNext).toHaveBeenCalled();
    });

    it("calls onBack when back button is clicked", async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({ currentStep: "explore" }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" onBack={onBack} />);

      const backButton = screen.getByRole("button", {
        name: /Back to Upload Spec/i,
      });
      await user.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("Navigation Guards", () => {
    it("disables next button when prerequisites not met", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: null, // No spec loaded
          currentStep: "upload",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="upload" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Explore API/i,
      });
      expect(nextButton).toBeDisabled();
    });

    it("enables next button when prerequisites are met", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      expect(nextButton).not.toBeDisabled();
    });

    it("shows tooltip when next button is disabled", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: null,
          currentStep: "upload",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="upload" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Explore API/i,
      });
      expect(nextButton).toHaveAttribute(
        "title",
        "Complete current step to continue"
      );
    });
  });

  describe("Prerequisite Checking", () => {
    it("allows navigation to explore when spec is loaded", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "upload",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="upload" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Explore API/i,
      });
      expect(nextButton).not.toBeDisabled();
    });

    it("prevents navigation to explore when no spec is loaded", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: null,
          currentStep: "upload",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="upload" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Explore API/i,
      });
      expect(nextButton).toBeDisabled();
    });

    it("allows navigation to mock when spec is loaded", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      expect(nextButton).not.toBeDisabled();
    });

    it("allows navigation to generate when spec is loaded", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "mock",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="mock" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Generate SDK/i,
      });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Redirects", () => {
    it("navigates to next step path when next button is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      await user.click(nextButton);

      expect(mockSetCurrentStep).toHaveBeenCalledWith("mock");
      expect(mockPush).toHaveBeenCalledWith("/explorer"); // Mock is part of explorer
    });

    it("navigates to previous step path when back button is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      const backButton = screen.getByRole("button", {
        name: /Back to Upload Spec/i,
      });
      await user.click(backButton);

      expect(mockSetCurrentStep).toHaveBeenCalledWith("upload");
      expect(mockPush).toHaveBeenCalledWith("/upload");
    });

    it("navigates to SDK generator when continuing from mock", async () => {
      const user = userEvent.setup();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "mock",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="mock" />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Generate SDK/i,
      });
      await user.click(nextButton);

      expect(mockSetCurrentStep).toHaveBeenCalledWith("generate");
      expect(mockPush).toHaveBeenCalledWith("/sdk-generator");
    });
  });

  describe("Loading State", () => {
    it("disables buttons when loading", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" isLoading={true} />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      const backButton = screen.getByRole("button", {
        name: /Back to Upload Spec/i,
      });

      expect(nextButton).toBeDisabled();
      expect(backButton).toBeDisabled();
    });

    it("shows loading indicator on next button", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" isLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("sets aria-busy on next button when loading", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" isLoading={true} />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      expect(nextButton).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("Breadcrumbs and Hints", () => {
    it("displays breadcrumbs by default", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    });

    it("displays hints by default", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      expect(screen.getByTestId("hints")).toBeInTheDocument();
    });

    it("hides breadcrumbs when showBreadcrumbs is false", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(
        <WorkflowNavigation currentStep="explore" showBreadcrumbs={false} />
      );

      expect(screen.queryByTestId("breadcrumbs")).not.toBeInTheDocument();
    });

    it("hides hints when showHints is false", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" showHints={false} />);

      expect(screen.queryByTestId("hints")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper navigation role", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState(),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      const nav = screen.getByRole("navigation", {
        name: /Workflow navigation/i,
      });
      expect(nav).toBeInTheDocument();
    });

    it("has proper aria-labels on buttons", () => {
      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" />);

      expect(
        screen.getByRole("button", { name: /Back to Upload Spec/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Continue to Mock Server/i })
      ).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
        state: createMockWorkflowState({
          currentSpec: { info: { title: "Test API", version: "1.0.0" } },
          currentStep: "explore",
        }),
        setCurrentStep: mockSetCurrentStep,
      } as any);

      render(<WorkflowNavigation currentStep="explore" onNext={onNext} />);

      const nextButton = screen.getByRole("button", {
        name: /Continue to Mock Server/i,
      });
      nextButton.focus();
      await user.keyboard("{Enter}");

      expect(onNext).toHaveBeenCalled();
    });
  });
});

/**
 * Tests for WorkflowProgress component
 * Validates step rendering, completion indicators, navigation, and disabled states
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import type { WorkflowStep } from "@/contexts/workflow-context";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("WorkflowProgress Component", () => {
  const defaultProps = {
    currentStep: "explore" as WorkflowStep,
    completedSteps: ["upload"] as WorkflowStep[],
  };

  describe("Step Rendering", () => {
    it("renders all workflow steps in order", () => {
      render(<WorkflowProgress {...defaultProps} />);

      expect(screen.getByLabelText(/Upload Spec/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Explore API/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mock Server/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Generate SDK/i)).toBeInTheDocument();
    });

    it("displays step labels on desktop", () => {
      render(<WorkflowProgress {...defaultProps} />);

      // Labels should be in the document (hidden on mobile via CSS)
      // Use getAllByText since some labels appear in both desktop and mobile views
      expect(screen.getAllByText("Upload Spec").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Explore API").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Mock Server").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Generate SDK").length).toBeGreaterThan(0);
    });

    it("displays current step label on mobile", () => {
      render(<WorkflowProgress {...defaultProps} />);

      // Current step should be displayed in mobile view
      const mobileLabels = screen.getAllByText("Explore API");
      expect(mobileLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Completion Indicators", () => {
    it("shows checkmark for completed steps", () => {
      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload", "explore"]}
        />
      );

      // Check for completed status in aria-label
      const uploadStep = screen.getByLabelText(/Upload Spec.*completed/i);
      expect(uploadStep).toBeInTheDocument();

      const exploreStep = screen.getByLabelText(/Explore API.*completed/i);
      expect(exploreStep).toBeInTheDocument();
    });

    it("highlights current step", () => {
      render(<WorkflowProgress {...defaultProps} />);

      const currentStep = screen.getByLabelText(/Explore API.*current/i);
      expect(currentStep).toBeInTheDocument();
      expect(currentStep).toHaveAttribute("aria-current", "step");
    });

    it("shows muted style for future steps", () => {
      render(<WorkflowProgress {...defaultProps} />);

      // Future steps should not have completed or current status
      const mockStep = screen.getByLabelText(/Mock Server/i);
      expect(mockStep).not.toHaveAttribute("aria-current");
      expect(mockStep.getAttribute("aria-label")).not.toContain("completed");

      const generateStep = screen.getByLabelText(/Generate SDK/i);
      expect(generateStep).not.toHaveAttribute("aria-current");
      expect(generateStep.getAttribute("aria-label")).not.toContain(
        "completed"
      );
    });

    it("displays connector lines between steps", () => {
      const { container } = render(<WorkflowProgress {...defaultProps} />);

      // There should be 3 connector lines (between 4 steps)
      const connectors = container.querySelectorAll('[aria-hidden="true"]');
      // Filter for elements that look like connector lines (have specific classes)
      const lineConnectors = Array.from(connectors).filter((el) =>
        el.className.includes("flex-1")
      );
      expect(lineConnectors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Navigation Clicks", () => {
    it("allows clicking on completed steps", () => {
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload"]}
          onStepClick={onStepClick}
        />
      );

      const uploadStep = screen.getByLabelText(/Upload Spec.*completed/i);
      expect(uploadStep).not.toBeDisabled();
      expect(uploadStep).toHaveAttribute("tabindex", "0");
    });

    it("calls onStepClick when completed step is clicked", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload"]}
          onStepClick={onStepClick}
        />
      );

      const uploadStep = screen.getByLabelText(/Upload Spec.*completed/i);
      await user.click(uploadStep);

      expect(onStepClick).toHaveBeenCalledWith("upload");
    });

    it("supports keyboard navigation on completed steps", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload"]}
          onStepClick={onStepClick}
        />
      );

      const uploadStep = screen.getByLabelText(/Upload Spec.*completed/i);
      uploadStep.focus();
      await user.keyboard("{Enter}");

      expect(onStepClick).toHaveBeenCalledWith("upload");
    });

    it("does not call onStepClick for non-completed steps", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload"]}
          onStepClick={onStepClick}
        />
      );

      const mockStep = screen.getByLabelText(/Mock Server/i);
      await user.click(mockStep);

      expect(onStepClick).not.toHaveBeenCalled();
    });
  });

  describe("Disabled States", () => {
    it("disables future steps", () => {
      render(<WorkflowProgress {...defaultProps} />);

      const mockStep = screen.getByLabelText(/Mock Server/i);
      expect(mockStep).toHaveAttribute("aria-disabled", "true");
      expect(mockStep).toHaveAttribute("tabindex", "-1");

      const generateStep = screen.getByLabelText(/Generate SDK/i);
      expect(generateStep).toHaveAttribute("aria-disabled", "true");
      expect(generateStep).toHaveAttribute("tabindex", "-1");
    });

    it("disables all steps when loading", () => {
      render(<WorkflowProgress {...defaultProps} isLoading={true} />);

      const uploadStep = screen.getByLabelText(/Upload Spec/i);
      expect(uploadStep).toHaveAttribute("aria-disabled", "true");

      const exploreStep = screen.getByLabelText(/Explore API/i);
      expect(exploreStep).toHaveAttribute("aria-disabled", "true");
    });

    it("shows loading indicator on current step when loading", () => {
      render(<WorkflowProgress {...defaultProps} isLoading={true} />);

      const currentStep = screen.getByLabelText(/Explore API/i);
      expect(currentStep).toHaveAttribute("aria-busy", "true");
    });

    it("does not allow navigation when loading", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload"]}
          onStepClick={onStepClick}
          isLoading={true}
        />
      );

      const uploadStep = screen.getByLabelText(/Upload Spec/i);
      await user.click(uploadStep);

      expect(onStepClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper navigation role", () => {
      render(<WorkflowProgress {...defaultProps} />);

      const nav = screen.getByRole("navigation", {
        name: /Workflow progress/i,
      });
      expect(nav).toBeInTheDocument();
    });

    it("announces current step to screen readers", () => {
      render(<WorkflowProgress {...defaultProps} />);

      const announcement = screen.getByRole("status");
      expect(announcement).toHaveTextContent(/Current step: Explore API/i);
    });

    it("announces completed steps count to screen readers", () => {
      render(
        <WorkflowProgress
          currentStep="explore"
          completedSteps={["upload", "explore"]}
        />
      );

      const announcement = screen.getByRole("status");
      expect(announcement).toHaveTextContent(/Completed 2 of 4 steps/i);
    });

    it("has proper aria-labels for each step", () => {
      render(
        <WorkflowProgress currentStep="explore" completedSteps={["upload"]} />
      );

      expect(
        screen.getByLabelText(/Upload Spec.*completed.*click to navigate/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Explore API.*current/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Mock Server/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Generate SDK/i)).toBeInTheDocument();
    });
  });

  describe("Multiple Completed Steps", () => {
    it("handles multiple completed steps correctly", () => {
      render(
        <WorkflowProgress
          currentStep="generate"
          completedSteps={["upload", "explore", "mock"]}
        />
      );

      expect(
        screen.getByLabelText(/Upload Spec.*completed/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Explore API.*completed/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Mock Server.*completed/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Generate SDK.*current/i)
      ).toBeInTheDocument();
    });

    it("allows navigation to any completed step", async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();

      render(
        <WorkflowProgress
          currentStep="generate"
          completedSteps={["upload", "explore", "mock"]}
          onStepClick={onStepClick}
        />
      );

      const exploreStep = screen.getByLabelText(/Explore API.*completed/i);
      await user.click(exploreStep);

      expect(onStepClick).toHaveBeenCalledWith("explore");
    });
  });
});

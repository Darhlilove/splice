"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Upload, Search, Server, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/contexts/workflow-context";

/**
 * Step information for display
 */
interface StepInfo {
  id: WorkflowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

/**
 * Workflow step definitions
 */
const WORKFLOW_STEPS: StepInfo[] = [
  {
    id: "upload",
    label: "Upload Spec",
    icon: Upload,
    path: "/upload",
  },
  {
    id: "explore",
    label: "Explore API",
    icon: Search,
    path: "/explorer",
  },
  {
    id: "mock",
    label: "Mock Server",
    icon: Server,
    path: "/explorer", // Mock is part of explorer
  },
  {
    id: "generate",
    label: "Generate SDK",
    icon: Code,
    path: "/sdk-generator",
  },
];

/**
 * Props for WorkflowProgress component
 */
export interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
  className?: string;
  isLoading?: boolean;
}

/**
 * WorkflowProgress component
 * Displays visual progress through the workflow with step indicators
 *
 * Requirements:
 * - 2.1: Display all workflow steps in order
 * - 2.2: Show checkmark for completed steps
 * - 2.3: Highlight current step
 * - 2.4: Show muted style for future steps
 * - 2.5: Make completed steps clickable and navigate on click
 */
export function WorkflowProgress({
  currentStep,
  completedSteps,
  onStepClick,
  className,
  isLoading = false,
}: WorkflowProgressProps) {
  const router = useRouter();

  /**
   * Determine the status of a step
   */
  const getStepStatus = (
    stepId: WorkflowStep
  ): "completed" | "current" | "future" => {
    if (completedSteps.includes(stepId)) {
      return "completed";
    }
    if (stepId === currentStep) {
      return "current";
    }
    return "future";
  };

  /**
   * Check if a step is clickable
   */
  const isStepClickable = (stepId: WorkflowStep): boolean => {
    return completedSteps.includes(stepId);
  };

  /**
   * Handle step click
   */
  const handleStepClick = (step: StepInfo) => {
    if (!isStepClickable(step.id)) {
      return;
    }

    if (onStepClick) {
      onStepClick(step.id);
    } else {
      // Default navigation behavior
      router.push(step.path);
    }
  };

  return (
    <div
      className={cn("w-full bg-background border-b border-border", className)}
      role="navigation"
      aria-label="Workflow progress"
    >
      {/* Screen reader announcement for current step */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Current step: {WORKFLOW_STEPS.find((s) => s.id === currentStep)?.label}.
        {completedSteps.length > 0 &&
          ` Completed ${completedSteps.length} of ${WORKFLOW_STEPS.length} steps.`}
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = isStepClickable(step.id);
            const Icon = step.icon;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Step indicator */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStepClick(step)}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === " ") &&
                        isClickable &&
                        !isLoading
                      ) {
                        e.preventDefault();
                        handleStepClick(step);
                      }
                    }}
                    disabled={!isClickable || isLoading}
                    className={cn(
                      "flex items-center gap-1 sm:gap-2 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg p-1 sm:p-2",
                      isClickable &&
                        !isLoading &&
                        "cursor-pointer hover:scale-105 active:scale-95",
                      (!isClickable || isLoading) && "cursor-default opacity-70"
                    )}
                    aria-label={`${step.label} - ${status}${
                      status === "completed" ? ", click to navigate" : ""
                    }`}
                    aria-current={status === "current" ? "step" : undefined}
                    aria-busy={isLoading && status === "current"}
                    aria-disabled={!isClickable || isLoading}
                    tabIndex={isClickable && !isLoading ? 0 : -1}
                  >
                    {/* Icon/Status indicator */}
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
                        "border-2",
                        "w-7 h-7 sm:w-8 sm:h-8",
                        // Completed state
                        status === "completed" &&
                          "bg-green-500 border-green-500 text-white transform rotate-0",
                        // Current state
                        status === "current" &&
                          "bg-blue-500 border-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50",
                        // Future state
                        status === "future" &&
                          "bg-muted border-muted-foreground/30 text-muted-foreground",
                        // Loading state
                        isLoading && status === "current" && "animate-pulse"
                      )}
                    >
                      {status === "completed" ? (
                        <Check
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          aria-hidden="true"
                        />
                      ) : isLoading && status === "current" ? (
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Icon
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Step label - hidden on mobile, shown on tablet+ */}
                    <span
                      className={cn(
                        "hidden md:inline text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out",
                        "whitespace-nowrap",
                        status === "completed" && "text-foreground opacity-100",
                        status === "current" &&
                          "text-foreground font-bold opacity-100 scale-105",
                        status === "future" &&
                          "text-muted-foreground opacity-60"
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-all duration-500 ease-in-out",
                      "min-w-2 sm:min-w-4",
                      status === "completed"
                        ? "bg-green-500 scale-y-150"
                        : "bg-muted-foreground/30"
                    )}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile & Tablet: Show current step label below */}
        <div className="md:hidden mt-2 text-center transition-all duration-300 ease-in-out">
          <span className="text-xs sm:text-sm font-medium text-foreground animate-in fade-in slide-in-from-bottom-2">
            {WORKFLOW_STEPS.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
      </div>
    </div>
  );
}

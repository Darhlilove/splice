"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkflow, type WorkflowStep } from "@/contexts/workflow-context";
import { WorkflowBreadcrumbs } from "./WorkflowBreadcrumbs";
import { WorkflowHints } from "./WorkflowHints";

/**
 * Step information for navigation
 */
interface StepInfo {
  id: WorkflowStep;
  label: string;
  path: string;
}

/**
 * Workflow step definitions in order
 */
const WORKFLOW_STEPS: StepInfo[] = [
  {
    id: "upload",
    label: "Upload Spec",
    path: "/upload",
  },
  {
    id: "explore",
    label: "Explore API",
    path: "/explorer",
  },
  {
    id: "mock",
    label: "Mock Server",
    path: "/explorer", // Mock is part of explorer
  },
  {
    id: "generate",
    label: "Generate SDK",
    path: "/sdk-generator",
  },
];

/**
 * Props for WorkflowNavigation component
 */
export interface WorkflowNavigationProps {
  currentStep?: WorkflowStep;
  onNext?: () => void;
  onBack?: () => void;
  className?: string;
  showBreadcrumbs?: boolean;
  showHints?: boolean;
  isLoading?: boolean;
}

/**
 * Get the next step in the workflow
 */
function getNextStep(current: WorkflowStep): WorkflowStep | null {
  const index = WORKFLOW_STEPS.findIndex((s) => s.id === current);
  return index < WORKFLOW_STEPS.length - 1
    ? WORKFLOW_STEPS[index + 1].id
    : null;
}

/**
 * Get the previous step in the workflow
 */
function getPreviousStep(current: WorkflowStep): WorkflowStep | null {
  const index = WORKFLOW_STEPS.findIndex((s) => s.id === current);
  return index > 0 ? WORKFLOW_STEPS[index - 1].id : null;
}

/**
 * Check if navigation to a step is allowed based on prerequisites
 */
function canNavigateToStep(
  step: WorkflowStep,
  state: {
    currentSpec: any;
    completedSteps: WorkflowStep[];
  }
): boolean {
  switch (step) {
    case "upload":
      return true; // Can always go to upload
    case "explore":
      return state.currentSpec !== null;
    case "mock":
      return state.currentSpec !== null;
    case "generate":
      return state.currentSpec !== null;
    default:
      return false;
  }
}

/**
 * WorkflowNavigation component
 * Provides contextual navigation buttons for moving through the workflow
 *
 * Requirements:
 * - 3.1: Display "Next Step" button based on current step
 * - 3.1: Display "Back" button if not on first step
 * - 3.2: Implement navigation logic with prerequisite checking
 */
export function WorkflowNavigation({
  currentStep: propCurrentStep,
  onNext,
  onBack,
  className,
  showBreadcrumbs = true,
  showHints = true,
  isLoading = false,
}: WorkflowNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setCurrentStep } = useWorkflow();

  // Use prop currentStep if provided, otherwise use context
  const currentStep = propCurrentStep ?? state.currentStep;

  // Determine next and previous steps
  const nextStep = getNextStep(currentStep);
  const previousStep = getPreviousStep(currentStep);

  // Check if we can navigate to next step
  const canGoNext = nextStep ? canNavigateToStep(nextStep, state) : false;

  // Get step info for display
  const nextStepInfo = nextStep
    ? WORKFLOW_STEPS.find((s) => s.id === nextStep)
    : null;
  const previousStepInfo = previousStep
    ? WORKFLOW_STEPS.find((s) => s.id === previousStep)
    : null;

  /**
   * Handle next button click
   */
  const handleNext = () => {
    if (!nextStep || !nextStepInfo) return;

    if (onNext) {
      onNext();
    } else {
      // Default navigation behavior
      if (canGoNext) {
        setCurrentStep(nextStep);
        router.push(nextStepInfo.path);
      }
    }
  };

  /**
   * Handle back button click
   */
  const handleBack = () => {
    if (!previousStep || !previousStepInfo) return;

    if (onBack) {
      onBack();
    } else {
      // Default navigation behavior
      setCurrentStep(previousStep);
      router.push(previousStepInfo.path);
    }
  };

  // Don't show navigation on upload page (first step)
  if (currentStep === "upload" && !nextStep) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full bg-background border-t border-border",
        "sticky bottom-0 z-10",
        className
      )}
      role="navigation"
      aria-label="Workflow navigation"
    >
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Breadcrumbs - hidden on mobile */}
        {showBreadcrumbs && (
          <div className="hidden sm:block">
            <WorkflowBreadcrumbs />
          </div>
        )}

        {/* Contextual hints - hidden on mobile */}
        {showHints && (
          <div className="hidden sm:block">
            <WorkflowHints currentStep={currentStep} variant="compact" />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Back button */}
          <div className="flex-1">
            {previousStep && previousStepInfo && (
              <Button
                variant="outline"
                onClick={handleBack}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isLoading) {
                    e.preventDefault();
                    handleBack();
                  }
                }}
                disabled={isLoading}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
                aria-label={`Go back to ${previousStepInfo.label}`}
                tabIndex={0}
              >
                <ArrowLeft
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  aria-hidden="true"
                />
                <span className="hidden md:inline">Back to</span>
                <span className="truncate max-w-[80px] sm:max-w-none">
                  {previousStepInfo.label}
                </span>
              </Button>
            )}
          </div>

          {/* Next button */}
          <div className="flex-1 flex justify-end">
            {nextStep && nextStepInfo && (
              <Button
                onClick={handleNext}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    canGoNext &&
                    !isLoading
                  ) {
                    e.preventDefault();
                    handleNext();
                  }
                }}
                disabled={!canGoNext || isLoading}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Continue to ${nextStepInfo.label}`}
                aria-busy={isLoading}
                aria-disabled={!canGoNext || isLoading}
                tabIndex={0}
                title={
                  !canGoNext
                    ? "Complete current step to continue"
                    : `Continue to ${nextStepInfo.label}`
                }
              >
                {isLoading ? (
                  <>
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline">Continue to</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {nextStepInfo.label}
                    </span>
                    <ArrowRight
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

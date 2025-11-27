"use client";

import * as React from "react";
import { X, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWorkflow, type WorkflowStep } from "@/contexts/workflow-context";

/**
 * Hint information for each workflow step
 */
interface HintInfo {
  step: WorkflowStep;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Contextual hints for each workflow step
 */
const WORKFLOW_HINTS: Record<WorkflowStep, HintInfo> = {
  upload: {
    step: "upload",
    title: "Start by uploading your OpenAPI spec",
    description:
      "Upload a JSON or YAML OpenAPI specification file to begin exploring your API. You can use one of our sample specs to try it out.",
    icon: Info,
  },
  explore: {
    step: "explore",
    title: "Explore your API endpoints",
    description:
      "Browse through your API endpoints, view request/response schemas, and test requests. You can also start a mock server to test without a backend.",
    icon: Lightbulb,
  },
  mock: {
    step: "mock",
    title: "Test with a mock server",
    description:
      "Start the mock server to generate realistic responses based on your OpenAPI spec. Perfect for frontend development without a backend.",
    icon: Lightbulb,
  },
  generate: {
    step: "generate",
    title: "Generate a type-safe SDK",
    description:
      "Create a TypeScript SDK for your API with full type safety and autocomplete. Configure the package details and download the generated code.",
    icon: Lightbulb,
  },
};

/**
 * Props for WorkflowHints component
 */
export interface WorkflowHintsProps {
  currentStep?: WorkflowStep;
  className?: string;
  variant?: "default" | "compact";
  dismissible?: boolean;
}

/**
 * Storage key for dismissed hints
 */
const DISMISSED_HINTS_KEY = "workflow-dismissed-hints";

/**
 * Get dismissed hints from localStorage
 */
function getDismissedHints(): WorkflowStep[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(DISMISSED_HINTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load dismissed hints:", error);
    return [];
  }
}

/**
 * Save dismissed hints to localStorage
 */
function saveDismissedHints(hints: WorkflowStep[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(DISMISSED_HINTS_KEY, JSON.stringify(hints));
  } catch (error) {
    console.error("Failed to save dismissed hints:", error);
  }
}

/**
 * WorkflowHints component
 * Displays helpful contextual hints about the next step in the workflow
 *
 * Requirements:
 * - 3.5: Display helpful hints about next step
 * - 3.5: Show hints based on current workflow state
 * - 3.5: Make hints dismissible
 */
export function WorkflowHints({
  currentStep: propCurrentStep,
  className,
  variant = "default",
  dismissible = true,
}: WorkflowHintsProps) {
  const { state } = useWorkflow();
  const currentStep = propCurrentStep ?? state.currentStep;

  // Track dismissed hints
  const [dismissedHints, setDismissedHints] = React.useState<WorkflowStep[]>(
    []
  );

  // Load dismissed hints on mount
  React.useEffect(() => {
    setDismissedHints(getDismissedHints());
  }, []);

  // Get hint for current step
  const hint = WORKFLOW_HINTS[currentStep];

  // Check if hint is dismissed
  const isDismissed = dismissedHints.includes(currentStep);

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    const updated = [...dismissedHints, currentStep];
    setDismissedHints(updated);
    saveDismissedHints(updated);
  };

  /**
   * Reset all dismissed hints (for development/testing)
   */
  const resetDismissedHints = () => {
    setDismissedHints([]);
    saveDismissedHints([]);
  };

  // Don't show if dismissed
  if (isDismissed && dismissible) {
    return null;
  }

  // Don't show if no hint available
  if (!hint) {
    return null;
  }

  const Icon = hint.icon || Lightbulb;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
            {hint.description}
          </p>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            aria-label="Dismiss hint"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert
      className={cn(
        "relative bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
            {hint.title}
          </h4>
          <AlertDescription className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            {hint.description}
          </AlertDescription>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            aria-label="Dismiss hint"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Hook to reset dismissed hints (useful for development/testing)
 */
export function useResetHints() {
  return React.useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DISMISSED_HINTS_KEY);
    }
  }, []);
}

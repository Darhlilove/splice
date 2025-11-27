"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useWorkflow, type WorkflowStep } from "@/contexts/workflow-context";

/**
 * Step requirements mapping
 */
interface StepRequirement {
  step: WorkflowStep;
  path: string;
  requiresSpec: boolean;
  requiresCompletedSteps?: WorkflowStep[];
  errorMessage: string;
  redirectPath: string;
}

/**
 * Define requirements for each workflow step
 */
const STEP_REQUIREMENTS: StepRequirement[] = [
  {
    step: "upload",
    path: "/upload",
    requiresSpec: false,
    errorMessage: "",
    redirectPath: "/upload",
  },
  {
    step: "explore",
    path: "/explorer",
    requiresSpec: true,
    requiresCompletedSteps: ["upload"],
    errorMessage: "Please upload an OpenAPI spec first",
    redirectPath: "/upload",
  },
  {
    step: "mock",
    path: "/explorer",
    requiresSpec: true,
    requiresCompletedSteps: ["upload"],
    errorMessage: "Please upload an OpenAPI spec first",
    redirectPath: "/upload",
  },
  {
    step: "generate",
    path: "/sdk-generator",
    requiresSpec: true,
    requiresCompletedSteps: ["upload"],
    errorMessage: "Please upload an OpenAPI spec before generating an SDK",
    redirectPath: "/upload",
  },
];

/**
 * Check if prerequisites are met for a given step
 */
function checkPrerequisites(
  step: WorkflowStep,
  state: {
    currentSpec: any;
    completedSteps: WorkflowStep[];
  }
): { allowed: boolean; requirement?: StepRequirement } {
  const requirement = STEP_REQUIREMENTS.find((req) => req.step === step);

  if (!requirement) {
    return { allowed: true };
  }

  // Check if spec is required
  if (requirement.requiresSpec && !state.currentSpec) {
    return { allowed: false, requirement };
  }

  // Check if required steps are completed
  if (requirement.requiresCompletedSteps) {
    const missingSteps = requirement.requiresCompletedSteps.filter(
      (requiredStep) => !state.completedSteps.includes(requiredStep)
    );

    if (missingSteps.length > 0) {
      return { allowed: false, requirement };
    }
  }

  return { allowed: true };
}

/**
 * Hook to guard navigation based on workflow prerequisites
 *
 * Requirements:
 * - 3.4: Check prerequisites before allowing navigation
 * - 3.4: Redirect to appropriate page if prerequisites not met
 * - 3.4: Show helpful error messages
 *
 * @param requiredStep - The workflow step required for the current page
 * @param options - Optional configuration
 */
export function useNavigationGuard(
  requiredStep: WorkflowStep,
  options?: {
    onRedirect?: () => void;
    skipGuard?: boolean;
  }
) {
  const { state } = useWorkflow();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip guard if explicitly disabled
    if (options?.skipGuard) {
      return;
    }

    // Check prerequisites
    const { allowed, requirement } = checkPrerequisites(requiredStep, state);

    if (!allowed && requirement) {
      // Show error message
      toast.error(requirement.errorMessage, {
        description: "Redirecting to the appropriate page...",
        duration: 3000,
      });

      // Call onRedirect callback if provided
      if (options?.onRedirect) {
        options.onRedirect();
      }

      // Redirect to the appropriate starting point
      router.push(requirement.redirectPath);
    }
  }, [requiredStep, state, router, pathname, options]);

  // Return current guard status
  const { allowed, requirement } = checkPrerequisites(requiredStep, state);

  return {
    allowed,
    requirement,
    checkPrerequisites: (step: WorkflowStep) => checkPrerequisites(step, state),
  };
}

/**
 * Check if navigation to a specific step is allowed
 * Utility function for use outside of React components
 */
export function canNavigateToStep(
  step: WorkflowStep,
  state: {
    currentSpec: any;
    completedSteps: WorkflowStep[];
  }
): boolean {
  const { allowed } = checkPrerequisites(step, state);
  return allowed;
}

"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflow, type WorkflowStep } from "@/contexts/workflow-context";

/**
 * Breadcrumb item interface
 */
interface BreadcrumbItem {
  label: string;
  path: string;
  isClickable: boolean;
  isCurrent: boolean;
}

/**
 * Step information for breadcrumbs
 */
interface StepInfo {
  id: WorkflowStep;
  label: string;
  path: string;
}

/**
 * Workflow step definitions
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
    path: "/explorer",
  },
  {
    id: "generate",
    label: "Generate SDK",
    path: "/sdk-generator",
  },
];

/**
 * Props for WorkflowBreadcrumbs component
 */
export interface WorkflowBreadcrumbsProps {
  className?: string;
  showHome?: boolean;
}

/**
 * Get breadcrumb items based on current path and workflow state
 */
function getBreadcrumbItems(
  pathname: string,
  currentStep: WorkflowStep,
  completedSteps: WorkflowStep[],
  showHome: boolean
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Add home if requested
  if (showHome) {
    items.push({
      label: "Home",
      path: "/",
      isClickable: true,
      isCurrent: pathname === "/",
    });
  }

  // Find current step index
  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.id === currentStep
  );

  // Add breadcrumbs for completed steps and current step
  WORKFLOW_STEPS.forEach((step, index) => {
    // Only show steps up to and including current step
    if (index <= currentStepIndex) {
      const isCompleted = completedSteps.includes(step.id);
      const isCurrent = step.id === currentStep;

      items.push({
        label: step.label,
        path: step.path,
        isClickable: isCompleted && !isCurrent,
        isCurrent,
      });
    }
  });

  return items;
}

/**
 * WorkflowBreadcrumbs component
 * Displays breadcrumb navigation showing current location in workflow
 *
 * Requirements:
 * - 3.3: Display current location in workflow
 * - 3.3: Show clickable breadcrumb trail
 * - 3.3: Update breadcrumbs on navigation
 */
export function WorkflowBreadcrumbs({
  className,
  showHome = true,
}: WorkflowBreadcrumbsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setCurrentStep } = useWorkflow();

  // Get breadcrumb items
  const items = getBreadcrumbItems(
    pathname,
    state.currentStep,
    state.completedSteps,
    showHome
  );

  /**
   * Handle breadcrumb click
   */
  const handleClick = (item: BreadcrumbItem) => {
    if (!item.isClickable || item.isCurrent) {
      return;
    }

    // Find the step for this path
    const step = WORKFLOW_STEPS.find((s) => s.path === item.path);
    if (step) {
      setCurrentStep(step.id);
    }

    router.push(item.path);
  };

  // Don't show breadcrumbs if only one item (or just home)
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm",
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.path}-${index}`}
              className="flex items-center gap-1 sm:gap-2"
            >
              {/* Breadcrumb item */}
              {item.isClickable ? (
                <button
                  onClick={() => handleClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleClick(item);
                    }
                  }}
                  className={cn(
                    "hover:text-foreground transition-all duration-200 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded",
                    "px-0.5 sm:px-1 py-0.5",
                    "active:scale-95 hover:scale-105",
                    item.isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:opacity-100"
                  )}
                  aria-current={item.isCurrent ? "page" : undefined}
                  tabIndex={0}
                >
                  {item.label === "Home" ? (
                    <Home className="w-3 h-3 sm:w-4 sm:h-4" aria-label="Home" />
                  ) : (
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {item.label}
                    </span>
                  )}
                </button>
              ) : (
                <span
                  className={cn(
                    "px-0.5 sm:px-1 py-0.5",
                    item.isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                  aria-current={item.isCurrent ? "page" : undefined}
                >
                  {item.label === "Home" ? (
                    <Home className="w-3 h-3 sm:w-4 sm:h-4" aria-label="Home" />
                  ) : (
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {item.label}
                    </span>
                  )}
                </span>
              )}

              {/* Separator */}
              {!isLast && (
                <ChevronRight
                  className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

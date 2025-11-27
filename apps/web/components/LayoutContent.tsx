"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConditionalNavbar } from "@/components/ConditionalNavbar";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { WorkflowNavigation } from "@/components/WorkflowNavigation";
import { useWorkflow } from "@/contexts/workflow-context";
import { PageErrorBoundary } from "@/components/ErrorBoundary";

/**
 * LayoutContent component
 * Wraps the main content with workflow components and error boundary
 * Requirements: 2.1, 4.5, 6.1, 7.1, 7.5
 */
export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useWorkflow();

  // Determine if we should show workflow components
  // Hide on home page and API explorer
  const showWorkflowComponents =
    pathname !== "/" && pathname !== "/api-explorer";

  // Get page name for error boundary
  const pageName = pathname.split("/").pop() || "page";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with SpecSelector and MockServerStatus */}
      <ConditionalNavbar />

      {/* Workflow Progress - Requirement 2.1 */}
      {/* REMOVED: Duplicate navbar showing workflow steps */}
      {/* {showWorkflowComponents && (
        <WorkflowProgress
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
        />
      )} */}

      {/* Main Content with Error Boundary - Requirements 7.1, 7.5 */}
      <main className="flex-1">
        <PageErrorBoundary
          pageName={pageName}
          onNavigateHome={() => router.push("/")}
        >
          {children}
        </PageErrorBoundary>
      </main>

      {/* Workflow Navigation - Requirements 3.1, 3.2, 3.3, 3.5 */}
      {/* REMOVED: Bottom navigation pane */}
      {/* {showWorkflowComponents && <WorkflowNavigation />} */}
    </div>
  );
}

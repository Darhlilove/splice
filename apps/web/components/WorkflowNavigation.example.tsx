/**
 * Example usage of WorkflowNavigation components
 *
 * This file demonstrates how to use the navigation components
 * in different scenarios.
 */

"use client";

import * as React from "react";
import { WorkflowNavigation } from "./WorkflowNavigation";
import { WorkflowBreadcrumbs } from "./WorkflowBreadcrumbs";
import { WorkflowHints } from "./WorkflowHints";
import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Example 1: Basic navigation with all features
 */
export function BasicNavigationExample() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Explorer Page</h1>
        <p>Your page content goes here...</p>
      </main>

      {/* Navigation with breadcrumbs and hints */}
      <WorkflowNavigation />
    </div>
  );
}

/**
 * Example 2: Navigation with custom handlers
 */
export function CustomHandlersExample() {
  const handleNext = () => {
    console.log("Custom next handler");
    // Perform custom logic before navigation
  };

  const handleBack = () => {
    console.log("Custom back handler");
    // Perform custom logic before navigation
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Custom Navigation</h1>
        <p>Navigation with custom handlers...</p>
      </main>

      <WorkflowNavigation onNext={handleNext} onBack={handleBack} />
    </div>
  );
}

/**
 * Example 3: Separate components
 */
export function SeparateComponentsExample() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Breadcrumbs at the top */}
      <div className="container mx-auto px-4 py-4 border-b">
        <WorkflowBreadcrumbs />
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hints in the content area */}
        <WorkflowHints variant="default" className="mb-6" />

        <h1 className="text-3xl font-bold mb-4">Separate Components</h1>
        <p>Using components separately for more control...</p>
      </main>

      {/* Navigation without breadcrumbs/hints (already shown above) */}
      <WorkflowNavigation showBreadcrumbs={false} showHints={false} />
    </div>
  );
}

/**
 * Example 4: With navigation guard
 */
export function GuardedPageExample() {
  // This will redirect if prerequisites aren't met
  const { allowed } = useNavigationGuard("explore", {
    onRedirect: () => {
      console.log("Redirecting due to missing prerequisites");
    },
  });

  // Don't render until guard check is complete
  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Guarded Page</h1>
        <p>This page requires a spec to be uploaded first.</p>
      </main>

      <WorkflowNavigation />
    </div>
  );
}

/**
 * Example 5: Compact hints variant
 */
export function CompactHintsExample() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Compact hints inline with content */}
        <WorkflowHints variant="compact" className="mb-6" />

        <h1 className="text-3xl font-bold mb-4">Compact Hints</h1>
        <p>Using compact variant for inline hints...</p>
      </main>

      <WorkflowNavigation showHints={false} />
    </div>
  );
}

/**
 * Example 6: Demo of all components
 */
export function AllComponentsDemo() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">
        Workflow Navigation Components Demo
      </h1>

      {/* Breadcrumbs */}
      <Card>
        <CardHeader>
          <CardTitle>Breadcrumbs</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowBreadcrumbs />
        </CardContent>
      </Card>

      {/* Hints - Default variant */}
      <Card>
        <CardHeader>
          <CardTitle>Hints - Default Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowHints variant="default" />
        </CardContent>
      </Card>

      {/* Hints - Compact variant */}
      <Card>
        <CardHeader>
          <CardTitle>Hints - Compact Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowHints variant="compact" />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowNavigation
            showBreadcrumbs={false}
            showHints={false}
            className="relative border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}

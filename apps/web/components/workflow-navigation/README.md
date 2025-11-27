# Workflow Navigation Components

This directory contains all navigation-related components for the workflow integration feature.

## Components

### WorkflowNavigation

Main navigation component that provides back/next buttons for moving through the workflow.

**Features:**

- Displays "Next Step" button based on current step
- Displays "Back" button if not on first step
- Integrates breadcrumbs and contextual hints
- Checks prerequisites before allowing navigation
- Redirects to appropriate page if prerequisites not met

**Usage:**

```tsx
import { WorkflowNavigation } from "@/components/WorkflowNavigation";

export default function MyPage() {
  return (
    <div>
      <main>{/* Page content */}</main>
      <WorkflowNavigation />
    </div>
  );
}
```

**Props:**

- `currentStep?: WorkflowStep` - Override the current step (defaults to context)
- `onNext?: () => void` - Custom handler for next button
- `onBack?: () => void` - Custom handler for back button
- `showBreadcrumbs?: boolean` - Show/hide breadcrumbs (default: true)
- `showHints?: boolean` - Show/hide contextual hints (default: true)
- `className?: string` - Additional CSS classes

### WorkflowBreadcrumbs

Breadcrumb navigation showing the current location in the workflow.

**Features:**

- Displays current location in workflow
- Shows clickable breadcrumb trail for completed steps
- Updates automatically on navigation
- Responsive design

**Usage:**

```tsx
import { WorkflowBreadcrumbs } from "@/components/WorkflowBreadcrumbs";

export default function MyPage() {
  return (
    <div>
      <WorkflowBreadcrumbs />
      <main>{/* Page content */}</main>
    </div>
  );
}
```

**Props:**

- `showHome?: boolean` - Show home breadcrumb (default: true)
- `className?: string` - Additional CSS classes

### WorkflowHints

Contextual hints that provide helpful information about the current workflow step.

**Features:**

- Displays helpful hints about next step
- Shows hints based on current workflow state
- Dismissible hints (persisted in localStorage)
- Two variants: default and compact

**Usage:**

```tsx
import { WorkflowHints } from "@/components/WorkflowHints";

export default function MyPage() {
  return (
    <div>
      <WorkflowHints variant="default" />
      <main>{/* Page content */}</main>
    </div>
  );
}
```

**Props:**

- `currentStep?: WorkflowStep` - Override the current step (defaults to context)
- `variant?: "default" | "compact"` - Display variant (default: "default")
- `dismissible?: boolean` - Allow dismissing hints (default: true)
- `className?: string` - Additional CSS classes

## Hooks

### useNavigationGuard

Hook to guard navigation based on workflow prerequisites.

**Features:**

- Checks prerequisites before allowing navigation
- Redirects to appropriate page if prerequisites not met
- Shows helpful error messages via toast notifications
- Returns current guard status

**Usage:**

```tsx
import { useNavigationGuard } from "@/hooks/use-navigation-guard";

export default function ExplorerPage() {
  // Guard this page - requires spec to be uploaded
  const { allowed } = useNavigationGuard("explore");

  if (!allowed) {
    return null; // Will redirect automatically
  }

  return <div>{/* Page content */}</div>;
}
```

**Parameters:**

- `requiredStep: WorkflowStep` - The workflow step required for the current page
- `options?: { onRedirect?: () => void; skipGuard?: boolean }` - Optional configuration

**Returns:**

- `allowed: boolean` - Whether navigation is allowed
- `requirement?: StepRequirement` - The requirement that failed (if any)
- `checkPrerequisites: (step: WorkflowStep) => { allowed: boolean }` - Function to check other steps

### canNavigateToStep

Utility function to check if navigation to a specific step is allowed.

**Usage:**

```tsx
import { canNavigateToStep } from "@/hooks/use-navigation-guard";
import { useWorkflow } from "@/contexts/workflow-context";

export default function MyComponent() {
  const { state } = useWorkflow();

  const canGoToGenerate = canNavigateToStep("generate", state);

  return <button disabled={!canGoToGenerate}>Generate SDK</button>;
}
```

## Integration Example

Here's a complete example of integrating all navigation components into a page:

```tsx
"use client";

import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { WorkflowNavigation } from "@/components/WorkflowNavigation";
import { WorkflowHints } from "@/components/WorkflowHints";

export default function ExplorerPage() {
  // Guard this page - requires spec to be uploaded
  useNavigationGuard("explore");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Optional: Show hints at the top of the page */}
      <div className="container mx-auto px-4 py-4">
        <WorkflowHints variant="default" />
      </div>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Your page content here */}
      </main>

      {/* Navigation at the bottom */}
      <WorkflowNavigation />
    </div>
  );
}
```

## Styling

All components use Tailwind CSS and are fully responsive. They integrate with the app's theme system and support dark mode automatically.

## Accessibility

All components follow accessibility best practices:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Semantic HTML

## State Management

The navigation components integrate with the WorkflowContext to:

- Track current workflow step
- Track completed steps
- Persist state in session storage
- Update state on navigation

## Testing

See the test files in `/tests` for examples of testing these components:

- `workflow-navigation.test.tsx` - Tests for WorkflowNavigation component
- `workflow-breadcrumbs.test.tsx` - Tests for WorkflowBreadcrumbs component
- `workflow-hints.test.tsx` - Tests for WorkflowHints component
- `use-navigation-guard.test.ts` - Tests for useNavigationGuard hook

# Workflow Context

The Workflow Context provides centralized state management for the entire application workflow, enabling seamless navigation between features with persistent state.

## Features

### State Management

- **Current Spec**: Tracks the uploaded OpenAPI specification
- **Explorer State**: Maintains selected endpoint and request configuration
- **Mock Server State**: Tracks mock server status, URL, and port
- **SDK Generator State**: Stores SDK configuration and generated SDK info
- **Workflow Progress**: Tracks completed steps and current step
- **Recent Specs**: Maintains list of up to 5 recently used specs

### Persistence

- Automatically saves state to `sessionStorage` with 500ms debouncing
- Loads state from `sessionStorage` on mount
- Clears storage when uploading new spec or resetting workflow
- Preserves recent specs across sessions

### Actions

#### Spec Management

- `setCurrentSpec(spec, metadata)` - Sets current spec and marks upload as completed
- `clearCurrentSpec()` - Clears spec and resets workflow state

#### Explorer

- `setSelectedEndpoint(endpoint)` - Sets the currently selected endpoint
- `setRequestConfig(config)` - Sets the request configuration

#### Mock Server

- `setMockServerStatus(status)` - Updates mock server status and marks step as completed

#### SDK Generator

- `setSdkConfig(config)` - Sets SDK configuration
- `setGeneratedSdk(sdk)` - Sets generated SDK info and marks step as completed

#### Workflow Progress

- `completeStep(step)` - Marks a workflow step as completed
- `setCurrentStep(step)` - Sets the current workflow step
- `resetWorkflow()` - Resets entire workflow to initial state

#### Recent Specs

- `addRecentSpec(metadata)` - Adds or updates a spec in recent list
- `loadRecentSpec(specId)` - Loads a spec from recent list (to be implemented in task 4)

## Usage

```tsx
import { WorkflowProvider, useWorkflow } from "@/contexts/workflow-context";

// Wrap your app with the provider
function App() {
  return (
    <WorkflowProvider>
      <YourComponents />
    </WorkflowProvider>
  );
}

// Use the hook in components
function MyComponent() {
  const { state, setCurrentSpec, completeStep } = useWorkflow();

  // Access state
  console.log(state.currentSpec);
  console.log(state.completedSteps);

  // Update state
  setCurrentSpec(spec, metadata);
  completeStep("explore");
}
```

## Testing

Comprehensive tests are available in `tests/workflow-context.test.tsx` covering:

- State initialization
- All action functions
- State persistence
- Edge cases (duplicates, limits, etc.)

Run tests with:

```bash
pnpm test workflow-context.test.tsx
```

## Requirements Satisfied

This implementation satisfies the following requirements from the workflow-integration spec:

- **1.1**: Persistent state across page navigation
- **1.2**: State preservation during navigation
- **1.3**: Session storage persistence
- **1.4**: Clear state on browser close
- **1.5**: Reset state on new spec upload
- **2.1-2.4**: Workflow progress tracking
- **4.1-4.4**: Mock server status management
- **6.3, 6.5**: Recent specs management

# SdkGenerationProgress Component

## Overview

The `SdkGenerationProgress` component displays real-time progress for SDK generation with visual stage indicators, a progress bar, and estimated time remaining.

## Features

✅ **Automatic Polling**: Polls `/api/sdk/status/{generationId}` every 2 seconds for status updates
✅ **Stage Visualization**: Shows 4 stages (validating, generating, packaging, complete) with icons
✅ **Progress Bar**: Displays percentage completion (0-100%)
✅ **ETA Calculation**: Shows estimated time remaining after 10 seconds
✅ **Completion Handling**: Calls `onComplete` callback when generation finishes
✅ **Error Handling**: Calls `onError` callback if generation fails
✅ **Auto Cleanup**: Stops polling on completion, error, or unmount

## Usage

```tsx
import { SdkGenerationProgress } from "@/components/SdkGenerationProgress";

function MyComponent() {
  const [generationId, setGenerationId] = useState<string | null>(null);

  const handleComplete = (result) => {
    console.log("Download URL:", result.downloadUrl);
    // Handle successful generation
  };

  const handleError = (error) => {
    console.error("Generation failed:", error);
    // Handle error
  };

  return (
    <>
      {generationId && (
        <SdkGenerationProgress
          generationId={generationId}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}
    </>
  );
}
```

## Props

| Prop           | Type                                 | Description                                        |
| -------------- | ------------------------------------ | -------------------------------------------------- |
| `generationId` | `string`                             | Unique ID for the generation (e.g., "gen-123-abc") |
| `onComplete`   | `(result: GenerationResult) => void` | Callback when generation completes successfully    |
| `onError`      | `(error: string) => void`            | Callback when generation fails                     |

## API Response Format

The component expects the `/api/sdk/status/{generationId}` endpoint to return:

```typescript
{
  success: boolean;
  status: "pending" | "generating" | "complete" | "failed";
  progress?: {
    stage: "validating" | "generating" | "packaging" | "complete";
    progress: number; // 0-100
    message: string;
  };
  downloadUrl?: string; // Present when status is "complete"
  error?: string; // Present when status is "failed" or success is false
}
```

## Stage Mapping

| Stage      | Progress % | Icon      | Description                      |
| ---------- | ---------- | --------- | -------------------------------- |
| validating | 10%        | Spinner   | Validating OpenAPI specification |
| generating | 60%        | Spinner   | Generating SDK code              |
| packaging  | 90%        | Spinner   | Packaging files into ZIP         |
| complete   | 100%       | Checkmark | SDK ready for download           |

## Testing

The component includes comprehensive tests covering:

- Initial render and UI elements
- Stage visualization
- Progress updates
- Completion handling
- Error handling
- API polling behavior

Run tests with:

```bash
pnpm vitest --run tests/sdk-generation-progress.test.tsx
```

## Implementation Details

- **Polling Interval**: 2 seconds (configurable in code)
- **ETA Update Interval**: 5 seconds
- **ETA Display Threshold**: Shows after 10 seconds of generation
- **Cleanup**: Automatically stops polling on unmount or completion
- **Error Resilience**: Continues polling on network errors (logs to console)

## Integration

The component is integrated into the SDK Generator page at `/app/sdk-generator/page.tsx` and displays during the "generating" state.

"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SdkGenerationProgress Component
 *
 * Displays real-time progress for SDK generation with stage visualization,
 * progress bar, and estimated time remaining.
 *
 * Features:
 * - Polls /api/sdk/status every 2 seconds for updates
 * - Shows current generation stage with icons
 * - Displays progress percentage (0-100%)
 * - Calculates and shows ETA after 10 seconds
 * - Calls onComplete when generation finishes
 * - Calls onError if generation fails
 *
 * @example
 * ```tsx
 * <SdkGenerationProgress
 *   generationId="gen-123-abc"
 *   onComplete={(result) => {
 *     console.log('Download URL:', result.downloadUrl);
 *   }}
 *   onError={(error) => {
 *     console.error('Generation failed:', error);
 *   }}
 * />
 * ```
 */

interface SdkGenerationProgressProps {
  generationId: string;
  onComplete: (result: GenerationResult) => void;
  onError: (error: string) => void;
}

interface GenerationResult {
  downloadUrl: string;
  packageName?: string;
  packageVersion?: string;
  fileSize?: number;
  codeSamples?: CodeSample[];
}

interface CodeSample {
  title: string;
  code: string;
  language: string;
}

interface ProgressState {
  stage: "validating" | "generating" | "packaging" | "complete";
  progress: number;
  message: string;
}

interface StatusResponse {
  success: boolean;
  status: "pending" | "generating" | "complete" | "failed";
  progress?: ProgressState;
  downloadUrl?: string;
  packageName?: string;
  packageVersion?: string;
  fileSize?: number;
  codeSamples?: CodeSample[];
  error?: string;
}

const STAGE_LABELS = {
  validating: "Validating specification...",
  generating: "Generating SDK code...",
  packaging: "Packaging files...",
  complete: "SDK ready for download!",
};

const STAGE_PROGRESS = {
  validating: 10,
  generating: 60,
  packaging: 90,
  complete: 100,
};

export function SdkGenerationProgress({
  generationId,
  onComplete,
  onError,
}: SdkGenerationProgressProps) {
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: "validating",
    progress: 0,
    message: STAGE_LABELS.validating,
  });
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<
    number | null
  >(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const etaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for status updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/sdk/status/${generationId}`);
        const data: StatusResponse = await response.json();

        if (!data.success) {
          // Stop polling and call error handler
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          if (etaIntervalRef.current) {
            clearInterval(etaIntervalRef.current);
          }
          onError(data.error || "Failed to check generation status");
          return;
        }

        // Update progress state
        if (data.progress) {
          setProgressState(data.progress);
        }

        // Handle completion
        // Requirements: 3.1, 4.1
        if (data.status === "complete" && data.downloadUrl) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          if (etaIntervalRef.current) {
            clearInterval(etaIntervalRef.current);
          }

          // Fetch additional generation details if available
          const result: GenerationResult = {
            downloadUrl: data.downloadUrl,
            packageName: data.packageName,
            packageVersion: data.packageVersion,
            fileSize: data.fileSize,
            codeSamples: data.codeSamples,
          };

          onComplete(result);
        }

        // Handle failure
        if (data.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          if (etaIntervalRef.current) {
            clearInterval(etaIntervalRef.current);
          }
          onError(data.error || "SDK generation failed");
        }
      } catch (error) {
        console.error("Error polling status:", error);
        // Don't stop polling on network errors, just log them
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval (every 2 seconds)
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (etaIntervalRef.current) {
        clearInterval(etaIntervalRef.current);
      }
    };
  }, [generationId, onComplete, onError]);

  // Track elapsed time and calculate ETA
  useEffect(() => {
    const updateElapsedTime = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);

      // Calculate ETA if generation exceeds 10 seconds
      if (elapsed > 10 && progressState.progress > 0) {
        const totalEstimatedTime = (elapsed / progressState.progress) * 100;
        const remaining = Math.max(0, Math.ceil(totalEstimatedTime - elapsed));
        setEstimatedTimeRemaining(remaining);
      }
    };

    // Update elapsed time immediately
    updateElapsedTime();

    // Update ETA every 5 seconds
    etaIntervalRef.current = setInterval(updateElapsedTime, 5000);

    return () => {
      if (etaIntervalRef.current) {
        clearInterval(etaIntervalRef.current);
      }
    };
  }, [progressState.progress]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageIcon = (stage: string, currentStage: string) => {
    const stages = ["validating", "generating", "packaging", "complete"];
    const currentIndex = stages.indexOf(currentStage);
    const stageIndex = stages.indexOf(stage);

    if (stageIndex < currentIndex) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (stageIndex === currentIndex) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Generating SDK</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Progress Bar */}
        <div
          className="space-y-2"
          role="region"
          aria-label="SDK generation progress"
        >
          <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-sm">
            <span
              className="text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {progressState.message}
            </span>
            <span className="font-medium" aria-live="polite" aria-atomic="true">
              {progressState.progress}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
            role="progressbar"
            aria-valuenow={progressState.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="SDK generation progress"
          >
            <div
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progressState.progress}%` }}
            />
          </div>
        </div>

        {/* Stage Visualization */}
        <div
          className="space-y-2 sm:space-y-3"
          role="list"
          aria-label="Generation stages"
        >
          {(["validating", "generating", "packaging", "complete"] as const).map(
            (stage) => (
              <div
                key={stage}
                className="flex items-center gap-2 sm:gap-3"
                role="listitem"
                aria-current={
                  progressState.stage === stage ? "step" : undefined
                }
              >
                {getStageIcon(stage, progressState.stage)}
                <span
                  className={cn(
                    "text-xs sm:text-sm",
                    progressState.stage === stage
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            )
          )}
        </div>

        {/* Estimated Time Remaining */}
        {estimatedTimeRemaining !== null && elapsedTime > 10 && (
          <div
            className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Estimated time remaining: {formatTime(estimatedTimeRemaining)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

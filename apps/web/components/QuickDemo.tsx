"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Play, Loader2 } from "lucide-react";
import { useWorkflow } from "@/contexts/workflow-context";
import type { OpenAPISpec } from "@/packages/openapi/src/types";
import type { SpecMetadata, SDKConfig } from "@/contexts/workflow-context";

/**
 * Demo step definition
 */
export interface DemoStep {
  title: string;
  description: string;
  action: () => Promise<void>;
  duration: number;
}

/**
 * Props for QuickDemo component
 */
export interface QuickDemoProps {
  onExit?: () => void;
  onComplete?: () => void;
}

/**
 * QuickDemo component
 * Provides an automated walkthrough of the complete workflow
 *
 * Requirements:
 * - 5.1: Provide "Quick Demo" button and allow exit at any time
 * - 5.2: Automatically load sample spec and navigate through steps
 * - 5.3: Navigate through each workflow step with explanations
 * - 5.4: Complete demo in under 2 minutes
 * - 5.5: Allow user to exit demo and return to normal mode
 */
export function QuickDemo({ onExit, onComplete }: QuickDemoProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const router = useRouter();
  const workflow = useWorkflow();

  /**
   * Load sample Petstore spec
   */
  const loadPetstoreSpec = React.useCallback(async () => {
    try {
      // Fetch the Petstore spec from public folder
      const response = await fetch("/test-specs/petstore-openapi-spec.json");
      if (!response.ok) {
        throw new Error("Failed to load Petstore spec");
      }

      const spec: OpenAPISpec = await response.json();

      // Create metadata for the spec
      const metadata: SpecMetadata = {
        id: `demo-${Date.now()}`,
        name: spec.info?.title || "Petstore API",
        version: spec.info?.version || "1.0.0",
        uploadedAt: new Date(),
        lastAccessedAt: new Date(),
      };

      // Set the spec in workflow context
      workflow.setCurrentSpec(spec, metadata);

      console.log("[QuickDemo] Loaded Petstore spec");
    } catch (err) {
      console.error("[QuickDemo] Failed to load spec:", err);
      throw new Error("Failed to load sample specification");
    }
  }, [workflow]);

  /**
   * Navigate to explorer and select first endpoint
   */
  const exploreEndpoints = React.useCallback(async () => {
    try {
      // Navigate to explorer
      router.push("/explorer");

      // Wait for navigation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Select first endpoint if spec is available
      if (workflow.state.currentSpec?.paths) {
        const paths = workflow.state.currentSpec.paths;
        const firstPath = Object.keys(paths)[0];
        const firstPathItem = paths[firstPath];

        if (firstPath && firstPathItem) {
          const method =
            (firstPathItem.get && "get") ||
            (firstPathItem.post && "post") ||
            (firstPathItem.put && "put") ||
            (firstPathItem.delete && "delete") ||
            "get";

          const operation = firstPathItem[method as keyof typeof firstPathItem];

          workflow.setSelectedEndpoint({
            path: firstPath,
            method: method.toUpperCase(),
            operationId: (operation as any)?.operationId,
            summary: (operation as any)?.summary,
            description: (operation as any)?.description,
          });

          workflow.completeStep("explore");
        }
      }

      console.log("[QuickDemo] Navigated to explorer");
    } catch (err) {
      console.error("[QuickDemo] Failed to explore endpoints:", err);
      throw new Error("Failed to explore API endpoints");
    }
  }, [router, workflow]);

  /**
   * Start mock server
   */
  const startMockServer = React.useCallback(async () => {
    try {
      if (!workflow.state.currentSpec || !workflow.state.specId) {
        throw new Error("No spec loaded");
      }

      // Call mock server start API
      const response = await fetch("/api/mock/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specId: workflow.state.specId,
          spec: workflow.state.currentSpec,
          port: 4010,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start mock server");
      }

      const data = await response.json();

      // Update workflow state
      workflow.setMockServerStatus({
        isRunning: true,
        url: data.serverInfo.url,
        port: data.serverInfo.port,
      });

      console.log("[QuickDemo] Started mock server");
    } catch (err) {
      console.error("[QuickDemo] Failed to start mock server:", err);
      // Don't throw - mock server might not be available in all environments
      console.warn("[QuickDemo] Continuing demo without mock server");
    }
  }, [workflow]);

  /**
   * Execute a sample request
   */
  const executeSampleRequest = React.useCallback(async () => {
    try {
      // This is a simulated request execution for demo purposes
      // In a real scenario, we would call the actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("[QuickDemo] Executed sample request");
    } catch (err) {
      console.error("[QuickDemo] Failed to execute request:", err);
      throw new Error("Failed to execute sample request");
    }
  }, []);

  /**
   * Generate sample SDK
   */
  const generateSampleSDK = React.useCallback(async () => {
    try {
      // Navigate to SDK generator
      router.push("/sdk-generator");

      // Wait for navigation
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!workflow.state.currentSpec) {
        throw new Error("No spec loaded");
      }

      // Set SDK config
      const sdkConfig: SDKConfig = {
        language: "typescript",
        packageName: "petstore-sdk",
        packageVersion: "1.0.0",
        author: "Demo User",
        description: "Generated Petstore SDK",
      };

      workflow.setSdkConfig(sdkConfig);

      // Simulate SDK generation (don't actually generate for demo)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      workflow.completeStep("generate");

      console.log("[QuickDemo] Generated sample SDK");
    } catch (err) {
      console.error("[QuickDemo] Failed to generate SDK:", err);
      throw new Error("Failed to generate SDK");
    }
  }, [router, workflow]);

  /**
   * Define demo steps
   */
  const demoSteps: DemoStep[] = React.useMemo(
    () => [
      {
        title: "Loading Petstore API",
        description: "Uploading sample OpenAPI specification...",
        action: loadPetstoreSpec,
        duration: 3000,
      },
      {
        title: "Exploring Endpoints",
        description: "Viewing available API endpoints...",
        action: exploreEndpoints,
        duration: 4000,
      },
      {
        title: "Starting Mock Server",
        description: "Launching mock API server...",
        action: startMockServer,
        duration: 5000,
      },
      {
        title: "Executing Request",
        description: "Making a test API call...",
        action: executeSampleRequest,
        duration: 3000,
      },
      {
        title: "Generating SDK",
        description: "Creating TypeScript client library...",
        action: generateSampleSDK,
        duration: 5000,
      },
    ],
    [
      loadPetstoreSpec,
      exploreEndpoints,
      startMockServer,
      executeSampleRequest,
      generateSampleSDK,
    ]
  );

  /**
   * Calculate total demo duration
   */
  const totalDuration = React.useMemo(
    () => demoSteps.reduce((sum, step) => sum + step.duration, 0),
    [demoSteps]
  );

  /**
   * Execute demo steps sequentially
   */
  const runDemo = React.useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setCurrentStepIndex(0);
    setProgress(0);

    try {
      for (let i = 0; i < demoSteps.length; i++) {
        const step = demoSteps[i];
        setCurrentStepIndex(i);

        // Execute step action
        await step.action();

        // Simulate progress during step duration
        const startTime = Date.now();
        const stepProgress = (i / demoSteps.length) * 100;

        while (Date.now() - startTime < step.duration) {
          const elapsed = Date.now() - startTime;
          const stepProgressPercent = (elapsed / step.duration) * 100;
          const totalProgress =
            stepProgress + stepProgressPercent / demoSteps.length;
          setProgress(Math.min(totalProgress, 100));

          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Demo complete
      setProgress(100);
      setCurrentStepIndex(demoSteps.length);

      // Wait a moment before calling onComplete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("[QuickDemo] Demo failed:", err);
      setError(err instanceof Error ? err.message : "Demo failed");
    } finally {
      setIsRunning(false);
    }
  }, [demoSteps, onComplete]);

  /**
   * Handle exit
   */
  const handleExit = React.useCallback(() => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setProgress(0);
    setError(null);

    if (onExit) {
      onExit();
    }
  }, [onExit]);

  /**
   * Get current step
   */
  const currentStep =
    currentStepIndex < demoSteps.length
      ? demoSteps[currentStepIndex]
      : demoSteps[demoSteps.length - 1];

  /**
   * Format duration for display
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Quick Demo
            </CardTitle>
            <CardDescription>
              Automated walkthrough of the complete workflow (
              {formatDuration(totalDuration)})
            </CardDescription>
          </div>
          {isRunning && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              aria-label="Exit demo"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {Math.min(currentStepIndex + 1, demoSteps.length)} of{" "}
              {demoSteps.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current step info */}
        {isRunning && currentStep && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <h3 className="font-semibold">{currentStep.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStep.description}
            </p>
          </div>
        )}

        {/* Demo steps list */}
        {!isRunning && !error && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Demo Steps:
            </h4>
            <div className="space-y-2">
              {demoSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(step.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              Demo Error: {error}
            </p>
          </div>
        )}

        {/* Demo complete message */}
        {!isRunning && currentStepIndex === demoSteps.length && !error && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Demo completed successfully!
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!isRunning && (
            <Button onClick={runDemo} className="flex-1" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Demo
            </Button>
          )}
          {isRunning && (
            <Button
              onClick={handleExit}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Exit Demo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

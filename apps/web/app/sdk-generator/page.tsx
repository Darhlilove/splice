"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { ErrorBoundary } from "react-error-boundary";
import { SpecInfoDisplay } from "@/components/SpecInfoDisplay";
import { SdkConfigForm, type SDKConfig } from "@/components/SdkConfigForm";
import { SdkGenerationProgress } from "@/components/SdkGenerationProgress";
import { SdkCodePreview } from "@/components/SdkCodePreview";
import { SdkDownloadSection } from "@/components/SdkDownloadSection";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { SpecValidationErrorDisplay } from "@/components/SpecValidationErrorDisplay";
import { useWorkflow } from "@/contexts/workflow-context";

/**
 * Generation workflow states
 */
type GenerationState =
  | "idle"
  | "configuring"
  | "validating"
  | "generating"
  | "complete"
  | "error";

interface GenerationResult {
  downloadUrl: string;
  packageName?: string;
  packageVersion?: string;
  fileSize?: number;
  codeSamples?: Array<{
    title: string;
    code: string;
    language: string;
  }>;
}

/**
 * Error fallback component for page-level errors
 */
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">⚠️</div>
          <div className="flex flex-col items-center gap-2">
            <CardTitle className="text-3xl text-destructive">
              Something Went Wrong
            </CardTitle>
            <Badge variant="destructive">Error</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">
            An unexpected error occurred while loading the SDK generator.
          </p>
          <p className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
            {error.message}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={resetErrorBoundary} variant="default">
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              <Icon icon="lucide:home" className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main SDK Generator page content
 */
function SDKGeneratorContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const router = useRouter();
  const { spec, metadata, isLoading, hasSpec } = useStoredSpec(
    specId || undefined
  );
  const { setCurrentStep, setCurrentSpec, setSdkConfig, setGeneratedSdk } =
    useWorkflow();

  // Generation workflow state
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[] | null>(null);
  const [config, setConfig] = useState<SDKConfig>({
    language: "typescript",
    packageName: "",
    packageVersion: "1.0.0",
  });

  // Set current step to generate when page loads (Requirement 1.2)
  useEffect(() => {
    setCurrentStep("generate");
  }, [setCurrentStep]);

  // Update workflow context when spec is loaded (Requirement 1.2)
  useEffect(() => {
    if (spec && specId) {
      setCurrentSpec(spec, {
        id: specId,
        name: spec.info.title,
        version: spec.info.version,
        uploadedAt: metadata?.uploadedAt
          ? new Date(metadata.uploadedAt)
          : new Date(),
      });
    }
  }, [spec, specId, metadata, setCurrentSpec]);

  // Handle generation submission
  // Requirements: 1.5
  const handleGenerate = async (sdkConfig: SDKConfig) => {
    try {
      setGenerationState("validating");
      setError(null);
      setConfig(sdkConfig);

      // Update workflow context with SDK config (Requirement 1.2)
      setSdkConfig(sdkConfig);

      // Call /api/sdk/generate endpoint
      // Use originalSpec if available (better for validation), otherwise use parsed spec
      const specToSend = (spec as any).originalSpec || spec;

      const response = await fetch("/api/sdk/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spec: specToSend,
          config: sdkConfig,
          specId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Check if this is a spec validation error
        if (data.validationErrors && Array.isArray(data.validationErrors)) {
          setValidationErrors(data.validationErrors);
          setGenerationState("error");
          return;
        }
        throw new Error(data.error || "Failed to start SDK generation");
      }

      // Store generation ID and transition to generating state
      setGenerationId(data.generationId);
      setGenerationState("generating");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start generation";
      console.error("SDK Generation Error:", errorMessage, err);
      setError(errorMessage);
      setGenerationState("error");
    }
  };

  // Handle generation completion
  // Requirements: 2.1, 3.1, 4.1
  const handleComplete = (result: GenerationResult) => {
    setGenerationResult(result);
    setGenerationState("complete");

    // Update workflow context with generated SDK (Requirement 1.2)
    setGeneratedSdk({
      downloadUrl: result.downloadUrl,
      packageName: result.packageName || config.packageName,
    });
  };

  // Handle generation error
  // Requirements: 2.1, 5.1, 5.2, 5.5
  const handleError = (errorMessage: string) => {
    console.error("SDK Generation Error:", errorMessage);
    setError(errorMessage);
    setGenerationState("error");
  };

  // Handle retry
  // Requirements: 2.1, 5.2
  const handleRetry = () => {
    setError(null);
    setValidationErrors(null);
    setGenerationState("idle");
    setGenerationId(null);
  };

  // Handle generate new
  // Requirements: 4.1
  const handleGenerateNew = () => {
    setGenerationState("idle");
    setGenerationId(null);
    setGenerationResult(null);
    setError(null);
    setValidationErrors(null);
    setConfig({
      language: "typescript",
      packageName: "",
      packageVersion: "1.0.0",
    });

    // Clear SDK state in workflow context
    setSdkConfig(null);
    setGeneratedSdk(null);
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 sm:h-5 w-full max-w-md" />
        </div>

        {/* Spec Info Skeleton */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-lg hidden sm:block" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Config Form Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No spec loaded state
  if (!hasSpec || !spec) {
    return (
      <div className="flex items-center justify-center p-8 py-24">
        <Card className="max-w-2xl w-full">
          <CardHeader className="flex flex-col items-center gap-3 pb-6">
            <div className="text-7xl">⚡</div>
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-4xl">SDK Generator</CardTitle>
              <Badge variant="secondary">No Spec Loaded</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">
              No OpenAPI specification found. Please upload a spec first.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/upload")}>
                <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                Upload Specification
              </Button>
              <Button
                onClick={() => router.push("/explorer")}
                variant="outline"
              >
                <Icon icon="lucide:search" className="w-4 h-4 mr-2" />
                Browse Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          SDK Generator
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Generate type-safe client libraries from your OpenAPI specification
        </p>
      </div>

      {/* Spec Info Display */}
      <div className="mb-4 sm:mb-6">
        <SpecInfoDisplay
          spec={spec}
          onBackToExplorer={() =>
            router.push(specId ? `/explorer?specId=${specId}` : "/explorer")
          }
        />
      </div>

      {/* Configuration Form - Requirements: 1.5 */}
      {(generationState === "idle" ||
        generationState === "validating" ||
        generationState === "error") && (
          <div className="mb-4 sm:mb-6">
            <SdkConfigForm
              onSubmit={handleGenerate}
              loading={generationState === "validating"}
              initialConfig={config}
            />
          </div>
        )}

      {/* Progress Indicator - Requirements: 2.1 */}
      {generationState === "generating" && generationId && (
        <div className="mb-4 sm:mb-6">
          <SdkGenerationProgress
            generationId={generationId}
            onComplete={handleComplete}
            onError={handleError}
          />
        </div>
      )}

      {/* Code Preview - Requirements: 3.1 */}
      {generationState === "complete" && generationResult && (
        <div className="mb-4 sm:mb-6">
          <SdkCodePreview
            generationId={generationId || ""}
            language={config.language}
            codeSamples={generationResult.codeSamples}
          />
        </div>
      )}

      {/* Download Section - Requirements: 4.1 */}
      {generationState === "complete" && generationResult && (
        <SdkDownloadSection
          downloadUrl={generationResult.downloadUrl}
          packageName={generationResult.packageName || config.packageName}
          packageVersion={
            generationResult.packageVersion || config.packageVersion
          }
          fileSize={generationResult.fileSize || 0}
          onGenerateNew={handleGenerateNew}
        />
      )}

      {/* Spec Validation Error Display - Requirements: 5.4 */}
      {generationState === "error" && validationErrors && (
        <SpecValidationErrorDisplay
          errors={validationErrors}
          onRetry={handleRetry}
          showUploadLink={true}
        />
      )}

      {/* General Error Display - Requirements: 5.1, 5.2, 5.5 */}
      {generationState === "error" && error && !validationErrors && (
        <ErrorDisplay
          error={error}
          title="Generation Failed"
          onRetry={handleRetry}
          variant="card"
        />
      )}
    </div>
  );
}

/**
 * SDK Generator Page with error boundary
 */
export default function SDKGeneratorPage() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the page state
        window.location.reload();
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 py-24">
            <Card className="max-w-2xl w-full">
              <CardContent className="text-center p-12">
                <Icon
                  icon="lucide:loader-2"
                  className="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
                />
                <p className="text-lg">Loading SDK Generator...</p>
              </CardContent>
            </Card>
          </div>
        }
      >
        <SDKGeneratorContent />
      </Suspense>
    </ErrorBoundary>
  );
}

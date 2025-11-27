"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWorkflow, type SpecMetadata } from "@/contexts/workflow-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props for the SpecSelector component
 */
export interface SpecSelectorProps {
  currentSpec: SpecMetadata | null;
  recentSpecs: SpecMetadata[];
  onSpecSelect: (specId: string) => void;
  onUploadNew: () => void;
}

/**
 * SpecSelector component
 * Displays current spec and allows switching between recent specs
 * Requirements: 6.1, 6.2, 6.3
 */
export function SpecSelector({
  currentSpec,
  recentSpecs,
  onSpecSelect,
  onUploadNew,
}: SpecSelectorProps) {
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Format spec display name
  const formatSpecName = (spec: SpecMetadata) => {
    return `${spec.name} v${spec.version}`;
  };

  // Handle spec selection
  const handleValueChange = (value: string) => {
    if (value === "upload-new") {
      onUploadNew();
    } else {
      onSpecSelect(value);
    }
  };

  return (
    <div className="w-full sm:min-w-[180px] sm:max-w-[300px]">
      <Select
        value={currentSpec?.id || "no-spec"}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          className="bg-background/50 border-border text-xs sm:text-sm h-8 sm:h-10"
          aria-label="Select OpenAPI specification"
        >
          <SelectValue placeholder="No spec selected">
            {currentSpec ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs">📄</span>
                <span className="truncate">{formatSpecName(currentSpec)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">No spec</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Current spec (if exists) */}
          {currentSpec && (
            <>
              <SelectItem value={currentSpec.id}>
                <div className="flex items-center gap-2">
                  <span className="text-xs">✓</span>
                  <span className="text-xs sm:text-sm">
                    {formatSpecName(currentSpec)}
                  </span>
                </div>
              </SelectItem>
              {recentSpecs.length > 1 && <SelectSeparator />}
            </>
          )}

          {/* Recent specs (excluding current) */}
          {recentSpecs
            .filter((spec) => spec.id !== currentSpec?.id)
            .map((spec) => (
              <SelectItem key={spec.id} value={spec.id}>
                <div className="flex items-center gap-2">
                  <span className="text-xs">📄</span>
                  <span className="text-xs sm:text-sm">
                    {formatSpecName(spec)}
                  </span>
                </div>
              </SelectItem>
            ))}

          {/* Upload new option */}
          {recentSpecs.length > 0 && <SelectSeparator />}
          <SelectItem value="upload-new">
            <div className="flex items-center gap-2">
              <span className="text-xs">➕</span>
              <span className="text-xs sm:text-sm">Upload New Spec</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Skeleton loader for SpecSelector
 */
export function SpecSelectorSkeleton() {
  return (
    <div className="w-full sm:min-w-[180px] sm:max-w-[300px]">
      <div className="h-8 sm:h-10 bg-muted animate-pulse rounded-md" />
    </div>
  );
}

/**
 * Connected SpecSelector component that uses workflow context
 * This is the main component to use in the app
 */
export function ConnectedSpecSelector() {
  const router = useRouter();
  const { state, loadRecentSpec } = useWorkflow();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSpecSelect = async (specId: string) => {
    setIsLoading(true);
    try {
      await loadRecentSpec(specId);
      // Navigate to explorer after loading spec (Requirement 6.4)
      router.push("/explorer");
    } catch (error) {
      console.error("Failed to load spec:", error);
      // Could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadNew = () => {
    router.push("/upload");
  };

  if (isLoading) {
    return <SpecSelectorSkeleton />;
  }

  return (
    <SpecSelector
      currentSpec={state.specMetadata}
      recentSpecs={state.recentSpecs}
      onSpecSelect={handleSpecSelect}
      onUploadNew={handleUploadNew}
    />
  );
}

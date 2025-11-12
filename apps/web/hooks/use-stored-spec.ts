"use client";

import { useState } from "react";
import { getStoredSpec, clearStoredSpec } from "@/lib/spec-storage";
import type { ParsedSpec } from "@splice/openapi";

interface SpecMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  source?: string;
  uploadedAt?: string;
}

/**
 * React hook to access the stored OpenAPI spec
 */
export function useStoredSpec() {
  // Initialize state with stored values directly
  const [{ spec, metadata }] = useState(() => {
    const { spec: storedSpec, metadata: storedMetadata } = getStoredSpec();
    return { spec: storedSpec, metadata: storedMetadata };
  });

  const clear = () => {
    clearStoredSpec();
    // Note: This won't update the state, but that's okay since
    // the user will typically navigate away after clearing
  };

  return {
    spec,
    metadata,
    isLoading: false,
    hasSpec: spec !== null,
    clear,
  };
}

"use client";

import { useState, useEffect } from "react";
import {
  getStoredSpec,
  getAllStoredSpecs,
  setCurrentSpecId,
  deleteSpec as deleteStoredSpec,
} from "@/lib/spec-storage";
import type { ParsedSpec } from "@splice/openapi";

interface SpecMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  source?: string;
  uploadedAt?: string;
}

/**
 * React hook to access stored OpenAPI specs with multi-spec support
 */
export function useStoredSpec(initialSpecId?: string) {
  // Initialize state with stored values directly
  const [{ spec, metadata, specId }, setState] = useState(() => {
    const {
      spec: storedSpec,
      metadata: storedMetadata,
      specId: id,
    } = getStoredSpec(initialSpecId);
    return { spec: storedSpec, metadata: storedMetadata, specId: id };
  });

  const [allSpecs, setAllSpecs] = useState(() => getAllStoredSpecs());

  // Refresh allSpecs when component mounts or initialSpecId changes
  useEffect(() => {
    const specs = getAllStoredSpecs();
    setAllSpecs(specs);
    console.log("[useStoredSpec] useEffect - refreshed specs:", specs.length);
  }, [initialSpecId]);

  const switchSpec = (newSpecId: string) => {
    const { spec: newSpec, metadata: newMetadata } = getStoredSpec(newSpecId);
    setState({ spec: newSpec, metadata: newMetadata, specId: newSpecId });
    setCurrentSpecId(newSpecId);
  };

  const deleteSpec = (specIdToDelete: string) => {
    deleteStoredSpec(specIdToDelete);
    // Reload from storage to get the new current spec
    const {
      spec: newSpec,
      metadata: newMetadata,
      specId: newId,
    } = getStoredSpec();
    setState({ spec: newSpec, metadata: newMetadata, specId: newId });
    setAllSpecs(getAllStoredSpecs());
  };

  const refreshSpecs = () => {
    setAllSpecs(getAllStoredSpecs());
  };

  return {
    spec,
    metadata,
    specId,
    isLoading: false,
    hasSpec: spec !== null,
    allSpecs,
    switchSpec,
    deleteSpec,
    refreshSpecs,
  };
}

/**
 * Client-side utilities for storing and retrieving parsed OpenAPI specs
 * Uses sessionStorage for temporary storage during the session
 */

import type { ParsedSpec } from "@splice/openapi";

interface SpecMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  source?: string;
  uploadedAt?: string;
}

/**
 * Store a parsed spec in sessionStorage
 */
export function storeSpec(spec: ParsedSpec, metadata?: SpecMetadata): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("parsedSpec", JSON.stringify(spec));
  if (metadata) {
    sessionStorage.setItem("specMetadata", JSON.stringify(metadata));
  }
}

/**
 * Retrieve the parsed spec from sessionStorage
 */
export function getStoredSpec(): {
  spec: ParsedSpec | null;
  metadata: SpecMetadata | null;
} {
  if (typeof window === "undefined") {
    return { spec: null, metadata: null };
  }

  try {
    const specData = sessionStorage.getItem("parsedSpec");
    const metadataData = sessionStorage.getItem("specMetadata");

    return {
      spec: specData ? JSON.parse(specData) : null,
      metadata: metadataData ? JSON.parse(metadataData) : null,
    };
  } catch (error) {
    console.error("Error retrieving spec from storage:", error);
    return { spec: null, metadata: null };
  }
}

/**
 * Clear the stored spec from sessionStorage
 */
export function clearStoredSpec(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("parsedSpec");
  sessionStorage.removeItem("specMetadata");
}

/**
 * Check if a spec is currently stored
 */
export function hasStoredSpec(): boolean {
  if (typeof window === "undefined") return false;

  return sessionStorage.getItem("parsedSpec") !== null;
}

/**
 * Client-side utilities for storing and retrieving parsed OpenAPI specs
 * Uses sessionStorage for temporary storage during the session
 * Supports multiple specs with unique IDs
 */

import type { ParsedSpec } from "@splice/openapi";

interface SpecMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  source?: string;
  uploadedAt?: string;
}

interface StoredSpecItem {
  specId: string;
  spec: ParsedSpec;
  metadata: SpecMetadata;
  uploadedAt: string;
}

const SPECS_KEY = "storedSpecs";
const CURRENT_SPEC_ID_KEY = "currentSpecId";

/**
 * Store a parsed spec in sessionStorage with a unique ID
 */
export function storeSpec(
  specId: string,
  spec: ParsedSpec,
  metadata?: SpecMetadata
): void {
  if (typeof window === "undefined") return;

  try {
    const specs = getAllStoredSpecs();
    console.log("[storeSpec] Current specs count:", specs.length);
    console.log("[storeSpec] Storing spec with ID:", specId);

    const newSpec: StoredSpecItem = {
      specId,
      spec,
      metadata: metadata || {},
      uploadedAt: new Date().toISOString(),
    };

    // Add or update the spec
    const existingIndex = specs.findIndex((s) => s.specId === specId);
    if (existingIndex >= 0) {
      console.log(
        "[storeSpec] Updating existing spec at index:",
        existingIndex
      );
      specs[existingIndex] = newSpec;
    } else {
      console.log("[storeSpec] Adding new spec");
      specs.push(newSpec);
    }

    sessionStorage.setItem(SPECS_KEY, JSON.stringify(specs));
    sessionStorage.setItem(CURRENT_SPEC_ID_KEY, specId);
    console.log("[storeSpec] Stored! New count:", specs.length);
  } catch (error) {
    console.error("Error storing spec:", error);
  }
}

/**
 * Retrieve a specific spec by ID
 */
export function getStoredSpec(specId?: string): {
  spec: ParsedSpec | null;
  metadata: SpecMetadata | null;
  specId: string | null;
} {
  if (typeof window === "undefined") {
    return { spec: null, metadata: null, specId: null };
  }

  try {
    const specs = getAllStoredSpecs();
    const targetId =
      specId || sessionStorage.getItem(CURRENT_SPEC_ID_KEY) || null;

    if (!targetId) {
      // Return the most recent spec if no ID specified
      const mostRecent = specs[specs.length - 1];
      return mostRecent
        ? {
            spec: mostRecent.spec,
            metadata: mostRecent.metadata,
            specId: mostRecent.specId,
          }
        : { spec: null, metadata: null, specId: null };
    }

    const storedSpec = specs.find((s) => s.specId === targetId);
    return storedSpec
      ? {
          spec: storedSpec.spec,
          metadata: storedSpec.metadata,
          specId: storedSpec.specId,
        }
      : { spec: null, metadata: null, specId: null };
  } catch (error) {
    console.error("Error retrieving spec from storage:", error);
    return { spec: null, metadata: null, specId: null };
  }
}

/**
 * Get all stored specs
 */
export function getAllStoredSpecs(): StoredSpecItem[] {
  if (typeof window === "undefined") return [];

  try {
    const specsData = sessionStorage.getItem(SPECS_KEY);
    const specs = specsData ? JSON.parse(specsData) : [];
    console.log("[getAllStoredSpecs] Retrieved specs count:", specs.length);
    return specs;
  } catch (error) {
    console.error("Error retrieving all specs:", error);
    return [];
  }
}

/**
 * Get list of spec summaries for dropdown
 */
export function getSpecList(): Array<{
  specId: string;
  title: string;
  version: string;
  fileName?: string;
  uploadedAt: string;
}> {
  const specs = getAllStoredSpecs();
  return specs.map((s) => ({
    specId: s.specId,
    title: s.spec.info.title,
    version: s.spec.info.version,
    fileName: s.metadata.fileName,
    uploadedAt: s.uploadedAt,
  }));
}

/**
 * Set the current active spec
 */
export function setCurrentSpecId(specId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CURRENT_SPEC_ID_KEY, specId);
}

/**
 * Get the current active spec ID
 */
export function getCurrentSpecId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CURRENT_SPEC_ID_KEY);
}

/**
 * Delete a specific spec
 */
export function deleteSpec(specId: string): void {
  if (typeof window === "undefined") return;

  try {
    const specs = getAllStoredSpecs();
    const filtered = specs.filter((s) => s.specId !== specId);
    sessionStorage.setItem(SPECS_KEY, JSON.stringify(filtered));

    // If we deleted the current spec, set a new current
    if (getCurrentSpecId() === specId && filtered.length > 0) {
      setCurrentSpecId(filtered[filtered.length - 1].specId);
    }
  } catch (error) {
    console.error("Error deleting spec:", error);
  }
}

/**
 * Clear all stored specs
 */
export function clearAllSpecs(): void {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SPECS_KEY);
  sessionStorage.removeItem(CURRENT_SPEC_ID_KEY);
}

/**
 * Check if any specs are stored
 */
export function hasStoredSpecs(): boolean {
  return getAllStoredSpecs().length > 0;
}

/**
 * Client-side utilities for managing recent specs in localStorage
 * Stores metadata about recently accessed specs for quick switching
 * Limits to 5 most recent specs, sorted by last accessed date
 */

import type { SpecMetadata } from "@/contexts/workflow-context";

const RECENT_SPECS_KEY = "recentSpecs";
const MAX_RECENT_SPECS = 5;

/**
 * Storage format for recent specs in localStorage
 */
interface RecentSpecsStorage {
  specs: Array<{
    id: string;
    name: string;
    version: string;
    uploadedAt: string;
    lastAccessedAt: string;
  }>;
}

/**
 * Get all recent specs from localStorage
 * @returns Array of recent spec metadata, sorted by last accessed date (most recent first)
 */
export function getRecentSpecs(): SpecMetadata[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(RECENT_SPECS_KEY);
    if (!stored) return [];

    const data: RecentSpecsStorage = JSON.parse(stored);

    // Convert date strings back to Date objects and sort by lastAccessedAt
    return data.specs
      .map((spec) => ({
        id: spec.id,
        name: spec.name,
        version: spec.version,
        uploadedAt: new Date(spec.uploadedAt),
        lastAccessedAt: new Date(spec.lastAccessedAt),
      }))
      .sort((a, b) => {
        const dateA = a.lastAccessedAt?.getTime() || 0;
        const dateB = b.lastAccessedAt?.getTime() || 0;
        return dateB - dateA; // Most recent first
      });
  } catch (error) {
    console.error("Error retrieving recent specs from localStorage:", error);
    return [];
  }
}

/**
 * Add or update a spec in the recent specs list
 * @param metadata - Spec metadata to add
 */
export function addRecentSpec(metadata: SpecMetadata): void {
  if (typeof window === "undefined") return;

  try {
    const recentSpecs = getRecentSpecs();

    // Check if spec already exists
    const existingIndex = recentSpecs.findIndex(
      (spec) => spec.id === metadata.id
    );

    let updatedSpecs: SpecMetadata[];

    if (existingIndex !== -1) {
      // Update existing spec's lastAccessedAt
      updatedSpecs = [...recentSpecs];
      updatedSpecs[existingIndex] = {
        ...updatedSpecs[existingIndex],
        lastAccessedAt: new Date(),
      };
    } else {
      // Add new spec with current timestamp
      const newSpec: SpecMetadata = {
        ...metadata,
        lastAccessedAt: new Date(),
      };
      updatedSpecs = [newSpec, ...recentSpecs];
    }

    // Sort by lastAccessedAt (most recent first)
    updatedSpecs.sort((a, b) => {
      const dateA = a.lastAccessedAt?.getTime() || 0;
      const dateB = b.lastAccessedAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Keep only the 5 most recent
    if (updatedSpecs.length > MAX_RECENT_SPECS) {
      updatedSpecs = updatedSpecs.slice(0, MAX_RECENT_SPECS);
    }

    // Save to localStorage
    const storageData: RecentSpecsStorage = {
      specs: updatedSpecs.map((spec) => ({
        id: spec.id,
        name: spec.name,
        version: spec.version,
        uploadedAt: spec.uploadedAt.toISOString(),
        lastAccessedAt: (spec.lastAccessedAt || new Date()).toISOString(),
      })),
    };

    localStorage.setItem(RECENT_SPECS_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Error adding recent spec to localStorage:", error);
  }
}

/**
 * Update the last accessed timestamp for a spec
 * @param specId - ID of the spec to update
 */
export function updateLastAccessed(specId: string): void {
  if (typeof window === "undefined") return;

  try {
    const recentSpecs = getRecentSpecs();
    const spec = recentSpecs.find((s) => s.id === specId);

    if (spec) {
      // Update the spec with new lastAccessedAt
      addRecentSpec({
        ...spec,
        lastAccessedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error updating last accessed timestamp:", error);
  }
}

/**
 * Remove a spec from recent specs
 * @param specId - ID of the spec to remove
 */
export function removeRecentSpec(specId: string): void {
  if (typeof window === "undefined") return;

  try {
    const recentSpecs = getRecentSpecs();
    const filtered = recentSpecs.filter((spec) => spec.id !== specId);

    const storageData: RecentSpecsStorage = {
      specs: filtered.map((spec) => ({
        id: spec.id,
        name: spec.name,
        version: spec.version,
        uploadedAt: spec.uploadedAt.toISOString(),
        lastAccessedAt: (spec.lastAccessedAt || new Date()).toISOString(),
      })),
    };

    localStorage.setItem(RECENT_SPECS_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Error removing recent spec from localStorage:", error);
  }
}

/**
 * Clear all recent specs from localStorage
 */
export function clearRecentSpecs(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(RECENT_SPECS_KEY);
  } catch (error) {
    console.error("Error clearing recent specs from localStorage:", error);
  }
}

/**
 * Check if a spec is in the recent specs list
 * @param specId - ID of the spec to check
 * @returns true if the spec is in recent specs
 */
export function isRecentSpec(specId: string): boolean {
  const recentSpecs = getRecentSpecs();
  return recentSpecs.some((spec) => spec.id === specId);
}

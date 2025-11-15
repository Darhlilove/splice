/**
 * Storage utilities for Request Builder
 * Handles saving/loading presets and authentication credentials
 */

import type { PresetConfig, AuthConfig } from "@/types/request-builder";

// Storage keys
const PRESET_KEY_PREFIX = "splice:presets:";
const AUTH_KEY = "splice:auth";

/**
 * Generate storage key for endpoint presets
 * @param method HTTP method
 * @param path Endpoint path
 * @returns Storage key string
 */
function getPresetKey(method: string, path: string): string {
  return `${PRESET_KEY_PREFIX}${method.toUpperCase()}:${path}`;
}

/**
 * Save a preset for a specific endpoint
 * @param method HTTP method
 * @param path Endpoint path
 * @param preset Preset configuration to save
 */
export function savePreset(
  method: string,
  path: string,
  preset: PresetConfig
): void {
  try {
    const key = getPresetKey(method, path);
    const existingPresets = loadPresets(method, path);

    // Check if preset with same name exists and replace it
    const presetIndex = existingPresets.findIndex(
      (p) => p.name === preset.name
    );
    if (presetIndex >= 0) {
      existingPresets[presetIndex] = preset;
    } else {
      existingPresets.push(preset);
    }

    localStorage.setItem(key, JSON.stringify(existingPresets));
  } catch (error) {
    console.error("Failed to save preset:", error);
    throw new Error("Failed to save preset to localStorage");
  }
}

/**
 * Load all presets for a specific endpoint
 * @param method HTTP method
 * @param path Endpoint path
 * @returns Array of preset configurations
 */
export function loadPresets(method: string, path: string): PresetConfig[] {
  try {
    const key = getPresetKey(method, path);
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    const presets = JSON.parse(data) as PresetConfig[];

    // Convert createdAt strings back to Date objects
    return presets.map((preset) => ({
      ...preset,
      createdAt: new Date(preset.createdAt),
    }));
  } catch (error) {
    console.error("Failed to load presets:", error);
    return [];
  }
}

/**
 * Delete a specific preset
 * @param method HTTP method
 * @param path Endpoint path
 * @param presetName Name of the preset to delete
 */
export function deletePreset(
  method: string,
  path: string,
  presetName: string
): void {
  try {
    const key = getPresetKey(method, path);
    const existingPresets = loadPresets(method, path);
    const filteredPresets = existingPresets.filter(
      (p) => p.name !== presetName
    );

    if (filteredPresets.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(filteredPresets));
    }
  } catch (error) {
    console.error("Failed to delete preset:", error);
    throw new Error("Failed to delete preset from localStorage");
  }
}

/**
 * Export all presets for an endpoint as JSON
 * @param method HTTP method
 * @param path Endpoint path
 * @returns JSON string of all presets
 */
export function exportPresets(method: string, path: string): string {
  const presets = loadPresets(method, path);
  return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON string
 * @param method HTTP method
 * @param path Endpoint path
 * @param jsonData JSON string containing presets
 */
export function importPresets(
  method: string,
  path: string,
  jsonData: string
): void {
  try {
    const presets = JSON.parse(jsonData) as PresetConfig[];

    // Validate preset structure
    if (!Array.isArray(presets)) {
      throw new Error("Invalid preset format: expected array");
    }

    const key = getPresetKey(method, path);
    const existingPresets = loadPresets(method, path);

    // Merge imported presets with existing ones (imported presets take precedence)
    const mergedPresets = [...existingPresets];

    presets.forEach((importedPreset) => {
      const existingIndex = mergedPresets.findIndex(
        (p) => p.name === importedPreset.name
      );

      if (existingIndex >= 0) {
        mergedPresets[existingIndex] = importedPreset;
      } else {
        mergedPresets.push(importedPreset);
      }
    });

    localStorage.setItem(key, JSON.stringify(mergedPresets));
  } catch (error) {
    console.error("Failed to import presets:", error);
    throw new Error("Failed to import presets: invalid JSON format");
  }
}

/**
 * Save authentication credentials to session storage
 * @param auth Authentication configuration
 */
export function saveAuthCredentials(auth: AuthConfig): void {
  try {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error("Failed to save auth credentials:", error);
    throw new Error("Failed to save authentication credentials");
  }
}

/**
 * Load authentication credentials from session storage
 * @returns Authentication configuration or null if not found
 */
export function loadAuthCredentials(): AuthConfig | null {
  try {
    const data = sessionStorage.getItem(AUTH_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as AuthConfig;
  } catch (error) {
    console.error("Failed to load auth credentials:", error);
    return null;
  }
}

/**
 * Clear authentication credentials from session storage
 */
export function clearAuthCredentials(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error("Failed to clear auth credentials:", error);
  }
}

/**
 * Get all preset keys from localStorage
 * Useful for debugging or bulk operations
 * @returns Array of all preset storage keys
 */
export function getAllPresetKeys(): string[] {
  const keys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PRESET_KEY_PREFIX)) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error("Failed to get preset keys:", error);
  }

  return keys;
}

/**
 * Clear all presets from localStorage
 * Use with caution - this removes all saved presets
 */
export function clearAllPresets(): void {
  try {
    const keys = getAllPresetKeys();
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all presets:", error);
    throw new Error("Failed to clear all presets");
  }
}

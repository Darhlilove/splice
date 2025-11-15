/**
 * Tests for request storage utilities
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  savePreset,
  loadPresets,
  deletePreset,
  exportPresets,
  importPresets,
  saveAuthCredentials,
  loadAuthCredentials,
  clearAuthCredentials,
  getAllPresetKeys,
  clearAllPresets,
} from "@/lib/request-storage";
import type { PresetConfig, AuthConfig } from "@/types/request-builder";

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(global, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

describe("request-storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe("Preset Management", () => {
    const method = "GET";
    const path = "/users/{id}";

    const mockPreset: PresetConfig = {
      name: "Test Preset",
      parameters: { id: "123", limit: 10 },
      requestBody: { name: "John" },
      authentication: {
        type: "bearer",
        bearerToken: "test-token",
      },
      createdAt: new Date("2024-01-01"),
    };

    test("savePreset should save preset to localStorage", () => {
      savePreset(method, path, mockPreset);
      const presets = loadPresets(method, path);

      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe(mockPreset.name);
      expect(presets[0].parameters).toEqual(mockPreset.parameters);
    });

    test("loadPresets should return empty array when no presets exist", () => {
      const presets = loadPresets(method, path);
      expect(presets).toEqual([]);
    });

    test("savePreset should replace existing preset with same name", () => {
      savePreset(method, path, mockPreset);

      const updatedPreset = {
        ...mockPreset,
        parameters: { id: "456", limit: 20 },
      };

      savePreset(method, path, updatedPreset);
      const presets = loadPresets(method, path);

      expect(presets).toHaveLength(1);
      expect(presets[0].parameters).toEqual(updatedPreset.parameters);
    });

    test("deletePreset should remove specific preset", () => {
      savePreset(method, path, mockPreset);
      savePreset(method, path, { ...mockPreset, name: "Preset 2" });

      deletePreset(method, path, "Test Preset");
      const presets = loadPresets(method, path);

      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe("Preset 2");
    });

    test("exportPresets should return JSON string", () => {
      savePreset(method, path, mockPreset);
      const exported = exportPresets(method, path);
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBe(mockPreset.name);
    });

    test("importPresets should merge with existing presets", () => {
      savePreset(method, path, mockPreset);

      const importData = JSON.stringify([
        { ...mockPreset, name: "Imported Preset" },
      ]);

      importPresets(method, path, importData);
      const presets = loadPresets(method, path);

      expect(presets).toHaveLength(2);
    });

    test("getAllPresetKeys should return all preset keys", () => {
      savePreset("GET", "/users", mockPreset);
      savePreset("POST", "/users", mockPreset);

      const keys = getAllPresetKeys();
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    test("clearAllPresets should remove all presets", () => {
      savePreset("GET", "/users", mockPreset);
      savePreset("POST", "/users", mockPreset);

      clearAllPresets();
      const keys = getAllPresetKeys();

      expect(keys).toHaveLength(0);
    });
  });

  describe("Authentication Management", () => {
    const mockAuth: AuthConfig = {
      type: "bearer",
      bearerToken: "test-token-123",
    };

    test("saveAuthCredentials should save to sessionStorage", () => {
      saveAuthCredentials(mockAuth);
      const loaded = loadAuthCredentials();

      expect(loaded).not.toBeNull();
      expect(loaded?.type).toBe(mockAuth.type);
      expect(loaded?.bearerToken).toBe(mockAuth.bearerToken);
    });

    test("loadAuthCredentials should return null when no credentials exist", () => {
      const loaded = loadAuthCredentials();
      expect(loaded).toBeNull();
    });

    test("clearAuthCredentials should remove credentials", () => {
      saveAuthCredentials(mockAuth);
      clearAuthCredentials();
      const loaded = loadAuthCredentials();

      expect(loaded).toBeNull();
    });

    test("should handle API key authentication", () => {
      const apiKeyAuth: AuthConfig = {
        type: "apiKey",
        apiKey: "my-api-key",
        apiKeyLocation: "header",
        apiKeyName: "X-API-Key",
      };

      saveAuthCredentials(apiKeyAuth);
      const loaded = loadAuthCredentials();

      expect(loaded?.type).toBe("apiKey");
      expect(loaded?.apiKey).toBe("my-api-key");
      expect(loaded?.apiKeyLocation).toBe("header");
    });
  });
});

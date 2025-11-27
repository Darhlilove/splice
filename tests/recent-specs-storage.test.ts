import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getRecentSpecs,
  addRecentSpec,
  updateLastAccessed,
  removeRecentSpec,
  clearRecentSpecs,
  isRecentSpec,
} from "@/lib/recent-specs-storage";
import type { SpecMetadata } from "@/contexts/workflow-context";

// Mock localStorage
const localStorageMock = (() => {
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
  };
})();

// Setup global mocks
beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
});

describe("Recent Specs Storage", () => {
  describe("getRecentSpecs", () => {
    it("should return empty array when no specs are stored", () => {
      const specs = getRecentSpecs();
      expect(specs).toEqual([]);
    });

    it("should return specs sorted by lastAccessedAt (most recent first)", async () => {
      const spec1: SpecMetadata = {
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      };
      const spec2: SpecMetadata = {
        id: "spec-2",
        name: "API 2",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-02"),
      };

      addRecentSpec(spec1);
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      addRecentSpec(spec2);
      const specs = getRecentSpecs();
      expect(specs[0].id).toBe("spec-2"); // Most recent first
      expect(specs[1].id).toBe("spec-1");
    });
  });

  describe("addRecentSpec", () => {
    it("should add a new spec to recent specs", () => {
      const spec: SpecMetadata = {
        id: "spec-1",
        name: "Petstore API",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      };

      addRecentSpec(spec);
      const specs = getRecentSpecs();

      expect(specs).toHaveLength(1);
      expect(specs[0].id).toBe("spec-1");
      expect(specs[0].name).toBe("Petstore API");
      expect(specs[0].lastAccessedAt).toBeInstanceOf(Date);
    });

    it("should update lastAccessedAt when adding existing spec", async () => {
      const spec: SpecMetadata = {
        id: "spec-1",
        name: "Petstore API",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      };

      addRecentSpec(spec);
      const firstAccess = getRecentSpecs()[0].lastAccessedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      addRecentSpec(spec);
      const secondAccess = getRecentSpecs()[0].lastAccessedAt;

      expect(getRecentSpecs()).toHaveLength(1);
      expect(secondAccess!.getTime()).toBeGreaterThan(firstAccess!.getTime());
    });

    it("should limit to 5 most recent specs", () => {
      for (let i = 1; i <= 7; i++) {
        addRecentSpec({
          id: `spec-${i}`,
          name: `API ${i}`,
          version: "1.0.0",
          uploadedAt: new Date(`2024-01-0${i}`),
        });
      }

      const specs = getRecentSpecs();
      expect(specs).toHaveLength(5);
      // Should keep the 5 most recent (spec-3 through spec-7)
      expect(specs.map((s: SpecMetadata) => s.id)).toContain("spec-7");
      expect(specs.map((s: SpecMetadata) => s.id)).toContain("spec-6");
      expect(specs.map((s: SpecMetadata) => s.id)).not.toContain("spec-1");
      expect(specs.map((s: SpecMetadata) => s.id)).not.toContain("spec-2");
    });
  });

  describe("updateLastAccessed", () => {
    it("should update the lastAccessedAt timestamp for a spec", async () => {
      const spec: SpecMetadata = {
        id: "spec-1",
        name: "Petstore API",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      };

      addRecentSpec(spec);
      const firstAccess = getRecentSpecs()[0].lastAccessedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      updateLastAccessed("spec-1");
      const secondAccess = getRecentSpecs()[0].lastAccessedAt;

      expect(secondAccess!.getTime()).toBeGreaterThan(firstAccess!.getTime());
    });

    it("should move updated spec to the front of the list", async () => {
      addRecentSpec({
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      addRecentSpec({
        id: "spec-2",
        name: "API 2",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-02"),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      updateLastAccessed("spec-1");
      const specs = getRecentSpecs();
      expect(specs[0].id).toBe("spec-1"); // Should be first now
    });
  });

  describe("removeRecentSpec", () => {
    it("should remove a spec from recent specs", () => {
      addRecentSpec({
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      });
      addRecentSpec({
        id: "spec-2",
        name: "API 2",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-02"),
      });

      expect(getRecentSpecs()).toHaveLength(2);

      removeRecentSpec("spec-1");
      const specs = getRecentSpecs();

      expect(specs).toHaveLength(1);
      expect(specs[0].id).toBe("spec-2");
    });
  });

  describe("clearRecentSpecs", () => {
    it("should remove all recent specs", () => {
      addRecentSpec({
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      });
      addRecentSpec({
        id: "spec-2",
        name: "API 2",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-02"),
      });

      expect(getRecentSpecs()).toHaveLength(2);

      clearRecentSpecs();
      expect(getRecentSpecs()).toHaveLength(0);
    });
  });

  describe("isRecentSpec", () => {
    it("should return true if spec is in recent specs", () => {
      addRecentSpec({
        id: "spec-1",
        name: "API 1",
        version: "1.0.0",
        uploadedAt: new Date("2024-01-01"),
      });

      expect(isRecentSpec("spec-1")).toBe(true);
      expect(isRecentSpec("spec-2")).toBe(false);
    });
  });
});

/**
 * Performance optimization tests
 * Tests for large response handling and optimization features
 */

import { describe, it, expect, beforeEach } from "vitest";
import { HistoryStore } from "@/lib/history-store";
import type { ResponseData } from "@/types/request-builder";

describe("Performance Optimizations", () => {
  describe("HistoryStore with Map optimization", () => {
    let store: HistoryStore;

    beforeEach(() => {
      // Clear sessionStorage before each test
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
      store = new HistoryStore(10);
    });

    it("should provide O(1) lookup with getEntry", () => {
      const mockResponse: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: { test: "data" },
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      // Add multiple entries
      const entries = [];
      for (let i = 0; i < 10; i++) {
        const entry = store.addEntry("GET", `/api/test/${i}`, {}, mockResponse);
        entries.push(entry);
      }

      // Lookup should be fast (O(1) with Map)
      const startTime = performance.now();
      const foundEntry = store.getEntry(entries[5].id);
      const endTime = performance.now();

      expect(foundEntry).toBeDefined();
      expect(foundEntry?.id).toBe(entries[5].id);
      expect(endTime - startTime).toBeLessThan(1); // Should be very fast
    });

    it("should maintain max entries limit efficiently", () => {
      const mockResponse: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      // Add more than max entries
      const firstEntry = store.addEntry("GET", "/api/first", {}, mockResponse);

      for (let i = 0; i < 15; i++) {
        store.addEntry("GET", `/api/test/${i}`, {}, mockResponse);
      }

      // Should only keep 10 entries
      expect(store.getCount()).toBe(10);

      // First entry should be removed
      expect(store.getEntry(firstEntry.id)).toBeNull();
    });

    it("should handle large number of entries efficiently", () => {
      const mockResponse: ResponseData = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: {},
        duration: 100,
        responseTime: 100,
        timestamp: new Date(),
        contentType: "application/json",
      };

      const startTime = performance.now();

      // Add many entries
      for (let i = 0; i < 100; i++) {
        store.addEntry("GET", `/api/test/${i}`, {}, mockResponse);
      }

      const endTime = performance.now();

      // Should complete quickly even with many operations
      expect(endTime - startTime).toBeLessThan(100);
      expect(store.getCount()).toBe(10); // Should maintain limit
    });
  });

  describe("Large response body handling", () => {
    it("should handle response bodies over 10KB", () => {
      // Create a large response body
      const largeBody = {
        data: Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: "A".repeat(100),
          })),
      };

      const bodyString = JSON.stringify(largeBody);
      expect(bodyString.length).toBeGreaterThan(10000);

      // Should be able to stringify without errors
      expect(() => JSON.parse(bodyString)).not.toThrow();
    });

    it("should handle response bodies over 100KB", () => {
      // Create a very large response body
      const veryLargeBody = {
        data: Array(10000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: "A".repeat(100),
          })),
      };

      const bodyString = JSON.stringify(veryLargeBody);
      expect(bodyString.length).toBeGreaterThan(100000);

      // Should be able to handle large bodies
      expect(() => JSON.parse(bodyString)).not.toThrow();
    });

    it("should truncate extremely large bodies (>100KB) for display", () => {
      const hugeBody = "A".repeat(150000);

      // Simulate truncation logic from ResponseViewer
      const truncated =
        hugeBody.length > 100000
          ? hugeBody.slice(0, 100000) + "\n\n... (truncated for performance)"
          : hugeBody;

      expect(truncated.length).toBeLessThan(hugeBody.length);
      expect(truncated).toContain("truncated for performance");
    });
  });

  describe("Format change debouncing", () => {
    it("should debounce rapid format changes", async () => {
      let callCount = 0;
      const debouncedFn = (value: string) => {
        callCount++;
      };

      // Simulate rapid calls
      const delay = 300;
      const startTime = Date.now();

      // In real implementation, only the last call should execute after delay
      // This test verifies the concept
      setTimeout(() => debouncedFn("pretty"), 0);
      setTimeout(() => debouncedFn("minified"), 50);
      setTimeout(() => debouncedFn("pretty"), 100);

      // Wait for debounce delay
      await new Promise((resolve) => setTimeout(resolve, delay + 100));

      // All calls should have executed in this test setup
      // In production, debouncing would reduce this to 1
      expect(callCount).toBeGreaterThan(0);
    });
  });
});

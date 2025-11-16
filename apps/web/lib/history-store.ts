/**
 * History Store for Request Execution
 * Manages storage and retrieval of request/response history
 */

import type {
  ResponseData,
  ParameterValue,
  AuthConfig,
} from "@/types/request-builder";
import type { HTTPMethod } from "@/packages/openapi/src/types";

/**
 * Represents a single history entry
 */
export interface HistoryEntry {
  id: string;
  timestamp: Date;
  method: HTTPMethod;
  endpoint: string;
  parameters: Record<string, ParameterValue>;
  requestBody?: string | Record<string, unknown>;
  authentication?: AuthConfig;
  response: ResponseData;
  status: number;
  responseTime: number;
}

/**
 * Serializable version of HistoryEntry for storage
 */
interface SerializedHistoryEntry {
  id: string;
  timestamp: string;
  method: HTTPMethod;
  endpoint: string;
  parameters: Record<string, ParameterValue>;
  requestBody?: string | Record<string, unknown>;
  authentication?: AuthConfig;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    duration: number;
    responseTime: number;
    timestamp: string;
    contentType: string;
  };
  status: number;
  responseTime: number;
}

const STORAGE_KEY = "splice_request_history";
const MAX_ENTRIES = 10;

/**
 * Manages request history with localStorage persistence
 * Optimized with Map for O(1) lookups and efficient memory usage
 */
export class HistoryStore {
  private entries: HistoryEntry[] = [];
  private entriesMap: Map<string, HistoryEntry> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number = MAX_ENTRIES) {
    this.maxEntries = maxEntries;
    this.loadFromStorage();
  }

  /**
   * Load history from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const serialized: SerializedHistoryEntry[] = JSON.parse(stored);
        this.entries = serialized.map(this.deserializeEntry);
        // Build the map for O(1) lookups
        this.entriesMap.clear();
        this.entries.forEach((entry) => {
          this.entriesMap.set(entry.id, entry);
        });
      }
    } catch (error) {
      console.error("Failed to load history from storage:", error);
      this.entries = [];
      this.entriesMap.clear();
    }
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const serialized = this.entries.map(this.serializeEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error("Failed to save history to storage:", error);
    }
  }

  /**
   * Serialize a history entry for storage
   */
  private serializeEntry(entry: HistoryEntry): SerializedHistoryEntry {
    return {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
      response: {
        ...entry.response,
        timestamp: entry.response.timestamp.toISOString(),
      },
    };
  }

  /**
   * Deserialize a history entry from storage
   */
  private deserializeEntry(serialized: SerializedHistoryEntry): HistoryEntry {
    return {
      ...serialized,
      timestamp: new Date(serialized.timestamp),
      response: {
        ...serialized.response,
        timestamp: new Date(serialized.response.timestamp),
      },
    };
  }

  /**
   * Generate a unique ID for a history entry
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a new entry to history
   * Maintains max entries limit by removing oldest entries
   * Optimized with Map for efficient lookups
   */
  addEntry(
    method: HTTPMethod,
    endpoint: string,
    parameters: Record<string, ParameterValue>,
    response: ResponseData,
    requestBody?: string | Record<string, unknown>,
    authentication?: AuthConfig
  ): HistoryEntry {
    const entry: HistoryEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      method,
      endpoint,
      parameters,
      requestBody,
      authentication,
      response,
      status: response.status,
      responseTime: response.responseTime,
    };

    // Add to beginning of array (most recent first)
    this.entries.unshift(entry);
    this.entriesMap.set(entry.id, entry);

    // Maintain max entries limit
    if (this.entries.length > this.maxEntries) {
      const removedEntries = this.entries.splice(this.maxEntries);
      // Remove from map as well
      removedEntries.forEach((removed) => {
        this.entriesMap.delete(removed.id);
      });
    }

    // Persist to storage
    this.saveToStorage();

    // Dispatch custom event to notify listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("historyUpdated"));
    }

    return entry;
  }

  /**
   * Get all history entries
   * Returns entries in chronological order (most recent first)
   */
  getEntries(): HistoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get a specific entry by ID (O(1) lookup with Map)
   */
  getEntry(id: string): HistoryEntry | null {
    return this.entriesMap.get(id) || null;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.entries = [];
    this.entriesMap.clear();
    this.saveToStorage();
  }

  /**
   * Export history as JSON string
   */
  exportHistory(): string {
    const serialized = this.entries.map(this.serializeEntry);
    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Get the number of entries in history
   */
  getCount(): number {
    return this.entries.length;
  }
}

// Singleton instance for use across the application
let historyStoreInstance: HistoryStore | null = null;

/**
 * Get the singleton history store instance
 */
export function getHistoryStore(): HistoryStore {
  if (!historyStoreInstance) {
    historyStoreInstance = new HistoryStore();
  }
  return historyStoreInstance;
}

/**
 * React hook for managing request history
 */

import { useState, useEffect, useCallback } from "react";
import { getHistoryStore, HistoryEntry } from "@/lib/history-store";

/**
 * Hook for managing request history state
 */
export function useRequestHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  // Load history on mount and listen for updates
  useEffect(() => {
    const historyStore = getHistoryStore();

    // Initial load
    setHistory(historyStore.getEntries());

    // Listen for history updates via custom event
    const handleHistoryUpdate = () => {
      setHistory(historyStore.getEntries());
    };

    window.addEventListener("historyUpdated", handleHistoryUpdate);

    // Also poll for updates every 1000ms as fallback
    // This ensures the UI updates even if events don't fire
    const interval = setInterval(() => {
      setHistory(historyStore.getEntries());
    }, 1000);

    return () => {
      window.removeEventListener("historyUpdated", handleHistoryUpdate);
      clearInterval(interval);
    };
  }, []);

  /**
   * Refresh history from store
   */
  const refreshHistory = useCallback(() => {
    const historyStore = getHistoryStore();
    setHistory(historyStore.getEntries());
  }, []);

  /**
   * Select a history entry
   */
  const selectEntry = useCallback((entry: HistoryEntry) => {
    setSelectedEntry(entry);
  }, []);

  /**
   * Clear selected entry
   */
  const clearSelection = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    const historyStore = getHistoryStore();
    historyStore.clearHistory();
    setHistory([]);
    setSelectedEntry(null);
  }, []);

  /**
   * Export history as JSON
   */
  const exportHistory = useCallback(() => {
    const historyStore = getHistoryStore();
    const json = historyStore.exportHistory();

    // Create a blob and download it
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `request-history-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Get a specific entry by ID
   */
  const getEntry = useCallback((id: string): HistoryEntry | null => {
    const historyStore = getHistoryStore();
    return historyStore.getEntry(id);
  }, []);

  return {
    history,
    selectedEntry,
    selectEntry,
    clearSelection,
    clearHistory,
    exportHistory,
    refreshHistory,
    getEntry,
  };
}

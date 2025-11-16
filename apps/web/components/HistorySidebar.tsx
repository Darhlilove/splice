"use client";

import * as React from "react";
import { HistoryEntry } from "@/lib/history-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Trash2, Download, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the HistorySidebar component
 */
export interface HistorySidebarProps {
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  onExportHistory?: () => void;
  selectedEntryId?: string;
  maxEntries?: number;
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  } else {
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  }
}

/**
 * Get status code color based on HTTP status
 */
function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-green-500/10 text-green-500 border-green-500/20";
  } else if (status >= 400 && status < 500) {
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  } else if (status >= 500) {
    return "bg-red-500/10 text-red-500 border-red-500/20";
  }
  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
}

/**
 * Get method color based on HTTP method
 */
function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "POST":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "PUT":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "PATCH":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "DELETE":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

/**
 * Format response time in milliseconds
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Truncate endpoint path for display
 */
function truncateEndpoint(endpoint: string, maxLength: number = 40): string {
  if (endpoint.length <= maxLength) {
    return endpoint;
  }
  return endpoint.substring(0, maxLength - 3) + "...";
}

/**
 * Memoized history entry component for better performance
 */
const HistoryEntryItem = React.memo(function HistoryEntryItem({
  entry,
  isSelected,
  onSelect,
}: {
  entry: HistoryEntry;
  isSelected: boolean;
  onSelect: (entry: HistoryEntry) => void;
}) {
  return (
    <button
      onClick={() => onSelect(entry)}
      className={cn(
        "w-full text-left p-4 hover:bg-accent/50 transition-colors",
        isSelected && "bg-accent"
      )}
    >
      <div className="space-y-2">
        {/* Method and Status */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs px-2 py-0.5",
              getMethodColor(entry.method)
            )}
          >
            {entry.method}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs px-2 py-0.5",
              getStatusColor(entry.status)
            )}
          >
            {entry.status}
          </Badge>
        </div>

        {/* Endpoint */}
        <div className="font-mono text-sm text-foreground break-all">
          {truncateEndpoint(entry.endpoint)}
        </div>

        {/* Timestamp and Response Time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(entry.timestamp)}</span>
          </div>
          <span className="font-mono">
            {formatResponseTime(entry.responseTime)}
          </span>
        </div>
      </div>
    </button>
  );
});

/**
 * HistorySidebar component (memoized for performance)
 * Displays and manages request history
 */
export const HistorySidebar = React.memo(function HistorySidebar({
  history,
  onSelectEntry,
  onClearHistory,
  onExportHistory,
  selectedEntryId,
  maxEntries = 10,
}: HistorySidebarProps) {
  const handleExport = React.useCallback(() => {
    if (onExportHistory) {
      onExportHistory();
    }
  }, [onExportHistory]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">History</CardTitle>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {history.length}/{maxEntries}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto p-0">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-2">
              <HistoryIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No requests yet</p>
              <p className="text-xs text-muted-foreground/70">
                Execute a request to see it here
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {history.map((entry) => (
              <HistoryEntryItem
                key={entry.id}
                entry={entry}
                isSelected={selectedEntryId === entry.id}
                onSelect={onSelectEntry}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      {history.length > 0 && (
        <>
          <Separator />
          <div className="p-3 space-y-2">
            {onExportHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearHistory}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
        </>
      )}
    </Card>
  );
});

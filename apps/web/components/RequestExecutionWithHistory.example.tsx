/**
 * Example integration of request execution with history
 * This demonstrates how to use ExecuteButton, ResponseViewer, and HistorySidebar together
 */

"use client";

import * as React from "react";
import { ExecuteButton } from "@/components/ExecuteButton";
import { ResponseViewer } from "@/components/ResponseViewer";
import { HistorySidebar } from "@/components/HistorySidebar";
import { useRequestHistory } from "@/hooks/use-request-history";
import { useRequestState } from "@/lib/request-state";
import type { Endpoint } from "@/packages/openapi/src/types";
import type { ParameterValue, AuthConfig } from "@/types/request-builder";

interface RequestExecutionWithHistoryProps {
  endpoint: Endpoint;
  parameters: Record<string, ParameterValue>;
  authentication: AuthConfig;
  requestBody?: string | Record<string, unknown>;
  contentType?: string;
  baseUrl?: string;
}

/**
 * Example component showing integration of request execution with history
 */
export function RequestExecutionWithHistory({
  endpoint,
  parameters,
  authentication,
  requestBody,
  contentType,
  baseUrl,
}: RequestExecutionWithHistoryProps) {
  const { state, setResponse, setError, reset } = useRequestState();
  const { history, selectedEntry, selectEntry, clearHistory, exportHistory } =
    useRequestHistory();

  // Handle history entry selection
  const handleSelectEntry = React.useCallback(
    (entry: (typeof history)[0]) => {
      selectEntry(entry);
      // Convert history entry response to APIResponse format
      setResponse({
        status: entry.response.status,
        statusText: entry.response.statusText,
        headers: entry.response.headers,
        body: entry.response.body,
        responseTime: entry.response.responseTime,
        timestamp: entry.response.timestamp,
        contentType: entry.response.contentType,
      });
    },
    [selectEntry, setResponse]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Execute Button */}
        <ExecuteButton
          endpoint={endpoint}
          parameters={parameters}
          authentication={authentication}
          requestBody={requestBody}
          contentType={contentType}
          baseUrl={baseUrl}
          onExecute={setResponse}
          onError={setError}
        />

        {/* Response Viewer */}
        <ResponseViewer
          response={state.response}
          loading={state.loading}
          error={state.error || undefined}
          onRetry={reset}
        />
      </div>

      {/* History Sidebar */}
      <div className="lg:col-span-1">
        <HistorySidebar
          history={history}
          onSelectEntry={handleSelectEntry}
          onClearHistory={clearHistory}
          onExportHistory={exportHistory}
          selectedEntryId={selectedEntry?.id}
        />
      </div>
    </div>
  );
}

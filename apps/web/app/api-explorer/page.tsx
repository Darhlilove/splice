"use client";

import { ExplorerLayout } from "@/components/ExplorerLayout";
import { EndpointList } from "@/components/EndpointList";
import { RequestBuilder } from "@/components/RequestBuilder";
import { HistorySidebar } from "@/components/HistorySidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { useRequestHistory } from "@/hooks/use-request-history";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import type { Endpoint } from "@splice/openapi";
import type { ResponseData } from "@/types/request-builder";
import { toast } from "sonner";

function ApiExplorerContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const router = useRouter();
  const { spec, metadata, hasSpec } = useStoredSpec(specId || undefined);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null
  );

  // History management
  const { history, selectedEntry, selectEntry, clearHistory, exportHistory } =
    useRequestHistory();

  // State for displaying historical response
  const [displayedResponse, setDisplayedResponse] =
    useState<ResponseData | null>(null);

  if (!hasSpec || !spec) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="max-w-2xl w-full">
          <CardHeader className="flex flex-col items-center gap-3 pb-6">
            <div className="text-7xl">🔍</div>
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-4xl">API Explorer</CardTitle>
              <Badge variant="secondary">No Spec Loaded</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">
              No OpenAPI specification found. Please upload a spec first.
            </p>
            <Button onClick={() => router.push("/upload")}>
              <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
              Upload Specification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Left Panel - Endpoint List
  const leftPanel = (
    <EndpointList
      endpoints={spec.endpoints}
      selectedEndpoint={selectedEndpoint || undefined}
      onSelectEndpoint={setSelectedEndpoint}
    />
  );

  // Get base URL from spec or use a default
  const baseUrl =
    spec.info.servers?.[0]?.url || "https://petstore.swagger.io/v2";

  // Center Panel - Request Builder or Empty State
  const centerPanel = selectedEndpoint ? (
    <RequestBuilder
      endpoint={selectedEndpoint}
      allSchemas={spec.schemas}
      baseUrl={baseUrl}
      securitySchemes={spec.securitySchemes}
    />
  ) : (
    <Card className="h-full flex items-center justify-center">
      <CardContent className="text-center py-12">
        <Icon
          icon="lucide:mouse-pointer-click"
          className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50"
        />
        <h3 className="text-xl font-semibold mb-2">Select an Endpoint</h3>
        <p className="text-muted-foreground">
          Choose an endpoint from the list to view its details
        </p>
      </CardContent>
    </Card>
  );

  // Handle history entry selection
  const handleSelectHistoryEntry = (entry: (typeof history)[0]) => {
    selectEntry(entry);
    setDisplayedResponse(entry.response);
    toast.success("History Entry Loaded", {
      description: `${entry.method.toUpperCase()} ${entry.endpoint}`,
      duration: 2000,
    });
  };

  // Handle clear history
  const handleClearHistory = () => {
    clearHistory();
    setDisplayedResponse(null);
    toast.success("History Cleared", {
      description: "All request history has been cleared",
      duration: 2000,
    });
  };

  // Handle export history
  const handleExportHistory = () => {
    exportHistory();
    toast.success("History Exported", {
      description: "Request history has been downloaded as JSON",
      duration: 2000,
    });
  };

  // Right Panel - History Sidebar
  const rightPanel = (
    <HistorySidebar
      history={history}
      onSelectEntry={handleSelectHistoryEntry}
      onClearHistory={handleClearHistory}
      onExportHistory={handleExportHistory}
      selectedEntryId={selectedEntry?.id}
      maxEntries={10}
    />
  );

  return (
    <ExplorerLayout
      leftPanel={leftPanel}
      centerPanel={centerPanel}
      rightPanel={rightPanel}
      specTitle={spec.info.title}
      specId={specId || undefined}
    />
  );
}

export default function ApiExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Icon
            icon="lucide:loader-2"
            className="w-12 h-12 animate-spin text-primary"
          />
        </div>
      }
    >
      <ApiExplorerContent />
    </Suspense>
  );
}

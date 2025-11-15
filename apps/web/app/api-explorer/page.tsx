"use client";

import { ExplorerLayout } from "@/components/ExplorerLayout";
import { EndpointList } from "@/components/EndpointList";
import { RequestBuilder } from "@/components/RequestBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import type { Endpoint } from "@splice/openapi";

function ApiExplorerContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const router = useRouter();
  const { spec, metadata, hasSpec } = useStoredSpec(specId || undefined);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null
  );

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

  // Center Panel - Request Builder or Empty State
  const centerPanel = selectedEndpoint ? (
    <RequestBuilder
      endpoint={selectedEndpoint}
      allSchemas={spec.schemas}
      baseUrl={spec.info.servers?.[0]?.url}
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

  // Right Panel - Code Samples (auto-generated)
  const rightPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Code Samples</h2>
        {selectedEndpoint && (
          <Badge variant="outline" className="text-xs">
            Auto-generated
          </Badge>
        )}
      </div>
      {selectedEndpoint ? (
        <div className="space-y-3">
          {/* cURL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon
                  icon="simple-icons:curl"
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                />
                cURL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto scrollbar-thin">
                {`curl -X ${selectedEndpoint.method.toUpperCase()} \\
  '${spec.info.servers?.[0]?.url || "https://api.example.com"}${
                  selectedEndpoint.path
                }' \\
  -H 'Content-Type: application/json'${
    selectedEndpoint.requestBody
      ? ` \\
  -d '{
    "key": "value"
  }'`
      : ""
  }`}
              </pre>
            </CardContent>
          </Card>

          {/* JavaScript/Fetch */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon
                  icon="simple-icons:javascript"
                  className="w-4 h-4 text-yellow-500 dark:text-yellow-400"
                />
                JavaScript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto scrollbar-thin">
                {`fetch('${
                  spec.info.servers?.[0]?.url || "https://api.example.com"
                }${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method.toUpperCase()}',
  headers: {
    'Content-Type': 'application/json'
  }${
    selectedEndpoint.requestBody
      ? `,
  body: JSON.stringify({
    key: 'value'
  })`
      : ""
  }
})
  .then(res => res.json())
  .then(data => console.log(data));`}
              </pre>
            </CardContent>
          </Card>

          {/* Python */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon
                  icon="simple-icons:python"
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                />
                Python
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto scrollbar-thin">
                {`import requests

url = '${spec.info.servers?.[0]?.url || "https://api.example.com"}${
                  selectedEndpoint.path
                }'
headers = {'Content-Type': 'application/json'}${
                  selectedEndpoint.requestBody
                    ? `
data = {'key': 'value'}

response = requests.${selectedEndpoint.method}(url, headers=headers, json=data)`
                    : `

response = requests.${selectedEndpoint.method}(url, headers=headers)`
                }
print(response.json())`}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Icon
              icon="lucide:code-2"
              className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Select an endpoint to see code samples
            </p>
          </CardContent>
        </Card>
      )}
    </div>
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

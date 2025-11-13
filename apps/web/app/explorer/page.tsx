"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";
import type { HTTPMethod, SchemaObject } from "@splice/openapi";
import { SchemaViewer } from "@/components/SchemaViewer";

const METHOD_COLORS: Record<HTTPMethod, string> = {
  get: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  post: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  put: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  patch:
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  delete: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  options: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  head: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  trace: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

function ExplorerContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const { spec, metadata, isLoading, hasSpec, allSpecs, switchSpec } =
    useStoredSpec(specId || undefined);
  const router = useRouter();
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [serversOpen, setServersOpen] = useState(true);
  const [endpointsOpen, setEndpointsOpen] = useState(true);
  const [schemasOpen, setSchemasOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 py-24">
        <Card className="max-w-2xl w-full">
          <CardContent className="text-center p-12">
            <Icon
              icon="lucide:loader-2"
              className="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
            />
            <p className="text-lg">Loading specification...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasSpec || !spec) {
    return (
      <div className="flex items-center justify-center p-8 py-24">
        <Card className="max-w-2xl w-full">
          <CardHeader className="flex flex-col items-center gap-3 pb-6">
            <div className="text-7xl">🔍</div>
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-4xl">Schema Explorer</CardTitle>
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

  const handleSpecChange = (newSpecId: string) => {
    switchSpec(newSpecId);
    router.push(`/explorer?specId=${newSpecId}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{spec.info.title}</h1>
            <p className="text-muted-foreground">
              Version {spec.info.version}
              {metadata?.fileName && ` • ${metadata.fileName}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allSpecs.length > 1 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs rounded-full">
                  {allSpecs.length} specs
                </Badge>
                <Select
                  value={specId || allSpecs[allSpecs.length - 1]?.specId}
                  onValueChange={handleSpecChange}
                >
                  <SelectTrigger className="w-[320px] h-11 rounded-full">
                    <SelectValue placeholder="Select a spec" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSpecs.map((s) => {
                      const displayText = `${
                        s.metadata.fileName || s.spec.info.title
                      } • v${s.spec.info.version}`;
                      return (
                        <SelectItem key={s.specId} value={s.specId}>
                          {displayText}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              variant="default"
              onClick={() =>
                router.push(
                  specId ? `/api-explorer?specId=${specId}` : "/api-explorer"
                )
              }
              className="h-11 rounded-full px-6"
            >
              <Icon icon="lucide:play" className="w-4 h-4 mr-2" />
              Try API
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/upload")}
              className="h-11 rounded-full px-6"
            >
              <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
              Upload New Spec
            </Button>
          </div>
        </div>
        {spec.info.description && (
          <p className="text-base text-foreground/70 mt-4">
            {spec.info.description}
          </p>
        )}
      </div>

      {/* Servers */}
      {spec.info.servers && spec.info.servers.length > 0 && (
        <Collapsible
          open={serversOpen}
          onOpenChange={setServersOpen}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="lucide:server" className="w-4 h-4" />
                  Servers
                  <Badge variant="secondary" className="text-xs">
                    {spec.info.servers.length}
                  </Badge>
                </CardTitle>
                <Icon
                  icon={
                    serversOpen ? "lucide:chevron-up" : "lucide:chevron-down"
                  }
                  className="w-5 h-5"
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {spec.info.servers.map((server, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Icon
                        icon="lucide:server"
                        className="w-5 h-5 text-primary"
                      />
                      <div>
                        <p className="font-mono text-sm">{server.url}</p>
                        {server.description && (
                          <p className="text-sm text-muted-foreground">
                            {server.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Endpoints */}
      <Collapsible open={endpointsOpen} onOpenChange={setEndpointsOpen}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="lucide:route" className="w-4 h-4" />
                Endpoints
                <Badge variant="secondary" className="text-xs">
                  {spec.endpoints.length}
                </Badge>
              </CardTitle>
              <Icon
                icon={
                  endpointsOpen ? "lucide:chevron-up" : "lucide:chevron-down"
                }
                className="w-5 h-5"
              />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-2">
                {spec.endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "uppercase font-mono text-xs w-16 justify-center",
                        METHOD_COLORS[endpoint.method]
                      )}
                    >
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-mono text-sm">{endpoint.path}</p>
                      {endpoint.summary && (
                        <p className="text-sm text-muted-foreground">
                          {endpoint.summary}
                        </p>
                      )}
                    </div>
                    {endpoint.tags && endpoint.tags.length > 0 && (
                      <div className="flex gap-1">
                        {endpoint.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Schemas */}
      {Object.keys(spec.schemas).length > 0 && (
        <Collapsible
          open={schemasOpen}
          onOpenChange={setSchemasOpen}
          className="mt-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="lucide:box" className="w-4 h-4" />
                  Schemas
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(spec.schemas).length}
                  </Badge>
                </CardTitle>
                <Icon
                  icon={
                    schemasOpen ? "lucide:chevron-up" : "lucide:chevron-down"
                  }
                  className="w-5 h-5"
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(spec.schemas).map((schemaName) => (
                    <div key={schemaName}>
                      <button
                        onClick={() =>
                          setSelectedSchema(
                            selectedSchema === schemaName ? null : schemaName
                          )
                        }
                        className={cn(
                          "w-full flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                          selectedSchema === schemaName &&
                            "bg-muted/50 border-primary"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Icon
                            icon="lucide:box"
                            className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0"
                          />
                          <p className="font-mono text-sm truncate">
                            {schemaName}
                          </p>
                        </div>
                        <Icon
                          icon={
                            selectedSchema === schemaName
                              ? "lucide:chevron-up"
                              : "lucide:chevron-down"
                          }
                          className="w-4 h-4 flex-shrink-0 text-muted-foreground"
                        />
                      </button>
                      {selectedSchema === schemaName &&
                        spec.schemas[selectedSchema] && (
                          <div className="mt-2 ml-7">
                            <SchemaViewer
                              schema={
                                spec.schemas[selectedSchema] as SchemaObject
                              }
                              title={`${selectedSchema} Schema`}
                              defaultExpanded={true}
                              resizable={false}
                              allSchemas={
                                spec.schemas as Record<string, SchemaObject>
                              }
                            />
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 py-24">
          <Card className="max-w-2xl w-full">
            <CardContent className="text-center p-12">
              <Icon
                icon="lucide:loader-2"
                className="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
              />
              <p className="text-lg">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}

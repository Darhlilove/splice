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
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Suspense } from "react";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const { spec, metadata, isLoading, hasSpec, allSpecs, switchSpec } =
    useStoredSpec(specId || undefined);
  const router = useRouter();

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
                    <SelectValue placeholder="Select a spec">
                      {(() => {
                        const currentSpec = allSpecs.find(
                          (s) =>
                            s.specId ===
                            (specId || allSpecs[allSpecs.length - 1]?.specId)
                        );
                        if (!currentSpec) return "Select a spec";
                        return `${
                          currentSpec.metadata.fileName ||
                          currentSpec.spec.info.title
                        } • v${currentSpec.spec.info.version}`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allSpecs.map((s) => (
                      <SelectItem key={s.specId} value={s.specId}>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">
                            {s.spec.info.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.metadata.fileName || "Uploaded spec"} • v
                            {s.spec.info.version}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spec.info.servers.map((server, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Icon icon="lucide:server" className="w-5 h-5 text-primary" />
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
        </Card>
      )}

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints ({spec.endpoints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {spec.endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Badge
                  variant={
                    endpoint.method === "get"
                      ? "secondary"
                      : endpoint.method === "post"
                      ? "default"
                      : endpoint.method === "delete"
                      ? "destructive"
                      : "outline"
                  }
                  className="uppercase font-mono text-xs w-16 justify-center"
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
      </Card>

      {/* Schemas */}
      {Object.keys(spec.schemas).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Schemas ({Object.keys(spec.schemas).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.keys(spec.schemas).map((schemaName) => (
                <div
                  key={schemaName}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="font-mono text-sm truncate">{schemaName}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

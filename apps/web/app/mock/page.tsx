"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MockServerControls } from "@/components/MockServerControls";
import { useStoredSpec } from "@/hooks/use-stored-spec";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Suspense } from "react";

function MockPageContent() {
  const searchParams = useSearchParams();
  const specId = searchParams.get("specId");
  const router = useRouter();
  const { spec, metadata, hasSpec, isLoading } = useStoredSpec(
    specId || undefined
  );

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
            <div className="text-7xl">🎭</div>
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-4xl">Mock Server</CardTitle>
              <Badge variant="secondary">No Spec Loaded</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">
              Generate realistic mock APIs from your spec
            </p>
            <p className="text-base text-foreground/70">
              Instant mock server • Realistic responses • No backend required
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

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mock Server</h1>
        <p className="text-muted-foreground">
          {spec.info.title} • Version {spec.info.version}
          {metadata?.fileName && ` • ${metadata.fileName}`}
        </p>
      </div>

      <div className="space-y-6">
        {/* Mock Server Controls */}
        {specId && (
          <MockServerControls
            specId={specId}
            spec={spec}
            onServerStart={(info) => {
              console.log("Mock server started:", info);
            }}
            onServerStop={() => {
              console.log("Mock server stopped");
            }}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>About Mock Servers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mock servers generate realistic API responses based on your
              OpenAPI specification. This allows you to test your API
              integration without requiring a live backend.
            </p>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Automatic response generation from schemas</li>
                <li>Example-based responses when available</li>
                <li>Request validation against your spec</li>
                <li>Dynamic port allocation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MockPage() {
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
      <MockPageContent />
    </Suspense>
  );
}

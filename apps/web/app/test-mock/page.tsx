"use client";

import { useState } from "react";
import { MockServerControls } from "@/components/MockServerControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestMockPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadSimplePetstore = async () => {
    setLoading(true);
    try {
      // Fetch from API route
      const response = await fetch("/api/test-specs/simple-petstore.json");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text());
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      setSpec(data);
      console.log("Loaded spec:", data);
      console.log("Spec has components:", !!data.components);
      console.log("Spec has schemas:", !!data.components?.schemas);
      if (data.components?.schemas) {
        console.log("Schema keys:", Object.keys(data.components.schemas));
      }
    } catch (error) {
      console.error("Failed to load spec:", error);
      alert(
        `Failed to load spec: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Mock Server Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Load Test Spec</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={loadSimplePetstore} disabled={loading}>
            {loading ? "Loading..." : "Load Simple Petstore Spec"}
          </Button>
        </CardContent>
      </Card>

      {spec && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Spec Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Title:</strong> {spec.info?.title}
              </div>
              <div>
                <strong>Version:</strong> {spec.info?.version}
              </div>
              <div>
                <strong>Has components:</strong>{" "}
                {spec.components ? "✅ Yes" : "❌ No"}
              </div>
              <div>
                <strong>Has schemas:</strong>{" "}
                {spec.components?.schemas ? "✅ Yes" : "❌ No"}
              </div>
              {spec.components?.schemas && (
                <div>
                  <strong>Schema keys:</strong>{" "}
                  {Object.keys(spec.components.schemas).join(", ")}
                </div>
              )}
              <div>
                <strong>Paths:</strong>{" "}
                {Object.keys(spec.paths || {}).join(", ")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mock Server Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <MockServerControls specId="test-simple-petstore" spec={spec} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Spec (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(spec, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

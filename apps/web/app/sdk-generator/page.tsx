"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SdkGeneratorPage() {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full">
        <CardHeader className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">⚡</div>
          <div className="flex flex-col items-center gap-2">
            <CardTitle className="text-4xl">SDK Generator</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">
            Create type-safe client libraries automatically
          </p>
          <p className="text-base text-foreground/70">
            TypeScript support • Full type safety • Auto-generated docs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

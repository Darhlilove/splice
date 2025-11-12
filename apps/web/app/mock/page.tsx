"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MockPage() {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full">
        <CardHeader className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">🎭</div>
          <div className="flex flex-col items-center gap-2">
            <CardTitle className="text-4xl">Mock Server</CardTitle>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">Generate realistic mock APIs from your spec</p>
          <p className="text-base text-foreground/70">
            Instant mock server • Realistic responses • No backend required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

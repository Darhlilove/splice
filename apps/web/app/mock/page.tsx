"use client";

import { Card, Chip } from "@heroui/react";

export default function MockPage() {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full">
        <Card.Header className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">🎭</div>
          <div className="flex flex-col items-center gap-2">
            <Card.Title className="text-4xl">Mock Server</Card.Title>
            <Chip color="warning" variant="secondary">
              Coming Soon
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="text-center space-y-4">
          <p className="text-lg">Generate realistic mock APIs from your spec</p>
          <p className="text-sm text-muted">
            Instant mock server • Realistic responses • No backend required
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

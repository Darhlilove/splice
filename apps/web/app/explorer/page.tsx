"use client";

import { Card, Chip } from "@heroui/react";

export default function ExplorerPage() {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full">
        <Card.Header className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">🔍</div>
          <div className="flex flex-col items-center gap-2">
            <Card.Title className="text-4xl">Schema Explorer</Card.Title>
            <Chip color="warning" variant="secondary">
              Coming Soon
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="text-center space-y-4">
          <p className="text-lg">Interactive API documentation viewer</p>
          <p className="text-sm text-muted">
            Browse endpoints • View schemas • Test requests • Response examples
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

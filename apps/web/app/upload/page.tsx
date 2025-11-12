"use client";

import { Card, Chip } from "@heroui/react";

export default function UploadPage() {
  return (
    <div className="flex items-center justify-center p-8 py-24">
      <Card className="max-w-2xl w-full">
        <Card.Header className="flex flex-col items-center gap-3 pb-6">
          <div className="text-7xl">📤</div>
          <div className="flex flex-col items-center gap-2">
            <Card.Title className="text-4xl">Upload Spec</Card.Title>
            <Chip color="warning" variant="secondary">
              Coming Soon
            </Chip>
          </div>
        </Card.Header>
        <Card.Content className="text-center space-y-4">
          <p className="text-lg">
            Upload your OpenAPI/Swagger specification files
          </p>
          <p className="text-sm text-muted">
            Support for YAML and JSON formats • Drag & drop interface • URL
            import
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

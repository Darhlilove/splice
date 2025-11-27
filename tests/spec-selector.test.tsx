import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpecSelector } from "@/components/SpecSelector";
import type { SpecMetadata } from "@/contexts/workflow-context";

describe("SpecSelector", () => {
  const mockCurrentSpec: SpecMetadata = {
    id: "spec-1",
    name: "Petstore API",
    version: "1.0.0",
    uploadedAt: new Date("2024-01-01"),
    lastAccessedAt: new Date("2024-01-02"),
  };

  const mockRecentSpecs: SpecMetadata[] = [
    mockCurrentSpec,
    {
      id: "spec-2",
      name: "Stripe API",
      version: "2023-10-16",
      uploadedAt: new Date("2024-01-03"),
      lastAccessedAt: new Date("2024-01-04"),
    },
  ];

  it("displays current spec name and version", () => {
    const onSpecSelect = vi.fn();
    const onUploadNew = vi.fn();

    render(
      <SpecSelector
        currentSpec={mockCurrentSpec}
        recentSpecs={mockRecentSpecs}
        onSpecSelect={onSpecSelect}
        onUploadNew={onUploadNew}
      />
    );

    // Check that the current spec is displayed
    expect(screen.getByText(/Petstore API v1.0.0/)).toBeDefined();
  });

  it("displays 'No spec selected' when no current spec", () => {
    const onSpecSelect = vi.fn();
    const onUploadNew = vi.fn();

    render(
      <SpecSelector
        currentSpec={null}
        recentSpecs={[]}
        onSpecSelect={onSpecSelect}
        onUploadNew={onUploadNew}
      />
    );

    // Check that placeholder is shown
    expect(screen.getByText("No spec")).toBeDefined();
  });
});

"use client";

import { useEffect, Suspense } from "react";
import { UploadForm } from "@/components/UploadForm";
import { useWorkflow } from "@/contexts/workflow-context";
import { useSearchParams } from "next/navigation";

function UploadContent() {
  const { setCurrentStep } = useWorkflow();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "file" | "url" | null;
  const url = searchParams.get("url");

  // Set current step to upload when page loads
  useEffect(() => {
    setCurrentStep("upload");
  }, [setCurrentStep]);

  const handleSubmit = (data: {
    mode: "file" | "url";
    file?: File;
    url?: string;
  }) => {
    console.log("Form submitted:", data);

    if (data.mode === "file" && data.file) {
      console.log("File:", data.file.name, data.file.size);
    } else if (data.mode === "url" && data.url) {
      console.log("URL:", data.url);
    }
  };

  return (
    <UploadForm
      onSubmit={handleSubmit}
      initialMode={mode || "file"}
      initialUrl={url || ""}
    />
  );
}

export default function UploadPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <UploadContent />
      </Suspense>
    </div>
  );
}

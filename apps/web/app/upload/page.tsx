"use client";

import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
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
    <div className="flex min-h-screen items-center justify-center p-8">
      <UploadForm onSubmit={handleSubmit} />
    </div>
  );
}

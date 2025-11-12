"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icon } from "@iconify/react";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type UploadMode = "file" | "url";

interface UploadFormProps {
  onSubmit?: (data: { mode: UploadMode; file?: File; url?: string }) => void;
}

export function UploadForm({ onSubmit }: UploadFormProps) {
  const [mode, setMode] = useState<UploadMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [urlValue, setUrlValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (file: File): string | null => {
    const validExtensions = [".json", ".yaml", ".yml"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      return "Please upload a JSON or YAML file";
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFileError("");

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (mode === "file" && !selectedFile) {
      setFileError("Please select a file");
      return;
    }

    if (mode === "url" && !urlValue) {
      return;
    }

    setIsUploading(true);
    setFileError("");

    try {
      if (mode === "file" && selectedFile) {
        // Upload file
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          setFileError(result.error || "Failed to parse specification");
          setIsUploading(false);
          return;
        }

        // Store parsed spec and specId in sessionStorage
        sessionStorage.setItem("parsedSpec", JSON.stringify(result.data));
        sessionStorage.setItem("specMetadata", JSON.stringify(result.metadata));
        if (result.specId) {
          sessionStorage.setItem("specId", result.specId);
        }

        // Navigate to explorer with specId in URL
        router.push(
          result.specId ? `/explorer?specId=${result.specId}` : "/explorer"
        );
      } else if (mode === "url" && urlValue) {
        // Parse from URL
        const response = await fetch("/api/parse-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: urlValue }),
        });

        const result = await response.json();

        if (!result.success) {
          setFileError(result.error || "Failed to parse specification");
          setIsUploading(false);
          return;
        }

        // Store parsed spec and specId in sessionStorage
        sessionStorage.setItem("parsedSpec", JSON.stringify(result.data));
        sessionStorage.setItem("specMetadata", JSON.stringify(result.metadata));
        if (result.specId) {
          sessionStorage.setItem("specId", result.specId);
        }

        // Navigate to explorer with specId in URL
        router.push(
          result.specId ? `/explorer?specId=${result.specId}` : "/explorer"
        );
      }

      // Call the optional onSubmit callback
      onSubmit?.({
        mode,
        file: mode === "file" ? selectedFile || undefined : undefined,
        url: mode === "url" ? urlValue : undefined,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setFileError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">
          Upload OpenAPI Specification
        </h1>
        <p className="text-muted-foreground text-lg">
          Select your OpenAPI spec file to parse and explore.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Mode Selection - Radio Buttons */}
        <div className="flex justify-center">
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as UploadMode)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="file" id="file" />
              <Label htmlFor="file" className="font-medium cursor-pointer">
                File Upload
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="url" />
              <Label htmlFor="url" className="font-medium cursor-pointer">
                URL
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* File Upload Mode */}
        {mode === "file" && (
          <div className="flex flex-col gap-6">
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center
                transition-colors cursor-pointer
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4 pointer-events-none">
                <div className="flex gap-2">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon
                      icon="lucide:file-code"
                      className="w-8 h-8 text-primary"
                    />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon
                      icon="lucide:file-text"
                      className="w-8 h-8 text-primary"
                    />
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon icon="lucide:file" className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div>
                  <p className="text-xl font-semibold mb-2">
                    Drag and drop spec files to upload
                  </p>
                  <p className="text-muted-foreground text-sm">
                    For maximum compatibility, upload in
                    <br />
                    JSON, YAML, or YML formats.
                  </p>
                </div>

                <Button variant="secondary" className="pointer-events-auto">
                  Select files
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,application/json,application/x-yaml,text/yaml"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* File Error */}
            {fileError && (
              <div className="border border-destructive/50 bg-destructive/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="lucide:circle-alert"
                    className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-destructive">
                      Invalid File
                    </p>
                    <p className="text-sm text-destructive/80">{fileError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected File Display */}
            {selectedFile && !fileError && (
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon
                      icon={
                        selectedFile.name.endsWith(".json")
                          ? "lucide:file-code"
                          : "lucide:file-text"
                      }
                      className="w-6 h-6 text-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileError("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <Icon icon="lucide:x" className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* URL Mode */}
        {mode === "url" && (
          <div className="border-2 border-dashed border-border rounded-2xl p-8">
            <div className="flex flex-col gap-3">
              <Label htmlFor="url-input" className="font-medium">
                OpenAPI Spec URL
              </Label>
              <input
                id="url-input"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/openapi.json"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL to your OpenAPI specification file
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setFileError("");
              setUrlValue("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isUploading ||
              (mode === "file" && !selectedFile) ||
              (mode === "url" && !urlValue)
            }
          >
            {isUploading ? (
              <>
                <Icon
                  icon="lucide:loader-2"
                  className="w-4 h-4 mr-2 animate-spin"
                />
                Parsing...
              </>
            ) : (
              <>
                <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                Parse Specification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { storeSpec, getAllStoredSpecs } from "@/lib/spec-storage";
import { useSettings } from "@/contexts/settings-context";
import { useMockServer } from "@/contexts/mock-server-context";
import { useWorkflow } from "@/contexts/workflow-context";
import { toast } from "sonner";

type UploadMode = "file" | "url";

interface UploadFormProps {
  onSubmit?: (data: { mode: UploadMode; file?: File; url?: string }) => void;
  initialMode?: UploadMode;
  initialUrl?: string;
}

export function UploadForm({ onSubmit, initialMode = "file", initialUrl = "" }: UploadFormProps) {
  const [mode, setMode] = useState<UploadMode>(initialMode);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");
  const [urlValue, setUrlValue] = useState(initialUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [storedSpecsCount] = useState(() => {
    // Initialize with stored specs count (client-side only)
    if (typeof window === "undefined") return 0;
    return getAllStoredSpecs().length;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { settings } = useSettings();
  const { setMockServerInfo } = useMockServer();
  const { setCurrentSpec } = useWorkflow();

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
    const files = Array.from(e.target.files || []);
    setFileError("");

    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    // Validate all files
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setFileError(`${file.name}: ${error}`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
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

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    // Validate all files
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setFileError(`${file.name}: ${error}`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
  };

  const startMockServer = async (
    specId: string,
    spec: any,
    retryCount = 0
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/mock/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ specId, spec }),
      });

      const result = await response.json();

      if (result.success && result.serverInfo) {
        setMockServerInfo(result.serverInfo);
        toast.success("Mock server started", {
          description: `Server running at ${result.serverInfo.url}`,
          action: {
            label: "Open",
            onClick: () => window.open(result.serverInfo.url, "_blank"),
          },
        });
        return true;
      } else {
        throw new Error(result.error || "Failed to start mock server");
      }
    } catch (error) {
      console.error("Mock server auto-start error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Show error toast with retry option
      if (retryCount < 2) {
        toast.error("Mock server failed to start", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => startMockServer(specId, spec, retryCount + 1),
          },
        });
      } else {
        toast.error("Mock server failed to start", {
          description: errorMessage,
        });
      }

      return false;
    }
  };

  const handleSubmit = async () => {
    if (mode === "file" && selectedFiles.length === 0) {
      setFileError("Please select at least one file");
      return;
    }

    if (mode === "url" && !urlValue) {
      return;
    }

    setIsUploading(true);
    setFileError("");

    try {
      if (mode === "file" && selectedFiles.length > 0) {
        // Upload all files
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          return response.json();
        });

        const results = await Promise.all(uploadPromises);

        // Check if any failed
        const failed = results.find((r) => !r.success);
        if (failed) {
          setFileError(
            failed.error || "Failed to parse one or more specifications"
          );
          setIsUploading(false);
          return;
        }

        // Store all parsed specs
        let lastSpecId = null;
        let lastSpec = null;
        for (const result of results) {
          if (result.specId && result.data) {
            storeSpec(result.specId, result.data, result.metadata);
            lastSpecId = result.specId;
            lastSpec = result.data;
          }
        }

        // Update workflow context with the last uploaded spec (Requirement 1.1)
        if (lastSpecId && lastSpec) {
          setCurrentSpec(lastSpec, {
            id: lastSpecId,
            name: lastSpec.info.title,
            version: lastSpec.info.version,
            uploadedAt: new Date(),
          });

          // Auto-start mock server if enabled
          if (settings.autoStartMockServer) {
            // Start mock server in background (don't wait for it)
            startMockServer(lastSpecId, lastSpec);
          }
        }

        // Navigate to explorer with the last uploaded spec
        router.push(
          lastSpecId ? `/explorer?specId=${lastSpecId}` : "/explorer"
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

        // Store parsed spec using the storage utility
        if (result.specId && result.data) {
          storeSpec(result.specId, result.data, result.metadata);

          // Update workflow context with the uploaded spec (Requirement 1.1)
          setCurrentSpec(result.data, {
            id: result.specId,
            name: result.data.info.title,
            version: result.data.info.version,
            uploadedAt: new Date(),
          });

          // Auto-start mock server if enabled
          if (settings.autoStartMockServer) {
            // Start mock server in background (don't wait for it)
            startMockServer(result.specId, result.data);
          }
        }

        // Navigate to explorer with specId in URL
        router.push(
          result.specId ? `/explorer?specId=${result.specId}` : "/explorer"
        );
      }

      // Call the optional onSubmit callback
      onSubmit?.({
        mode,
        file: mode === "file" ? selectedFiles[0] || undefined : undefined,
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
        <div className="flex items-center justify-center gap-3 mb-3">
          <h1 className="text-4xl font-bold">Upload OpenAPI Specification</h1>
          {storedSpecsCount > 0 && (
            <Badge variant="secondary" className="text-sm rounded-full">
              {storedSpecsCount} stored
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Select your OpenAPI spec file to parse and explore.
        </p>
        {storedSpecsCount > 0 && (
          <Button
            variant="link"
            onClick={() => router.push("/explorer")}
            className="mt-2"
          >
            <Icon icon="lucide:eye" className="w-4 h-4 mr-2" />
            View stored specs
          </Button>
        )}
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
                ${isDragging
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
                multiple
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

            {/* Selected Files Display */}
            {selectedFiles.length > 0 && !fileError && (
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    {selectedFiles.length} file
                    {selectedFiles.length > 1 ? "s" : ""} selected
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles([]);
                      setFileError("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon
                          icon={
                            file.name.endsWith(".json")
                              ? "lucide:file-code"
                              : "lucide:file-text"
                          }
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== index)
                          );
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <Icon icon="lucide:x" className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
            className="h-11 rounded-full px-6"
            onClick={() => {
              setSelectedFiles([]);
              setFileError("");
              setUrlValue("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full px-6"
            onClick={handleSubmit}
            disabled={
              isUploading ||
              (mode === "file" && selectedFiles.length === 0) ||
              (mode === "url" && !urlValue)
            }
          >
            {isUploading ? (
              <>
                <Icon
                  icon="lucide:loader-2"
                  className="w-4 h-4 mr-2 animate-spin"
                />
                Parsing{" "}
                {selectedFiles.length > 1
                  ? `${selectedFiles.length} files`
                  : ""}
                ...
              </>
            ) : (
              <>
                <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                Parse{" "}
                {selectedFiles.length > 1
                  ? `${selectedFiles.length} Specifications`
                  : "Specification"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

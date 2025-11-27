"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

/**
 * SdkDownloadSection Component
 *
 * Provides download functionality and metadata for generated SDK packages.
 *
 * Features:
 * - Prominent "Download SDK" button
 * - Package name and version display
 * - File size display (formatted as KB/MB)
 * - Success message and icon
 * - "Generate New SDK" option to reset workflow
 * - Download expiration notice
 *
 * @example
 * ```tsx
 * <SdkDownloadSection
 *   downloadUrl="/api/sdk/download/abc123"
 *   packageName="my-api-client"
 *   packageVersion="1.0.0"
 *   fileSize={251904}
 *   onGenerateNew={() => resetState()}
 * />
 * ```
 */

interface SdkDownloadSectionProps {
  downloadUrl: string;
  packageName: string;
  packageVersion: string;
  fileSize: number;
  onGenerateNew?: () => void;
}

/**
 * Format file size in bytes to human-readable format (KB/MB)
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export function SdkDownloadSection({
  downloadUrl,
  packageName,
  packageVersion,
  fileSize,
  onGenerateNew,
}: SdkDownloadSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Handle SDK download
   * Triggers download when button clicked, sets filename to package name
   */
  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Fetch the file
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${packageName}.zip`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("SDK downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download SDK. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full border-green-500/50 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-green-600 dark:text-green-400">
          <Icon icon="lucide:check-circle" className="h-5 w-5 sm:h-6 sm:w-6" />
          SDK Ready for Download
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-2">
          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🎉</div>
          <p className="text-base sm:text-lg font-medium">
            Your SDK has been generated successfully!
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Download your package and start integrating with your API
          </p>
        </div>

        {/* Package Metadata */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Package Name:
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-xs sm:text-sm w-fit"
            >
              {packageName}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Version:
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-xs sm:text-sm w-fit"
            >
              v{packageVersion}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-muted-foreground">
              File Size:
            </span>
            <Badge
              variant="secondary"
              className="font-mono text-xs sm:text-sm w-fit"
            >
              {formatFileSize(fileSize)}
            </Badge>
          </div>
        </div>

        {/* Download Button */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base sm:text-lg h-12 sm:h-14"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label={`Download ${packageName} version ${packageVersion} SDK package`}
          >
            {isDownloading ? (
              <>
                <Icon
                  icon="lucide:loader-2"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin"
                  aria-hidden="true"
                />
                Downloading...
              </>
            ) : (
              <>
                <Icon
                  icon="lucide:download"
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  aria-hidden="true"
                />
                Download SDK
              </>
            )}
          </Button>

          {/* Generate New Button */}
          {onGenerateNew && (
            <Button
              size="default"
              variant="outline"
              className="w-full"
              onClick={onGenerateNew}
            >
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
              Generate New SDK
            </Button>
          )}
        </div>

        {/* Expiration Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <Icon icon="lucide:info" className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Download links expire after 1 hour. Make sure to download your SDK
            before then.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

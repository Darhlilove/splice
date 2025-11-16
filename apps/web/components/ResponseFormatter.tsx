"use client";

import * as React from "react";
import { APIResponse } from "@/lib/request-state";
import { Button } from "@/components/ui/button";
import { Copy, Download, Minimize2, Maximize2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Format options for response display
 */
export type ResponseFormat = "pretty" | "minified" | "raw";

/**
 * Props for the ResponseFormatter component
 */
export interface ResponseFormatterProps {
  response: APIResponse;
  format: ResponseFormat;
  onFormatChange: (format: ResponseFormat) => void;
}

/**
 * Determine file extension based on content type
 */
function getFileExtension(contentType: string): string {
  const type = contentType.toLowerCase();

  if (
    type.includes("application/json") ||
    type.includes("application/vnd.api+json")
  ) {
    return "json";
  } else if (type.includes("text/xml") || type.includes("application/xml")) {
    return "xml";
  } else if (type.includes("text/html")) {
    return "html";
  } else {
    return "txt";
  }
}

/**
 * Format response body based on format type
 */
function formatResponseBody(
  body: any,
  format: ResponseFormat,
  contentType: string
): string {
  const type = contentType.toLowerCase();
  const isJson =
    type.includes("application/json") ||
    type.includes("application/vnd.api+json");

  try {
    if (isJson) {
      const jsonObj = typeof body === "string" ? JSON.parse(body) : body;

      if (format === "pretty") {
        return JSON.stringify(jsonObj, null, 2);
      } else if (format === "minified") {
        return JSON.stringify(jsonObj);
      } else {
        // raw format
        return typeof body === "string"
          ? body
          : JSON.stringify(jsonObj, null, 2);
      }
    } else {
      // For non-JSON content, return as-is
      return typeof body === "string" ? body : String(body);
    }
  } catch (err) {
    // If parsing fails, return as string
    return typeof body === "string" ? body : String(body);
  }
}

/**
 * Custom hook for debouncing format changes
 */
function useDebouncedFormatChange(
  onFormatChange: (format: ResponseFormat) => void,
  delay: number = 300
) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedChange = React.useCallback(
    (format: ResponseFormat) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onFormatChange(format);
      }, delay);
    },
    [onFormatChange, delay]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedChange;
}

/**
 * ResponseFormatter component (memoized for performance)
 * Provides formatting controls, copy to clipboard, and download functionality
 */
export const ResponseFormatter = React.memo(function ResponseFormatter({
  response,
  format,
  onFormatChange,
}: ResponseFormatterProps) {
  const contentType = (response.contentType || "").toLowerCase();
  const isJson =
    contentType.includes("application/json") ||
    contentType.includes("application/vnd.api+json");

  // Debounce format changes to prevent excessive re-renders
  const debouncedFormatChange = useDebouncedFormatChange(onFormatChange, 300);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    try {
      const formattedBody = formatResponseBody(
        response.body,
        format,
        response.contentType
      );
      await navigator.clipboard.writeText(formattedBody);
      toast.success("Copied to clipboard", {
        description: "Response body has been copied successfully",
      });
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy", {
        description: "Could not copy response to clipboard",
      });
    }
  };

  /**
   * Handle download as file
   */
  const handleDownload = () => {
    try {
      const formattedBody = formatResponseBody(
        response.body,
        format,
        response.contentType
      );
      const extension = getFileExtension(response.contentType);

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `response-${timestamp}.${extension}`;

      // Create blob and trigger download
      const blob = new Blob([formattedBody], {
        type: response.contentType || "text/plain",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started", {
        description: `Downloading ${filename}`,
      });
    } catch (err) {
      console.error("Failed to download file:", err);
      toast.error("Download failed", {
        description: "Could not download response file",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Format Controls - Only show for JSON */}
      {isJson && (
        <>
          <Button
            variant={format === "pretty" ? "default" : "outline"}
            size="sm"
            onClick={() => debouncedFormatChange("pretty")}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Pretty
          </Button>
          <Button
            variant={format === "minified" ? "default" : "outline"}
            size="sm"
            onClick={() => debouncedFormatChange("minified")}
            className="gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            Minify
          </Button>
        </>
      )}

      {/* Copy Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        Copy
      </Button>

      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
    </div>
  );
});

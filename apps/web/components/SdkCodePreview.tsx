"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

/**
 * SdkCodePreview Component
 *
 * Displays samples of generated SDK code with syntax highlighting and copy functionality.
 *
 * Features:
 * - Displays API client class sample
 * - Shows TypeScript interface examples
 * - Provides usage example code
 * - Syntax highlighting with react-syntax-highlighter
 * - Copy to clipboard functionality for each sample
 * - Toast notifications on successful copy
 *
 * @example
 * ```tsx
 * <SdkCodePreview
 *   generationId="gen-123-abc"
 *   language="typescript"
 * />
 * ```
 */

interface SdkCodePreviewProps {
  generationId: string;
  language: string;
  codeSamples?: CodeSample[];
}

interface CodeSample {
  title: string;
  code: string;
  language: string;
}

export function SdkCodePreview({
  generationId,
  language,
  codeSamples,
}: SdkCodePreviewProps) {
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);

  // Default code samples if none provided
  const defaultSamples: CodeSample[] = [
    {
      title: "API Client",
      code: `import { Configuration, DefaultApi } from "my-api-client";

const config = new Configuration({
  basePath: "https://api.example.com",
  apiKey: "your-api-key",
});

const api = new DefaultApi(config);`,
      language: "typescript",
    },
    {
      title: "Type Definitions",
      code: `export interface Pet {
  id: number;
  name: string;
  status: "available" | "pending" | "sold";
}

export interface ApiResponse {
  code: number;
  message: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}`,
      language: "typescript",
    },
    {
      title: "Usage Example",
      code: `async function getPet(petId: number) {
  try {
    const pet = await api.getPetById({ petId });
    console.log("Pet:", pet);
    return pet;
  } catch (error) {
    console.error("Error fetching pet:", error);
    throw error;
  }
}

// Initialize and use the SDK
const result = await getPet(123);`,
      language: "typescript",
    },
  ];

  const samples = codeSamples || defaultSamples;

  // Handle copy to clipboard
  const handleCopy = async (code: string, index: number) => {
    try {
      setCopyingIndex(index);
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code. Please try again.");
    } finally {
      // Reset copying state after animation
      setTimeout(() => setCopyingIndex(null), 1000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Icon icon="lucide:code" className="h-5 w-5" />
          Code Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" className="w-full">
          <TabsList
            className="grid w-full grid-cols-3 h-auto"
            role="tablist"
            aria-label="Code sample tabs"
          >
            {samples.map((sample, index) => (
              <TabsTrigger
                key={index}
                value={index.toString()}
                className="text-xs sm:text-sm py-2 sm:py-1.5"
                role="tab"
                aria-label={`View ${sample.title} code sample`}
              >
                {sample.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {samples.map((sample, index) => (
            <TabsContent
              key={index}
              value={index.toString()}
              className="mt-4"
              role="tabpanel"
              aria-label={`${sample.title} code sample`}
            >
              <div className="relative">
                {/* Copy Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 z-10 text-xs sm:text-sm"
                  onClick={() => handleCopy(sample.code, index)}
                  disabled={copyingIndex === index}
                  aria-label={`Copy ${sample.title} code to clipboard`}
                >
                  {copyingIndex === index ? (
                    <>
                      <Icon
                        icon="lucide:check"
                        className="h-4 w-4 mr-1 sm:mr-2"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">Copied!</span>
                      <span className="sm:hidden">✓</span>
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="lucide:copy"
                        className="h-4 w-4 mr-1 sm:mr-2"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </Button>

                {/* Code Display */}
                <div className="rounded-lg overflow-hidden border overflow-x-auto">
                  <SyntaxHighlighter
                    language={sample.language}
                    style={vscDarkPlus}
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "0.75rem",
                      lineHeight: "1.5",
                    }}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {sample.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

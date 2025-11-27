"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/react";

/**
 * SDK Configuration interface
 */
export interface SDKConfig {
  language: "typescript";
  packageName: string;
  packageVersion: string;
  author?: string;
  description?: string;
}

interface SdkConfigFormProps {
  onSubmit: (config: SDKConfig) => void;
  loading?: boolean;
  initialConfig?: Partial<SDKConfig>;
}

interface FormErrors {
  packageName?: string;
  packageVersion?: string;
}

interface TouchedFields {
  packageName?: boolean;
  packageVersion?: boolean;
}

/**
 * Validates package name according to NPM rules
 * Requirements: 1.2
 */
const validatePackageName = (name: string): string | null => {
  if (!name) return "Package name is required";
  if (name.length < 1 || name.length > 214)
    return "Package name must be 1-214 characters";
  if (!/^[a-z0-9-]+$/.test(name))
    return "Package name must be lowercase with hyphens only";
  if (name.startsWith("-") || name.endsWith("-"))
    return "Package name cannot start or end with hyphen";
  return null;
};

/**
 * Validates version according to semantic versioning rules
 * Requirements: 1.3
 */
const validateVersion = (version: string): string | null => {
  if (!version) return "Version is required";
  if (!/^\d+\.\d+\.\d+(-[a-z0-9]+)?$/.test(version))
    return "Version must follow semantic versioning (e.g., 1.0.0)";
  return null;
};

/**
 * SDK Configuration Form Component
 * Collects SDK configuration parameters from the user
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3
 */
export function SdkConfigForm({
  onSubmit,
  loading = false,
  initialConfig,
}: SdkConfigFormProps) {
  // Form state
  const [language, setLanguage] = useState<"typescript">(
    initialConfig?.language || "typescript"
  );
  const [packageName, setPackageName] = useState(
    initialConfig?.packageName || ""
  );
  const [packageVersion, setPackageVersion] = useState(
    initialConfig?.packageVersion || "1.0.0"
  );
  const [author, setAuthor] = useState(initialConfig?.author || "");
  const [description, setDescription] = useState(
    initialConfig?.description || ""
  );

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  /**
   * Validates a specific field
   * Requirements: 1.2, 1.3, 1.5
   */
  const validateField = useCallback(
    (field: "packageName" | "packageVersion", value: string) => {
      let error: string | null = null;

      if (field === "packageName") {
        error = validatePackageName(value);
      } else if (field === "packageVersion") {
        error = validateVersion(value);
      }

      setErrors((prev) => ({
        ...prev,
        [field]: error || undefined,
      }));

      return error === null;
    },
    []
  );

  /**
   * Handles field blur for validation
   * Requirements: 1.2, 1.3, 1.4
   */
  const handleBlur = (field: "packageName" | "packageVersion") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "packageName") {
      validateField("packageName", packageName);
    } else if (field === "packageVersion") {
      validateField("packageVersion", packageVersion);
    }
  };

  /**
   * Handles package name change
   * Requirements: 1.1, 1.2
   */
  const handlePackageNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPackageName(value);

    // Validate if field has been touched
    if (touched.packageName) {
      validateField("packageName", value);
    }
  };

  /**
   * Handles version change
   * Requirements: 1.1, 1.3
   */
  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPackageVersion(value);

    // Validate if field has been touched
    if (touched.packageVersion) {
      validateField("packageVersion", value);
    }
  };

  /**
   * Handles description change with character limit
   * Requirements: 1.1, 1.4
   */
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setDescription(value);
    }
  };

  /**
   * Checks if form is valid
   * Requirements: 1.5
   */
  const isFormValid = (): boolean => {
    const nameValid = validatePackageName(packageName) === null;
    const versionValid = validateVersion(packageVersion) === null;
    return nameValid && versionValid;
  };

  /**
   * Handles form submission
   * Requirements: 1.5
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      packageName: true,
      packageVersion: true,
    });

    // Validate all fields
    const nameValid = validateField("packageName", packageName);
    const versionValid = validateField("packageVersion", packageVersion);

    if (nameValid && versionValid) {
      const config: SDKConfig = {
        language,
        packageName,
        packageVersion,
        author: author || undefined,
        description: description || undefined,
      };

      onSubmit(config);
    }
  };

  const formValid = isFormValid();
  const characterCount = description.length;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            SDK Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Language Selector - Requirements: 7.1, 7.2, 7.3 */}
            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select
                value={language}
                onValueChange={() => {}}
                disabled={loading}
              >
                <SelectTrigger id="language" disabled={loading}>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python" disabled>
                    Python (Coming soon)
                  </SelectItem>
                  <SelectItem value="go" disabled>
                    Go (Coming soon)
                  </SelectItem>
                  <SelectItem value="java" disabled>
                    Java (Coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Additional languages will be available soon
              </p>
            </div>

            {/* Package Name - Requirements: 1.1, 1.2, 1.4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="packageName">
                  Package Name <span className="text-destructive">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Icon
                        icon="lucide:info"
                        className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Package name information"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The name of your SDK package. Must be lowercase with
                      hyphens only. This will be used when installing the
                      package (e.g., npm install my-api-client).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="packageName"
                placeholder="my-api-client"
                value={packageName}
                onChange={handlePackageNameChange}
                onBlur={() => handleBlur("packageName")}
                className={
                  touched.packageName && errors.packageName
                    ? "border-destructive"
                    : ""
                }
                disabled={loading}
                aria-required="true"
                aria-invalid={touched.packageName && !!errors.packageName}
                aria-describedby={
                  touched.packageName && errors.packageName
                    ? "packageName-error packageName-description"
                    : "packageName-description"
                }
              />
              {touched.packageName && errors.packageName && (
                <p
                  id="packageName-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <Icon icon="lucide:alert-circle" className="w-3 h-3" />
                  {errors.packageName}
                </p>
              )}
              <p
                id="packageName-description"
                className="text-xs text-muted-foreground"
              >
                Lowercase letters, numbers, and hyphens only (e.g.,
                my-api-client)
              </p>
            </div>

            {/* Package Version - Requirements: 1.1, 1.3, 1.4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="packageVersion">
                  Version <span className="text-destructive">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Icon
                        icon="lucide:info"
                        className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Version information"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Semantic version number for your SDK (e.g., 1.0.0,
                      2.1.3-beta). Follow the format: MAJOR.MINOR.PATCH with
                      optional pre-release suffix.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="packageVersion"
                placeholder="1.0.0"
                value={packageVersion}
                onChange={handleVersionChange}
                onBlur={() => handleBlur("packageVersion")}
                className={
                  touched.packageVersion && errors.packageVersion
                    ? "border-destructive"
                    : ""
                }
                disabled={loading}
                aria-required="true"
                aria-invalid={touched.packageVersion && !!errors.packageVersion}
                aria-describedby={
                  touched.packageVersion && errors.packageVersion
                    ? "packageVersion-error packageVersion-description"
                    : "packageVersion-description"
                }
              />
              {touched.packageVersion && errors.packageVersion && (
                <p
                  id="packageVersion-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <Icon icon="lucide:alert-circle" className="w-3 h-3" />
                  {errors.packageVersion}
                </p>
              )}
              <p
                id="packageVersion-description"
                className="text-xs text-muted-foreground"
              >
                Semantic versioning format (e.g., 1.0.0, 2.1.3-beta)
              </p>
            </div>

            {/* Author - Requirements: 1.1, 1.4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="author">Author (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Icon
                        icon="lucide:info"
                        className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Author information"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The name of the person or organization maintaining this
                      SDK. This will appear in the package metadata.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="author"
                placeholder="Your Name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={loading}
                aria-describedby="author-description"
              />
              <p
                id="author-description"
                className="text-xs text-muted-foreground"
              >
                The author or maintainer of this SDK
              </p>
            </div>

            {/* Description - Requirements: 1.1, 1.4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Icon
                        icon="lucide:info"
                        className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Description information"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      A brief description of what your SDK does. This helps
                      users understand the purpose of the package (max 500
                      characters).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="description"
                placeholder="Client library for My API"
                value={description}
                onChange={handleDescriptionChange}
                disabled={loading}
                rows={3}
                aria-describedby="description-description description-count"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p
                  id="description-description"
                  className="text-xs text-muted-foreground"
                >
                  Brief description of your SDK
                </p>
                <p
                  id="description-count"
                  className={`text-xs ${
                    characterCount > 450
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                  aria-live="polite"
                >
                  {characterCount}/500
                </p>
              </div>
            </div>

            {/* Submit Button - Requirements: 1.5 */}
            <div className="flex gap-3 pt-2 sm:pt-4">
              <Button
                type="submit"
                disabled={!formValid || loading}
                className="flex-1 h-11 sm:h-10"
              >
                {loading ? (
                  <>
                    <Icon
                      icon="lucide:loader-2"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">Generating</span>
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:sparkles" className="w-4 h-4 mr-2" />
                    Generate SDK
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { RequestBody, SchemaObject } from "@/packages/openapi/src/types";
import { ValidationError } from "@/types/request-builder";
import {
  generateExampleFromSchema,
  formatExampleAsJSON,
} from "@/lib/schema-example";
import { formatSchemaForDisplay } from "@/lib/schema-utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center border rounded-md bg-muted">
      <p className="text-sm text-muted-foreground">Loading editor...</p>
    </div>
  ),
});

interface RequestBodyEditorProps {
  requestBody: RequestBody;
  value: string | Record<string, unknown>;
  contentType: string;
  allSchemas: Record<string, SchemaObject>;
  onChange: (value: string | Record<string, unknown>) => void;
  onContentTypeChange: (contentType: string) => void;
  errors?: ValidationError[];
}

/**
 * RequestBodyEditor component
 * Provides editor for JSON or form-data request bodies
 */
export function RequestBodyEditor({
  requestBody,
  value,
  contentType,
  allSchemas,
  onChange,
  onContentTypeChange,
  errors = [],
}: RequestBodyEditorProps) {
  const [schemaViewerOpen, setSchemaViewerOpen] = React.useState(false);
  const [jsonError, setJsonError] = React.useState<string | undefined>();

  // Get available content types
  const contentTypes = Object.keys(requestBody.content);
  const currentMediaType = requestBody.content[contentType];
  const schema = currentMediaType?.schema;

  // Initialize with example if value is empty
  React.useEffect(() => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      if (schema && contentType === "application/json") {
        const example = generateExampleFromSchema(schema, allSchemas);
        if (example) {
          onChange(formatExampleAsJSON(example));
        }
      }
    }
  }, [schema, allSchemas, contentType]); // Intentionally omit value and onChange

  /**
   * Handle content type change
   */
  const handleContentTypeChange = (newContentType: string) => {
    onContentTypeChange(newContentType);
    // Reset value when content type changes
    const newMediaType = requestBody.content[newContentType];
    if (newMediaType?.schema && newContentType === "application/json") {
      const example = generateExampleFromSchema(
        newMediaType.schema,
        allSchemas
      );
      if (example) {
        onChange(formatExampleAsJSON(example));
      }
    } else {
      onChange({});
    }
  };

  /**
   * Generate example from schema
   */
  const handleGenerateExample = () => {
    if (schema) {
      const example = generateExampleFromSchema(schema, allSchemas);
      if (example) {
        if (contentType === "application/json") {
          onChange(formatExampleAsJSON(example));
        } else {
          onChange(example as Record<string, unknown>);
        }
      }
    }
  };

  /**
   * Format/prettify JSON
   */
  const handleFormatJSON = () => {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        onChange(JSON.stringify(parsed, null, 2));
        setJsonError(undefined);
      } catch (error) {
        setJsonError(
          error instanceof Error ? error.message : "Invalid JSON syntax"
        );
      }
    }
  };

  // Determine if content type is JSON
  const isJSON = contentType === "application/json";
  const isFormData =
    contentType === "application/x-www-form-urlencoded" ||
    contentType === "multipart/form-data";

  // Get validation errors for body
  const bodyErrors = errors.filter((err) => err.field === "body");

  return (
    <div className="space-y-4">
      {/* Header with content type selector */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor="content-type">
            Content Type
            {requestBody.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
          {contentTypes.length > 1 ? (
            <Select value={contentType} onValueChange={handleContentTypeChange}>
              <SelectTrigger id="content-type" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              {contentType}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 items-end">
          {isJSON && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFormatJSON}
                title="Format JSON"
              >
                Format
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateExample}
                title="Generate example from schema"
              >
                <Wand2 className="h-4 w-4 mr-1" />
                Example
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {requestBody.description && (
        <p className="text-sm text-muted-foreground">
          {requestBody.description}
        </p>
      )}

      {/* Schema viewer */}
      {schema && (
        <Collapsible open={schemaViewerOpen} onOpenChange={setSchemaViewerOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">Expected Schema</span>
              {schemaViewerOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-4">
                <pre className="text-xs overflow-auto max-h-[200px] p-2 bg-muted rounded">
                  {formatSchemaForDisplay(schema, allSchemas)}
                </pre>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Editor based on content type */}
      {isJSON ? (
        <JSONEditor
          value={
            typeof value === "string" ? value : JSON.stringify(value, null, 2)
          }
          onChange={onChange}
          schema={schema}
          allSchemas={allSchemas}
          error={jsonError}
        />
      ) : isFormData ? (
        <FormDataEditor
          value={typeof value === "object" ? value : {}}
          onChange={onChange}
          schema={schema}
          allSchemas={allSchemas}
          isMultipart={contentType === "multipart/form-data"}
        />
      ) : (
        <div className="text-sm text-muted-foreground p-4 border rounded-md">
          Content type {contentType} is not yet supported. Please use JSON
          editor or form-data editor.
        </div>
      )}

      {/* Validation errors */}
      {bodyErrors.length > 0 && (
        <div className="space-y-1">
          {bodyErrors.map((error, index) => (
            <p
              key={index}
              className="text-xs text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * JSON Editor sub-component using Monaco
 */
interface JSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  schema?: SchemaObject;
  allSchemas: Record<string, SchemaObject>;
  error?: string;
}

function JSONEditor({ value, onChange, error }: JSONEditorProps) {
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  // Update local error when prop changes
  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  /**
   * Handle editor change with validation
   */
  const handleEditorChange = (newValue: string | undefined) => {
    const val = newValue || "";
    onChange(val);

    // Validate JSON syntax
    if (val.trim()) {
      try {
        JSON.parse(val);
        setLocalError(undefined);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : "Invalid JSON syntax"
        );
      }
    } else {
      setLocalError(undefined);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border rounded-md overflow-hidden",
          localError && "border-destructive"
        )}
      >
        <Editor
          height="300px"
          language="json"
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "on",
            renderLineHighlight: "all",
            automaticLayout: true,
          }}
        />
      </div>
      {localError && (
        <p className="text-xs text-destructive" role="alert" aria-live="polite">
          {localError}
        </p>
      )}
    </div>
  );
}

/**
 * Form Data Editor sub-component
 */
interface FormDataEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  schema?: SchemaObject;
  allSchemas: Record<string, SchemaObject>;
  isMultipart: boolean;
}

function FormDataEditor({
  value,
  onChange,
  schema,
  isMultipart,
}: FormDataEditorProps) {
  const properties = schema?.properties || {};
  const required = schema?.required || [];

  /**
   * Handle field change
   */
  const handleFieldChange = (fieldName: string, fieldValue: unknown) => {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    });
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange({
        ...value,
        [fieldName]: file,
      });
    }
  };

  // If no schema properties, show message
  if (Object.keys(properties).length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-md">
        No schema properties defined for this content type.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Form Fields</CardTitle>
        <CardDescription>
          {isMultipart
            ? "Fill in the form fields. File uploads are supported."
            : "Fill in the form fields."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(properties).map(([fieldName, fieldSchema]) => {
          const fieldSchemaObj = fieldSchema as SchemaObject;
          const isRequired = required.includes(fieldName);
          const fieldValue = value[fieldName];

          // Determine if this should be a file input
          const isFile =
            isMultipart &&
            fieldSchemaObj.type === "string" &&
            (fieldSchemaObj.format === "binary" ||
              fieldSchemaObj.format === "base64");

          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={`form-field-${fieldName}`}>
                {fieldName}
                {isRequired && (
                  <span className="text-destructive ml-1" aria-label="required">
                    *
                  </span>
                )}
              </Label>

              {isFile ? (
                <Input
                  id={`form-field-${fieldName}`}
                  type="file"
                  onChange={(e) => handleFileChange(fieldName, e)}
                  aria-label={fieldName}
                />
              ) : fieldSchemaObj.type === "boolean" ? (
                <div className="flex items-center space-x-2">
                  <input
                    id={`form-field-${fieldName}`}
                    type="checkbox"
                    checked={fieldValue === true}
                    onChange={(e) =>
                      handleFieldChange(fieldName, e.target.checked)
                    }
                    className="h-4 w-4"
                    aria-label={fieldName}
                  />
                  <label
                    htmlFor={`form-field-${fieldName}`}
                    className="text-sm text-muted-foreground"
                  >
                    {fieldSchemaObj.description || "Enable this option"}
                  </label>
                </div>
              ) : fieldSchemaObj.type === "number" ||
                fieldSchemaObj.type === "integer" ? (
                <Input
                  id={`form-field-${fieldName}`}
                  type="number"
                  value={
                    typeof fieldValue === "number" ? fieldValue.toString() : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      handleFieldChange(fieldName, "");
                    } else {
                      const numVal =
                        fieldSchemaObj.type === "integer"
                          ? parseInt(val, 10)
                          : parseFloat(val);
                      handleFieldChange(
                        fieldName,
                        isNaN(numVal) ? val : numVal
                      );
                    }
                  }}
                  placeholder={
                    fieldSchemaObj.description || `Enter ${fieldName}`
                  }
                  aria-label={fieldName}
                />
              ) : (
                <Input
                  id={`form-field-${fieldName}`}
                  type="text"
                  value={typeof fieldValue === "string" ? fieldValue : ""}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  placeholder={
                    fieldSchemaObj.description || `Enter ${fieldName}`
                  }
                  aria-label={fieldName}
                />
              )}

              {fieldSchemaObj.description &&
                fieldSchemaObj.type !== "boolean" && (
                  <p className="text-xs text-muted-foreground">
                    {fieldSchemaObj.description}
                  </p>
                )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

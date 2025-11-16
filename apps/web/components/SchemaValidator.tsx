"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { SchemaObject } from "@splice/openapi";
import {
  SchemaValidator as Validator,
  ValidationResult,
  FieldValidation,
} from "@/lib/schema-validator";

/**
 * Props for the SchemaValidator component
 */
export interface SchemaValidatorProps {
  response: any;
  schema: SchemaObject;
  onValidationComplete?: (result: ValidationResult) => void;
}

/**
 * Format field value for display
 */
function formatValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * FieldItem component for displaying individual field validation
 */
function FieldItem({
  field,
  type,
}: {
  field: FieldValidation;
  type: "matching" | "extra" | "missing";
}) {
  const getIcon = () => {
    switch (type) {
      case "matching":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "extra":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "missing":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "matching":
        return "bg-green-500/10 border-green-500/20";
      case "extra":
        return "bg-orange-500/10 border-orange-500/20";
      case "missing":
        return "bg-red-500/10 border-red-500/20";
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-md border ${getBgColor()}`}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-sm font-mono font-medium">{field.path}</code>
          {field.expectedType && (
            <Badge variant="outline" className="text-xs">
              {field.expectedType}
            </Badge>
          )}
          {field.actualType && type !== "missing" && (
            <Badge variant="outline" className="text-xs">
              {field.actualType}
            </Badge>
          )}
        </div>
        {field.value !== undefined && type !== "missing" && (
          <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
            {formatValue(field.value)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SchemaValidator component
 * Validates API responses against OpenAPI schemas and displays results
 */
export function SchemaValidator({
  response,
  schema,
  onValidationComplete,
}: SchemaValidatorProps) {
  const [validationResult, setValidationResult] =
    React.useState<ValidationResult | null>(null);
  const [matchingOpen, setMatchingOpen] = React.useState(true);
  const [extraOpen, setExtraOpen] = React.useState(true);
  const [missingOpen, setMissingOpen] = React.useState(true);
  const [errorsOpen, setErrorsOpen] = React.useState(true);

  // Perform validation when response or schema changes
  React.useEffect(() => {
    if (!response || !schema) {
      setValidationResult(null);
      return;
    }

    const validator = new Validator();
    const result = validator.validate(response, schema);
    setValidationResult(result);

    if (onValidationComplete) {
      onValidationComplete(result);
    }
  }, [response, schema, onValidationComplete]);

  // Don't render if no validation result
  if (!validationResult) {
    return null;
  }

  const hasMatchingFields = validationResult.matchingFields.length > 0;
  const hasExtraFields = validationResult.extraFields.length > 0;
  const hasMissingFields = validationResult.missingFields.length > 0;
  const hasErrors = validationResult.errors.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Schema Validation</CardTitle>
          <Badge
            variant={validationResult.valid ? "default" : "destructive"}
            className="gap-1.5"
          >
            {validationResult.valid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                Invalid
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-md bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-500">
              {validationResult.matchingFields.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Matching</div>
          </div>
          <div className="text-center p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-500">
              {validationResult.extraFields.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Extra</div>
          </div>
          <div className="text-center p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-500">
              {validationResult.missingFields.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Missing</div>
          </div>
          <div className="text-center p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-500">
              {validationResult.errors.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Errors</div>
          </div>
        </div>

        <Separator />

        {/* Matching Fields */}
        {hasMatchingFields && (
          <Collapsible open={matchingOpen} onOpenChange={setMatchingOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Matching Fields ({validationResult.matchingFields.length})
                </span>
                {matchingOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {validationResult.matchingFields.map((field, index) => (
                <FieldItem key={index} field={field} type="matching" />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Extra Fields */}
        {hasExtraFields && (
          <Collapsible open={extraOpen} onOpenChange={setExtraOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Extra Fields ({validationResult.extraFields.length})
                </span>
                {extraOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {validationResult.extraFields.map((field, index) => (
                <FieldItem key={index} field={field} type="extra" />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Missing Fields */}
        {hasMissingFields && (
          <Collapsible open={missingOpen} onOpenChange={setMissingOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Required Fields (
                  {validationResult.missingFields.length})
                </span>
                {missingOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {validationResult.missingFields.map((field, index) => (
                <FieldItem key={index} field={field} type="missing" />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Validation Errors */}
        {hasErrors && (
          <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Validation Errors ({validationResult.errors.length})
                </span>
                {errorsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {validationResult.errors.map((error, index) => (
                <div
                  key={index}
                  className="p-3 rounded-md border bg-red-500/10 border-red-500/20"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono font-medium">
                        {error.field}
                      </code>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error.message}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            Expected:
                          </span>{" "}
                          <code className="font-mono">{error.expected}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual:</span>{" "}
                          <code className="font-mono">{error.actual}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* No issues found */}
        {!hasExtraFields && !hasMissingFields && !hasErrors && (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium">Perfect Match!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Response matches the schema exactly
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

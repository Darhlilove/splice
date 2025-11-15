"use client";

import * as React from "react";
import { Parameter, SchemaObject } from "@/packages/openapi/src/types";
import { ParameterValue } from "@/types/request-builder";
import { validateParameter } from "@/lib/parameter-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ParameterInputProps {
  parameter: Parameter;
  value: ParameterValue;
  error?: string;
  onChange: (value: ParameterValue) => void;
}

/**
 * TextInput sub-component for string parameters
 */
function TextInput({
  parameter,
  value,
  onChange,
}: {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={parameter.description || `Enter ${parameter.name}`}
      aria-label={parameter.name}
    />
  );
}

/**
 * NumberInput sub-component for number/integer parameters
 */
function NumberInput({
  parameter,
  value,
  onChange,
}: {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: number | string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string for clearing
    if (val === "") {
      onChange("");
      return;
    }
    // Parse as number
    const numVal =
      parameter.schema.type === "integer" ? parseInt(val, 10) : parseFloat(val);
    onChange(isNaN(numVal) ? val : numVal);
  };

  return (
    <Input
      type="number"
      value={value?.toString() || ""}
      onChange={handleChange}
      placeholder={parameter.description || `Enter ${parameter.name}`}
      aria-label={parameter.name}
      step={parameter.schema.type === "integer" ? "1" : "any"}
    />
  );
}

/**
 * CheckboxInput sub-component for boolean parameters
 */
function CheckboxInput({
  parameter,
  value,
  onChange,
}: {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`checkbox-${parameter.name}`}
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked === true)}
        aria-label={parameter.name}
      />
      <label
        htmlFor={`checkbox-${parameter.name}`}
        className="text-sm text-muted-foreground cursor-pointer"
      >
        {parameter.description || "Enable this option"}
      </label>
    </div>
  );
}

/**
 * SelectInput sub-component for enum parameters
 */
function SelectInput({
  parameter,
  value,
  onChange,
}: {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: string) => void;
}) {
  const enumValues = parameter.schema.enum || [];

  return (
    <Select value={(value as string) || ""} onValueChange={onChange}>
      <SelectTrigger aria-label={parameter.name}>
        <SelectValue placeholder={`Select ${parameter.name}`} />
      </SelectTrigger>
      <SelectContent>
        {enumValues.map((enumValue) => (
          <SelectItem key={String(enumValue)} value={String(enumValue)}>
            {String(enumValue)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * ArrayInput sub-component for array parameters
 */
function ArrayInput({
  parameter,
  value,
  onChange,
}: {
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: string[]) => void;
}) {
  const arrayValue = Array.isArray(value) ? value : [];
  const stringValue = arrayValue.join(", ");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Split by comma and trim whitespace
    const items = val
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    onChange(items);
  };

  return (
    <Input
      type="text"
      value={stringValue}
      onChange={handleChange}
      placeholder="Enter comma-separated values"
      aria-label={parameter.name}
    />
  );
}

/**
 * Determines which input component to render based on schema type
 */
function getInputComponent(schema: SchemaObject): React.ComponentType<{
  parameter: Parameter;
  value: ParameterValue;
  onChange: (value: any) => void;
}> {
  // Enum takes precedence
  if (schema.enum && schema.enum.length > 0) {
    return SelectInput;
  }

  // Type-based selection
  switch (schema.type) {
    case "boolean":
      return CheckboxInput;
    case "number":
    case "integer":
      return NumberInput;
    case "array":
      return ArrayInput;
    case "string":
    default:
      return TextInput;
  }
}

/**
 * Main ParameterInput component
 * Renders appropriate input based on parameter schema type
 */
export function ParameterInput({
  parameter,
  value,
  error,
  onChange,
}: ParameterInputProps) {
  const InputComponent = getInputComponent(parameter.schema);
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  // Update local error when prop changes
  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Validate on change
  const handleChange = (newValue: ParameterValue) => {
    onChange(newValue);

    // Perform validation
    const validationResult = validateParameter(parameter, newValue);
    setLocalError(
      validationResult.isValid ? undefined : validationResult.error
    );
  };

  // Display error from prop or local validation
  const displayError = localError || error;

  const inputId = `param-${parameter.name}`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex items-center gap-1">
        {parameter.name}
        {parameter.required && (
          <span className="text-destructive" aria-label="required">
            *
          </span>
        )}
      </Label>

      <div
        role="group"
        aria-labelledby={inputId}
        aria-describedby={
          displayError
            ? errorId
            : parameter.description
            ? descriptionId
            : undefined
        }
        aria-invalid={!!displayError}
      >
        <InputComponent
          parameter={parameter}
          value={value}
          onChange={handleChange}
        />
      </div>

      {parameter.description && !parameter.schema.type?.includes("boolean") && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {parameter.description}
        </p>
      )}

      {displayError && (
        <p
          id={errorId}
          className="text-xs text-destructive"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}

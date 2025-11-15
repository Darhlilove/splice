/**
 * Parameter validation utilities for Request Builder
 */

import { Parameter, SchemaObject } from "@/packages/openapi/src/types";
import { ParameterValue } from "@/types/request-builder";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  type?: "required" | "type" | "pattern" | "min" | "max" | "enum";
}

/**
 * Validates a parameter value against its schema
 */
export function validateParameter(
  parameter: Parameter,
  value: ParameterValue
): ValidationResult {
  const { schema, required } = parameter;

  // Required field validation
  if (required) {
    const requiredResult = validateRequired(value);
    if (!requiredResult.isValid) {
      return requiredResult;
    }
  }

  // If value is empty and not required, it's valid
  if (value === null || value === undefined || value === "") {
    return { isValid: true };
  }

  // Type validation
  const typeResult = validateType(value, schema);
  if (!typeResult.isValid) {
    return typeResult;
  }

  // Enum validation
  if (schema.enum && schema.enum.length > 0) {
    const enumResult = validateEnum(value, schema.enum);
    if (!enumResult.isValid) {
      return enumResult;
    }
  }

  // Pattern validation (for strings)
  if (schema.pattern && typeof value === "string") {
    const patternResult = validatePattern(value, schema.pattern as string);
    if (!patternResult.isValid) {
      return patternResult;
    }
  }

  // Min/max validation
  if (schema.type === "string" && typeof value === "string") {
    const lengthResult = validateStringLength(value, schema);
    if (!lengthResult.isValid) {
      return lengthResult;
    }
  }

  if (
    (schema.type === "number" || schema.type === "integer") &&
    typeof value === "number"
  ) {
    const rangeResult = validateNumberRange(value, schema);
    if (!rangeResult.isValid) {
      return rangeResult;
    }
  }

  return { isValid: true };
}

/**
 * Validates that a required field has a value
 */
function validateRequired(value: ParameterValue): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return {
      isValid: false,
      error: "This field is required",
      type: "required",
    };
  }

  // For arrays, check if it has at least one item
  if (Array.isArray(value) && value.length === 0) {
    return {
      isValid: false,
      error: "This field is required",
      type: "required",
    };
  }

  return { isValid: true };
}

/**
 * Validates that the value matches the expected type
 */
function validateType(
  value: ParameterValue,
  schema: SchemaObject
): ValidationResult {
  const { type } = schema;

  if (!type) {
    return { isValid: true };
  }

  switch (type) {
    case "string":
      if (typeof value !== "string") {
        return {
          isValid: false,
          error: "Must be a string",
          type: "type",
        };
      }
      break;

    case "number":
    case "integer":
      if (typeof value !== "number") {
        return {
          isValid: false,
          error: `Must be a ${type}`,
          type: "type",
        };
      }
      if (type === "integer" && !Number.isInteger(value)) {
        return {
          isValid: false,
          error: "Must be an integer",
          type: "type",
        };
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return {
          isValid: false,
          error: "Must be a boolean",
          type: "type",
        };
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        return {
          isValid: false,
          error: "Must be an array",
          type: "type",
        };
      }
      break;

    default:
      // Unknown type, skip validation
      break;
  }

  return { isValid: true };
}

/**
 * Validates that the value is one of the allowed enum values
 */
function validateEnum(
  value: ParameterValue,
  enumValues: unknown[]
): ValidationResult {
  // Convert value to string for comparison
  const valueStr = String(value);
  const enumStrs = enumValues.map((v) => String(v));

  if (!enumStrs.includes(valueStr)) {
    return {
      isValid: false,
      error: `Must be one of: ${enumStrs.join(", ")}`,
      type: "enum",
    };
  }

  return { isValid: true };
}

/**
 * Validates that a string matches a regex pattern
 */
function validatePattern(value: string, pattern: string): ValidationResult {
  try {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return {
        isValid: false,
        error: `Must match pattern: ${pattern}`,
        type: "pattern",
      };
    }
  } catch (error) {
    // Invalid regex pattern in schema, skip validation
    console.warn("Invalid regex pattern in schema:", pattern);
  }

  return { isValid: true };
}

/**
 * Validates string length constraints (minLength, maxLength)
 */
function validateStringLength(
  value: string,
  schema: SchemaObject
): ValidationResult {
  const minLength = schema.minLength as number | undefined;
  const maxLength = schema.maxLength as number | undefined;

  if (minLength !== undefined && value.length < minLength) {
    return {
      isValid: false,
      error: `Must be at least ${minLength} characters`,
      type: "min",
    };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return {
      isValid: false,
      error: `Must be at most ${maxLength} characters`,
      type: "max",
    };
  }

  return { isValid: true };
}

/**
 * Validates number range constraints (minimum, maximum)
 */
function validateNumberRange(
  value: number,
  schema: SchemaObject
): ValidationResult {
  const minimum = schema.minimum as number | undefined;
  const maximum = schema.maximum as number | undefined;
  const exclusiveMinimum = schema.exclusiveMinimum as number | undefined;
  const exclusiveMaximum = schema.exclusiveMaximum as number | undefined;

  if (minimum !== undefined && value < minimum) {
    return {
      isValid: false,
      error: `Must be at least ${minimum}`,
      type: "min",
    };
  }

  if (maximum !== undefined && value > maximum) {
    return {
      isValid: false,
      error: `Must be at most ${maximum}`,
      type: "max",
    };
  }

  if (exclusiveMinimum !== undefined && value <= exclusiveMinimum) {
    return {
      isValid: false,
      error: `Must be greater than ${exclusiveMinimum}`,
      type: "min",
    };
  }

  if (exclusiveMaximum !== undefined && value >= exclusiveMaximum) {
    return {
      isValid: false,
      error: `Must be less than ${exclusiveMaximum}`,
      type: "max",
    };
  }

  return { isValid: true };
}

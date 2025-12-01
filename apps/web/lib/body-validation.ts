/**
 * Validation utilities for request body
 */

import type { SchemaObject, RequestBody } from "@/packages/openapi/src/types";
import type { ValidationError } from "@/types/request-builder";

/**
 * Validation result
 */
export interface BodyValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate request body against schema
 */
export function validateRequestBody(
  value: string | Record<string, unknown>,
  schema: SchemaObject,
  contentType: string
): BodyValidationResult {
  const validationErrors: ValidationError[] = [];

  // Validate JSON content
  if (contentType === "application/json") {
    if (typeof value === "string") {
      // Validate JSON syntax
      try {
        const parsed = JSON.parse(value);

        // Validate against schema
        const schemaErrors = validateValueAgainstSchema(parsed, schema, "body");
        validationErrors.push(...schemaErrors);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `Invalid JSON syntax: ${error.message}`
            : "Invalid JSON syntax. Please check your JSON formatting.";
        validationErrors.push({
          field: "body",
          message: errorMessage,
          type: "json",
        });
      }
    } else {
      // Already parsed object
      const schemaErrors = validateValueAgainstSchema(value, schema, "body");
      validationErrors.push(...schemaErrors);
    }
  }

  // Validate form data
  if (
    contentType === "application/x-www-form-urlencoded" ||
    contentType === "multipart/form-data"
  ) {
    if (typeof value === "object") {
      const schemaErrors = validateValueAgainstSchema(value, schema, "body");
      validationErrors.push(...schemaErrors);
    }
  }

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors.map((e) => e.message),
  };
}

/**
 * Validate a value against a schema
 */
function validateValueAgainstSchema(
  value: unknown,
  schema: SchemaObject,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Skip validation for $ref (would need schema resolution)
  if (typeof schema === "object" && schema !== null && "$ref" in schema && schema.$ref) {
    return errors;
  }

  // Validate type
  if (schema.type) {
    const actualType = getValueType(value);
    if (actualType !== schema.type && actualType !== "null") {
      errors.push({
        field: fieldPath,
        message: `Type mismatch: expected ${schema.type}, but received ${actualType}`,
        type: "type",
      });
      return errors; // Don't continue validation if type is wrong
    }
  }

  // Type-specific validation
  switch (schema.type) {
    case "string":
      if (typeof value === "string") {
        // Pattern validation
        if (schema.pattern && typeof schema.pattern === "string") {
          try {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
              errors.push({
                field: fieldPath,
                message: `Value does not match the required pattern: ${schema.pattern}`,
                type: "pattern",
              });
            }
          } catch (error) {
            // Invalid regex pattern in schema
            console.error("Invalid regex pattern in schema:", error);
          }
        }

        // Min/max length
        if (
          "minLength" in schema &&
          typeof schema.minLength === "number" &&
          value.length < schema.minLength
        ) {
          errors.push({
            field: fieldPath,
            message: `String must be at least ${schema.minLength} characters long`,
            type: "min",
          });
        }
        if (
          "maxLength" in schema &&
          typeof schema.maxLength === "number" &&
          value.length > schema.maxLength
        ) {
          errors.push({
            field: fieldPath,
            message: `String must be at most ${schema.maxLength} characters long`,
            type: "max",
          });
        }

        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            field: fieldPath,
            message: `Value must be one of the following: ${schema.enum.join(
              ", "
            )}`,
            type: "enum",
          });
        }
      }
      break;

    case "number":
    case "integer":
      if (typeof value === "number") {
        // Min/max validation
        if (
          "minimum" in schema &&
          typeof schema.minimum === "number" &&
          value < schema.minimum
        ) {
          errors.push({
            field: fieldPath,
            message: `Number must be at least ${schema.minimum}`,
            type: "min",
          });
        }
        if (
          "maximum" in schema &&
          typeof schema.maximum === "number" &&
          value > schema.maximum
        ) {
          errors.push({
            field: fieldPath,
            message: `Number must be at most ${schema.maximum}`,
            type: "max",
          });
        }

        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            field: fieldPath,
            message: `Value must be one of the following: ${schema.enum.join(
              ", "
            )}`,
            type: "enum",
          });
        }
      }
      break;

    case "array":
      if (Array.isArray(value)) {
        // Min/max items
        if (
          "minItems" in schema &&
          typeof schema.minItems === "number" &&
          value.length < schema.minItems
        ) {
          errors.push({
            field: fieldPath,
            message: `Array must contain at least ${schema.minItems} item${schema.minItems !== 1 ? "s" : ""
              }`,
            type: "min",
          });
        }
        if (
          "maxItems" in schema &&
          typeof schema.maxItems === "number" &&
          value.length > schema.maxItems
        ) {
          errors.push({
            field: fieldPath,
            message: `Array must contain at most ${schema.maxItems} item${schema.maxItems !== 1 ? "s" : ""
              }`,
            type: "max",
          });
        }

        // Validate items
        if (schema.items) {
          value.forEach((item, index) => {
            const itemErrors = validateValueAgainstSchema(
              item,
              schema.items as SchemaObject,
              `${fieldPath}[${index}]`
            );
            errors.push(...itemErrors);
          });
        }
      }
      break;

    case "object":
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const obj = value as Record<string, unknown>;

        // Check required properties
        if (schema.required) {
          for (const requiredProp of schema.required) {
            if (!(requiredProp in obj)) {
              errors.push({
                field: `${fieldPath}.${requiredProp}`,
                message: `Property '${requiredProp}' is required`,
                type: "required",
              });
            }
          }
        }

        // Validate properties
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(
            schema.properties
          )) {
            if (propName in obj) {
              const propErrors = validateValueAgainstSchema(
                obj[propName],
                propSchema as SchemaObject,
                `${fieldPath}.${propName}`
              );
              errors.push(...propErrors);
            }
          }
        }
      }
      break;
  }

  return errors;
}

/**
 * Get the type of a value for validation
 */
function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  return typeof value;
}

/**
 * Schema Validator Utility
 * Validates API responses against OpenAPI schemas
 */

import Ajv, { ValidateFunction } from "ajv";
import type { SchemaObject } from "@splice/openapi";

export interface ValidationResult {
  valid: boolean;
  matchingFields: FieldValidation[];
  extraFields: FieldValidation[];
  missingFields: FieldValidation[];
  errors: ValidationError[];
}

export interface FieldValidation {
  path: string;
  expectedType?: string;
  actualType?: string;
  value?: any;
}

export interface ValidationError {
  field: string;
  expected: string;
  actual: string;
  message: string;
}

export class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: false,
    });
  }

  /**
   * Validate a response against an OpenAPI schema
   */
  validate(response: any, schema: SchemaObject): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      matchingFields: [],
      extraFields: [],
      missingFields: [],
      errors: [],
    };

    // Handle null or undefined response
    if (response === null || response === undefined) {
      if (schema.required && schema.required.length > 0) {
        result.valid = false;
        schema.required.forEach((field) => {
          result.missingFields.push({
            path: field,
            expectedType: this.getSchemaType(schema.properties?.[field]),
          });
        });
      }
      return result;
    }

    // Validate using AJV
    const validate = this.ajv.compile(schema);
    const isValid = validate(response);

    if (!isValid && validate.errors) {
      result.valid = false;
      result.errors = this.formatAjvErrors(validate.errors);
    }

    // Compare fields for detailed validation
    if (typeof response === "object" && !Array.isArray(response)) {
      this.compareFields(response, schema, "", result);
    }

    return result;
  }

  /**
   * Compare response fields against schema
   */
  private compareFields(
    response: any,
    schema: SchemaObject,
    parentPath: string,
    result: ValidationResult
  ): void {
    const schemaProps = schema.properties || {};
    const requiredFields = schema.required || [];
    const responseKeys = Object.keys(response);
    const schemaKeys = Object.keys(schemaProps);

    // Check for matching and missing fields
    schemaKeys.forEach((key) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldSchema = schemaProps[key];
      const expectedType = this.getSchemaType(fieldSchema);

      if (key in response) {
        const actualType = this.getActualType(response[key]);
        const typesMatch = this.typesMatch(expectedType, actualType);

        if (typesMatch) {
          result.matchingFields.push({
            path: fieldPath,
            expectedType,
            actualType,
            value: response[key],
          });

          // Recursively validate nested objects
          if (
            typeof response[key] === "object" &&
            response[key] !== null &&
            !Array.isArray(response[key]) &&
            fieldSchema.properties
          ) {
            this.compareFields(response[key], fieldSchema, fieldPath, result);
          }
        } else {
          result.valid = false;
          result.errors.push({
            field: fieldPath,
            expected: expectedType,
            actual: actualType,
            message: `Type mismatch: expected ${expectedType}, got ${actualType}`,
          });
        }
      } else if (requiredFields.includes(key)) {
        result.valid = false;
        result.missingFields.push({
          path: fieldPath,
          expectedType,
        });
      }
    });

    // Check for extra fields
    responseKeys.forEach((key) => {
      if (!(key in schemaProps)) {
        const fieldPath = parentPath ? `${parentPath}.${key}` : key;
        result.extraFields.push({
          path: fieldPath,
          actualType: this.getActualType(response[key]),
          value: response[key],
        });
      }
    });
  }

  /**
   * Get the type from a schema object
   */
  private getSchemaType(schema: any): string {
    if (!schema) return "unknown";

    if (schema.$ref) {
      return schema.$ref.split("/").pop() || "reference";
    }

    if (schema.type) {
      if (schema.type === "array" && schema.items) {
        const itemType = this.getSchemaType(schema.items);
        return `array<${itemType}>`;
      }
      if (schema.type === "object" && schema.properties) {
        return "object";
      }
      if (schema.format) {
        return `${schema.type}(${schema.format})`;
      }
      return schema.type;
    }

    if (schema.properties) {
      return "object";
    }

    if (schema.items) {
      return "array";
    }

    return "unknown";
  }

  /**
   * Get the actual type of a value
   */
  private getActualType(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) {
      if (value.length > 0) {
        const itemType = this.getActualType(value[0]);
        return `array<${itemType}>`;
      }
      return "array";
    }

    const type = typeof value;
    if (type === "object") {
      return "object";
    }

    return type;
  }

  /**
   * Check if types match
   */
  private typesMatch(expectedType: string, actualType: string): boolean {
    // Handle null/undefined
    if (actualType === "null" || actualType === "undefined") {
      return false;
    }

    // Exact match
    if (expectedType === actualType) {
      return true;
    }

    // Handle format types (e.g., "string(date-time)" matches "string")
    if (expectedType.includes("(") && expectedType.startsWith(actualType)) {
      return true;
    }

    // Handle array types
    if (expectedType.startsWith("array") && actualType.startsWith("array")) {
      return true;
    }

    // Handle integer as number
    if (expectedType === "integer" && actualType === "number") {
      return true;
    }

    return false;
  }

  /**
   * Format AJV errors into ValidationError objects
   */
  private formatAjvErrors(ajvErrors: any[]): ValidationError[] {
    return ajvErrors.map((error) => ({
      field: error.instancePath || error.dataPath || "root",
      expected: error.params?.type || error.schemaPath || "valid value",
      actual: error.data !== undefined ? String(error.data) : "invalid",
      message: error.message || "Validation failed",
    }));
  }
}

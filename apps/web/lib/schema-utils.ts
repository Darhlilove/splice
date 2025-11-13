/**
 * Utility functions for displaying OpenAPI schemas
 */

import type { SchemaObject } from "@splice/openapi";

/**
 * Format a schema object for display, handling $ref pointers
 */
export function formatSchemaForDisplay(
  schema: SchemaObject | undefined,
  maxDepth = 3,
  currentDepth = 0
): string {
  if (!schema) {
    return "{}";
  }

  // Handle $ref pointers
  if (typeof schema === "object" && "$ref" in schema && schema.$ref) {
    return `{ "$ref": "${schema.$ref}" }`;
  }

  // Prevent infinite recursion
  if (currentDepth >= maxDepth) {
    return "{ ... }";
  }

  try {
    // Create a simplified version for display
    const simplified = simplifySchema(schema, currentDepth, maxDepth);
    return JSON.stringify(simplified, null, 2);
  } catch (error) {
    console.error("Error formatting schema:", error);
    return JSON.stringify(schema, null, 2);
  }
}

/**
 * Simplify a schema object for display
 */
function simplifySchema(
  schema: SchemaObject,
  currentDepth: number,
  maxDepth: number
): unknown {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  // Handle $ref
  if ("$ref" in schema && schema.$ref) {
    return { $ref: schema.$ref };
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    if (currentDepth >= maxDepth) {
      return ["..."];
    }
    return schema.map((item) =>
      simplifySchema(item as SchemaObject, currentDepth + 1, maxDepth)
    );
  }

  // Handle objects
  const result: Record<string, unknown> = {};

  // Key properties to always include
  const keyProps = [
    "type",
    "format",
    "description",
    "required",
    "properties",
    "items",
    "enum",
    "default",
    "example",
    "$ref",
    "allOf",
    "oneOf",
    "anyOf",
  ];

  for (const key of keyProps) {
    if (key in schema) {
      const value = (schema as Record<string, unknown>)[key];

      if (key === "properties" && typeof value === "object" && value !== null) {
        if (currentDepth >= maxDepth - 1) {
          result[key] = { "...": "..." };
        } else {
          const props: Record<string, unknown> = {};
          for (const [propKey, propValue] of Object.entries(value)) {
            props[propKey] = simplifySchema(
              propValue as SchemaObject,
              currentDepth + 1,
              maxDepth
            );
          }
          result[key] = props;
        }
      } else if (
        (key === "items" ||
          key === "allOf" ||
          key === "oneOf" ||
          key === "anyOf") &&
        typeof value === "object" &&
        value !== null
      ) {
        if (currentDepth >= maxDepth - 1) {
          result[key] = Array.isArray(value) ? ["..."] : { "...": "..." };
        } else {
          result[key] = simplifySchema(
            value as SchemaObject,
            currentDepth + 1,
            maxDepth
          );
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Get a human-readable type description from a schema
 */
export function getSchemaTypeDescription(
  schema: SchemaObject | undefined
): string {
  if (!schema) return "any";

  if (typeof schema === "object" && "$ref" in schema && schema.$ref) {
    // Extract the reference name
    const refParts = schema.$ref.split("/");
    return refParts[refParts.length - 1] || schema.$ref;
  }

  if ("type" in schema && schema.type) {
    if (schema.type === "array" && schema.items) {
      const itemType = getSchemaTypeDescription(schema.items as SchemaObject);
      return `${itemType}[]`;
    }
    if (schema.format) {
      return `${schema.type} (${schema.format})`;
    }
    return schema.type as string;
  }

  if ("allOf" in schema) return "allOf";
  if ("oneOf" in schema) return "oneOf";
  if ("anyOf" in schema) return "anyOf";

  return "object";
}

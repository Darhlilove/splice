/**
 * Utility functions for generating example values from OpenAPI schemas
 */

import type { SchemaObject } from "@/packages/openapi/src/types";

/**
 * Generate an example value from a schema
 */
export function generateExampleFromSchema(
  schema: SchemaObject | undefined,
  allSchemas: Record<string, SchemaObject> = {},
  depth = 0,
  maxDepth = 3
): unknown {
  if (!schema || depth > maxDepth) {
    return undefined;
  }

  // Use explicit example if provided
  if ("example" in schema && schema.example !== undefined) {
    return schema.example;
  }

  // Handle $ref
  if ("$ref" in schema && schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    if (refName && allSchemas[refName]) {
      return generateExampleFromSchema(
        allSchemas[refName],
        allSchemas,
        depth + 1,
        maxDepth
      );
    }
    return undefined;
  }

  // Handle by type
  switch (schema.type) {
    case "string":
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if (schema.format === "date") {
        return new Date().toISOString().split("T")[0];
      }
      if (schema.format === "date-time") {
        return new Date().toISOString();
      }
      if (schema.format === "email") {
        return "user@example.com";
      }
      if (schema.format === "uri" || schema.format === "url") {
        return "https://example.com";
      }
      return schema.description
        ? `Example ${schema.description.toLowerCase()}`
        : "string";

    case "number":
    case "integer":
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if ("minimum" in schema && typeof schema.minimum === "number") {
        return schema.minimum;
      }
      if ("default" in schema && typeof schema.default === "number") {
        return schema.default;
      }
      return schema.type === "integer" ? 0 : 0.0;

    case "boolean":
      if ("default" in schema && typeof schema.default === "boolean") {
        return schema.default;
      }
      return false;

    case "array":
      if (schema.items) {
        const itemExample = generateExampleFromSchema(
          schema.items as SchemaObject,
          allSchemas,
          depth + 1,
          maxDepth
        );
        return itemExample !== undefined ? [itemExample] : [];
      }
      return [];

    case "object":
      if (schema.properties) {
        const obj: Record<string, unknown> = {};
        const required = schema.required || [];

        // Generate examples for required properties first
        for (const key of required) {
          if (schema.properties[key]) {
            const value = generateExampleFromSchema(
              schema.properties[key] as SchemaObject,
              allSchemas,
              depth + 1,
              maxDepth
            );
            if (value !== undefined) {
              obj[key] = value;
            }
          }
        }

        // Add a few optional properties (up to 2)
        const optionalProps = Object.keys(schema.properties).filter(
          (key) => !required.includes(key)
        );
        for (let i = 0; i < Math.min(2, optionalProps.length); i++) {
          const key = optionalProps[i];
          const value = generateExampleFromSchema(
            schema.properties[key] as SchemaObject,
            allSchemas,
            depth + 1,
            maxDepth
          );
          if (value !== undefined) {
            obj[key] = value;
          }
        }

        return obj;
      }
      return {};

    default:
      return undefined;
  }
}

/**
 * Format example value as pretty JSON string
 */
export function formatExampleAsJSON(example: unknown): string {
  try {
    return JSON.stringify(example, null, 2);
  } catch (error) {
    console.error("Error formatting example:", error);
    return "{}";
  }
}

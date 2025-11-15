/**
 * Tests for schema example generation utilities
 */

import { describe, test, expect } from "vitest";
import {
  generateExampleFromSchema,
  formatExampleAsJSON,
} from "@/lib/schema-example";
import type { SchemaObject } from "@/packages/openapi/src/types";

describe("generateExampleFromSchema", () => {
  describe("Primitive types", () => {
    test("should generate string example", () => {
      const schema: SchemaObject = { type: "string" };
      const result = generateExampleFromSchema(schema);
      expect(typeof result).toBe("string");
    });

    test("should use explicit example if provided", () => {
      const schema: SchemaObject = {
        type: "string",
        example: "custom example",
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe("custom example");
    });

    test("should generate email format string", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "email",
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe("user@example.com");
    });

    test("should generate date format string", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "date",
      };
      const result = generateExampleFromSchema(schema);
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("should generate date-time format string", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "date-time",
      };
      const result = generateExampleFromSchema(schema);
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test("should generate uri format string", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "uri",
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe("https://example.com");
    });

    test("should use first enum value for string", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "completed", "cancelled"],
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe("pending");
    });

    test("should generate number example", () => {
      const schema: SchemaObject = { type: "number" };
      const result = generateExampleFromSchema(schema);
      expect(typeof result).toBe("number");
    });

    test("should use minimum value for number if provided", () => {
      const schema: SchemaObject = {
        type: "number",
        minimum: 10,
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe(10);
    });

    test("should use default value for number if provided", () => {
      const schema: SchemaObject = {
        type: "number",
        default: 42,
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe(42);
    });

    test("should generate integer example", () => {
      const schema: SchemaObject = { type: "integer" };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe(0);
    });

    test("should use first enum value for number", () => {
      const schema: SchemaObject = {
        type: "number",
        enum: [1, 2, 3],
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe(1);
    });

    test("should generate boolean example", () => {
      const schema: SchemaObject = { type: "boolean" };
      const result = generateExampleFromSchema(schema);
      expect(typeof result).toBe("boolean");
    });

    test("should use default value for boolean if provided", () => {
      const schema: SchemaObject = {
        type: "boolean",
        default: true,
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toBe(true);
    });
  });

  describe("Array type", () => {
    test("should generate array with item example", () => {
      const schema: SchemaObject = {
        type: "array",
        items: { type: "string" },
      };
      const result = generateExampleFromSchema(schema);
      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown[]).length).toBe(1);
    });

    test("should generate array with object items", () => {
      const schema: SchemaObject = {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
          },
        },
      };
      const result = generateExampleFromSchema(schema) as unknown[];
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    });

    test("should generate empty array if no items schema", () => {
      const schema: SchemaObject = {
        type: "array",
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toEqual([]);
    });
  });

  describe("Object type", () => {
    test("should generate object with required properties", () => {
      const schema: SchemaObject = {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          age: { type: "number" },
        },
      };
      const result = generateExampleFromSchema(schema) as Record<
        string,
        unknown
      >;
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result.email).toBe("user@example.com");
    });

    test("should include some optional properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          prop1: { type: "string" },
          prop2: { type: "string" },
          prop3: { type: "string" },
        },
      };
      const result = generateExampleFromSchema(schema) as Record<
        string,
        unknown
      >;
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(Object.keys(result).length).toBeLessThanOrEqual(2);
    });

    test("should generate nested objects", () => {
      const schema: SchemaObject = {
        type: "object",
        required: ["user"],
        properties: {
          user: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
        },
      };
      const result = generateExampleFromSchema(schema) as Record<
        string,
        unknown
      >;
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("name");
    });

    test("should return empty object if no properties", () => {
      const schema: SchemaObject = {
        type: "object",
      };
      const result = generateExampleFromSchema(schema);
      expect(result).toEqual({});
    });
  });

  describe("Depth limiting", () => {
    test("should stop generating at max depth", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: {
                type: "object",
                properties: {
                  level3: {
                    type: "object",
                    properties: {
                      level4: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const result = generateExampleFromSchema(schema, {}, 0, 2);
      expect(result).toBeDefined();
    });
  });

  describe("$ref handling", () => {
    test("should resolve $ref from allSchemas", () => {
      const schema: SchemaObject = {
        $ref: "#/components/schemas/User",
      };
      const allSchemas = {
        User: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
        },
      };
      const result = generateExampleFromSchema(schema, allSchemas) as Record<
        string,
        unknown
      >;
      expect(result).toHaveProperty("name");
    });

    test("should return undefined for unresolved $ref", () => {
      const schema: SchemaObject = {
        $ref: "#/components/schemas/Unknown",
      };
      const result = generateExampleFromSchema(schema, {});
      expect(result).toBeUndefined();
    });
  });
});

describe("formatExampleAsJSON", () => {
  test("should format object as pretty JSON", () => {
    const example = { name: "John", age: 30 };
    const result = formatExampleAsJSON(example);
    expect(result).toContain("{\n");
    expect(result).toContain("  ");
    expect(result).toContain('"name"');
  });

  test("should format array as pretty JSON", () => {
    const example = [1, 2, 3];
    const result = formatExampleAsJSON(example);
    expect(result).toContain("[\n");
    expect(result).toContain("  ");
  });

  test("should handle primitive values", () => {
    expect(formatExampleAsJSON("test")).toBe('"test"');
    expect(formatExampleAsJSON(42)).toBe("42");
    expect(formatExampleAsJSON(true)).toBe("true");
  });

  test("should return empty object for invalid input", () => {
    const circular: any = {};
    circular.self = circular;
    const result = formatExampleAsJSON(circular);
    expect(result).toBe("{}");
  });
});

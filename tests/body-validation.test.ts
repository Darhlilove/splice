/**
 * Tests for request body validation utilities
 */

import { describe, test, expect } from "vitest";
import { validateRequestBody } from "@/lib/body-validation";
import type { RequestBody, SchemaObject } from "@/packages/openapi/src/types";

describe("validateRequestBody", () => {
  describe("Required body validation", () => {
    test("should fail when required body is empty string", () => {
      const requestBody: RequestBody = {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const result = validateRequestBody(requestBody, "", "application/json");
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Request body is required");
      expect(result.errors[0].type).toBe("required");
    });

    test("should pass when optional body is empty", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const result = validateRequestBody(requestBody, "{}", "application/json");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("JSON syntax validation", () => {
    test("should fail when JSON syntax is invalid", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        "{ invalid json }",
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("json");
    });

    test("should pass when JSON syntax is valid", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"name": "test"}',
        "application/json"
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("Type validation", () => {
    test("should fail when type does not match schema", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "string" },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"name": "test"}',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("type");
    });

    test("should pass when type matches schema", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"name": "test"}',
        "application/json"
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("String validation", () => {
    test("should fail when string is too short", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "string",
              minLength: 10,
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '"short"',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("min");
    });

    test("should fail when string is too long", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "string",
              maxLength: 5,
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '"toolong"',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("max");
    });

    test("should fail when string does not match pattern", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "string",
              pattern: "^[a-z]+$",
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '"ABC123"',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("pattern");
    });

    test("should fail when string not in enum", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "string",
              enum: ["pending", "completed"],
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '"invalid"',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("enum");
    });
  });

  describe("Number validation", () => {
    test("should validate number properties in object", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["age"],
              properties: {
                age: {
                  type: "number",
                  minimum: 18,
                },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"age": 15}',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Object validation", () => {
    test("should fail when required property is missing", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email"],
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"name": "John"}',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("required");
      expect(result.errors[0].field).toBe("body.email");
    });

    test("should validate nested properties", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", minLength: 3 },
                  },
                },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"user": {"name": "ab"}}',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("min");
      expect(result.errors[0].field).toBe("body.user.name");
    });

    test("should pass when all required properties are present", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '{"name": "John"}',
        "application/json"
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("Array validation", () => {
    test("should fail when array has too few items", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "array",
              minItems: 2,
              items: { type: "string" },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '["one"]',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("min");
    });

    test("should fail when array has too many items", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "array",
              maxItems: 2,
              items: { type: "string" },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '["one", "two", "three"]',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("max");
    });

    test("should validate array items", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "number" },
                },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '[{"name": "test"}, {"id": 1}]',
        "application/json"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("body[0].id");
    });

    test("should pass when array is valid", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        '["one", "two", "three"]',
        "application/json"
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("Form data validation", () => {
    test("should validate form data object", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              required: ["username"],
              properties: {
                username: { type: "string", minLength: 3 },
                age: { type: "number" },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        { username: "ab" },
        "application/x-www-form-urlencoded"
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("min");
    });

    test("should pass when form data is valid", () => {
      const requestBody: RequestBody = {
        required: false,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      };

      const result = validateRequestBody(
        requestBody,
        { name: "John Doe" },
        "multipart/form-data"
      );
      expect(result.isValid).toBe(true);
    });
  });
});

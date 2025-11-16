/**
 * Tests for parameter validation utilities
 */

import { describe, test, expect } from "vitest";
import { validateParameter } from "@/lib/parameter-validation";
import type { Parameter } from "@/packages/openapi/src/types";

describe("validateParameter", () => {
  describe("Required field validation", () => {
    test("should fail when required field is empty string", () => {
      const parameter: Parameter = {
        name: "username",
        in: "query",
        required: true,
        schema: { type: "string" },
      };

      const result = validateParameter(parameter, "");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("This field is required and cannot be empty");
    });

    test("should fail when required field is null", () => {
      const parameter: Parameter = {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      };

      const result = validateParameter(parameter, null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("This field is required and cannot be empty");
    });

    test("should pass when required field has value", () => {
      const parameter: Parameter = {
        name: "username",
        in: "query",
        required: true,
        schema: { type: "string" },
      };

      const result = validateParameter(parameter, "john");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should pass when optional field is empty", () => {
      const parameter: Parameter = {
        name: "optional",
        in: "query",
        required: false,
        schema: { type: "string" },
      };

      const result = validateParameter(parameter, "");
      expect(result.isValid).toBe(true);
    });
  });

  describe("Type validation", () => {
    test("should fail when string expected but number provided", () => {
      const parameter: Parameter = {
        name: "name",
        in: "query",
        required: false,
        schema: { type: "string" },
      };

      const result = validateParameter(parameter, 123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be a text string value");
    });

    test("should fail when number expected but string provided", () => {
      const parameter: Parameter = {
        name: "age",
        in: "query",
        required: false,
        schema: { type: "number" },
      };

      const result = validateParameter(parameter, "not a number");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be a numeric number value");
    });

    test("should fail when integer expected but float provided", () => {
      const parameter: Parameter = {
        name: "count",
        in: "query",
        required: false,
        schema: { type: "integer" },
      };

      const result = validateParameter(parameter, 3.14);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Must be a whole number (integer) without decimals"
      );
    });

    test("should pass when boolean type matches", () => {
      const parameter: Parameter = {
        name: "active",
        in: "query",
        required: false,
        schema: { type: "boolean" },
      };

      const result = validateParameter(parameter, true);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Enum validation", () => {
    test("should fail when value not in enum", () => {
      const parameter: Parameter = {
        name: "status",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["pending", "completed", "cancelled"],
        },
      };

      const result = validateParameter(parameter, "invalid");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Must be one of");
    });

    test("should pass when value is in enum", () => {
      const parameter: Parameter = {
        name: "status",
        in: "query",
        required: false,
        schema: {
          type: "string",
          enum: ["pending", "completed", "cancelled"],
        },
      };

      const result = validateParameter(parameter, "pending");
      expect(result.isValid).toBe(true);
    });
  });

  describe("Pattern validation", () => {
    test("should fail when string does not match pattern", () => {
      const parameter: Parameter = {
        name: "email",
        in: "query",
        required: false,
        schema: {
          type: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
      };

      const result = validateParameter(parameter, "invalid-email");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Must match pattern");
    });

    test("should pass when string matches pattern", () => {
      const parameter: Parameter = {
        name: "email",
        in: "query",
        required: false,
        schema: {
          type: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
      };

      const result = validateParameter(parameter, "test@example.com");
      expect(result.isValid).toBe(true);
    });
  });

  describe("String length validation", () => {
    test("should fail when string is too short", () => {
      const parameter: Parameter = {
        name: "password",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 8,
        },
      };

      const result = validateParameter(parameter, "short");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be at least 8 characters");
    });

    test("should fail when string is too long", () => {
      const parameter: Parameter = {
        name: "username",
        in: "query",
        required: false,
        schema: {
          type: "string",
          maxLength: 10,
        },
      };

      const result = validateParameter(parameter, "verylongusername");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be at most 10 characters");
    });

    test("should pass when string length is within bounds", () => {
      const parameter: Parameter = {
        name: "username",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 20,
        },
      };

      const result = validateParameter(parameter, "validuser");
      expect(result.isValid).toBe(true);
    });
  });

  describe("Number range validation", () => {
    test("should fail when number is below minimum", () => {
      const parameter: Parameter = {
        name: "age",
        in: "query",
        required: false,
        schema: {
          type: "number",
          minimum: 18,
        },
      };

      const result = validateParameter(parameter, 15);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be at least 18");
    });

    test("should fail when number is above maximum", () => {
      const parameter: Parameter = {
        name: "percentage",
        in: "query",
        required: false,
        schema: {
          type: "number",
          maximum: 100,
        },
      };

      const result = validateParameter(parameter, 150);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be at most 100");
    });

    test("should pass when number is within range", () => {
      const parameter: Parameter = {
        name: "score",
        in: "query",
        required: false,
        schema: {
          type: "number",
          minimum: 0,
          maximum: 100,
        },
      };

      const result = validateParameter(parameter, 75);
      expect(result.isValid).toBe(true);
    });

    test("should fail when number equals exclusive minimum", () => {
      const parameter: Parameter = {
        name: "price",
        in: "query",
        required: false,
        schema: {
          type: "number",
          exclusiveMinimum: 0,
        },
      };

      const result = validateParameter(parameter, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be greater than 0");
    });

    test("should fail when number equals exclusive maximum", () => {
      const parameter: Parameter = {
        name: "discount",
        in: "query",
        required: false,
        schema: {
          type: "number",
          exclusiveMaximum: 100,
        },
      };

      const result = validateParameter(parameter, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Must be less than 100");
    });
  });
});

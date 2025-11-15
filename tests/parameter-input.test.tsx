/**
 * Tests for ParameterInput component
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParameterInput } from "@/components/ParameterInput";
import type { Parameter } from "@/packages/openapi/src/types";

describe("ParameterInput", () => {
  describe("TextInput (string type)", () => {
    test("should render text input for string parameter", () => {
      const parameter: Parameter = {
        name: "username",
        in: "query",
        required: true,
        description: "User's username",
        schema: { type: "string" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput parameter={parameter} value="" onChange={onChange} />
      );

      expect(screen.getByLabelText("username")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument(); // Required indicator
      expect(screen.getByText("User's username")).toBeInTheDocument();
    });
  });

  describe("NumberInput (number type)", () => {
    test("should render number input for number parameter", () => {
      const parameter: Parameter = {
        name: "limit",
        in: "query",
        required: false,
        description: "Maximum number of results",
        schema: { type: "number" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput parameter={parameter} value={10} onChange={onChange} />
      );

      const input = screen.getByLabelText("limit") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe("number");
      expect(input.value).toBe("10");
    });

    test("should render integer input for integer parameter", () => {
      const parameter: Parameter = {
        name: "page",
        in: "query",
        required: false,
        schema: { type: "integer" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput parameter={parameter} value={1} onChange={onChange} />
      );

      const input = screen.getByLabelText("page") as HTMLInputElement;
      expect(input.step).toBe("1");
    });
  });

  describe("CheckboxInput (boolean type)", () => {
    test("should render checkbox for boolean parameter", () => {
      const parameter: Parameter = {
        name: "active",
        in: "query",
        required: false,
        description: "Filter by active status",
        schema: { type: "boolean" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput
          parameter={parameter}
          value={true}
          onChange={onChange}
        />
      );

      expect(screen.getByLabelText("active")).toBeInTheDocument();
      expect(screen.getByText("Filter by active status")).toBeInTheDocument();
    });
  });

  describe("SelectInput (enum type)", () => {
    test("should render select dropdown for enum parameter", () => {
      const parameter: Parameter = {
        name: "status",
        in: "query",
        required: true,
        description: "Order status",
        schema: {
          type: "string",
          enum: ["pending", "completed", "cancelled"],
        },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput
          parameter={parameter}
          value="pending"
          onChange={onChange}
        />
      );

      expect(screen.getByLabelText("status")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  describe("ArrayInput (array type)", () => {
    test("should render text input for array parameter", () => {
      const parameter: Parameter = {
        name: "tags",
        in: "query",
        required: false,
        description: "Filter by tags",
        schema: { type: "array", items: { type: "string" } },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput
          parameter={parameter}
          value={["tag1", "tag2"]}
          onChange={onChange}
        />
      );

      const input = screen.getByLabelText("tags") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe("tag1, tag2");
    });
  });

  describe("Error display", () => {
    test("should display error message when provided", () => {
      const parameter: Parameter = {
        name: "email",
        in: "query",
        required: true,
        schema: { type: "string" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput
          parameter={parameter}
          value=""
          error="Email is required"
          onChange={onChange}
        />
      );

      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Required indicator", () => {
    test("should show asterisk for required parameters", () => {
      const parameter: Parameter = {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput parameter={parameter} value="" onChange={onChange} />
      );

      const asterisk = screen.getByLabelText("required");
      expect(asterisk).toBeInTheDocument();
      expect(asterisk.textContent).toBe("*");
    });

    test("should not show asterisk for optional parameters", () => {
      const parameter: Parameter = {
        name: "optional",
        in: "query",
        required: false,
        schema: { type: "string" },
      };

      const onChange = vi.fn();
      render(
        <ParameterInput parameter={parameter} value="" onChange={onChange} />
      );

      expect(screen.queryByLabelText("required")).not.toBeInTheDocument();
    });
  });
});

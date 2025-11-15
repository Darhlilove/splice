"use client";

import * as React from "react";
import { Parameter } from "@/packages/openapi/src/types";
import { ParameterValue } from "@/types/request-builder";
import { validateParameter } from "@/lib/parameter-validation";
import { ParameterInput } from "@/components/ParameterInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, ParameterValue>;
  errors: Record<string, string>;
  onChange: (name: string, value: ParameterValue) => void;
  onValidationChange?: (name: string, error: string | undefined) => void;
}

/**
 * Groups parameters by their location (query, path, header, cookie)
 */
function groupParametersByLocation(parameters: Parameter[]) {
  const groups: Record<string, Parameter[]> = {
    query: [],
    path: [],
    header: [],
    cookie: [],
  };

  parameters.forEach((param) => {
    if (param.in && groups[param.in]) {
      groups[param.in].push(param);
    }
  });

  return groups;
}

/**
 * ParameterForm component
 * Displays parameters grouped by location with collapsible sections
 * Handles parameter value changes and validation
 */
export function ParameterForm({
  parameters,
  values,
  errors,
  onChange,
  onValidationChange,
}: ParameterFormProps) {
  // Create a map of parameters by name for quick lookup
  const parameterMap = React.useMemo(() => {
    const map = new Map<string, Parameter>();
    parameters.forEach((param) => map.set(param.name, param));
    return map;
  }, [parameters]);

  /**
   * Handles parameter value change with validation
   */
  const handleParameterChange = React.useCallback(
    (name: string, value: ParameterValue) => {
      // Update the value
      onChange(name, value);

      // Validate the parameter
      const parameter = parameterMap.get(name);
      if (parameter && onValidationChange) {
        const validationResult = validateParameter(parameter, value);
        onValidationChange(
          name,
          validationResult.isValid ? undefined : validationResult.error
        );
      }
    },
    [onChange, onValidationChange, parameterMap]
  );

  // Group parameters by location
  const groupedParams = groupParametersByLocation(parameters);

  // Determine which sections have parameters
  const sections = [
    { key: "query", label: "Query Parameters", params: groupedParams.query },
    { key: "path", label: "Path Parameters", params: groupedParams.path },
    { key: "header", label: "Header Parameters", params: groupedParams.header },
    { key: "cookie", label: "Cookie Parameters", params: groupedParams.cookie },
  ].filter((section) => section.params.length > 0);

  // If no parameters, show empty state
  if (sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No parameters required for this endpoint.
      </div>
    );
  }

  // Set query and path sections to open by default
  const defaultOpenSections = sections
    .filter((section) => section.key === "query" || section.key === "path")
    .map((section) => section.key);

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={defaultOpenSections}
        className="w-full"
      >
        {sections.map((section) => (
          <AccordionItem key={section.key} value={section.key}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">{section.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {section.params.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {section.params.map((param) => (
                  <ParameterInput
                    key={param.name}
                    parameter={param}
                    value={values[param.name] ?? null}
                    error={errors[param.name]}
                    onChange={(value) =>
                      handleParameterChange(param.name, value)
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

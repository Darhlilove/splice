"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SchemaObject } from "@splice/openapi";
import { cn } from "@/lib/utils";

interface SchemaViewerProps {
  schema: SchemaObject | undefined;
  title?: string;
  defaultExpanded?: boolean;
  resizable?: boolean;
  allSchemas?: Record<string, SchemaObject>;
}

interface SchemaProperty {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  format?: string;
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  $ref?: string;
}

function SchemaPropertyRow({
  property,
  level = 0,
  allSchemas,
}: {
  property: SchemaProperty;
  level?: number;
  allSchemas?: Record<string, SchemaObject>;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  // Resolve $ref if present
  const resolvedProperty = useMemo(() => {
    if (property.$ref && allSchemas) {
      // Extract schema name from $ref (e.g., "#/components/schemas/Pet" -> "Pet")
      const refMatch = property.$ref.match(/#\/components\/schemas\/(.+)/);
      if (refMatch && refMatch[1]) {
        const schemaName = refMatch[1];
        const referencedSchema = allSchemas[schemaName];
        if (referencedSchema) {
          return {
            ...property,
            type: (referencedSchema.type as string) || "object",
            properties: referencedSchema.properties as
              | Record<string, SchemaObject>
              | undefined,
            items: referencedSchema.items as SchemaObject | undefined,
            description:
              property.description ||
              (referencedSchema.description as string | undefined),
          };
        }
      }
    }
    return property;
  }, [property, allSchemas]);

  const hasNested =
    resolvedProperty.properties ||
    (resolvedProperty.items &&
      (resolvedProperty.items as SchemaObject).properties);

  return (
    <div
      className={cn("py-2", level > 0 && "ml-6 border-l-2 border-muted pl-4")}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <code className="text-sm font-semibold text-foreground">
              {resolvedProperty.name}
            </code>
            <Badge
              variant="outline"
              className="text-xs font-mono bg-purple-500/10 text-purple-700 dark:text-purple-400"
            >
              {resolvedProperty.type}
              {resolvedProperty.format && ` (${resolvedProperty.format})`}
            </Badge>
            {resolvedProperty.required && (
              <Badge
                variant="destructive"
                className="text-xs bg-red-500/10 text-red-700 dark:text-red-400"
              >
                required
              </Badge>
            )}
            {resolvedProperty.enum && (
              <Badge variant="secondary" className="text-xs">
                enum
              </Badge>
            )}
            {property.$ref && (
              <Badge
                variant="outline"
                className="text-xs text-blue-600 dark:text-blue-400"
              >
                ref
              </Badge>
            )}
            {hasNested && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-auto hover:bg-muted rounded p-0.5 transition-colors"
              >
                <Icon
                  icon={
                    isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"
                  }
                  className="w-4 h-4 text-muted-foreground"
                />
              </button>
            )}
          </div>
          {resolvedProperty.description && (
            <p className="text-xs text-muted-foreground mb-1">
              {resolvedProperty.description}
            </p>
          )}
          {resolvedProperty.enum && (
            <div className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
              {(resolvedProperty.enum as unknown[])
                .map((v) => JSON.stringify(v))
                .join(" | ")}
            </div>
          )}
          {resolvedProperty.example !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Example:{" "}
              <code className="font-mono">
                {JSON.stringify(resolvedProperty.example)}
              </code>
            </div>
          )}
          {resolvedProperty.default !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Default:{" "}
              <code className="font-mono">
                {JSON.stringify(resolvedProperty.default)}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Nested properties */}
      {isExpanded && resolvedProperty.properties && (
        <div className="mt-2 space-y-1">
          {Object.entries(resolvedProperty.properties).map(([key, value]) => {
            const propSchema = value as SchemaObject;
            const nestedProp: SchemaProperty = {
              name: key,
              type: (propSchema.type as string) || "object",
              description: propSchema.description as string | undefined,
              required: false,
              format: propSchema.format as string | undefined,
              enum: propSchema.enum as unknown[] | undefined,
              example: propSchema.example,
              default: propSchema.default,
              properties: propSchema.properties as
                | Record<string, SchemaObject>
                | undefined,
              items: propSchema.items as SchemaObject | undefined,
              $ref: propSchema.$ref as string | undefined,
            };
            return (
              <SchemaPropertyRow
                key={key}
                property={nestedProp}
                level={level + 1}
                allSchemas={allSchemas}
              />
            );
          })}
        </div>
      )}

      {/* Array items */}
      {isExpanded &&
        resolvedProperty.items &&
        (resolvedProperty.items as SchemaObject).properties && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-2 font-semibold">
              Array items:
            </div>
            {Object.entries(
              (resolvedProperty.items as SchemaObject).properties as Record<
                string,
                SchemaObject
              >
            ).map(([key, value]) => {
              const propSchema = value as SchemaObject;
              const nestedProp: SchemaProperty = {
                name: key,
                type: (propSchema.type as string) || "object",
                description: propSchema.description as string | undefined,
                required: false,
                format: propSchema.format as string | undefined,
                enum: propSchema.enum as unknown[] | undefined,
                example: propSchema.example,
                default: propSchema.default,
                properties: propSchema.properties as
                  | Record<string, SchemaObject>
                  | undefined,
                items: propSchema.items as SchemaObject | undefined,
                $ref: propSchema.$ref as string | undefined,
              };
              return (
                <SchemaPropertyRow
                  key={key}
                  property={nestedProp}
                  level={level + 1}
                  allSchemas={allSchemas}
                />
              );
            })}
          </div>
        )}
    </div>
  );
}

export function SchemaViewer({
  schema,
  title = "Schema",
  defaultExpanded = true,
  resizable = true,
  allSchemas,
}: SchemaViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<"structured" | "json">("structured");

  // Resolve schema for JSON view - recursively resolve all $refs
  const resolvedSchemaForJson = useMemo(() => {
    if (!schema || !allSchemas) return schema;

    const resolveRefs = (obj: any, depth = 0): any => {
      // Prevent infinite recursion
      if (depth > 10) return obj;

      if (!obj || typeof obj !== "object") return obj;

      // If this is a $ref, resolve it
      if (obj.$ref && typeof obj.$ref === "string") {
        const refMatch = obj.$ref.match(/#\/components\/schemas\/(.+)/);
        if (refMatch && refMatch[1]) {
          const schemaName = refMatch[1];
          const referencedSchema = allSchemas[schemaName];
          if (referencedSchema) {
            // Recursively resolve refs in the referenced schema
            return resolveRefs(referencedSchema, depth + 1);
          }
        }
        return obj;
      }

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map((item) => resolveRefs(item, depth + 1));
      }

      // Handle objects - recursively resolve all properties
      const resolved: any = {};
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = resolveRefs(value, depth + 1);
      }
      return resolved;
    };

    return resolveRefs(schema);
  }, [schema, allSchemas]);

  const properties = useMemo(() => {
    if (!schema || typeof schema !== "object") {
      return [];
    }

    // Handle $ref at root level - resolve it first
    if (schema.$ref && allSchemas) {
      const refMatch = (schema.$ref as string).match(
        /#\/components\/schemas\/(.+)/
      );
      if (refMatch && refMatch[1]) {
        const schemaName = refMatch[1];
        const referencedSchema = allSchemas[schemaName];
        if (referencedSchema && referencedSchema.properties) {
          // Use the resolved schema's properties
          const props: SchemaProperty[] = [];
          const required = (referencedSchema.required as string[]) || [];

          for (const [name, prop] of Object.entries(
            referencedSchema.properties
          )) {
            const propSchema = prop as SchemaObject;
            props.push({
              name,
              type: (propSchema.type as string) || "object",
              description: propSchema.description as string | undefined,
              required: required.includes(name),
              format: propSchema.format as string | undefined,
              enum: propSchema.enum as unknown[] | undefined,
              example: propSchema.example,
              default: propSchema.default,
              items: propSchema.items as SchemaObject | undefined,
              properties: propSchema.properties as
                | Record<string, SchemaObject>
                | undefined,
              $ref: propSchema.$ref as string | undefined,
            });
          }
          return props;
        }
      }
    }

    // Handle array type with items
    if (schema.type === "array" && schema.items) {
      const itemsSchema = schema.items as SchemaObject;

      // If items has a $ref, resolve it
      if (itemsSchema.$ref && allSchemas) {
        const refMatch = (itemsSchema.$ref as string).match(
          /#\/components\/schemas\/(.+)/
        );

        if (refMatch && refMatch[1]) {
          const schemaName = refMatch[1];
          const referencedSchema = allSchemas[schemaName];

          if (referencedSchema && referencedSchema.properties) {
            const props: SchemaProperty[] = [];
            const required = (referencedSchema.required as string[]) || [];

            for (const [name, prop] of Object.entries(
              referencedSchema.properties
            )) {
              const propSchema = prop as SchemaObject;
              props.push({
                name,
                type: (propSchema.type as string) || "object",
                description: propSchema.description as string | undefined,
                required: required.includes(name),
                format: propSchema.format as string | undefined,
                enum: propSchema.enum as unknown[] | undefined,
                example: propSchema.example,
                default: propSchema.default,
                items: propSchema.items as SchemaObject | undefined,
                properties: propSchema.properties as
                  | Record<string, SchemaObject>
                  | undefined,
                $ref: propSchema.$ref as string | undefined,
              });
            }
            return props;
          }
        }
      }

      // If items has properties, show them
      if (itemsSchema.properties) {
        const props: SchemaProperty[] = [];
        const required = (itemsSchema.required as string[]) || [];

        for (const [name, prop] of Object.entries(itemsSchema.properties)) {
          const propSchema = prop as SchemaObject;
          props.push({
            name,
            type: (propSchema.type as string) || "object",
            description: propSchema.description as string | undefined,
            required: required.includes(name),
            format: propSchema.format as string | undefined,
            enum: propSchema.enum as unknown[] | undefined,
            example: propSchema.example,
            default: propSchema.default,
            items: propSchema.items as SchemaObject | undefined,
            properties: propSchema.properties as
              | Record<string, SchemaObject>
              | undefined,
            $ref: propSchema.$ref as string | undefined,
          });
        }
        return props;
      }
    }

    // Parse properties
    const props: SchemaProperty[] = [];
    const required = (schema.required as string[]) || [];

    if (schema.properties && typeof schema.properties === "object") {
      for (const [name, prop] of Object.entries(schema.properties)) {
        const propSchema = prop as SchemaObject;
        props.push({
          name,
          type: (propSchema.type as string) || "object",
          description: propSchema.description as string | undefined,
          required: required.includes(name),
          format: propSchema.format as string | undefined,
          enum: propSchema.enum as unknown[] | undefined,
          example: propSchema.example,
          default: propSchema.default,
          items: propSchema.items as SchemaObject | undefined,
          properties: propSchema.properties as
            | Record<string, SchemaObject>
            | undefined,
          $ref: propSchema.$ref as string | undefined,
        });
      }
    }

    return props;
  }, [schema, allSchemas]);

  if (!schema) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Icon
            icon="lucide:file-question"
            className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50"
          />
          <p className="text-sm text-muted-foreground">No schema available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon
              icon="lucide:braces"
              className="w-4 h-4 text-purple-600 dark:text-purple-400"
            />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "structured" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("structured")}
                className="h-8 px-3 rounded-r-none"
              >
                <Icon icon="lucide:list-tree" className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "json" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("json")}
                className="h-8 px-3 rounded-l-none border-l"
              >
                <Icon icon="lucide:braces" className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Icon
                icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-down"}
                className="w-4 h-4"
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div
            className={cn(
              "overflow-auto scrollbar-thin border rounded-lg bg-background",
              resizable
                ? "min-h-[60px] max-h-[600px] resize-y"
                : "max-h-[400px]"
            )}
          >
            {viewMode === "json" ? (
              <pre className="text-xs font-mono p-3 whitespace-pre-wrap break-words">
                {JSON.stringify(resolvedSchemaForJson, null, 2)}
              </pre>
            ) : properties.length > 0 ? (
              <div className="space-y-1 p-3">
                {properties.map((property) => (
                  <SchemaPropertyRow
                    key={property.name}
                    property={property}
                    allSchemas={allSchemas}
                  />
                ))}
              </div>
            ) : (
              <div className="py-2 p-3">
                {schema.$ref ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Reference:
                    </span>
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      {schema.$ref as string}
                    </code>
                  </div>
                ) : schema.type ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono bg-purple-500/10 text-purple-700 dark:text-purple-400"
                    >
                      {schema.type as string}
                      {schema.format && ` (${schema.format as string})`}
                    </Badge>
                    {schema.description && (
                      <span className="text-xs text-muted-foreground">
                        {schema.description as string}
                      </span>
                    )}
                    {schema.enum && (
                      <div className="w-full mt-1">
                        <span className="text-xs text-muted-foreground mr-2">
                          Values:
                        </span>
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                          {(schema.enum as unknown[])
                            .map((v) => JSON.stringify(v))
                            .join(" | ")}
                        </code>
                      </div>
                    )}
                    {schema.example !== undefined && (
                      <div className="w-full mt-1">
                        <span className="text-xs text-muted-foreground mr-2">
                          Example:
                        </span>
                        <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                          {JSON.stringify(schema.example)}
                        </code>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No properties defined
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

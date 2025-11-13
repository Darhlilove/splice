"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import type { Endpoint, HTTPMethod, SchemaObject } from "@splice/openapi";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SchemaViewer } from "./SchemaViewer";

interface EndpointDetailProps {
  endpoint: Endpoint;
  allSchemas?: Record<string, SchemaObject>;
}

const METHOD_COLORS: Record<HTTPMethod, string> = {
  get: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  post: "bg-green-500/10 text-green-700 dark:text-green-400",
  put: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  patch: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  delete: "bg-red-500/10 text-red-700 dark:text-red-400",
  options: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  head: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  trace: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export function EndpointDetail({ endpoint, allSchemas }: EndpointDetailProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    parameters: true,
    requestBody: true,
    responses: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasParameters = endpoint.parameters && endpoint.parameters.length > 0;
  const hasRequestBody = endpoint.requestBody !== undefined;
  const hasResponses = Object.keys(endpoint.responses).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Badge
            className={cn(
              "uppercase font-mono text-sm px-3 py-1",
              METHOD_COLORS[endpoint.method]
            )}
          >
            {endpoint.method}
          </Badge>
          <code className="text-lg font-mono">{endpoint.path}</code>
        </div>

        {endpoint.summary && (
          <p className="text-base text-foreground/90 mb-2">
            {endpoint.summary}
          </p>
        )}

        {endpoint.description && (
          <p className="text-sm text-muted-foreground">
            {endpoint.description}
          </p>
        )}

        {endpoint.tags && endpoint.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {endpoint.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Parameters Section */}
      {hasParameters && (
        <Collapsible
          open={openSections.parameters}
          onOpenChange={() => toggleSection("parameters")}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="lucide:list" className="w-4 h-4" />
                  Parameters
                  <Badge variant="secondary" className="text-xs">
                    {endpoint.parameters?.length}
                  </Badge>
                </CardTitle>
                <Icon
                  icon={
                    openSections.parameters
                      ? "lucide:chevron-up"
                      : "lucide:chevron-down"
                  }
                  className="w-5 h-5"
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>In</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoint.parameters?.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {param.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {param.in}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {param.schema?.type || "any"}
                        </TableCell>
                        <TableCell>
                          {param.required ? (
                            <Badge
                              variant="destructive"
                              className="text-xs bg-red-500/10 text-red-700 dark:text-red-400"
                            >
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {param.description || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Request Body Section */}
      {hasRequestBody && (
        <Collapsible
          open={openSections.requestBody}
          onOpenChange={() => toggleSection("requestBody")}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="lucide:file-json" className="w-4 h-4" />
                  Request Body
                  {endpoint.requestBody?.required && (
                    <Badge
                      variant="destructive"
                      className="text-xs bg-red-500/10 text-red-700 dark:text-red-400"
                    >
                      Required
                    </Badge>
                  )}
                </CardTitle>
                <Icon
                  icon={
                    openSections.requestBody
                      ? "lucide:chevron-up"
                      : "lucide:chevron-down"
                  }
                  className="w-5 h-5"
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {endpoint.requestBody?.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {endpoint.requestBody.description}
                  </p>
                )}
                <div className="space-y-2">
                  {endpoint.requestBody?.content &&
                    Object.entries(endpoint.requestBody.content).map(
                      ([contentType, mediaType]) => (
                        <div
                          key={contentType}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {contentType}
                            </Badge>
                          </div>
                          <SchemaViewer
                            schema={mediaType.schema}
                            title={`Schema (${contentType})`}
                            defaultExpanded={true}
                            resizable={true}
                            allSchemas={allSchemas}
                          />
                        </div>
                      )
                    )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Responses Section */}
      {hasResponses && (
        <Collapsible
          open={openSections.responses}
          onOpenChange={() => toggleSection("responses")}
        >
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon icon="lucide:arrow-left-right" className="w-4 h-4" />
                  Responses
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(endpoint.responses).length}
                  </Badge>
                </CardTitle>
                <Icon
                  icon={
                    openSections.responses
                      ? "lucide:chevron-up"
                      : "lucide:chevron-down"
                  }
                  className="w-5 h-5"
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(endpoint.responses).map(
                    ([statusCode, response]) => {
                      const isSuccess = statusCode.startsWith("2");
                      const isError =
                        statusCode.startsWith("4") ||
                        statusCode.startsWith("5");

                      return (
                        <div
                          key={statusCode}
                          className="border rounded-lg p-3 bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                isSuccess
                                  ? "default"
                                  : isError
                                  ? "destructive"
                                  : "outline"
                              }
                              className={cn(
                                "font-mono text-xs",
                                isSuccess &&
                                  "bg-green-500/10 text-green-700 dark:text-green-400",
                                isError &&
                                  "bg-red-500/10 text-red-700 dark:text-red-400"
                              )}
                            >
                              {statusCode}
                            </Badge>
                            <span className="text-sm font-medium">
                              {response.description}
                            </span>
                          </div>
                          {response.content &&
                            Object.entries(response.content).map(
                              ([contentType, mediaType]) => (
                                <div key={contentType} className="mt-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono mb-2"
                                  >
                                    {contentType}
                                  </Badge>
                                  <SchemaViewer
                                    schema={mediaType.schema}
                                    title={`Response Schema (${statusCode} - ${contentType})`}
                                    defaultExpanded={true}
                                    resizable={true}
                                    allSchemas={allSchemas}
                                  />
                                </div>
                              )
                            )}
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty state */}
      {!hasParameters && !hasRequestBody && !hasResponses && (
        <Card>
          <CardContent className="text-center py-8">
            <Icon
              icon="lucide:info"
              className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50"
            />
            <p className="text-muted-foreground">
              No additional details available for this endpoint
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

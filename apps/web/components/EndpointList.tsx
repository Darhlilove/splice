"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import type { Endpoint, HTTPMethod } from "@splice/openapi";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface EndpointListProps {
  endpoints: Endpoint[];
  selectedEndpoint?: Endpoint;
  onSelectEndpoint: (endpoint: Endpoint) => void;
}

const METHOD_COLORS: Record<
  HTTPMethod,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  get: {
    variant: "secondary",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
  },
  post: {
    variant: "default",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20",
  },
  put: {
    variant: "outline",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20",
  },
  patch: {
    variant: "outline",
    className:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20",
  },
  delete: {
    variant: "destructive",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20",
  },
  options: {
    variant: "outline",
    className:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 hover:bg-gray-500/20",
  },
  head: {
    variant: "outline",
    className:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 hover:bg-gray-500/20",
  },
  trace: {
    variant: "outline",
    className:
      "bg-gray-500/10 text-gray-700 dark:text-gray-400 hover:bg-gray-500/20",
  },
};

export function EndpointList({
  endpoints,
  selectedEndpoint,
  onSelectEndpoint,
}: EndpointListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract unique tags
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    endpoints.forEach((endpoint) => {
      endpoint.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [endpoints]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((endpoint) => {
      const matchesSearch =
        searchQuery === "" ||
        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.method.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === null || endpoint.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [endpoints, searchQuery, selectedTag]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-3">Endpoints</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Icon
            icon="lucide:search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tag filters */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <Badge
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Badge>
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Endpoint list */}
      <div className="space-y-1">
        {filteredEndpoints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Icon
              icon="lucide:search-x"
              className="w-8 h-8 mx-auto mb-2 opacity-50"
            />
            No endpoints found
          </div>
        ) : (
          filteredEndpoints.map((endpoint, index) => {
            const isSelected =
              selectedEndpoint?.path === endpoint.path &&
              selectedEndpoint?.method === endpoint.method;
            const methodConfig = METHOD_COLORS[endpoint.method];

            return (
              <button
                key={`${endpoint.method}-${endpoint.path}-${index}`}
                onClick={() => onSelectEndpoint(endpoint)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  isSelected
                    ? "bg-accent border-accent-foreground/30"
                    : "bg-background border-border"
                )}
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant={methodConfig.variant}
                    className={cn(
                      "uppercase font-mono text-xs min-w-[60px] justify-center",
                      methodConfig.className
                    )}
                  >
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">
                      {endpoint.path}
                    </p>
                    {endpoint.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {endpoint.summary}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Count */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        Showing {filteredEndpoints.length} of {endpoints.length} endpoints
      </div>
    </div>
  );
}

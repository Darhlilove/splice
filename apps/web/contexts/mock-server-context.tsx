"use client";

import * as React from "react";

/**
 * Mock server information returned from the API
 */
export interface MockServerInfo {
  url: string;
  port: number;
  pid: number;
  status: "running" | "stopped" | "starting" | "error";
  startedAt: Date;
  error?: string;
}

/**
 * Context value for mock server state
 */
interface MockServerContextValue {
  isMockMode: boolean;
  setMockMode: (enabled: boolean) => void;
  mockServerInfo: MockServerInfo | null;
  setMockServerInfo: (info: MockServerInfo | null) => void;
}

/**
 * Create the context with undefined default
 */
const MockServerContext = React.createContext<
  MockServerContextValue | undefined
>(undefined);

/**
 * Props for the MockServerProvider component
 */
interface MockServerProviderProps {
  children: React.ReactNode;
}

/**
 * MockServerProvider component
 * Provides global state for mock server mode and server information
 */
export function MockServerProvider({ children }: MockServerProviderProps) {
  const [isMockMode, setMockMode] = React.useState(false);
  const [mockServerInfo, setMockServerInfo] =
    React.useState<MockServerInfo | null>(null);

  // Automatically disable mock mode if server stops
  React.useEffect(() => {
    if (
      mockServerInfo &&
      (mockServerInfo.status === "stopped" || mockServerInfo.status === "error")
    ) {
      setMockMode(false);
    }
  }, [mockServerInfo]);

  const value = React.useMemo(
    () => ({
      isMockMode,
      setMockMode,
      mockServerInfo,
      setMockServerInfo,
    }),
    [isMockMode, mockServerInfo]
  );

  return (
    <MockServerContext.Provider value={value}>
      {children}
    </MockServerContext.Provider>
  );
}

/**
 * Hook to access mock server context
 * @throws Error if used outside of MockServerProvider
 */
export function useMockServer(): MockServerContextValue {
  const context = React.useContext(MockServerContext);

  if (context === undefined) {
    throw new Error("useMockServer must be used within a MockServerProvider");
  }

  return context;
}

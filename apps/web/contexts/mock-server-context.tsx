"use client";

import * as React from "react";

/**
 * Mock server configuration
 */
export interface MockServerConfig {
  enabled: boolean;
  baseUrl: string;
}

/**
 * Mock server context value
 */
interface MockServerContextValue {
  config: MockServerConfig;
  setEnabled: (enabled: boolean) => void;
  setBaseUrl: (baseUrl: string) => void;
  toggleMockServer: () => void;
}

/**
 * Mock server context
 */
const MockServerContext = React.createContext<
  MockServerContextValue | undefined
>(undefined);

/**
 * Props for MockServerProvider
 */
interface MockServerProviderProps {
  children: React.ReactNode;
}

/**
 * Mock server provider component
 * Manages mock server state across the application
 */
export function MockServerProvider({ children }: MockServerProviderProps) {
  const [config, setConfig] = React.useState<MockServerConfig>({
    enabled: false,
    baseUrl: "http://localhost:4010", // Default Prism mock server port
  });

  const setEnabled = React.useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const setBaseUrl = React.useCallback((baseUrl: string) => {
    setConfig((prev) => ({ ...prev, baseUrl }));
  }, []);

  const toggleMockServer = React.useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const value = React.useMemo(
    () => ({
      config,
      setEnabled,
      setBaseUrl,
      toggleMockServer,
    }),
    [config, setEnabled, setBaseUrl, toggleMockServer]
  );

  return (
    <MockServerContext.Provider value={value}>
      {children}
    </MockServerContext.Provider>
  );
}

/**
 * Hook to use mock server context
 */
export function useMockServer() {
  const context = React.useContext(MockServerContext);
  if (context === undefined) {
    throw new Error("useMockServer must be used within a MockServerProvider");
  }
  return context;
}

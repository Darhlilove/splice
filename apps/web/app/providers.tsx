"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MockServerProvider } from "@/contexts/mock-server-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { WorkflowProvider } from "@/contexts/workflow-context";
import { initializeGlobalErrorHandlers } from "@/lib/global-error-handler";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize global error handlers on mount
  // Requirements: 7.5
  useEffect(() => {
    initializeGlobalErrorHandlers();
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SettingsProvider>
        <WorkflowProvider>
          <MockServerProvider>{children}</MockServerProvider>
        </WorkflowProvider>
      </SettingsProvider>
    </NextThemesProvider>
  );
}

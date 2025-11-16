"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MockServerProvider } from "@/contexts/mock-server-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MockServerProvider>{children}</MockServerProvider>
    </NextThemesProvider>
  );
}

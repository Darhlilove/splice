"use client";

import { usePathname } from "next/navigation";
import { AppNavbar } from "./AppNavbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const hideNavbar = pathname === "/api-explorer";

  if (hideNavbar) {
    return null;
  }

  return <AppNavbar />;
}

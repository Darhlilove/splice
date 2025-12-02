"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ConnectedSpecSelector } from "@/components/SpecSelector";
import { MockServerStatus } from "@/components/MockServerStatus";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export function AppNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Upload", href: "/upload", icon: "lucide:upload" },
    { name: "Explorer", href: "/explorer", icon: "lucide:search" },
    { name: "Mock", href: "/mock", icon: "lucide:server" },
    { name: "SDK", href: "/sdk-generator", icon: "lucide:code" },
  ];

  return (
    <nav className="border-b border-border bg-background/70 backdrop-blur-md sticky top-0 z-50 dark:#7c3aed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Left: Logo */}
        <div className="flex items-center">
          <NextLink
            href="/"
            className="font-logo font-bold text-xl sm:text-2xl no-underline"
          >
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Splice
            </span>
          </NextLink>
        </div>

        {/* Right: Status components, Navigation Menu, Settings, Theme */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Spec Selector - Requirement 6.1 */}
          {mounted && <ConnectedSpecSelector />}

          {/* Mock Server Status - Requirement 4.5 */}
          {mounted && <MockServerStatus />}

          {/* Navigation Menu */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-lg p-2"
                  aria-label="Navigation menu"
                >
                  <Icon icon="lucide:menu" className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <NextLink
                        href={item.href}
                        className={`flex items-center gap-2 cursor-pointer ${isActive ? "bg-blue-600/10" : ""
                          }`}
                      >
                        <Icon icon={item.icon} className="h-4 w-4" />
                        <span>{item.name}</span>
                        {isActive && (
                          <Icon
                            icon="lucide:check"
                            className="h-4 w-4 ml-auto text-blue-600"
                          />
                        )}
                      </NextLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Settings */}
          {mounted && <SettingsDialog />}

          {/* Theme Switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-12 w-12 flex items-center justify-center rounded-lg p-2 hover:bg-blue-600/10 dark:hover:bg-blue-400/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

"use client";

import { Link } from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function AppNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Upload", href: "/upload", icon: "📤" },
    { name: "Explorer", href: "/explorer", icon: "🔍" },
    { name: "Mock", href: "/mock", icon: "🎭" },
    { name: "SDK", href: "/sdk-generator", icon: "⚡" },
  ];

  return (
    <nav className="border-b border-border bg-background/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link asChild>
          <NextLink href="/" className="font-bold text-2xl no-underline">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Splice
            </span>
          </NextLink>
        </Link>
        <div className="hidden sm:flex gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className="no-underline"
              >
                <button
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-colors
                    flex items-center gap-2
                    ${
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-transparent text-foreground hover:bg-blue-600/10 dark:hover:bg-blue-400/10"
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  {item.name}
                </button>
              </NextLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

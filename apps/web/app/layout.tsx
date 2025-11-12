import type { Metadata } from "next";
import { Poppins, Quicksand } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { AppNavbar } from "./components/AppNavbar";

// Tsukimi Rounded for app name/logo
const tsukimiRounded = localFont({
  src: [
    {
      path: "./fonts/Roboto_Flex,Tsukimi_Rounded/Tsukimi_Rounded/TsukimiRounded-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Roboto_Flex,Tsukimi_Rounded/Tsukimi_Rounded/TsukimiRounded-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Roboto_Flex,Tsukimi_Rounded/Tsukimi_Rounded/TsukimiRounded-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-logo",
});

// Quicksand for headers
const quicksand = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Poppins for body text
const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Splice - API Schema Explorer",
  description: "OpenAPI schema exploration and development tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${tsukimiRounded.variable} ${quicksand.variable} ${poppins.variable} font-body antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <AppNavbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins, Quicksand } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { LayoutContent } from "@/components/LayoutContent";

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
  title: "Splice - From Schema to SDK in Minutes",
  description: "Complete OpenAPI workflow tool. Upload your spec, explore endpoints interactively, spin up mock servers, and generate type-safe SDKs—all in one seamless experience.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://splice-production-80f1.up.railway.app'),
  openGraph: {
    title: "Splice - From Schema to SDK in Minutes",
    description: "Complete OpenAPI workflow tool. Upload your spec, explore endpoints interactively, spin up mock servers, and generate type-safe SDKs.",
    url: '/',
    siteName: 'Splice',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Splice - OpenAPI Development Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Splice - From Schema to SDK in Minutes",
    description: "Complete OpenAPI workflow tool. Upload, explore, mock, and generate SDKs from your OpenAPI specs.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KRM3SDVTM0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KRM3SDVTM0');
          `}
        </Script>

        {/* Iubenda Cookie Consent */}
        <Script id="iubenda-config" strategy="afterInteractive">
          {`
            var _iub = _iub || [];
            _iub.csConfiguration = {"siteId":4334525,"cookiePolicyId":37695076,"lang":"en","storage":{"useSiteId":true}};
          `}
        </Script>
        <Script
          src="https://cs.iubenda.com/autoblocking/4334525.js"
          strategy="afterInteractive"
        />
        <Script src="//cdn.iubenda.com/cs/gpp/stub.js" strategy="afterInteractive" />
        <Script
          src="//cdn.iubenda.com/cs/iubenda_cs.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${tsukimiRounded.variable} ${quicksand.variable} ${poppins.variable} font-body antialiased`}
      >
        <Providers>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

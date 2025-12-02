"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Icon } from "@iconify/react";
import {
  Search,
  Server,
  Code,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Globe
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slides = [
    { image: "https://res.cloudinary.com/dqdmetu6p/image/upload/v1764636311/hero-explorer-v0_q5kmsd.png", alt: "Schema Definition" },
    { image: "https://res.cloudinary.com/dqdmetu6p/image/upload/v1764636311/hero-schema-v0_chgn34.png", alt: "API Explorer" },
    { image: "https://res.cloudinary.com/dqdmetu6p/image/upload/v1764636311/hero-sdk-v0_d3jay6.png", alt: "SDK Generation" }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 px-6">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 opacity-40" />

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-border bg-background/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            v1.0 is now live
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            The Complete <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">OpenAPI Workflow</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Design, mock, test, and generate SDKs without leaving your browser.
            The modern toolchain for API-first teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link href="/upload">
              <Button size="lg" className="text-base h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/upload?mode=url&url=https://petstore3.swagger.io/api/v3/openapi.json">
              <Button size="lg" variant="outline" className="text-base h-12 px-8 rounded-full border-border hover:bg-muted/50 backdrop-blur-sm">
                <Icon icon="lucide:zap" className="w-4 h-4 mr-2 text-yellow-500" />
                Try with Swagger Petstore
              </Button>
            </Link>
          </div>

          {/* Hero Image Carousel */}
          <div className="mt-16 relative w-full max-w-7xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-8 border-border bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 group aspect-[16/10]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-fill"
                  priority={index === 0}
                />
                {/* Gradient overlay for better text contrast if needed, or just aesthetic - Dark mode only */}
                <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </div>
            ))}

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 shadow-sm ${index === currentSlide ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/60"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks (Alternating) */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">

          {/* Feature 1: Mock Server */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Server className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Instant Mock APIs</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stop waiting for the backend. Spin up realistic mock servers from your OpenAPI spec in seconds.
                Complete with validation, dynamic responses, and a public gateway for sharing.
              </p>
              <ul className="space-y-3 pt-4">
                {[
                  "Zero-config setup",
                  "Public gateway URLs",
                  "Request validation",
                  "Dynamic response generation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl border border-border bg-card/50 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl -z-10" />
              {/* Abstract Code UI */}
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-muted-foreground border-b border-border pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                  <span className="ml-2">server.ts</span>
                </div>
                <div className="text-blue-400">POST /api/users</div>
                <div className="text-green-400">201 Created</div>
                <div className="text-muted-foreground">
                  {`{
                    "id": "user_123",
                    "name": "John Doe",
                    "role": "admin",
                    "created_at": "2024-03-20T10:00:00Z"
                  }`}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: SDK Generation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
            <div className="order-2 lg:order-1 relative rounded-2xl border border-border bg-card/50 p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-2xl -z-10" />
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "TypeScript", icon: "TS", color: "text-blue-400 bg-blue-500/10" },
                  { name: "Python", icon: "PY", color: "text-yellow-400 bg-yellow-500/10" },
                  { name: "Go", icon: "GO", color: "text-cyan-400 bg-cyan-500/10" },
                  { name: "Java", icon: "JV", color: "text-red-400 bg-red-500/10" }
                ].map((lang) => (
                  <div
                    key={lang.name}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background/50 relative overflow-hidden"
                  >
                    <div className={`w-10 h-10 rounded-lg ${lang.color} flex items-center justify-center font-bold text-xs`}>
                      {lang.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.name}</span>
                      {lang.name !== "TypeScript" && (
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Coming Soon</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Code className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Type-Safe SDKs</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate production-ready client libraries for your favorite languages.
                Keep your frontend and backend in sync with automated type definitions.
              </p>
              <div className="flex flex-wrap gap-2 pt-4">
                {["TypeScript", "Python", "Go", "Java", "Rust", "PHP"].map((lang) => (
                  <div key={lang} className="relative group">
                    <Badge
                      variant={lang === "TypeScript" ? "secondary" : "outline"}
                      className="px-3 py-1 text-sm"
                    >
                      {lang}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 px-6 bg-secondary/10">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">See it in action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how Splice transforms your API workflow in under 2 minutes.
            </p>
          </div>

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-8 border-border bg-black/50">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/yoMH-pStc9k?si=FLFZclON08hc94kj"
              title="Splice Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 px-6 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Everything you need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for the modern API developer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Schema Explorer",
                desc: "Interactive documentation viewer for your OpenAPI specs.",
                icon: <Search className="w-6 h-6" />,
                col: "md:col-span-2"
              },
              {
                title: "Public Gateway",
                desc: "Share your local mock servers with the world.",
                icon: <Globe className="w-6 h-6" />,
                col: "md:col-span-1"
              },
              {
                title: "Validation",
                desc: "Ensure spec compliance with built-in linting.",
                icon: <Shield className="w-6 h-6" />,
                col: "md:col-span-1"
              },
              {
                title: "Fast & Secure",
                desc: "Built on modern tech stack for blazing performance.",
                icon: <Zap className="w-6 h-6" />,
                col: "md:col-span-2"
              }
            ].map((item, i) => (
              <Card key={i} className={`${item.col} bg-background border-border hover:border-primary/50 transition-colors`}>
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    {item.icon}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to build better APIs?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the future of API development today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/upload">
                <Button size="lg" className="text-lg h-14 px-10 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-all">
                  Start Building Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-border bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="font-logo font-bold text-2xl">Splice</div>
              <p className="text-muted-foreground max-w-xs">
                The complete OpenAPI workflow tool for modern development teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/upload" className="hover:text-foreground">Upload Spec</Link></li>
                <li><Link href="/mock" className="hover:text-foreground">Mock Server</Link></li>
                <li><Link href="/sdk-generator" className="hover:text-foreground">SDK Generator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="https://github.com/Darhlilove/splice" className="hover:text-foreground">GitHub</Link></li>
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-border">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Splice. All rights reserved.
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-sm">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-semibold text-foreground">Kiro</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

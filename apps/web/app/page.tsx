"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Upload, Search, Server, Code, ArrowRight } from "lucide-react";

export default function Home() {

  const features = [
    {
      title: "Upload Spec",
      description:
        "Import your OpenAPI/Swagger specifications with ease. Supports YAML and JSON formats.",
      icon: "📤",
      href: "/upload",
      badge: "Start Here",
    },
    {
      title: "Schema Explorer",
      description:
        "Interactive documentation viewer with detailed endpoint information and request/response schemas.",
      icon: "🔍",
      href: "/explorer",
      badge: "Explore",
    },
    {
      title: "Mock Server",
      description:
        "Generate realistic mock APIs instantly. Test your frontend without backend dependencies.",
      icon: "🎭",
      href: "/mock",
      badge: "Test",
    },
    {
      title: "SDK Generator",
      description:
        "Create type-safe client libraries automatically with full TypeScript support.",
      icon: "⚡",
      href: "/sdk-generator",
      badge: "Generate",
    },
  ];

  return (
    <div className="flex flex-col items-center px-6 py-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-20 space-y-8 max-w-4xl">
        <div className="space-y-4">
          <Badge variant="secondary" className="text-sm">
            OpenAPI Development Tool
          </Badge>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Splice
          </h1>
          <p className="text-2xl md:text-3xl font-semibold">
            From Schema to SDK in Minutes
          </p>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Complete OpenAPI workflow tool. Upload your spec, explore endpoints
          interactively, spin up mock servers, and generate type-safe SDKs—all
          in one seamless experience.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-6">
          <Link href="/upload">
            <Button size="lg" className="text-lg w-[250px] h-[50px] rounded-full">
              Get Started →
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mb-20">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="hover:scale-[1.02] transition-transform cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start gap-4 w-full">
                  <div className="text-5xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle>{feature.title}</CardTitle>
                      <Badge variant="secondary">{feature.badge}</Badge>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>



      <Separator className="my-12 max-w-6xl" />

      {/* Workflow Section */}
      <div className="text-center max-w-6xl w-full mb-20">
        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-lg text-muted-foreground mb-12">
          Four simple steps to accelerate your API development
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

          {[
            {
              step: "1",
              title: "Upload",
              desc: "Import your OpenAPI specification",
              icon: <Upload className="w-6 h-6" />,
              color: "bg-blue-500/10 text-blue-500",
            },
            {
              step: "2",
              title: "Explore",
              desc: "Browse endpoints and schemas",
              icon: <Search className="w-6 h-6" />,
              color: "bg-purple-500/10 text-purple-500",
            },
            {
              step: "3",
              title: "Mock",
              desc: "Test with generated mock servers",
              icon: <Server className="w-6 h-6" />,
              color: "bg-pink-500/10 text-pink-500",
            },
            {
              step: "4",
              title: "Generate",
              desc: "Create type-safe SDKs",
              icon: <Code className="w-6 h-6" />,
              color: "bg-orange-500/10 text-orange-500",
            },
          ].map((item) => (
            <Card key={item.step} className="border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center text-center p-6 pt-8 space-y-4">
                <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mb-2 shadow-sm`}>
                  {item.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Splice. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50">
              <span>Built with</span>
              <span className="font-semibold text-foreground">Kiro</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface ExplorerLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  specTitle?: string;
  specId?: string;
}

export function ExplorerLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  specTitle,
  specId,
}: ExplorerLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (specId) {
      router.push(`/explorer?specId=${specId}`);
    } else {
      router.push("/explorer");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {specTitle || "API Explorer"}
            </h1>
          </div>
          <Button
            variant="default"
            onClick={() =>
              router.push(
                specId ? `/sdk-generator?specId=${specId}` : "/sdk-generator"
              )
            }
            className="rounded-full"
          >
            <Icon icon="lucide:package" className="w-4 h-4 mr-2" />
            Generate SDK
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/upload")}
            className="rounded-full"
          >
            <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
            Upload Spec
          </Button>
        </div>
      </nav>

      {/* Three-panel layout with resizable panels */}
      <div className="flex-1 overflow-hidden hidden lg:block">
        <PanelGroup direction="horizontal">
          {/* Left Panel - Endpoint List */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={35}
            className="border-r bg-muted/30"
          >
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
              <div className="p-4">{leftPanel}</div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary/0 group-hover:bg-primary/30 transition-colors" />
          </PanelResizeHandle>

          {/* Center Panel - Request Builder */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
              <div className="p-6">{centerPanel}</div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group hidden xl:block">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary/0 group-hover:bg-primary/30 transition-colors" />
          </PanelResizeHandle>

          {/* Right Panel - Code Samples */}
          <Panel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            className="border-l bg-muted/30 hidden xl:block"
          >
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
              <div className="p-4">{rightPanel}</div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Mobile: Stack panels */}
      <div className="lg:hidden flex flex-col">
        <div className="border-t p-4">{leftPanel}</div>
        <div className="border-t p-4">{centerPanel}</div>
        <div className="border-t p-4">{rightPanel}</div>
      </div>
    </div>
  );
}

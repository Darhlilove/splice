"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useSettings } from "@/contexts/settings-context";

interface SettingsDialogProps {
  children?: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-lg p-2"
            aria-label="Settings"
          >
            <Icon icon="lucide:settings" className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your preferences for Splice
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Mock Server Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Mock Server</h3>
              <p className="text-sm text-muted-foreground">
                Configure automatic mock server behavior
              </p>
            </div>
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="auto-start"
                  className="text-sm font-medium cursor-pointer"
                >
                  Auto-start mock server
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start mock server when uploading a spec
                </p>
              </div>
              <Switch
                id="auto-start"
                checked={settings.autoStartMockServer}
                onCheckedChange={(checked) =>
                  updateSettings({ autoStartMockServer: checked })
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

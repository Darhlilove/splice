"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  savePreset,
  loadPresets,
  deletePreset,
  exportPresets,
  importPresets,
} from "@/lib/request-storage";
import type {
  PresetConfig,
  ParameterValue,
  AuthConfig,
} from "@/types/request-builder";
import { Save, Download, Upload, Trash2 } from "lucide-react";

interface PresetManagerProps {
  method: string;
  path: string;
  currentValues: {
    parameters: Record<string, ParameterValue>;
    requestBody?: string | Record<string, unknown>;
    authentication?: AuthConfig;
  };
  onLoadPreset: (preset: PresetConfig) => void;
}

export function PresetManager({
  method,
  path,
  currentValues,
  onLoadPreset,
}: PresetManagerProps) {
  const [presets, setPresets] = useState<PresetConfig[]>(() =>
    loadPresets(method, path)
  );
  const [selectedPresetName, setSelectedPresetName] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [saveError, setSaveError] = useState("");

  // Refresh presets from localStorage
  const refreshPresets = () => {
    setPresets(loadPresets(method, path));
  };

  // Handle saving a new preset
  const handleSavePreset = () => {
    setSaveError("");

    if (!newPresetName.trim()) {
      setSaveError("Preset name is required");
      return;
    }

    try {
      const preset: PresetConfig = {
        name: newPresetName.trim(),
        parameters: currentValues.parameters,
        requestBody: currentValues.requestBody,
        authentication: currentValues.authentication,
        createdAt: new Date(),
      };

      savePreset(method, path, preset);
      refreshPresets();
      setSaveDialogOpen(false);
      setNewPresetName("");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save preset"
      );
    }
  };

  // Handle loading a preset
  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      onLoadPreset(preset);
      setSelectedPresetName(presetName);
    }
  };

  // Handle deleting a preset
  const handleDeletePreset = (presetName: string) => {
    if (
      confirm(`Are you sure you want to delete the preset "${presetName}"?`)
    ) {
      try {
        deletePreset(method, path, presetName);
        refreshPresets();
        if (selectedPresetName === presetName) {
          setSelectedPresetName("");
        }
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to delete preset"
        );
      }
    }
  };

  // Handle exporting presets
  const handleExportPresets = () => {
    try {
      const jsonData = exportPresets(method, path);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presets-${method}-${path.replace(/\//g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to export presets"
      );
    }
  };

  // Handle importing presets
  const handleImportPresets = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        importPresets(method, path, text);
        refreshPresets();
        alert("Presets imported successfully");
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to import presets"
        );
      }
    };
    input.click();
  };

  const selectedPreset = presets.find((p) => p.name === selectedPresetName);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request Presets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Preset Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save as Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Request Preset</DialogTitle>
              <DialogDescription>
                Save the current parameter values, request body, and
                authentication for quick reuse.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="e.g., Test User Request"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSavePreset();
                    }
                  }}
                />
                {saveError && (
                  <p className="text-sm text-red-500">{saveError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setNewPresetName("");
                  setSaveError("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePreset}>Save Preset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Load Preset Dropdown */}
        {presets.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="preset-select">Load Preset</Label>
              <Select
                value={selectedPresetName}
                onValueChange={handleLoadPreset}
              >
                <SelectTrigger id="preset-select">
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Preset Info */}
            {selectedPreset && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedPreset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {selectedPreset.createdAt.toLocaleDateString()}{" "}
                      {selectedPreset.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePreset(selectedPreset.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Import/Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExportPresets}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleImportPresets}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </>
        )}

        {presets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No presets saved yet. Save your first preset to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

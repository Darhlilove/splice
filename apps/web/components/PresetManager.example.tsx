/**
 * Example usage of PresetManager component
 *
 * This file demonstrates how to integrate the PresetManager
 * into the RequestBuilder component.
 */

import { useState } from "react";
import { PresetManager } from "@/components/PresetManager";
import type {
  PresetConfig,
  ParameterValue,
  AuthConfig,
} from "@/types/request-builder";

// Example integration in RequestBuilder component
function RequestBuilderExample() {
  const [parameters, setParameters] = useState<Record<string, ParameterValue>>(
    {}
  );
  const [requestBody, setRequestBody] = useState<
    string | Record<string, unknown>
  >("");
  const [authentication, setAuthentication] = useState<AuthConfig>({
    type: "none",
  });

  // Handler for loading a preset
  const handleLoadPreset = (preset: PresetConfig) => {
    // Populate all form fields with preset values
    setParameters(preset.parameters);

    if (preset.requestBody) {
      setRequestBody(preset.requestBody);
    }

    if (preset.authentication) {
      setAuthentication(preset.authentication);
    }
  };

  return (
    <div className="space-y-4">
      {/* Other request builder components */}

      {/* PresetManager component */}
      <PresetManager
        method="GET"
        path="/users/{id}"
        currentValues={{
          parameters,
          requestBody,
          authentication,
        }}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}

/**
 * Features implemented:
 *
 * 1. Save Preset (Task 9.1)
 *    - Click "Save as Preset" button
 *    - Enter preset name in dialog
 *    - Saves parameters, request body, and auth to localStorage
 *    - Uses endpoint key (method:path) as storage key
 *
 * 2. Load Preset (Task 9.2)
 *    - Dropdown shows all saved presets for current endpoint
 *    - Select preset to load and populate all form fields
 *    - Shows preset creation date and time
 *
 * 3. Preset Management (Task 9.3)
 *    - Delete button removes selected preset
 *    - Export button downloads presets as JSON file
 *    - Import button uploads and merges presets from JSON file
 */

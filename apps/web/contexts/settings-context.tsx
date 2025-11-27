"use client";

import * as React from "react";

/**
 * User settings for the application
 */
interface Settings {
  autoStartMockServer: boolean;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: Settings = {
  autoStartMockServer: true,
};

/**
 * Context value for settings
 */
interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

/**
 * Create the context with undefined default
 */
const SettingsContext = React.createContext<SettingsContextValue | undefined>(
  undefined
);

/**
 * Props for the SettingsProvider component
 */
interface SettingsProviderProps {
  children: React.ReactNode;
}

/**
 * SettingsProvider component
 * Provides global settings state with localStorage persistence
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load settings from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("splice-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("splice-settings", JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = React.useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = React.useMemo(
    () => ({
      settings,
      updateSettings,
    }),
    [settings, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to access settings context
 * @throws Error if used outside of SettingsProvider
 */
export function useSettings(): SettingsContextValue {
  const context = React.useContext(SettingsContext);

  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}

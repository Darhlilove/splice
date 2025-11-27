"use client";

import * as React from "react";
import type { OpenAPISpec, Endpoint } from "@/packages/openapi/src/types";
import type { RequestConfig } from "@/types/request-builder";
import * as recentSpecsStorage from "@/lib/recent-specs-storage";
import * as specStorage from "@/lib/spec-storage";

/**
 * Workflow step types
 */
export type WorkflowStep = "upload" | "explore" | "mock" | "generate";

/**
 * Spec metadata for tracking uploaded specs
 */
export interface SpecMetadata {
  id: string;
  name: string;
  version: string;
  uploadedAt: Date;
  lastAccessedAt?: Date;
}

/**
 * SDK configuration interface
 */
export interface SDKConfig {
  language: "typescript";
  packageName: string;
  packageVersion: string;
  author?: string;
  description?: string;
}

/**
 * Endpoint information for explorer state
 */
export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
}

/**
 * Main workflow state interface
 */
export interface WorkflowState {
  // Current spec
  currentSpec: OpenAPISpec | null;
  specId: string | null;
  specMetadata: SpecMetadata | null;

  // Explorer state
  selectedEndpoint: EndpointInfo | null;
  requestConfig: RequestConfig | null;

  // Mock server state
  mockServer: {
    isRunning: boolean;
    url: string | null;
    port: number | null;
  };

  // SDK generation state
  sdkConfig: SDKConfig | null;
  generatedSdk: {
    downloadUrl: string | null;
    packageName: string | null;
  } | null;

  // Workflow progress
  completedSteps: WorkflowStep[];
  currentStep: WorkflowStep;

  // Recent specs
  recentSpecs: SpecMetadata[];
}

/**
 * Context value interface with state and actions
 */
export interface WorkflowContextValue {
  state: WorkflowState;

  // Spec actions
  setCurrentSpec: (spec: OpenAPISpec, metadata: SpecMetadata) => void;
  clearCurrentSpec: () => void;

  // Explorer actions
  setSelectedEndpoint: (endpoint: EndpointInfo | null) => void;
  setRequestConfig: (config: RequestConfig | null) => void;

  // Mock server actions
  setMockServerStatus: (status: {
    isRunning: boolean;
    url?: string;
    port?: number;
  }) => void;

  // SDK actions
  setSdkConfig: (config: SDKConfig | null) => void;
  setGeneratedSdk: (
    sdk: {
      downloadUrl: string;
      packageName: string;
    } | null
  ) => void;

  // Workflow actions
  completeStep: (step: WorkflowStep) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  resetWorkflow: () => void;

  // Recent specs actions
  addRecentSpec: (metadata: SpecMetadata) => void;
  loadRecentSpec: (specId: string) => Promise<void>;
}

/**
 * Initial workflow state
 */
const INITIAL_STATE: WorkflowState = {
  currentSpec: null,
  specId: null,
  specMetadata: null,
  selectedEndpoint: null,
  requestConfig: null,
  mockServer: {
    isRunning: false,
    url: null,
    port: null,
  },
  sdkConfig: null,
  generatedSdk: null,
  completedSteps: [],
  currentStep: "upload",
  recentSpecs: [],
};

/**
 * Create the context with undefined default
 */
const WorkflowContext = React.createContext<WorkflowContextValue | undefined>(
  undefined
);

/**
 * Props for the WorkflowProvider component
 */
interface WorkflowProviderProps {
  children: React.ReactNode;
}

/**
 * Storage key for session storage
 */
const STORAGE_KEY = "workflow-state";

/**
 * Debounce utility for saving state
 */
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  return React.useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * WorkflowProvider component
 * Provides global workflow state with session storage persistence
 */
export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [state, setState] = React.useState<WorkflowState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load state from sessionStorage on mount
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.specMetadata?.uploadedAt) {
          parsed.specMetadata.uploadedAt = new Date(
            parsed.specMetadata.uploadedAt
          );
        }
        if (parsed.specMetadata?.lastAccessedAt) {
          parsed.specMetadata.lastAccessedAt = new Date(
            parsed.specMetadata.lastAccessedAt
          );
        }
        if (parsed.recentSpecs) {
          parsed.recentSpecs = parsed.recentSpecs.map((spec: any) => ({
            ...spec,
            uploadedAt: new Date(spec.uploadedAt),
            lastAccessedAt: spec.lastAccessedAt
              ? new Date(spec.lastAccessedAt)
              : undefined,
          }));
        }
        setState(parsed);
      }

      // Load recent specs from localStorage
      const recentSpecs = recentSpecsStorage.getRecentSpecs();
      setState((prev) => ({
        ...prev,
        recentSpecs,
      }));
    } catch (error) {
      console.error(
        "Failed to load workflow state from sessionStorage:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to sessionStorage with debouncing (500ms)
  const saveToStorage = React.useCallback((stateToSave: WorkflowState) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save workflow state to sessionStorage:", error);
    }
  }, []);

  const debouncedSave = useDebouncedCallback(saveToStorage, 500);

  // Save to sessionStorage whenever state changes (after initial load)
  React.useEffect(() => {
    if (isLoaded) {
      debouncedSave(state);
    }
  }, [state, isLoaded, debouncedSave]);

  // Spec management actions
  const setCurrentSpec = React.useCallback(
    (spec: OpenAPISpec, metadata: SpecMetadata) => {
      // Add to recent specs
      recentSpecsStorage.addRecentSpec(metadata);
      const updatedRecentSpecs = recentSpecsStorage.getRecentSpecs();

      setState((prev) => ({
        ...prev,
        currentSpec: spec,
        specId: metadata.id,
        specMetadata: metadata,
        recentSpecs: updatedRecentSpecs,
        // Mark upload step as completed when spec is set
        completedSteps: prev.completedSteps.includes("upload")
          ? prev.completedSteps
          : [...prev.completedSteps, "upload"],
        currentStep: "explore",
      }));

      // Clear sessionStorage and start fresh (as per requirement 1.5)
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear sessionStorage:", error);
      }
    },
    []
  );

  const clearCurrentSpec = React.useCallback(() => {
    setState((prev) => ({
      ...INITIAL_STATE,
      recentSpecs: prev.recentSpecs, // Preserve recent specs
    }));

    // Clear sessionStorage when spec is cleared
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear sessionStorage:", error);
    }
  }, []);

  // Explorer state actions
  const setSelectedEndpoint = React.useCallback(
    (endpoint: EndpointInfo | null) => {
      setState((prev) => ({
        ...prev,
        selectedEndpoint: endpoint,
      }));
    },
    []
  );

  const setRequestConfig = React.useCallback((config: RequestConfig | null) => {
    setState((prev) => ({
      ...prev,
      requestConfig: config,
    }));
  }, []);

  // Mock server state actions
  const setMockServerStatus = React.useCallback(
    (status: { isRunning: boolean; url?: string; port?: number }) => {
      setState((prev) => ({
        ...prev,
        mockServer: {
          isRunning: status.isRunning,
          url: status.url ?? prev.mockServer.url,
          port: status.port ?? prev.mockServer.port,
        },
        // Mark mock step as completed when server starts
        completedSteps:
          status.isRunning && !prev.completedSteps.includes("mock")
            ? [...prev.completedSteps, "mock"]
            : prev.completedSteps,
      }));
    },
    []
  );

  // SDK generator state actions
  const setSdkConfig = React.useCallback((config: SDKConfig | null) => {
    setState((prev) => ({
      ...prev,
      sdkConfig: config,
    }));
  }, []);

  const setGeneratedSdk = React.useCallback(
    (sdk: { downloadUrl: string; packageName: string } | null) => {
      setState((prev) => ({
        ...prev,
        generatedSdk: sdk
          ? {
              downloadUrl: sdk.downloadUrl,
              packageName: sdk.packageName,
            }
          : null,
        // Mark generate step as completed when SDK is generated
        completedSteps:
          sdk && !prev.completedSteps.includes("generate")
            ? [...prev.completedSteps, "generate"]
            : prev.completedSteps,
      }));
    },
    []
  );

  // Workflow progress actions
  const completeStep = React.useCallback((step: WorkflowStep) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }));
  }, []);

  const setCurrentStep = React.useCallback((step: WorkflowStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const resetWorkflow = React.useCallback(() => {
    setState((prev) => ({
      ...INITIAL_STATE,
      recentSpecs: prev.recentSpecs, // Preserve recent specs
    }));

    // Clear sessionStorage on reset
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear sessionStorage:", error);
    }
  }, []);

  // Recent specs actions
  const addRecentSpec = React.useCallback((metadata: SpecMetadata) => {
    // Add to localStorage
    recentSpecsStorage.addRecentSpec(metadata);

    // Update state with the latest from localStorage
    const updatedRecentSpecs = recentSpecsStorage.getRecentSpecs();

    setState((prev) => ({
      ...prev,
      recentSpecs: updatedRecentSpecs,
    }));
  }, []);

  const loadRecentSpec = React.useCallback(async (specId: string) => {
    try {
      // Load spec data from sessionStorage
      const {
        spec,
        metadata,
        specId: loadedSpecId,
      } = specStorage.getStoredSpec(specId);

      if (!spec || !loadedSpecId) {
        console.error("Spec not found in storage:", specId);
        throw new Error("Spec not found");
      }

      // Update last accessed timestamp in recent specs
      recentSpecsStorage.updateLastAccessed(specId);
      const updatedRecentSpecs = recentSpecsStorage.getRecentSpecs();

      // Create spec metadata for workflow state
      const specMetadata: SpecMetadata = {
        id: loadedSpecId,
        name: spec.info.title,
        version: spec.info.version,
        uploadedAt: metadata?.uploadedAt
          ? new Date(metadata.uploadedAt)
          : new Date(),
        lastAccessedAt: new Date(),
      };

      // Update workflow state with loaded spec
      setState((prev) => ({
        ...prev,
        currentSpec: spec,
        specId: loadedSpecId,
        specMetadata,
        recentSpecs: updatedRecentSpecs,
        // Mark upload step as completed
        completedSteps: prev.completedSteps.includes("upload")
          ? prev.completedSteps
          : [...prev.completedSteps, "upload"],
        currentStep: "explore",
      }));
    } catch (error) {
      console.error("Failed to load recent spec:", error);
      throw error;
    }
  }, []);

  const value = React.useMemo(
    () => ({
      state,
      setCurrentSpec,
      clearCurrentSpec,
      setSelectedEndpoint,
      setRequestConfig,
      setMockServerStatus,
      setSdkConfig,
      setGeneratedSdk,
      completeStep,
      setCurrentStep,
      resetWorkflow,
      addRecentSpec,
      loadRecentSpec,
    }),
    [
      state,
      setCurrentSpec,
      clearCurrentSpec,
      setSelectedEndpoint,
      setRequestConfig,
      setMockServerStatus,
      setSdkConfig,
      setGeneratedSdk,
      completeStep,
      setCurrentStep,
      resetWorkflow,
      addRecentSpec,
      loadRecentSpec,
    ]
  );

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

/**
 * Hook to access workflow context
 * @throws Error if used outside of WorkflowProvider
 */
export function useWorkflow(): WorkflowContextValue {
  const context = React.useContext(WorkflowContext);

  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }

  return context;
}

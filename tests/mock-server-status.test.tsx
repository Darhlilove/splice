import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockServerStatus } from "@/components/MockServerStatus";
import * as WorkflowContext from "@/contexts/workflow-context";
import * as MockServerContext from "@/contexts/mock-server-context";

// Mock the contexts
vi.mock("@/contexts/workflow-context", () => ({
  useWorkflow: vi.fn(),
}));

vi.mock("@/contexts/mock-server-context", () => ({
  useMockServer: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MockServerStatus", () => {
  const mockSetMockServerStatus = vi.fn();
  const mockSetMockServerInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when no spec is loaded", () => {
    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
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
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: null,
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: false,
      setMockMode: vi.fn(),
    });

    const { container } = render(<MockServerStatus />);
    expect(container.firstChild).toBeNull();
  });

  it("displays stopped status when server is not running", () => {
    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
        currentSpec: { info: { title: "Test API", version: "1.0.0" } },
        specId: "test-spec",
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
        currentStep: "explore",
        recentSpecs: [],
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: null,
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: false,
      setMockMode: vi.fn(),
    });

    render(<MockServerStatus />);
    expect(screen.getByText("Stopped")).toBeDefined();
  });

  it("displays running status when server is running", () => {
    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
        currentSpec: { info: { title: "Test API", version: "1.0.0" } },
        specId: "test-spec",
        specMetadata: null,
        selectedEndpoint: null,
        requestConfig: null,
        mockServer: {
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        },
        sdkConfig: null,
        generatedSdk: null,
        completedSteps: [],
        currentStep: "explore",
        recentSpecs: [],
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: {
        url: "http://localhost:4010",
        port: 4010,
        pid: 12345,
        status: "running",
        startedAt: new Date(),
      },
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: true,
      setMockMode: vi.fn(),
    });

    render(<MockServerStatus />);
    expect(screen.getByText("Running")).toBeDefined();
  });

  it("displays server URL when running", () => {
    const serverUrl = "http://localhost:4010";

    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
        currentSpec: { info: { title: "Test API", version: "1.0.0" } },
        specId: "test-spec",
        specMetadata: null,
        selectedEndpoint: null,
        requestConfig: null,
        mockServer: {
          isRunning: true,
          url: serverUrl,
          port: 4010,
        },
        sdkConfig: null,
        generatedSdk: null,
        completedSteps: [],
        currentStep: "explore",
        recentSpecs: [],
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: {
        url: serverUrl,
        port: 4010,
        pid: 12345,
        status: "running",
        startedAt: new Date(),
      },
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: true,
      setMockMode: vi.fn(),
    });

    render(<MockServerStatus />);
    expect(screen.getByText(serverUrl)).toBeDefined();
  });

  it("displays start button when server is stopped", () => {
    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
        currentSpec: { info: { title: "Test API", version: "1.0.0" } },
        specId: "test-spec",
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
        currentStep: "explore",
        recentSpecs: [],
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: null,
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: false,
      setMockMode: vi.fn(),
    });

    render(<MockServerStatus />);
    expect(screen.getByText("Start")).toBeDefined();
  });

  it("displays stop button when server is running", () => {
    vi.mocked(WorkflowContext.useWorkflow).mockReturnValue({
      state: {
        currentSpec: { info: { title: "Test API", version: "1.0.0" } },
        specId: "test-spec",
        specMetadata: null,
        selectedEndpoint: null,
        requestConfig: null,
        mockServer: {
          isRunning: true,
          url: "http://localhost:4010",
          port: 4010,
        },
        sdkConfig: null,
        generatedSdk: null,
        completedSteps: [],
        currentStep: "explore",
        recentSpecs: [],
      },
      setMockServerStatus: mockSetMockServerStatus,
    } as any);

    vi.mocked(MockServerContext.useMockServer).mockReturnValue({
      mockServerInfo: {
        url: "http://localhost:4010",
        port: 4010,
        pid: 12345,
        status: "running",
        startedAt: new Date(),
      },
      setMockServerInfo: mockSetMockServerInfo,
      isMockMode: true,
      setMockMode: vi.fn(),
    });

    render(<MockServerStatus />);
    expect(screen.getByText("Stop")).toBeDefined();
  });
});

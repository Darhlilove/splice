/**
 * Unit tests for MockServerManager
 * Tests port allocation, process spawning (mocked), state management, and error scenarios
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { MockServerManager } from "../packages/openapi/src/mock-manager";
import type { MockServerConfig } from "../packages/openapi/src/mock-manager";
import { EventEmitter } from "events";
import * as childProcess from "child_process";
import * as net from "net";

// Mock child_process module
vi.mock("child_process", async () => {
  const actual = await vi.importActual("child_process");
  return {
    ...actual,
    spawn: vi.fn(),
    execSync: vi.fn(),
  };
});

// Mock net module for port checking
vi.mock("net", () => ({
  default: {},
  createServer: vi.fn(),
}));

describe("MockServerManager", () => {
  let manager: MockServerManager;
  let mockSpawnFn: any;
  let mockExecSyncFn: any;
  let mockCreateServer: any;

  beforeEach(() => {
    // Get mocked functions
    mockSpawnFn = childProcess.spawn as any;
    mockExecSyncFn = childProcess.execSync as any;
    mockCreateServer = net.createServer as any;

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock for Prism installation check (installed)
    // Mock it to succeed without throwing
    mockExecSyncFn.mockImplementation(() => "4.10.0");

    // Create manager after mocks are set up
    manager = new MockServerManager();

    // Spy on isPrismInstalled to always return true for tests that need it
    vi.spyOn(manager, "isPrismInstalled").mockReturnValue(true);
  });

  afterEach(async () => {
    // Clean up any running servers
    try {
      await manager.cleanup();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe("Prism Installation Detection", () => {
    test("should detect when Prism is not installed", () => {
      mockExecSyncFn.mockImplementation(() => {
        throw new Error("Command not found");
      });

      // Create new manager to reset cache
      const newManager = new MockServerManager();
      const isInstalled = newManager.isPrismInstalled();

      expect(isInstalled).toBe(false);
    });

    test("should provide installation instructions when not installed", () => {
      const instructions = manager.getPrismInstallationInstructions();

      expect(instructions).toContain("npm install -g @stoplight/prism-cli");
      expect(instructions).toContain("yarn global add @stoplight/prism-cli");
      expect(instructions).toContain("pnpm add -g @stoplight/prism-cli");
    });
  });

  describe("Port Allocation", () => {
    test("should find available port in range", async () => {
      // Mock port availability check - first port is available
      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") {
            callback();
          }
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const port = await manager.findAvailablePort(4010);

      expect(port).toBe(4010);
    });

    test("should skip occupied ports and find next available", async () => {
      let attemptCount = 0;

      mockCreateServer.mockImplementation(() => {
        attemptCount++;
        return {
          once: vi.fn((event, callback) => {
            // First port is occupied, second is available
            if (event === "error" && attemptCount === 1) {
              callback();
            } else if (event === "listening" && attemptCount === 2) {
              callback();
            }
          }),
          listen: vi.fn(),
          close: vi.fn(),
        };
      });

      const port = await manager.findAvailablePort(4010);

      expect(port).toBe(4011); // 4010 occupied, 4011 available
    });

    test("should throw error when no ports available in range", async () => {
      // Mock all ports as occupied
      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "error") {
            callback();
          }
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      await expect(manager.findAvailablePort(4095)).rejects.toThrow(
        "No available ports in range"
      );
    });

    test("should throw error after max retry attempts", async () => {
      // Mock all ports as occupied
      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "error") {
            callback();
          }
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      await expect(manager.findAvailablePort(4010)).rejects.toThrow(
        "Could not find available port after"
      );
    });
  });

  describe("State Management", () => {
    test("should return null for non-existent server", () => {
      const info = manager.getServerInfo("non-existent");

      expect(info).toBeNull();
    });

    test("should track server state during lifecycle", async () => {
      // Mock successful Prism spawn
      const mockProcess = createMockProcess();
      mockSpawnFn.mockImplementation(() => mockProcess);

      // Mock port availability
      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
        port: 4010,
      };

      // Start server
      const startPromise = manager.startServer("test-spec", config);

      // Simulate Prism startup
      setTimeout(() => {
        mockProcess.stdout.emit("data", Buffer.from("Prism is listening"));
      }, 10);

      const serverInfo = await startPromise;

      expect(serverInfo.status).toBe("running");
      expect(serverInfo.port).toBe(4010);
      expect(serverInfo.url).toBe("http://localhost:4010");
      expect(serverInfo.pid).toBeGreaterThan(0);
    });

    test("should return all servers", async () => {
      // Mock successful Prism spawn
      const mockProcess = createMockProcess();
      mockSpawnFn.mockReturnValue(mockProcess);

      // Mock port availability
      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.stdout.emit("data", Buffer.from("Prism is listening"));
      }, 10);

      await startPromise;

      const allServers = manager.getAllServers();

      expect(allServers.size).toBe(1);
      expect(allServers.has("test-spec")).toBe(true);
    });
  });

  describe("Process Spawning", () => {
    test("should spawn Prism process with correct arguments", async () => {
      const mockProcess = createMockProcess();
      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
        port: 4010,
        host: "localhost",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.stdout.emit("data", Buffer.from("Prism is listening"));
      }, 10);

      await startPromise;

      expect(mockSpawnFn).toHaveBeenCalledWith("prism", [
        "mock",
        "/tmp/test-spec.json",
        "--host",
        "localhost",
        "--port",
        "4010",
        "--dynamic",
      ]);
    });

    test("should return existing server if already running", async () => {
      const mockProcess = createMockProcess();
      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise1 = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.stdout.emit("data", Buffer.from("Prism is listening"));
      }, 10);

      const info1 = await startPromise1;
      const info2 = await manager.startServer("test-spec", config);

      expect(info1).toEqual(info2);
      expect(mockSpawnFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Scenarios", () => {
    test("should throw error when Prism is not installed", async () => {
      mockExecSyncFn.mockImplementation(() => {
        throw new Error("Command not found");
      });

      // Create new manager to reset cache
      const newManager = new MockServerManager();

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      await expect(newManager.startServer("test-spec", config)).rejects.toThrow(
        "Prism CLI is not installed"
      );
    });

    test("should handle process spawn errors", async () => {
      const mockProcess = createMockProcess();

      // Add error handler to prevent unhandled error
      mockProcess.on("error", () => { });

      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.emit("error", new Error("Spawn failed"));
      }, 10);

      await expect(startPromise).rejects.toThrow(
        "Failed to spawn Prism process"
      );
    });

    test("should handle Prism startup errors", async () => {
      const mockProcess = createMockProcess();
      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.stderr.emit("data", Buffer.from("Invalid OpenAPI spec"));
      }, 10);

      await expect(startPromise).rejects.toThrow("Prism startup failed");
    });

    test("should update state to error on startup failure", async () => {
      const mockProcess = createMockProcess();

      // Add error handler to prevent unhandled error
      mockProcess.on("error", () => { });

      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.emit("error", new Error("Spawn failed"));
      }, 10);

      try {
        await startPromise;
      } catch (error) {
        // Expected error
      }

      const serverInfo = manager.getServerInfo("test-spec");
      expect(serverInfo?.status).toBe("error");
      expect(serverInfo?.error).toContain("Failed to spawn Prism process");
    });

    test("should throw error when stopping non-existent server", async () => {
      await expect(manager.stopServer("non-existent")).rejects.toThrow(
        "No server found for specId"
      );
    });
  });

  describe("Server Lifecycle", () => {
    test("should stop running server", async () => {
      const mockProcess = createMockProcess();
      mockSpawnFn.mockReturnValue(mockProcess);

      mockCreateServer.mockReturnValue({
        once: vi.fn((event, callback) => {
          if (event === "listening") callback();
        }),
        listen: vi.fn(),
        close: vi.fn(),
      });

      const config: MockServerConfig = {
        specPath: "/tmp/test-spec.json",
      };

      const startPromise = manager.startServer("test-spec", config);

      setTimeout(() => {
        mockProcess.stdout.emit("data", Buffer.from("Prism is listening"));
      }, 10);

      await startPromise;

      // Stop server
      const stopPromise = manager.stopServer("test-spec");

      setTimeout(() => {
        mockProcess.emit("exit", 0, "SIGTERM");
      }, 10);

      await stopPromise;

      const serverInfo = manager.getServerInfo("test-spec");
      expect(serverInfo?.status).toBe("stopped");
    });
  });
});

/**
 * Helper function to create a mock ChildProcess
 */
function createMockProcess(): any {
  const emitter = new EventEmitter();
  return {
    ...emitter,
    pid: Math.floor(Math.random() * 10000) + 1000,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(),
    once: emitter.once.bind(emitter),
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
  };
}

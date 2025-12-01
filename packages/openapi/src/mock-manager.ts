/**
 * Mock Server Manager
 *
 * Manages lifecycle of Prism mock servers including:
 * - Port allocation
 * - Process spawning and monitoring
 * - State management
 * - Crash detection and recovery
 */

import { spawn, ChildProcess, execSync } from "child_process";
import * as net from "net";

export interface MockServerConfig {
  specPath: string;
  port?: number;
  host?: string;
}

export interface MockServerInfo {
  url: string;
  port: number;
  pid: number;
  status: "running" | "stopped" | "starting" | "error";
  startedAt: Date;
  error?: string;
}

export class MockServerManager {
  private servers: Map<string, MockServerInfo> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  private readonly PORT_RANGE_START = 4010;
  private readonly PORT_RANGE_END = 4099;
  private readonly MAX_PORT_RETRIES = 10;
  private prismInstalled: boolean | null = null;

  /**
   * Check if Prism CLI is installed on the system
   */
  isPrismInstalled(): boolean {
    // Cache the result to avoid repeated checks
    if (this.prismInstalled !== null) {
      return this.prismInstalled;
    }

    try {
      // Try to execute 'prism --version'
      execSync("prism --version", { stdio: "pipe" });
      this.prismInstalled = true;
      return true;
    } catch (error) {
      this.prismInstalled = false;
      return false;
    }
  }

  /**
   * Get Prism installation instructions
   */
  getPrismInstallationInstructions(): string {
    return (
      "Prism CLI is not installed. Please install it using one of the following methods:\n\n" +
      "npm: npm install -g @stoplight/prism-cli\n" +
      "yarn: yarn global add @stoplight/prism-cli\n" +
      "pnpm: pnpm add -g @stoplight/prism-cli\n\n" +
      "For more information, visit: https://docs.stoplight.io/docs/prism/674b27b261c3c-prism-overview"
    );
  }

  /**
   * Start a mock server for the given spec
   */
  async startServer(
    specId: string,
    config: MockServerConfig
  ): Promise<MockServerInfo> {
    // Check if Prism is installed
    if (!this.isPrismInstalled()) {
      throw new Error(
        `Prism CLI is not installed. ${this.getPrismInstallationInstructions()}`
      );
    }

    // Check if server already running
    const existing = this.servers.get(specId);
    if (existing && existing.status === "running") {
      return existing;
    }

    // Set initial status
    const startingInfo: MockServerInfo = {
      url: "",
      port: 0,
      pid: 0,
      status: "starting",
      startedAt: new Date(),
    };
    this.servers.set(specId, startingInfo);

    try {
      // Find available port with retry logic
      let port: number;
      let attempts = 0;
      let lastError: Error | null = null;

      if (config.port) {
        // User specified a port, try it first
        const isAvailable = await this.isPortAvailable(config.port);
        if (!isAvailable) {
          console.warn(
            `Requested port ${config.port} is not available, finding alternative...`
          );
          port = await this.findAvailablePort(this.PORT_RANGE_START);
        } else {
          port = config.port;
        }
      } else {
        port = await this.findAvailablePort(this.PORT_RANGE_START);
      }

      const host = config.host || "localhost";

      // Try to spawn Prism process with port conflict retry
      while (attempts < this.MAX_PORT_RETRIES) {
        try {
          const process = await this.spawnPrismProcess(
            specId,
            config.specPath,
            port,
            host
          );

          // Store process reference
          this.processes.set(specId, process);

          // Create server info
          const serverInfo: MockServerInfo = {
            url: `http://${host}:${port}`,
            port,
            pid: process.pid || 0,
            status: "running",
            startedAt: new Date(),
          };

          this.servers.set(specId, serverInfo);

          // Monitor process for crashes
          this.monitorProcess(specId, process);

          return serverInfo;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Check if it's a port conflict error (EADDRINUSE)
          if (
            lastError.message.includes("EADDRINUSE") ||
            lastError.message.includes("address already in use")
          ) {
            console.warn(
              `Port ${port} conflict detected (attempt ${attempts + 1}/${this.MAX_PORT_RETRIES
              }), trying next port...`
            );
            attempts++;

            // Try next available port
            port = await this.findAvailablePort(port + 1);

            // Continue to next iteration
            continue;
          }

          // If it's not a port conflict, throw immediately
          throw lastError;
        }
      }

      // If we exhausted all retries
      throw new Error(
        `Failed to start mock server after ${this.MAX_PORT_RETRIES} port conflict retries. ` +
        `Last error: ${lastError?.message || "Unknown error"}`
      );
    } catch (error) {
      const errorInfo: MockServerInfo = {
        url: "",
        port: 0,
        pid: 0,
        status: "error",
        startedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
      this.servers.set(specId, errorInfo);
      throw error;
    }
  }

  /**
   * Stop a running mock server
   */
  async stopServer(specId: string): Promise<void> {
    const process = this.processes.get(specId);
    const serverInfo = this.servers.get(specId);

    if (!process || !serverInfo) {
      throw new Error(`No server found for specId: ${specId}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        process.kill("SIGKILL");
        reject(new Error("Server stop timeout - forced kill"));
      }, 2000);

      process.once("exit", () => {
        clearTimeout(timeout);
        this.processes.delete(specId);
        this.servers.set(specId, {
          ...serverInfo,
          status: "stopped",
        });
        resolve();
      });

      // Send termination signal
      process.kill("SIGTERM");
    });
  }

  /**
   * Get server info for a specific spec
   */
  getServerInfo(specId: string): MockServerInfo | null {
    return this.servers.get(specId) || null;
  }

  /**
   * Get all running servers
   */
  getAllServers(): Map<string, MockServerInfo> {
    return new Map(this.servers);
  }

  /**
   * Find an available port in the configured range
   */
  async findAvailablePort(startPort: number): Promise<number> {
    let attempts = 0;
    let currentPort = startPort;

    while (attempts < this.MAX_PORT_RETRIES) {
      if (currentPort > this.PORT_RANGE_END) {
        throw new Error(
          `No available ports in range ${this.PORT_RANGE_START}-${this.PORT_RANGE_END}`
        );
      }

      const isAvailable = await this.isPortAvailable(currentPort);
      if (isAvailable) {
        return currentPort;
      }

      currentPort++;
      attempts++;
    }

    throw new Error(
      `Could not find available port after ${this.MAX_PORT_RETRIES} attempts`
    );
  }

  /**
   * Check if a port is available
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", () => {
        resolve(false);
      });

      server.once("listening", () => {
        server.close();
        resolve(true);
      });

      server.listen(port);
    });
  }

  /**
   * Parse Prism error output into user-friendly messages
   */
  private parseSpecError(errorOutput: string): string {
    try {
      // Check for EMISSINGPOINTER error code (common pattern)
      if (
        errorOutput.includes("EMISSINGPOINTER") ||
        errorOutput.includes("MissingPointerError")
      ) {
        // Try to extract the message more robustly
        let message = errorOutput;

        // Extract the missing reference pattern
        const refMatch = errorOutput.match(
          /token "([^"]+)" in "([^"]+)" does not exist/
        );
        if (refMatch) {
          const [, token, reference] = refMatch;
          return `Invalid OpenAPI specification: Missing schema reference "${reference}". The schema component "${token}" is referenced but not defined in the spec. Please add the "${token}" schema to your components/schemas section.`;
        }

        // Fallback with the extracted message
        return `Invalid OpenAPI specification: ${message.substring(0, 200)}`;
      }

      // Try to parse as JSON if it looks like a JSON error object
      if (errorOutput.includes("{") && errorOutput.includes("}")) {
        // Extract JSON portion
        const jsonMatch = errorOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const errorObj = JSON.parse(jsonMatch[0]);

            // Handle MissingPointerError
            if (
              errorObj.code === "EMISSINGPOINTER" ||
              errorObj.name === "MissingPointerError"
            ) {
              const message = errorObj.message || "";

              // Extract the missing reference
              const refMatch = message.match(
                /token "([^"]+)" in "([^"]+)" does not exist/
              );
              if (refMatch) {
                const [, token, reference] = refMatch;
                return `Invalid OpenAPI specification: Missing schema reference "${reference}". The schema component "${token}" is referenced but not defined in the spec.`;
              }

              // Fallback for other missing pointer errors
              return `Invalid OpenAPI specification: ${message}`;
            }

            // Handle other error types
            if (errorObj.message) {
              return `OpenAPI specification error: ${errorObj.message}`;
            }
          } catch (parseError) {
            // JSON parsing failed, continue to other checks
          }
        }
      }

      // Check for common error patterns
      if (errorOutput.includes("ResolverError")) {
        return "Invalid OpenAPI specification: Unable to resolve schema references. Please check that all $ref pointers are valid.";
      }

      if (errorOutput.includes("Error opening file")) {
        return "Unable to read OpenAPI specification file. Please ensure the file is accessible.";
      }

      if (errorOutput.includes("YAML")) {
        return "Invalid OpenAPI specification: YAML parsing error. Please check your spec syntax.";
      }

      if (errorOutput.includes("JSON")) {
        return "Invalid OpenAPI specification: JSON parsing error. Please check your spec syntax.";
      }

      // Generic fallback
      return `Mock server startup failed: ${errorOutput.substring(0, 200)}`;
    } catch (parseError) {
      // If parsing fails, return a generic message
      return `Mock server startup failed. Please check your OpenAPI specification for errors.`;
    }
  }

  /**
   * Spawn a Prism process for the given spec
   */
  private async spawnPrismProcess(
    specId: string,
    specPath: string,
    port: number,
    host: string
  ): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      // Spawn Prism CLI process
      const process = spawn("prism", [
        "mock",
        specPath,
        "--host",
        host,
        "--port",
        port.toString(),
        "--dynamic",
        "--errors=false", // Allow dynamic responses even when proper response definitions are missing
      ]);

      let startupOutput = "";
      let hasStarted = false;

      // Capture stdout for startup detection
      process.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        startupOutput += output;

        // Check if Prism has started successfully
        if (
          !hasStarted &&
          (output.includes("Prism is listening") || output.includes("started"))
        ) {
          hasStarted = true;
          resolve(process);
        }
      });

      // Capture stderr - Prism outputs logs to stderr, not just errors
      process.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        startupOutput += output;

        // Check if Prism has started successfully (Prism logs to stderr)
        if (
          !hasStarted &&
          (output.includes("Prism is listening") || output.includes("start"))
        ) {
          hasStarted = true;
          resolve(process);
        }

        // Only treat as error if it contains actual error indicators
        if (!hasStarted) {
          // Check for port conflict errors
          if (
            output.includes("EADDRINUSE") ||
            output.includes("address already in use")
          ) {
            reject(
              new Error(
                `Port ${port} is already in use (EADDRINUSE). Will retry with next available port.`
              )
            );
          } else if (
            output.includes("ResolverError") ||
            output.includes("MissingPointerError") ||
            output.includes("EMISSINGPOINTER") ||
            output.includes("Error opening file") ||
            (output.includes("Error:") && !output.includes("Options:"))
          ) {
            // Try to parse as JSON object first
            let errorMessage = output;
            try {
              // Remove any non-JSON prefix
              const jsonMatch = output.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const errorObj = JSON.parse(jsonMatch[0]);
                if (errorObj.message) {
                  errorMessage = errorObj.message;
                } else if (errorObj.code === "EMISSINGPOINTER") {
                  // Extract message from EMISSINGPOINTER error
                  const errorStr = JSON.stringify(errorObj);
                  errorMessage = errorStr;
                }
              }
            } catch (e) {
              // Failed to parse as JSON, use original output
            }

            // Parse and format the error for user-friendly display
            const userFriendlyError = this.parseSpecError(errorMessage);
            console.log(`[Prism ${specId}] Parsed error:`, userFriendlyError);
            console.error(`[Prism ${specId}] Raw error:`, output);
            reject(new Error(userFriendlyError));
          }
        }
      });

      // Handle process errors
      process.on("error", (error) => {
        if (!hasStarted) {
          reject(new Error(`Failed to spawn Prism process: ${error.message}`));
        }
      });

      // Handle immediate exit (e.g., Prism not installed)
      process.on("exit", (code, signal) => {
        if (!hasStarted) {
          reject(
            new Error(
              `Prism exited immediately with code ${code} and signal ${signal}. ` +
              `Is Prism installed? Run: npm install -g @stoplight/prism-cli`
            )
          );
        }
      });

      // Timeout if Prism doesn't start within 10 seconds
      setTimeout(() => {
        if (!hasStarted) {
          process.kill("SIGTERM");
          reject(new Error("Prism startup timeout after 10 seconds"));
        }
      }, 10000);
    });
  }

  /**
   * Monitor a Prism process for crashes and unexpected exits
   */
  private monitorProcess(specId: string, process: ChildProcess): void {
    const startTime = Date.now();

    // Log stdout for debugging
    process.stdout?.on("data", (data: Buffer) => {
      console.log(`[Prism ${specId}]:`, data.toString().trim());
    });

    // Log stderr for debugging
    process.stderr?.on("data", (data: Buffer) => {
      console.error(`[Prism ${specId}] Error:`, data.toString().trim());
    });

    // Handle process exit
    process.on("exit", (code, signal) => {
      const uptime = Date.now() - startTime;
      const uptimeSeconds = (uptime / 1000).toFixed(2);

      console.log(
        `[Prism ${specId}] Process exited with code ${code} and signal ${signal} after ${uptimeSeconds}s`
      );

      const serverInfo = this.servers.get(specId);
      if (serverInfo && serverInfo.status === "running") {
        // Unexpected crash - determine crash reason
        let crashReason = "Unknown crash";

        if (signal === "SIGTERM" || signal === "SIGKILL") {
          // Graceful shutdown or forced kill
          crashReason = `Process terminated by signal ${signal}`;
        } else if (code !== null && code !== 0) {
          // Non-zero exit code indicates error
          crashReason = `Process exited with error code ${code}`;
        } else if (uptime < 5000) {
          // Crashed within 5 seconds of starting
          crashReason = `Process crashed immediately after startup (${uptimeSeconds}s uptime)`;
        } else {
          crashReason = `Process crashed unexpectedly after ${uptimeSeconds}s uptime`;
        }

        // Log detailed crash information
        console.error(`[Prism ${specId}] CRASH DETECTED:`, {
          reason: crashReason,
          exitCode: code,
          signal: signal,
          uptime: `${uptimeSeconds}s`,
          pid: process.pid,
          timestamp: new Date().toISOString(),
        });

        // Update server status to stopped (not error, to allow restart)
        this.servers.set(specId, {
          ...serverInfo,
          status: "stopped",
          error: crashReason,
        });
      }

      // Clean up process reference
      this.processes.delete(specId);
    });

    // Handle process errors
    process.on("error", (error) => {
      console.error(`[Prism ${specId}] Process error:`, error);

      // Log detailed error information
      console.error(`[Prism ${specId}] ERROR DETAILS:`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
        pid: process.pid,
        timestamp: new Date().toISOString(),
      });

      const serverInfo = this.servers.get(specId);
      if (serverInfo) {
        this.servers.set(specId, {
          ...serverInfo,
          status: "error",
          error: `Process error: ${error.message}`,
        });
      }
    });

    // Handle uncaught exceptions in the process
    process.on("disconnect", () => {
      console.warn(`[Prism ${specId}] Process disconnected`);

      const serverInfo = this.servers.get(specId);
      if (serverInfo && serverInfo.status === "running") {
        this.servers.set(specId, {
          ...serverInfo,
          status: "stopped",
          error: "Process disconnected unexpectedly",
        });
      }
    });
  }

  /**
   * Clean up all servers (useful for shutdown)
   */
  async cleanup(): Promise<void> {
    const stopPromises: Promise<void>[] = [];

    for (const specId of this.processes.keys()) {
      stopPromises.push(
        this.stopServer(specId).catch((error) => {
          console.error(`Failed to stop server ${specId}:`, error);
        })
      );
    }

    await Promise.all(stopPromises);
  }
}

// Singleton instance
// Use globalThis to persist across module reloads in development
const globalForMockManager = globalThis as unknown as {
  mockServerManager: MockServerManager | undefined;
};

/**
 * Get the singleton MockServerManager instance
 */
export function getMockServerManager(): MockServerManager {
  if (!globalForMockManager.mockServerManager) {
    globalForMockManager.mockServerManager = new MockServerManager();
  }
  return globalForMockManager.mockServerManager;
}

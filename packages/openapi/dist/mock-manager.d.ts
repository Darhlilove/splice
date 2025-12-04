/**
 * Mock Server Manager
 *
 * Manages lifecycle of Prism mock servers including:
 * - Port allocation
 * - Process spawning and monitoring
 * - State management
 * - Crash detection and recovery
 */
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
    apiKey?: string;
    requiresAuth?: boolean;
}
export declare class MockServerManager {
    private servers;
    private processes;
    private readonly PORT_RANGE_START;
    private readonly PORT_RANGE_END;
    private readonly MAX_PORT_RETRIES;
    private prismInstalled;
    /**
     * Check if Prism CLI is installed on the system
     */
    isPrismInstalled(): boolean;
    /**
     * Get Prism installation instructions
     */
    getPrismInstallationInstructions(): string;
    /**
     * Check if a spec requires API key authentication
     */
    private requiresApiKeyAuth;
    /**
     * Start a mock server for the given spec
     */
    startServer(specId: string, config: MockServerConfig): Promise<MockServerInfo>;
    /**
     * Stop a running mock server
     */
    stopServer(specId: string): Promise<void>;
    /**
     * Get server info for a specific spec
     */
    getServerInfo(specId: string): MockServerInfo | null;
    /**
     * Get all running servers
     */
    getAllServers(): Map<string, MockServerInfo>;
    /**
     * Find an available port in the configured range
     */
    findAvailablePort(startPort: number): Promise<number>;
    /**
     * Check if a port is available
     */
    private isPortAvailable;
    /**
     * Parse Prism error output into user-friendly messages
     */
    private parseSpecError;
    /**
     * Spawn a Prism process for the given spec
     */
    private spawnPrismProcess;
    /**
     * Monitor a Prism process for crashes and unexpected exits
     */
    private monitorProcess;
    /**
     * Clean up all servers (useful for shutdown)
     */
    cleanup(): Promise<void>;
}
/**
 * Get the singleton MockServerManager instance
 */
export declare function getMockServerManager(): MockServerManager;
//# sourceMappingURL=mock-manager.d.ts.map
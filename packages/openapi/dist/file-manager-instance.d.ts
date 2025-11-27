/**
 * File Manager Singleton Instance
 * Provides a global FileManager instance with automatic cleanup
 */
import { FileManager } from "./file-manager.js";
/**
 * Get or create the global FileManager instance
 * @returns FileManager instance
 */
export declare function getFileManager(): FileManager;
/**
 * Shutdown the global FileManager instance
 * Should be called when the application is shutting down
 */
export declare function shutdownFileManager(): Promise<void>;
/**
 * Reset the FileManager instance (useful for testing)
 */
export declare function resetFileManager(): void;
//# sourceMappingURL=file-manager-instance.d.ts.map
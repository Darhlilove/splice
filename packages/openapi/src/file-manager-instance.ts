/**
 * File Manager Singleton Instance
 * Provides a global FileManager instance with automatic cleanup
 */

import { FileManager } from "./file-manager.js";

// Use globalThis to ensure singleton persists across module reloads in Next.js
const globalStore = global as unknown as { fileManagerInstance: FileManager | null };
if (!globalStore.fileManagerInstance) {
  globalStore.fileManagerInstance = null;
}

/**
 * Get or create the global FileManager instance
 * @returns FileManager instance
 */
export function getFileManager(): FileManager {
  if (!globalStore.fileManagerInstance) {
    globalStore.fileManagerInstance = new FileManager();

    // Start cleanup process automatically (runs every 15 minutes)
    globalStore.fileManagerInstance.startCleanupProcess(900000);

    console.log(
      "[FileManager] Global instance created and cleanup process started"
    );
  }

  return globalStore.fileManagerInstance;
}

/**
 * Shutdown the global FileManager instance
 * Should be called when the application is shutting down
 */
export async function shutdownFileManager(): Promise<void> {
  if (globalStore.fileManagerInstance) {
    await globalStore.fileManagerInstance.shutdown();
    globalStore.fileManagerInstance = null;
  }
}

/**
 * Reset the FileManager instance (useful for testing)
 */
export function resetFileManager(): void {
  if (globalStore.fileManagerInstance) {
    globalStore.fileManagerInstance.stopCleanupProcess();
    globalStore.fileManagerInstance = null;
  }
}

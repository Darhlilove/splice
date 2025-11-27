/**
 * File Manager implementation
 * Manages temporary file storage with expiration tracking
 */
/**
 * Stored file metadata
 */
export interface StoredFile {
    id: string;
    path: string;
    createdAt: Date;
    expiresAt: Date;
    size: number;
}
/**
 * File Manager class
 * Handles temporary file storage, retrieval, and cleanup with TTL support
 */
export declare class FileManager {
    private files;
    private readonly baseStoragePath;
    private readonly baseUrl;
    private cleanupInterval?;
    /**
     * Create a new FileManager instance
     * @param baseStoragePath - Base directory for file storage (default: /tmp/splice-sdks)
     * @param baseUrl - Base URL for download links (default: /api/sdk/download)
     */
    constructor(baseStoragePath?: string, baseUrl?: string);
    /**
     * Store a file with a unique ID and TTL
     * @param filePath - Path to the file to store
     * @param ttl - Time to live in milliseconds (default: 1 hour)
     * @returns Unique file ID
     */
    storeFile(filePath: string, ttl?: number): Promise<string>;
    /**
     * Retrieve a file by ID
     * @param fileId - Unique file ID
     * @returns File path or null if not found or expired
     */
    getFile(fileId: string): Promise<string | null>;
    /**
     * Delete a file by ID
     * @param fileId - Unique file ID
     */
    deleteFile(fileId: string): Promise<void>;
    /**
     * Clean up expired files
     * @returns Number of files cleaned up
     */
    cleanupExpiredFiles(): Promise<number>;
    /**
     * Generate a download URL for a file
     * @param fileId - Unique file ID
     * @returns Download URL
     */
    getDownloadUrl(fileId: string): string;
    /**
     * Start automatic cleanup process
     * @param intervalMs - Cleanup interval in milliseconds (default: 15 minutes)
     */
    startCleanupProcess(intervalMs?: number): void;
    /**
     * Stop automatic cleanup process
     */
    stopCleanupProcess(): void;
    /**
     * Get all stored files (for debugging/monitoring)
     * @returns Array of stored file metadata
     */
    getAllFiles(): StoredFile[];
    /**
     * Get count of stored files
     * @returns Number of files currently tracked
     */
    getFileCount(): number;
    /**
     * Generate a unique file ID
     * @returns Unique file ID
     */
    private generateFileId;
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Clean up all files and stop cleanup process (for shutdown)
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=file-manager.d.ts.map
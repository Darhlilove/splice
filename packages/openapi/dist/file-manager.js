/**
 * File Manager implementation
 * Manages temporary file storage with expiration tracking
 */
import * as fs from "fs";
import { randomBytes } from "crypto";
/**
 * File Manager class
 * Handles temporary file storage, retrieval, and cleanup with TTL support
 */
export class FileManager {
    /**
     * Create a new FileManager instance
     * @param baseStoragePath - Base directory for file storage (default: /tmp/splice-sdks)
     * @param baseUrl - Base URL for download links (default: /api/sdk/download)
     */
    constructor(baseStoragePath = "/tmp/splice-sdks", baseUrl = "/api/sdk/download") {
        this.files = new Map();
        this.baseStoragePath = baseStoragePath;
        this.baseUrl = baseUrl;
        // Ensure storage directory exists
        this.ensureStorageDirectory();
    }
    /**
     * Store a file with a unique ID and TTL
     * @param filePath - Path to the file to store
     * @param ttl - Time to live in milliseconds (default: 1 hour)
     * @returns Unique file ID
     */
    async storeFile(filePath, ttl = 3600000) {
        console.log(`[FileManager] Storing file: ${filePath}`);
        console.log(`  TTL: ${ttl / 1000}s (${ttl / 60000} minutes)`);
        // Validate file exists
        if (!fs.existsSync(filePath)) {
            const error = `File not found: ${filePath}`;
            console.error(`[FileManager] ${error}`);
            throw new Error(error);
        }
        // Generate unique file ID
        const fileId = this.generateFileId();
        // Get file stats
        const stats = fs.statSync(filePath);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttl);
        console.log(`  File ID: ${fileId}`);
        console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Created: ${now.toISOString()}`);
        console.log(`  Expires: ${expiresAt.toISOString()}`);
        // Store file metadata
        const storedFile = {
            id: fileId,
            path: filePath,
            createdAt: now,
            expiresAt: expiresAt,
            size: stats.size,
        };
        this.files.set(fileId, storedFile);
        console.log(`[FileManager] File stored successfully. Total files: ${this.files.size}`);
        return fileId;
    }
    /**
     * Retrieve a file by ID
     * @param fileId - Unique file ID
     * @returns File path or null if not found or expired
     */
    async getFile(fileId) {
        const storedFile = this.files.get(fileId);
        if (!storedFile) {
            return null;
        }
        // Check if file has expired
        if (new Date() > storedFile.expiresAt) {
            // File expired, clean it up
            await this.deleteFile(fileId);
            return null;
        }
        // Check if file still exists on disk
        if (!fs.existsSync(storedFile.path)) {
            // File missing, remove from tracking
            this.files.delete(fileId);
            return null;
        }
        return storedFile.path;
    }
    /**
     * Delete a file by ID
     * @param fileId - Unique file ID
     */
    async deleteFile(fileId) {
        const storedFile = this.files.get(fileId);
        if (!storedFile) {
            console.warn(`[FileManager] Attempted to delete non-existent file: ${fileId}`);
            return;
        }
        console.log(`[FileManager] Deleting file ${fileId}`);
        console.log(`  Path: ${storedFile.path}`);
        // Delete file from disk if it exists
        try {
            if (fs.existsSync(storedFile.path)) {
                // If it's a directory, remove recursively
                const stats = fs.statSync(storedFile.path);
                if (stats.isDirectory()) {
                    fs.rmSync(storedFile.path, { recursive: true, force: true });
                    console.log(`  Deleted directory: ${storedFile.path}`);
                }
                else {
                    fs.unlinkSync(storedFile.path);
                    console.log(`  Deleted file: ${storedFile.path}`);
                }
            }
            else {
                console.warn(`  File not found on disk: ${storedFile.path}`);
            }
        }
        catch (error) {
            console.error(`[FileManager] Error deleting file ${fileId}:`, error);
            if (error instanceof Error) {
                console.error(`  Error message: ${error.message}`);
                console.error(`  Stack trace: ${error.stack}`);
            }
            throw error; // Re-throw to allow caller to handle
        }
        // Remove from tracking
        this.files.delete(fileId);
        console.log(`[FileManager] File ${fileId} removed from tracking`);
    }
    /**
     * Clean up expired files
     * @returns Number of files cleaned up
     */
    async cleanupExpiredFiles() {
        const now = new Date();
        const startTime = Date.now();
        let cleanedCount = 0;
        let totalSizeFreed = 0;
        const expiredFiles = [];
        console.log(`[FileManager] Starting cleanup process at ${now.toISOString()}`);
        console.log(`  Total files tracked: ${this.files.size}`);
        // Identify expired files
        for (const [fileId, storedFile] of this.files.entries()) {
            if (now > storedFile.expiresAt) {
                expiredFiles.push(fileId);
                totalSizeFreed += storedFile.size;
                console.log(`  Found expired file: ${fileId}`);
                console.log(`    Path: ${storedFile.path}`);
                console.log(`    Size: ${(storedFile.size / 1024 / 1024).toFixed(2)} MB`);
                console.log(`    Expired at: ${storedFile.expiresAt.toISOString()}`);
            }
        }
        if (expiredFiles.length === 0) {
            console.log(`[FileManager] No expired files found`);
            return 0;
        }
        console.log(`[FileManager] Found ${expiredFiles.length} expired file(s) to clean up`);
        // Delete expired files
        for (const fileId of expiredFiles) {
            try {
                await this.deleteFile(fileId);
                cleanedCount++;
                console.log(`  Deleted file: ${fileId}`);
            }
            catch (error) {
                console.error(`  Failed to delete file ${fileId}:`, error);
            }
        }
        const duration = Date.now() - startTime;
        const sizeMB = (totalSizeFreed / 1024 / 1024).toFixed(2);
        console.log(`[FileManager] Cleanup complete`);
        console.log(`  Files cleaned: ${cleanedCount}`);
        console.log(`  Space freed: ${sizeMB} MB`);
        console.log(`  Duration: ${duration}ms`);
        console.log(`  Remaining files: ${this.files.size}`);
        return cleanedCount;
    }
    /**
     * Generate a download URL for a file
     * @param fileId - Unique file ID
     * @returns Download URL
     */
    getDownloadUrl(fileId) {
        return `${this.baseUrl}/${fileId}`;
    }
    /**
     * Start automatic cleanup process
     * @param intervalMs - Cleanup interval in milliseconds (default: 15 minutes)
     */
    startCleanupProcess(intervalMs = 900000) {
        if (this.cleanupInterval) {
            console.warn("[FileManager] Cleanup process already running");
            return;
        }
        console.log(`[FileManager] Starting cleanup process (interval: ${intervalMs / 1000}s)`);
        // Run cleanup immediately
        this.cleanupExpiredFiles();
        // Schedule periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredFiles();
        }, intervalMs);
    }
    /**
     * Stop automatic cleanup process
     */
    stopCleanupProcess() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
            console.log("[FileManager] Cleanup process stopped");
        }
    }
    /**
     * Get all stored files (for debugging/monitoring)
     * @returns Array of stored file metadata
     */
    getAllFiles() {
        return Array.from(this.files.values());
    }
    /**
     * Get count of stored files
     * @returns Number of files currently tracked
     */
    getFileCount() {
        return this.files.size;
    }
    /**
     * Generate a unique file ID
     * @returns Unique file ID
     */
    generateFileId() {
        return randomBytes(16).toString("hex");
    }
    /**
     * Ensure storage directory exists
     */
    ensureStorageDirectory() {
        if (!fs.existsSync(this.baseStoragePath)) {
            fs.mkdirSync(this.baseStoragePath, { recursive: true });
            console.log(`[FileManager] Created storage directory: ${this.baseStoragePath}`);
        }
    }
    /**
     * Clean up all files and stop cleanup process (for shutdown)
     */
    async shutdown() {
        console.log("[FileManager] Shutting down...");
        // Stop cleanup process
        this.stopCleanupProcess();
        // Delete all tracked files
        const fileIds = Array.from(this.files.keys());
        for (const fileId of fileIds) {
            await this.deleteFile(fileId);
        }
        console.log("[FileManager] Shutdown complete");
    }
}

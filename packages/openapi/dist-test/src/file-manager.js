"use strict";
/**
 * File Manager implementation
 * Manages temporary file storage with expiration tracking
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
/**
 * File Manager class
 * Handles temporary file storage, retrieval, and cleanup with TTL support
 */
class FileManager {
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
        // Validate file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        // Generate unique file ID
        const fileId = this.generateFileId();
        // Get file stats
        const stats = fs.statSync(filePath);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttl);
        // Store file metadata
        const storedFile = {
            id: fileId,
            path: filePath,
            createdAt: now,
            expiresAt: expiresAt,
            size: stats.size,
        };
        this.files.set(fileId, storedFile);
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
            return;
        }
        // Delete file from disk if it exists
        try {
            if (fs.existsSync(storedFile.path)) {
                // If it's a directory, remove recursively
                const stats = fs.statSync(storedFile.path);
                if (stats.isDirectory()) {
                    fs.rmSync(storedFile.path, { recursive: true, force: true });
                }
                else {
                    fs.unlinkSync(storedFile.path);
                }
            }
        }
        catch (error) {
            console.error(`Error deleting file ${fileId}:`, error);
        }
        // Remove from tracking
        this.files.delete(fileId);
    }
    /**
     * Clean up expired files
     * @returns Number of files cleaned up
     */
    async cleanupExpiredFiles() {
        const now = new Date();
        let cleanedCount = 0;
        const expiredFiles = [];
        // Identify expired files
        for (const [fileId, storedFile] of this.files.entries()) {
            if (now > storedFile.expiresAt) {
                expiredFiles.push(fileId);
            }
        }
        // Delete expired files
        for (const fileId of expiredFiles) {
            await this.deleteFile(fileId);
            cleanedCount++;
        }
        if (cleanedCount > 0) {
            console.log(`[FileManager] Cleaned up ${cleanedCount} expired file(s) at ${now.toISOString()}`);
        }
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
        return (0, crypto_1.randomBytes)(16).toString("hex");
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
exports.FileManager = FileManager;

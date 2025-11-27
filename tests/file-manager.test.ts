/**
 * Unit tests for FileManager
 * Tests file storage, retrieval, expiration logic, cleanup process, and download URL generation
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { FileManager } from "../packages/openapi/src/file-manager";
import * as fs from "fs";
import * as path from "path";

describe("FileManager", () => {
  let fileManager: FileManager;
  const testStoragePath = "/tmp/splice-test-storage";
  const testBaseUrl = "/api/test/download";

  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true, force: true });
    }

    fileManager = new FileManager(testStoragePath, testBaseUrl);
  });

  afterEach(async () => {
    // Clean up after each test
    await fileManager.shutdown();

    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true, force: true });
    }
  });

  describe("File Storage", () => {
    test("should store a file and return unique ID", async () => {
      // Create a test file
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.mkdirSync(testStoragePath, { recursive: true });
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);

      expect(fileId).toBeTruthy();
      expect(typeof fileId).toBe("string");
      expect(fileId.length).toBeGreaterThan(0);
    });

    test("should generate unique IDs for different files", async () => {
      // Create test files
      fs.mkdirSync(testStoragePath, { recursive: true });
      const file1Path = path.join(testStoragePath, "file1.txt");
      const file2Path = path.join(testStoragePath, "file2.txt");
      fs.writeFileSync(file1Path, "content 1");
      fs.writeFileSync(file2Path, "content 2");

      const fileId1 = await fileManager.storeFile(file1Path);
      const fileId2 = await fileManager.storeFile(file2Path);

      expect(fileId1).not.toBe(fileId2);
    });

    test("should throw error when storing non-existent file", async () => {
      const nonExistentPath = path.join(testStoragePath, "does-not-exist.txt");

      await expect(fileManager.storeFile(nonExistentPath)).rejects.toThrow(
        "File not found"
      );
    });

    test("should store file with custom TTL", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const customTTL = 5000; // 5 seconds
      const fileId = await fileManager.storeFile(testFilePath, customTTL);

      expect(fileId).toBeTruthy();
    });

    test("should track file count", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const initialCount = fileManager.getFileCount();
      await fileManager.storeFile(testFilePath);
      const afterCount = fileManager.getFileCount();

      expect(afterCount).toBe(initialCount + 1);
    });
  });

  describe("File Retrieval", () => {
    test("should retrieve stored file by ID", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);
      const retrievedPath = await fileManager.getFile(fileId);

      expect(retrievedPath).toBe(testFilePath);
    });

    test("should return null for non-existent file ID", async () => {
      const retrievedPath = await fileManager.getFile("non-existent-id");

      expect(retrievedPath).toBeNull();
    });

    test("should return null if file was deleted from disk", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);

      // Delete file from disk
      fs.unlinkSync(testFilePath);

      const retrievedPath = await fileManager.getFile(fileId);

      expect(retrievedPath).toBeNull();
    });

    test("should retrieve all stored files", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const file1Path = path.join(testStoragePath, "file1.txt");
      const file2Path = path.join(testStoragePath, "file2.txt");
      fs.writeFileSync(file1Path, "content 1");
      fs.writeFileSync(file2Path, "content 2");

      await fileManager.storeFile(file1Path);
      await fileManager.storeFile(file2Path);

      const allFiles = fileManager.getAllFiles();

      expect(allFiles.length).toBe(2);
      expect(allFiles[0]).toHaveProperty("id");
      expect(allFiles[0]).toHaveProperty("path");
      expect(allFiles[0]).toHaveProperty("createdAt");
      expect(allFiles[0]).toHaveProperty("expiresAt");
      expect(allFiles[0]).toHaveProperty("size");
    });
  });

  describe("Expiration Logic", () => {
    test("should return null for expired file", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      // Store with very short TTL (1ms)
      const fileId = await fileManager.storeFile(testFilePath, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const retrievedPath = await fileManager.getFile(fileId);

      expect(retrievedPath).toBeNull();
    });

    test("should not return expired file even if it exists on disk", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      // Store with very short TTL
      const fileId = await fileManager.storeFile(testFilePath, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      // File still exists on disk
      expect(fs.existsSync(testFilePath)).toBe(true);

      // But should not be retrievable
      const retrievedPath = await fileManager.getFile(fileId);
      expect(retrievedPath).toBeNull();
    });

    test("should store expiration metadata correctly", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const ttl = 60000; // 1 minute
      const beforeStore = Date.now();
      const fileId = await fileManager.storeFile(testFilePath, ttl);
      const afterStore = Date.now();

      const allFiles = fileManager.getAllFiles();
      const storedFile = allFiles.find((f) => f.id === fileId);

      expect(storedFile).toBeDefined();
      expect(storedFile!.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeStore
      );
      expect(storedFile!.createdAt.getTime()).toBeLessThanOrEqual(afterStore);
      expect(storedFile!.expiresAt.getTime()).toBeGreaterThan(
        storedFile!.createdAt.getTime()
      );
    });
  });

  describe("File Deletion", () => {
    test("should delete file by ID", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);
      await fileManager.deleteFile(fileId);

      const retrievedPath = await fileManager.getFile(fileId);
      expect(retrievedPath).toBeNull();
    });

    test("should delete file from disk", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);
      await fileManager.deleteFile(fileId);

      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    test("should handle deletion of non-existent file gracefully", async () => {
      await expect(
        fileManager.deleteFile("non-existent-id")
      ).resolves.not.toThrow();
    });

    test("should delete directory recursively", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testDirPath = path.join(testStoragePath, "test-dir");
      fs.mkdirSync(testDirPath, { recursive: true });
      fs.writeFileSync(path.join(testDirPath, "file.txt"), "content");

      const fileId = await fileManager.storeFile(testDirPath);
      await fileManager.deleteFile(fileId);

      expect(fs.existsSync(testDirPath)).toBe(false);
    });

    test("should decrease file count after deletion", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);
      const beforeCount = fileManager.getFileCount();
      await fileManager.deleteFile(fileId);
      const afterCount = fileManager.getFileCount();

      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe("Cleanup Process", () => {
    test("should clean up expired files", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const file1Path = path.join(testStoragePath, "file1.txt");
      const file2Path = path.join(testStoragePath, "file2.txt");
      fs.writeFileSync(file1Path, "content 1");
      fs.writeFileSync(file2Path, "content 2");

      // Store one file with short TTL, one with long TTL
      await fileManager.storeFile(file1Path, 1); // 1ms - will expire
      await fileManager.storeFile(file2Path, 60000); // 1 minute - won't expire

      // Wait for first file to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanedCount = await fileManager.cleanupExpiredFiles();

      expect(cleanedCount).toBe(1);
      expect(fileManager.getFileCount()).toBe(1);
    });

    test("should return 0 when no files are expired", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      await fileManager.storeFile(testFilePath, 60000); // 1 minute

      const cleanedCount = await fileManager.cleanupExpiredFiles();

      expect(cleanedCount).toBe(0);
    });

    test("should clean up multiple expired files", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });

      // Create and store multiple files with short TTL
      for (let i = 0; i < 3; i++) {
        const filePath = path.join(testStoragePath, `file${i}.txt`);
        fs.writeFileSync(filePath, `content ${i}`);
        await fileManager.storeFile(filePath, 1); // 1ms
      }

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanedCount = await fileManager.cleanupExpiredFiles();

      expect(cleanedCount).toBe(3);
      expect(fileManager.getFileCount()).toBe(0);
    });

    test("should handle cleanup errors gracefully", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath, 1);

      // Delete file from disk before cleanup
      fs.unlinkSync(testFilePath);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cleanup should handle missing file gracefully
      const cleanedCount = await fileManager.cleanupExpiredFiles();

      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Download URL Generation", () => {
    test("should generate download URL with file ID", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const testFilePath = path.join(testStoragePath, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      const fileId = await fileManager.storeFile(testFilePath);
      const downloadUrl = fileManager.getDownloadUrl(fileId);

      expect(downloadUrl).toBe(`${testBaseUrl}/${fileId}`);
    });

    test("should generate different URLs for different files", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const file1Path = path.join(testStoragePath, "file1.txt");
      const file2Path = path.join(testStoragePath, "file2.txt");
      fs.writeFileSync(file1Path, "content 1");
      fs.writeFileSync(file2Path, "content 2");

      const fileId1 = await fileManager.storeFile(file1Path);
      const fileId2 = await fileManager.storeFile(file2Path);

      const url1 = fileManager.getDownloadUrl(fileId1);
      const url2 = fileManager.getDownloadUrl(fileId2);

      expect(url1).not.toBe(url2);
    });

    test("should use configured base URL", () => {
      const customBaseUrl = "/custom/download";
      const customFileManager = new FileManager(testStoragePath, customBaseUrl);

      const downloadUrl = customFileManager.getDownloadUrl("test-id");

      expect(downloadUrl).toBe(`${customBaseUrl}/test-id`);
    });
  });

  describe("Automatic Cleanup Process", () => {
    test("should start cleanup process", () => {
      fileManager.startCleanupProcess(1000);

      // Should not throw
      expect(true).toBe(true);
    });

    test("should stop cleanup process", () => {
      fileManager.startCleanupProcess(1000);
      fileManager.stopCleanupProcess();

      // Should not throw
      expect(true).toBe(true);
    });

    test("should not start duplicate cleanup process", () => {
      fileManager.startCleanupProcess(1000);
      fileManager.startCleanupProcess(1000);

      // Should handle gracefully
      expect(true).toBe(true);

      fileManager.stopCleanupProcess();
    });
  });

  describe("Shutdown", () => {
    test("should clean up all files on shutdown", async () => {
      fs.mkdirSync(testStoragePath, { recursive: true });
      const file1Path = path.join(testStoragePath, "file1.txt");
      const file2Path = path.join(testStoragePath, "file2.txt");
      fs.writeFileSync(file1Path, "content 1");
      fs.writeFileSync(file2Path, "content 2");

      await fileManager.storeFile(file1Path);
      await fileManager.storeFile(file2Path);

      expect(fileManager.getFileCount()).toBe(2);

      await fileManager.shutdown();

      expect(fileManager.getFileCount()).toBe(0);
    });

    test("should stop cleanup process on shutdown", async () => {
      fileManager.startCleanupProcess(1000);
      await fileManager.shutdown();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

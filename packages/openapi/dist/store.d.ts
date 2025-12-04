/**
 * Store for parsed OpenAPI specifications
 * Uses Redis for persistence if configured, otherwise falls back to in-memory Map
 */
import type { ParsedSpec } from "./types.js";
import Redis from "ioredis";
interface StoredSpec {
    spec: ParsedSpec;
    originalSpec?: any;
    metadata: {
        fileName?: string;
        fileSize?: number;
        source?: string;
        uploadedAt: string;
    };
}
/**
 * Get the Redis client instance
 * @returns The Redis client if configured, null otherwise
 */
export declare function getRedisClient(): Redis | null;
/**
 * Generate a unique spec ID
 */
export declare function generateSpecId(): string;
/**
 * Save a parsed spec to the store
 * @param specId - Unique identifier for this spec
 * @param spec - The parsed OpenAPI specification
 * @param metadata - Optional metadata about the spec
 * @returns The spec ID
 */
export declare function saveSpec(specId: string, spec: ParsedSpec, metadata?: {
    fileName?: string;
    fileSize?: number;
    source?: string;
}, originalSpec?: any): Promise<string>;
/**
 * Retrieve a parsed spec from the store
 * @param specId - The spec ID to retrieve
 * @returns The stored spec and metadata, or null if not found
 */
export declare function getSpec(specId: string): Promise<StoredSpec | null>;
/**
 * Delete a spec from the store
 * @param specId - The spec ID to delete
 * @returns True if deleted, false if not found
 */
export declare function deleteSpec(specId: string): Promise<boolean>;
/**
 * Clear all specs from the store
 */
export declare function clearAllSpecs(): Promise<void>;
/**
 * Get the number of specs currently stored
 * Note: For Redis, this counts keys matching "spec-*"
 */
export declare function getStoreSize(): Promise<number>;
/**
 * Get all spec IDs currently in the store
 */
export declare function getAllSpecIds(): Promise<string[]>;
export {};
//# sourceMappingURL=store.d.ts.map
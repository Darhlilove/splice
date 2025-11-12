/**
 * In-memory store for parsed OpenAPI specifications
 * Stores specs temporarily during a session for quick retrieval
 */
import type { ParsedSpec } from "./types.js";
interface StoredSpec {
    spec: ParsedSpec;
    metadata: {
        fileName?: string;
        fileSize?: number;
        source?: string;
        uploadedAt: Date;
    };
}
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
}): string;
/**
 * Retrieve a parsed spec from the store
 * @param specId - The spec ID to retrieve
 * @returns The stored spec and metadata, or null if not found
 */
export declare function getSpec(specId: string): StoredSpec | null;
/**
 * Delete a spec from the store
 * @param specId - The spec ID to delete
 * @returns True if deleted, false if not found
 */
export declare function deleteSpec(specId: string): boolean;
/**
 * Clear all specs from the store
 */
export declare function clearAllSpecs(): void;
/**
 * Get the number of specs currently stored
 */
export declare function getStoreSize(): number;
/**
 * Get all spec IDs currently in the store
 */
export declare function getAllSpecIds(): string[];
export {};
//# sourceMappingURL=store.d.ts.map
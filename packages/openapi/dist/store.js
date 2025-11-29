/**
 * Store for parsed OpenAPI specifications
 * Uses Redis for persistence if configured, otherwise falls back to in-memory Map
 */
import Redis from "ioredis";
// Redis client
let redis = null;
if (process.env.REDIS_URL) {
    console.log("[Store] Initializing Redis client");
    redis = new Redis(process.env.REDIS_URL);
}
else {
    console.log("[Store] No REDIS_URL found, using in-memory storage");
}
// In-memory fallback
const memoryStore = new Map();
// Expiry: 24 hours in seconds for Redis, milliseconds for memory
const EXPIRY_SECONDS = 24 * 60 * 60;
const EXPIRY_MS = EXPIRY_SECONDS * 1000;
/**
 * Generate a unique spec ID
 */
export function generateSpecId() {
    return `spec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Save a parsed spec to the store
 * @param specId - Unique identifier for this spec
 * @param spec - The parsed OpenAPI specification
 * @param metadata - Optional metadata about the spec
 * @returns The spec ID
 */
export async function saveSpec(specId, spec, metadata, originalSpec) {
    console.log(`[Store] Saving spec with ID: ${specId}`);
    const data = {
        spec,
        originalSpec,
        metadata: Object.assign(Object.assign({}, metadata), { uploadedAt: new Date().toISOString() }),
    };
    const serialized = JSON.stringify(data);
    if (redis) {
        await redis.setex(specId, EXPIRY_SECONDS, serialized);
    }
    else {
        memoryStore.set(specId, serialized);
        // Schedule cleanup for memory store
        setTimeout(() => {
            memoryStore.delete(specId);
        }, EXPIRY_MS);
    }
    return specId;
}
/**
 * Retrieve a parsed spec from the store
 * @param specId - The spec ID to retrieve
 * @returns The stored spec and metadata, or null if not found
 */
export async function getSpec(specId) {
    console.log(`[Store] Retrieving spec with ID: ${specId}`);
    let serialized = null;
    if (redis) {
        serialized = await redis.get(specId);
    }
    else {
        serialized = memoryStore.get(specId) || null;
    }
    if (!serialized) {
        console.log(`[Store] Spec not found: ${specId}`);
        return null;
    }
    try {
        const stored = JSON.parse(serialized);
        console.log(`[Store] Spec found: ${specId}`);
        return stored;
    }
    catch (error) {
        console.error(`[Store] Failed to parse spec ${specId}:`, error);
        return null;
    }
}
/**
 * Delete a spec from the store
 * @param specId - The spec ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteSpec(specId) {
    if (redis) {
        const result = await redis.del(specId);
        return result > 0;
    }
    else {
        return memoryStore.delete(specId);
    }
}
/**
 * Clear all specs from the store
 */
export async function clearAllSpecs() {
    if (redis) {
        const keys = await redis.keys("spec-*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
    else {
        memoryStore.clear();
    }
}
/**
 * Get the number of specs currently stored
 * Note: For Redis, this counts keys matching "spec-*"
 */
export async function getStoreSize() {
    if (redis) {
        const keys = await redis.keys("spec-*");
        return keys.length;
    }
    else {
        return memoryStore.size;
    }
}
/**
 * Get all spec IDs currently in the store
 */
export async function getAllSpecIds() {
    if (redis) {
        return redis.keys("spec-*");
    }
    else {
        return Array.from(memoryStore.keys());
    }
}

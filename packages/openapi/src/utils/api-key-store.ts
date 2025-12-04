/**
 * API Key Store
 * Redis-based storage for mock server API keys with in-memory fallback
 */

import { getRedisClient } from '../store.js';

const API_KEY_PREFIX = 'mock:apikey:';

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, string>();

/**
 * Store an API key in Redis or memory
 * 
 * @param specId - The spec ID to associate with the key
 * @param apiKey - The API key to store
 */
export async function storeApiKey(specId: string, apiKey: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${API_KEY_PREFIX}${specId}`;

    if (redis) {
        await redis.set(key, apiKey);
    } else {
        memoryStore.set(key, apiKey);
    }

    console.log(`[ApiKeyStore] Stored API key for spec: ${specId}`);
}

/**
 * Retrieve an API key from Redis or memory
 * 
 * @param specId - The spec ID to retrieve the key for
 * @returns The API key if found, null otherwise
 */
export async function getApiKey(specId: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = `${API_KEY_PREFIX}${specId}`;

    let apiKey: string | null = null;

    if (redis) {
        apiKey = await redis.get(key);
    } else {
        apiKey = memoryStore.get(key) || null;
    }

    if (apiKey) {
        console.log(`[ApiKeyStore] Retrieved API key for spec: ${specId}`);
    } else {
        console.log(`[ApiKeyStore] No API key found for spec: ${specId}`);
    }

    return apiKey;
}

/**
 * Delete an API key from Redis or memory
 * 
 * @param specId - The spec ID to delete the key for
 */
export async function deleteApiKey(specId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `${API_KEY_PREFIX}${specId}`;

    if (redis) {
        await redis.del(key);
    } else {
        memoryStore.delete(key);
    }

    console.log(`[ApiKeyStore] Deleted API key for spec: ${specId}`);
}

/**
 * Validate if a provided API key matches the stored key
 * 
 * @param specId - The spec ID to validate against
 * @param providedKey - The API key provided by the client
 * @returns True if the key is valid, false otherwise
 */
export async function validateApiKey(
    specId: string,
    providedKey: string
): Promise<boolean> {
    const storedKey = await getApiKey(specId);

    if (!storedKey) {
        console.log(`[ApiKeyStore] Validation failed: No key stored for spec ${specId}`);
        return false;
    }

    const isValid = storedKey === providedKey;

    if (isValid) {
        console.log(`[ApiKeyStore] API key validated successfully for spec: ${specId}`);
    } else {
        console.log(`[ApiKeyStore] API key validation failed for spec: ${specId}`);
    }

    return isValid;
}

/**
 * Check if a spec has an API key stored
 * 
 * @param specId - The spec ID to check
 * @returns True if an API key exists for this spec
 */
export async function hasApiKey(specId: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `${API_KEY_PREFIX}${specId}`;

    if (redis) {
        const exists = await redis.exists(key);
        return exists === 1;
    } else {
        return memoryStore.has(key);
    }
}

/**
 * API Key Store
 * Redis-based storage for mock server API keys with in-memory fallback
 */
/**
 * Store an API key in Redis or memory
 *
 * @param specId - The spec ID to associate with the key
 * @param apiKey - The API key to store
 */
export declare function storeApiKey(specId: string, apiKey: string): Promise<void>;
/**
 * Retrieve an API key from Redis or memory
 *
 * @param specId - The spec ID to retrieve the key for
 * @returns The API key if found, null otherwise
 */
export declare function getApiKey(specId: string): Promise<string | null>;
/**
 * Delete an API key from Redis or memory
 *
 * @param specId - The spec ID to delete the key for
 */
export declare function deleteApiKey(specId: string): Promise<void>;
/**
 * Validate if a provided API key matches the stored key
 *
 * @param specId - The spec ID to validate against
 * @param providedKey - The API key provided by the client
 * @returns True if the key is valid, false otherwise
 */
export declare function validateApiKey(specId: string, providedKey: string): Promise<boolean>;
/**
 * Check if a spec has an API key stored
 *
 * @param specId - The spec ID to check
 * @returns True if an API key exists for this spec
 */
export declare function hasApiKey(specId: string): Promise<boolean>;
//# sourceMappingURL=api-key-store.d.ts.map
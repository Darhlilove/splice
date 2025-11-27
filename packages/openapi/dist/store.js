/**
 * In-memory store for parsed OpenAPI specifications
 * Stores specs temporarily during a session for quick retrieval
 */
// In-memory storage
const specStore = new Map();
// Auto-cleanup: Remove specs older than 1 hour
const EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
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
export function saveSpec(specId, spec, metadata, originalSpec) {
    console.log(`[Store] Saving spec with ID: ${specId}`);
    specStore.set(specId, {
        spec,
        originalSpec,
        metadata: Object.assign(Object.assign({}, metadata), { uploadedAt: new Date() }),
    });
    console.log(`[Store] Store size after save: ${specStore.size}`);
    // Schedule cleanup
    setTimeout(() => {
        console.log(`[Store] Cleaning up spec: ${specId}`);
        specStore.delete(specId);
    }, EXPIRY_TIME);
    return specId;
}
/**
 * Retrieve a parsed spec from the store
 * @param specId - The spec ID to retrieve
 * @returns The stored spec and metadata, or null if not found
 */
export function getSpec(specId) {
    console.log(`[Store] Retrieving spec with ID: ${specId}`);
    console.log(`[Store] Current store size: ${specStore.size}`);
    console.log(`[Store] All keys:`, Array.from(specStore.keys()));
    const stored = specStore.get(specId);
    if (!stored) {
        console.log(`[Store] Spec not found: ${specId}`);
        return null;
    }
    // Check if expired
    const age = Date.now() - stored.metadata.uploadedAt.getTime();
    if (age > EXPIRY_TIME) {
        console.log(`[Store] Spec expired: ${specId}`);
        specStore.delete(specId);
        return null;
    }
    console.log(`[Store] Spec found: ${specId}`);
    return stored;
}
/**
 * Delete a spec from the store
 * @param specId - The spec ID to delete
 * @returns True if deleted, false if not found
 */
export function deleteSpec(specId) {
    return specStore.delete(specId);
}
/**
 * Clear all specs from the store
 */
export function clearAllSpecs() {
    specStore.clear();
}
/**
 * Get the number of specs currently stored
 */
export function getStoreSize() {
    return specStore.size;
}
/**
 * Get all spec IDs currently in the store
 */
export function getAllSpecIds() {
    return Array.from(specStore.keys());
}

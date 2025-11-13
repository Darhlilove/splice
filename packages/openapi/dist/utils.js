/**
 * Utility functions for OpenAPI parser
 */
/**
 * Remove circular references from an object by replacing them with a reference string
 * This allows the object to be safely serialized to JSON
 */
export function removeCircularReferences(obj, seen = new WeakSet()) {
    // Handle primitives and null
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item) => removeCircularReferences(item, seen));
    }
    // Check if we've seen this object before (circular reference)
    if (seen.has(obj)) {
        return "[Circular Reference]";
    }
    // Mark this object as seen
    seen.add(obj);
    // Create a new object with processed properties
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        try {
            result[key] = removeCircularReferences(value, seen);
        }
        catch (error) {
            // If we can't process a property, skip it
            console.warn(`Skipping property ${key} due to error:`, error);
            result[key] = "[Error processing property]";
        }
    }
    return result;
}
/**
 * Safely stringify an object that may contain circular references
 */
export function safeStringify(obj, space) {
    try {
        return JSON.stringify(removeCircularReferences(obj), null, space);
    }
    catch (error) {
        console.error("Error stringifying object:", error);
        return JSON.stringify({ error: "Failed to serialize object" });
    }
}

"use strict";
/**
 * Utility functions for OpenAPI parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCircularReferences = removeCircularReferences;
exports.safeStringify = safeStringify;
/**
 * Remove circular references from an object by replacing them with a reference string
 * This allows the object to be safely serialized to JSON
 */
function removeCircularReferences(obj, seen = new WeakSet(), path = [], refMap = new Map()) {
    // Handle primitives and null
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item, index) => removeCircularReferences(item, seen, [...path, `[${index}]`], refMap));
    }
    // If this object has a $ref property, it's an OpenAPI reference - preserve it as-is
    // Don't process it further to avoid breaking the reference
    if (typeof obj === "object" && obj !== null && "$ref" in obj) {
        return obj;
    }
    // Check if we've seen this object before (circular reference)
    if (seen.has(obj)) {
        // Check if we stored the original $ref for this object
        const originalRef = refMap.get(obj);
        if (originalRef) {
            return { $ref: originalRef };
        }
        // Otherwise use the path-based reference
        return { $ref: `#/${path.join("/")}` };
    }
    // Mark this object as seen
    seen.add(obj);
    // If we're in the schemas section, map this object to its schema name
    // This allows us to create proper $ref values for circular references
    if (path.length >= 2 &&
        path[0] === "schemas" &&
        typeof path[1] === "string") {
        const schemaName = path[1];
        refMap.set(obj, `#/components/schemas/${schemaName}`);
    }
    // Create a new object with processed properties
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        try {
            result[key] = removeCircularReferences(value, seen, [...path, key], refMap);
        }
        catch (error) {
            // If we can't process a property, skip it
            console.warn(`Skipping property ${key} due to error:`, error);
            result[key] = { error: "Error processing property" };
        }
    }
    return result;
}
/**
 * Safely stringify an object that may contain circular references
 */
function safeStringify(obj, space) {
    try {
        return JSON.stringify(removeCircularReferences(obj), null, space);
    }
    catch (error) {
        console.error("Error stringifying object:", error);
        return JSON.stringify({ error: "Failed to serialize object" });
    }
}

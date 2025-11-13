/**
 * Utility functions for OpenAPI parser
 */

/**
 * Remove circular references from an object by replacing them with a reference string
 * This allows the object to be safely serialized to JSON
 */
export function removeCircularReferences<T>(obj: T, seen = new WeakSet()): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => removeCircularReferences(item, seen)) as T;
  }

  // Check if we've seen this object before (circular reference)
  if (seen.has(obj as object)) {
    return "[Circular Reference]" as T;
  }

  // Mark this object as seen
  seen.add(obj as object);

  // Create a new object with processed properties
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    try {
      result[key] = removeCircularReferences(value, seen);
    } catch (error) {
      // If we can't process a property, skip it
      console.warn(`Skipping property ${key} due to error:`, error);
      result[key] = "[Error processing property]";
    }
  }

  return result as T;
}

/**
 * Safely stringify an object that may contain circular references
 */
export function safeStringify(obj: unknown, space?: number): string {
  try {
    return JSON.stringify(removeCircularReferences(obj), null, space);
  } catch (error) {
    console.error("Error stringifying object:", error);
    return JSON.stringify({ error: "Failed to serialize object" });
  }
}

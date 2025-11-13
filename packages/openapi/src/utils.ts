/**
 * Utility functions for OpenAPI parser
 */

/**
 * Remove circular references from an object by replacing them with a reference string
 * This allows the object to be safely serialized to JSON
 */
export function removeCircularReferences<T>(
  obj: T,
  seen = new WeakSet(),
  path: string[] = [],
  refMap = new Map<object, string>()
): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      removeCircularReferences(item, seen, [...path, `[${index}]`], refMap)
    ) as T;
  }

  // If this object has a $ref property, it's an OpenAPI reference - preserve it as-is
  // Don't process it further to avoid breaking the reference
  if (typeof obj === "object" && obj !== null && "$ref" in obj) {
    return obj;
  }

  // Check if we've seen this object before (circular reference)
  if (seen.has(obj as object)) {
    // Check if we stored the original $ref for this object
    const originalRef = refMap.get(obj as object);
    if (originalRef) {
      return { $ref: originalRef } as T;
    }
    // Otherwise use the path-based reference
    return { $ref: `#/${path.join("/")}` } as T;
  }

  // Mark this object as seen
  seen.add(obj as object);

  // If we're in the schemas section, map this object to its schema name
  // This allows us to create proper $ref values for circular references
  if (
    path.length >= 2 &&
    path[0] === "schemas" &&
    typeof path[1] === "string"
  ) {
    const schemaName = path[1];
    refMap.set(obj as object, `#/components/schemas/${schemaName}`);
  }

  // Create a new object with processed properties
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    try {
      result[key] = removeCircularReferences(
        value,
        seen,
        [...path, key],
        refMap
      );
    } catch (error) {
      // If we can't process a property, skip it
      console.warn(`Skipping property ${key} due to error:`, error);
      result[key] = { error: "Error processing property" };
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

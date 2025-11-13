/**
 * Utility functions for OpenAPI parser
 */
/**
 * Remove circular references from an object by replacing them with a reference string
 * This allows the object to be safely serialized to JSON
 */
export declare function removeCircularReferences<T>(obj: T, seen?: WeakSet<object>): T;
/**
 * Safely stringify an object that may contain circular references
 */
export declare function safeStringify(obj: unknown, space?: number): string;
//# sourceMappingURL=utils.d.ts.map
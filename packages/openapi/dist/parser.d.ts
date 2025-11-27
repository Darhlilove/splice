/**
 * OpenAPI specification parser implementation
 */
import type { ParsedSpec } from "./types.js";
/**
 * Parse an OpenAPI specification from a file path or URL
 * @param source - File path or URL to the OpenAPI specification
 * @returns Parsed specification with structured data
 * @throws ParserError if parsing fails
 */
export declare function parseOpenAPISpec(source: string): Promise<ParsedSpec & {
    originalSpec?: any;
}>;
//# sourceMappingURL=parser.d.ts.map
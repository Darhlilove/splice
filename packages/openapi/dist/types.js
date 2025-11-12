/**
 * TypeScript type definitions for OpenAPI parser
 */
// Custom error class for parser errors
export class ParserError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "ParserError";
    }
}

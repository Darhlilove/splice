"use strict";
/**
 * TypeScript type definitions for OpenAPI parser
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserError = void 0;
// Custom error class for parser errors
class ParserError extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "ParserError";
    }
}
exports.ParserError = ParserError;

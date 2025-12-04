/**
 * API Key Generator
 * Generates cryptographically secure API keys for mock servers
 */
/**
 * Generate a cryptographically secure API key
 * Format: sk_live_{32 random alphanumeric characters}
 *
 * @returns A secure API key string
 *
 * @example
 * const apiKey = generateApiKey();
 * // Returns: "sk_test_mock_key_1234567890abcdef"
 */
export declare function generateApiKey(): string;
/**
 * Validate API key format
 * Checks if the key matches the expected format
 *
 * @param apiKey - The API key to validate
 * @returns True if the key format is valid
 */
export declare function isValidApiKeyFormat(apiKey: string): boolean;
/**
 * Mask API key for display purposes
 * Shows only the first 12 and last 4 characters
 *
 * @param apiKey - The API key to mask
 * @returns Masked API key string
 *
 * @example
 * maskApiKey("sk_test_mock_key_1234567890abcdef")
 * // Returns: "sk_test_mock...cdef"
 */
export declare function maskApiKey(apiKey: string): string;
//# sourceMappingURL=key-generator.d.ts.map
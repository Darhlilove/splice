/**
 * API Key Generator
 * Generates cryptographically secure API keys for mock servers
 */

import crypto from 'crypto';

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
export function generateApiKey(): string {
    // Generate 24 random bytes (will become 32 chars in base64url)
    const randomBytes = crypto.randomBytes(24);

    // Convert to base64url (URL-safe base64 without padding)
    const randomString = randomBytes
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    // Add prefix for easy identification
    return `sk_live_${randomString}`;
}

/**
 * Validate API key format
 * Checks if the key matches the expected format
 * 
 * @param apiKey - The API key to validate
 * @returns True if the key format is valid
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
    // Check format: sk_live_ followed by 32 alphanumeric characters
    const apiKeyRegex = /^sk_live_[A-Za-z0-9_-]{32}$/;
    return apiKeyRegex.test(apiKey);
}

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
export function maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 16) {
        return '****';
    }

    const prefix = apiKey.substring(0, 12); // "sk_live_a1b2"
    const suffix = apiKey.substring(apiKey.length - 4); // "o5p6"

    return `${prefix}...${suffix}`;
}

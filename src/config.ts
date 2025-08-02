// src/config.ts

/**
 * File upload size limits removed - set to a very high value.
 * This configuration only affects file uploads.
 */
export const MAX_FILE_SIZE_MB = 100000; // 100GB - effectively no limit

/**
 * The maximum file size in bytes.
 * Derived from MAX_FILE_SIZE_MB.
 */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 10240 * 10240;

/**
 * The maximum size for a base64-encoded string, accounting for the ~37% overhead.
 * This is used for server-side validation in Genkit flows.
 */
export const MAX_BASE64_SIZE_BYTES = MAX_FILE_SIZE_BYTES * 1.37;

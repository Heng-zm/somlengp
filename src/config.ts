// src/config.ts

/**
 * The maximum file size in megabytes (MB) allowed for uploads.
 * This limit is enforced on the client-side before uploading
 * and on the server-side upon receiving the file.
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * The maximum file size in bytes.
 * Derived from MAX_FILE_SIZE_MB.
 */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * The maximum size for a base64-encoded string, accounting for the ~37% overhead.
 * This is used for server-side validation in Genkit flows.
 */
export const MAX_BASE64_SIZE_BYTES = MAX_FILE_SIZE_BYTES * 1.37;

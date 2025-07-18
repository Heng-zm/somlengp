// src/config.ts

/**
 * The maximum file size in megabytes (MB) allowed for uploads.
 * This limit is enforced on the client-side before uploading
 * and on the server-side upon receiving the file.
 * NOTE: Vercel Hobby plan has a 4.5MB body size limit for Serverless Functions.
 * Base64 encoding adds ~37% overhead, so a 4MB file becomes ~5.5MB.
 * We set this to 4MB as a safe upper limit to avoid 413 errors.
 */
export const MAX_FILE_SIZE_MB = 4;

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

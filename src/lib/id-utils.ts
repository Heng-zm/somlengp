// Utility functions for generating unique IDs

let messageCounter = 0;

/**
 * Generates a unique message ID that combines timestamp and counter to avoid collisions
 * @returns A unique string ID
 */
export function generateMessageId(): string {
  messageCounter = (messageCounter + 1) % 10000; // Reset counter every 10000 to prevent overflow
  return `msg_${Date.now()}_${messageCounter.toString().padStart(4, '0')}`;
}

/**
 * Generates a cryptographically secure random ID
 * @param length The length of the generated ID (default: 16)
 * @returns A secure random string
 */
export function generateSecureId(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser environment)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random for environments where crypto is not available
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generates a UUID v4 compatible ID
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

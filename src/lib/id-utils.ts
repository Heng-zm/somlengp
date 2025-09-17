// Utility functions for generating unique IDs
import { errorHandler, ValidationError, safeSync, safeAsync, AppError, ErrorType } from './error-utils';
let messageCounter = 0;
const MAX_COUNTER = 999999; // Reset counter to prevent overflow
const CRYPTO_TIMEOUT = 5000; // 5 seconds timeout for crypto operations
const MAX_RETRY_ATTEMPTS = 3; // Maximum retry attempts for ID generation
/**
 * Generates a unique message ID that combines timestamp and counter to avoid collisions
 * @param prefix - Optional prefix for the ID (default: 'msg')
 * @param includeRandomSeed - Whether to include additional random seed for uniqueness
 * @returns A unique string ID
 */
export function generateMessageId(prefix: string = 'msg', includeRandomSeed: boolean = false): string {
  let attempts = 0;
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      // Validate prefix parameter
      if (typeof prefix !== 'string' || prefix.length === 0) {
        throw new ValidationError('Prefix must be a non-empty string', { provided: prefix });
      }
      if (prefix.length > 20) {
        throw new ValidationError('Prefix too long (max 20 characters)', { provided: prefix, length: prefix.length });
      }
      // Sanitize prefix (remove special characters that might cause issues)
      const sanitizedPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
      // Safely increment counter with bounds checking
      const { data: newCounter, error } = safeSync(
        () => {
          messageCounter = (messageCounter + 1) % MAX_COUNTER;
          return messageCounter;
        },
        0,
        { operation: 'incrementCounter', attempt: attempts + 1 }
      );
      if (error) {
        console.warn('Counter increment failed, using fallback');
        messageCounter = Math.floor(Math.random() * 1000) + attempts * 1000; // Ensure different values on retry
      } else {
        messageCounter = newCounter || 0;
      }
      const timestamp = Date.now();
      if (!timestamp || timestamp <= 0 || !Number.isInteger(timestamp)) {
        throw new ValidationError('Invalid timestamp generated for message ID', { timestamp });
      }
      // Add validation for counter
      if (!Number.isInteger(messageCounter) || messageCounter < 0) {
        throw new ValidationError('Invalid counter value', { counter: messageCounter });
      }
      const counterStr = messageCounter.toString().padStart(6, '0');
      let id = `${sanitizedPrefix}_${timestamp}_${counterStr}`;
      // Add random seed if requested for extra uniqueness
      if (includeRandomSeed) {
        const randomSeed = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        id += `_${randomSeed}`;
      }
      // Validate final ID format
      if (id.length > 100) {
        throw new ValidationError('Generated ID too long', { id, length: id.length });
      }
      // Test that the ID doesn't contain invalid characters
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        throw new ValidationError('Generated ID contains invalid characters', { id });
      }
      return id;
    } catch (error) {
      attempts++;
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        errorHandler.handle(error, { 
          function: 'generateMessageId', 
          counter: messageCounter, 
          prefix,
          attempts,
          includeRandomSeed
        });
        // Ultimate fallback ID generation
        const fallbackTimestamp = Date.now() || new Date().getTime() || Math.floor(Date.now());
        const fallbackCounter = Math.floor(Math.random() * 10000);
        const fallbackRandom = Math.floor(Math.random() * 1000);
        return `fallback_${fallbackTimestamp}_${fallbackCounter}_${fallbackRandom}`;
      }
      // Brief delay before retry - using synchronous approach since this is a sync function
      const delay = Math.pow(2, attempts) * 10; // Exponential backoff: 20ms, 40ms, 80ms
      // Add small random jitter to prevent synchronized retries
      const jitter = Math.random() * 10;
      const startTime = Date.now();
      while (Date.now() - startTime < delay + jitter) {
        // Busy wait for short delays (less elegant but keeps function synchronous)
        // For production, consider making this function async if delays are needed
      }
    }
  }
  // This should never be reached, but provide ultimate fallback
  return `emergency_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}
/**
 * Generates a cryptographically secure random ID with enhanced validation and fallbacks
 * @param length The length of the generated ID (default: 16, min: 4, max: 256)
 * @param charset Custom character set to use (optional)
 * @param options Additional options for ID generation
 * @returns A secure random string
 */
export function generateSecureId(
  length: number = 16, 
  charset?: string,
  options: {
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    excludeSimilar?: boolean; // Exclude similar-looking characters (0, O, 1, l, I)
    maxRetries?: number;
  } = {}
): string {
  let attempts = 0;
  const maxRetries = options.maxRetries || MAX_RETRY_ATTEMPTS;
  while (attempts < maxRetries) {
    try {
      // Validate length parameter
      if (typeof length !== 'number' || !Number.isInteger(length)) {
        throw new ValidationError('Length must be an integer', { provided: length, type: typeof length });
      }
      if (length < 4 || length > 256) {
        throw new ValidationError('Length must be between 4 and 256 characters', { provided: length });
      }
      // Validate charset if provided
      if (charset && (typeof charset !== 'string' || charset.length === 0)) {
        throw new ValidationError('Charset must be a non-empty string', { provided: charset });
      }
      // Build character set based on options
      let chars = charset || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      if (!charset) {
        if (options.excludeSimilar) {
          chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        }
        // Validate character set requirements
        const hasUpper = /[A-Z]/.test(chars);
        const hasLower = /[a-z]/.test(chars);
        const hasNumbers = /[0-9]/.test(chars);
        if (options.requireUppercase && !hasUpper) {
          throw new ValidationError('Character set must include uppercase letters when requireUppercase is true');
        }
        if (options.requireLowercase && !hasLower) {
          throw new ValidationError('Character set must include lowercase letters when requireLowercase is true');
        }
        if (options.requireNumbers && !hasNumbers) {
          throw new ValidationError('Character set must include numbers when requireNumbers is true');
        }
      }
      if (chars.length < 2) {
        throw new ValidationError('Character set must contain at least 2 characters', { charset: chars });
      }
      // Try cryptographically secure generation with timeout protection
      const { data: secureResult, error: cryptoError } = safeSync(
        () => {
          if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('Crypto API not available');
          }
          // Check if we're in a secure context for crypto operations
          if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          }
          const array = new Uint8Array(length);
          crypto.getRandomValues(array);
          let cryptoResult = '';
          for (let i = 0; i < length; i++) {
            const randomIndex = array[i] % chars.length;
            cryptoResult += chars[randomIndex];
          }
          // Validate generated result
          if (cryptoResult.length !== length) {
            throw new Error(`Generated ID length mismatch: expected ${length}, got ${cryptoResult.length}`);
          }
          // Check that all characters are from our charset
          for (const char of cryptoResult) {
            if (!chars.includes(char)) {
              throw new Error(`Invalid character generated: ${char}`);
            }
          }
          return cryptoResult;
        },
        null,
        { operation: 'cryptoGeneration', requestedLength: length, attempt: attempts + 1, charset: chars.substring(0, 20) }
      );
      if (!cryptoError && secureResult) {
        // Validate composition requirements if specified
        if (options.requireUppercase && !/[A-Z]/.test(secureResult)) {
          throw new ValidationError('Generated ID does not contain required uppercase letters');
        }
        if (options.requireLowercase && !/[a-z]/.test(secureResult)) {
          throw new ValidationError('Generated ID does not contain required lowercase letters');
        }
        if (options.requireNumbers && !/[0-9]/.test(secureResult)) {
          throw new ValidationError('Generated ID does not contain required numbers');
        }
        return secureResult;
      }
      // Fallback to Math.random with enhanced entropy
      console.warn('Crypto generation failed, using Math.random fallback');
      const { data: fallbackResult, error: mathError } = safeSync(
        () => {
          let mathResult = '';
          const timestamp = Date.now().toString(36);
          const randomSeed = Math.random().toString(36).substring(2);
          const combined = (timestamp + randomSeed).replace(/[^a-z0-9]/gi, '');
          // Enhanced entropy generation with multiple sources
          for (let i = 0; i < length; i++) {
            let char: string;
            if (i < combined.length && Math.random() > 0.5) {
              // Use character from timestamp/random mix
              char = combined[i];
              // Map to our character set
              if (chars.includes(char.toLowerCase())) {
                char = Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
                if (chars.includes(char)) {
                  mathResult += char;
                  continue;
                }
              }
            }
            // Use random character from charset
            mathResult += chars[Math.floor(Math.random() * chars.length)];
          }
          if (mathResult.length !== length) {
            throw new Error(`Fallback ID generation failed: expected length ${length}, got ${mathResult.length}`);
          }
          return mathResult;
        },
        null,
        { operation: 'fallbackGeneration', requestedLength: length, attempt: attempts + 1 }
      );
      if (!mathError && fallbackResult) {
        // Validate composition requirements for fallback too
        if (options.requireUppercase && !/[A-Z]/.test(fallbackResult)) {
          throw new ValidationError('Fallback generated ID does not contain required uppercase letters');
        }
        if (options.requireLowercase && !/[a-z]/.test(fallbackResult)) {
          throw new ValidationError('Fallback generated ID does not contain required lowercase letters');
        }
        if (options.requireNumbers && !/[0-9]/.test(fallbackResult)) {
          throw new ValidationError('Fallback generated ID does not contain required numbers');
        }
        return fallbackResult;
      }
      // If both methods failed, increment attempt and continue
      throw new Error(`ID generation attempt ${attempts + 1} failed`);
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        errorHandler.handle(error, { 
          function: 'generateSecureId', 
          length, 
          charset: charset?.substring(0, 20),
          options,
          attempts
        });
        // Emergency fallback - basic but functional
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const emergency = `${timestamp}${random}`.substring(0, Math.max(4, Math.min(length, 32)));
        // Pad or trim to requested length
        if (emergency.length < length) {
          return emergency + 'x'.repeat(length - emergency.length);
        }
        return emergency.substring(0, length);
      }
      // Brief delay before retry
      const delay = Math.pow(2, attempts) * 10;
      const jitter = Math.random() * 10;
      const startTime = Date.now();
      while (Date.now() - startTime < delay + jitter) {
        // Brief synchronous wait
      }
    }
  }
  // Final fallback (should never reach here)
  return `final_fallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`.substring(0, Math.max(4, Math.min(length, 50)));
}
/**
 * Generates a UUID v4 compatible ID
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  try {
    // Try native crypto.randomUUID first (most secure and standard)
    const { data: nativeUUID, error: nativeError } = safeSync(
      () => {
        if (typeof crypto === 'undefined' || !crypto.randomUUID) {
          throw new Error('crypto.randomUUID not available');
        }
        const uuid = crypto.randomUUID();
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
          throw new Error('Generated UUID format invalid');
        }
        return uuid;
      },
      null,
      { operation: 'nativeUUID' }
    );
    if (!nativeError && nativeUUID) {
      return nativeUUID;
    }
    // Fallback to crypto.getRandomValues implementation
    const { data: cryptoUUID, error: cryptoError } = safeSync(
      () => {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
          throw new Error('crypto.getRandomValues not available');
        }
        const buffer = new Uint8Array(16);
        crypto.getRandomValues(buffer);
        // Set version (4) and variant bits according to RFC 4122
        buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
        buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 10
        const hex = Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
        const uuid = [
          hex.substring(0, 8),
          hex.substring(8, 12),
          hex.substring(12, 16),
          hex.substring(16, 20),
          hex.substring(20, 32)
        ].join('-');
        // Validate generated UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
          throw new Error('Crypto-generated UUID format invalid');
        }
        return uuid;
      },
      null,
      { operation: 'cryptoUUID' }
    );
    if (!cryptoError && cryptoUUID) {
      return cryptoUUID;
    }
    // Last resort: Math.random fallback with better randomness
    const { data: mathUUID, error: mathError } = safeSync(
      () => {
        // Enhanced Math.random implementation with better distribution
        const getRandomHex = (size: number) => {
          let result = '';
          for (let i = 0; i < size; i++) {
            result += Math.floor(Math.random() * 16).toString(16);
          }
          return result;
        };
        const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        const uuid = template.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        // Validate fallback UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
          throw new Error('Math.random UUID format invalid');
        }
        return uuid;
      },
      null,
      { operation: 'mathUUID' }
    );
    if (!mathError && mathUUID) {
      return mathUUID;
    }
    throw new Error('All UUID generation methods failed');
  } catch (error) {
    errorHandler.handle(error, { function: 'generateUUID' });
    // Emergency UUID fallback - less random but functional
    const timestamp = Date.now().toString(16).padStart(12, '0');
    const random1 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    const random2 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    const random3 = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    const random4 = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    return `${timestamp.substring(0, 8)}-${random1}-4${random2.substring(1)}-8${random3.substring(1)}-${random4}${timestamp.substring(8)}`;
  }
}
/**
 * Validates if a string is a valid ID format
 * @param id - The ID string to validate
 * @param options - Validation options
 * @returns Validation result with details
 */
export function validateId(
  id: string, 
  options: {
    minLength?: number;
    maxLength?: number;
    allowedChars?: RegExp;
    requirePrefix?: string;
    format?: 'message' | 'secure' | 'uuid' | 'custom';
  } = {}
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    // Basic type and length validation
    if (typeof id !== 'string') {
      errors.push('ID must be a string');
      return { isValid: false, errors, warnings };
    }
    if (id.length === 0) {
      errors.push('ID cannot be empty');
      return { isValid: false, errors, warnings };
    }
    const minLength = options.minLength || 1;
    const maxLength = options.maxLength || 100;
    if (id.length < minLength) {
      errors.push(`ID too short (minimum ${minLength} characters)`);
    }
    if (id.length > maxLength) {
      errors.push(`ID too long (maximum ${maxLength} characters)`);
    }
    // Character validation
    const allowedChars = options.allowedChars || /^[a-zA-Z0-9_-]+$/;
    if (!allowedChars.test(id)) {
      errors.push('ID contains invalid characters');
    }
    // Prefix validation
    if (options.requirePrefix && !id.startsWith(options.requirePrefix)) {
      errors.push(`ID must start with prefix: ${options.requirePrefix}`);
    }
    // Format-specific validation
    if (options.format) {
      switch (options.format) {
        case 'message':
          if (!/^[a-zA-Z0-9_-]+_\d+_\d{6}(_\d{4})?$/.test(id)) {
            warnings.push('ID does not match expected message ID format');
          }
          break;
        case 'uuid':
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(id)) {
            errors.push('Invalid UUID format');
          }
          break;
        case 'secure':
          if (id.length < 8) {
            warnings.push('Secure ID should be at least 8 characters for adequate security');
          }
          break;
      }
    }
    // Security warnings
    if (id.length < 8 && !options.format) {
      warnings.push('Short IDs may not be sufficiently unique');
    }
    if (/^(test|temp|sample|example)_/.test(id.toLowerCase())) {
      warnings.push('ID appears to be a test/temporary identifier');
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    errorHandler.handle(error, { function: 'validateId', id: id?.substring(0, 50) });
    return {
      isValid: false,
      errors: ['Failed to validate ID due to internal error'],
      warnings
    };
  }
}
/**
 * Generates a short, URL-safe ID
 * @param length - Length of the ID (default: 8)
 * @returns A short URL-safe ID
 */
export function generateShortId(length: number = 8): string {
  return generateSecureId(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_', {
    excludeSimilar: true
  });
}
/**
 * Generates a human-readable ID with words
 * @param separator - Character to separate words (default: '-')
 * @param wordCount - Number of words to include (default: 3)
 * @returns A human-readable ID
 */
export function generateReadableId(separator: string = '-', wordCount: number = 3): string {
  const adjectives = ['happy', 'bright', 'swift', 'calm', 'bold', 'wise', 'kind', 'cool', 'warm', 'free'];
  const nouns = ['fox', 'owl', 'cat', 'dog', 'bird', 'fish', 'star', 'moon', 'sun', 'tree'];
  const colors = ['red', 'blue', 'green', 'gold', 'pink', 'gray', 'cyan', 'lime', 'navy', 'teal'];
  const wordSets = [adjectives, colors, nouns];
  const words: string[] = [];
  try {
    for (let i = 0; i < Math.min(wordCount, 5); i++) {
      const wordSet = wordSets[i % wordSets.length];
      const randomIndex = Math.floor(Math.random() * wordSet.length);
      words.push(wordSet[randomIndex]);
    }
    // Add a random number for uniqueness
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    words.push(randomNumber);
    return words.join(separator);
  } catch (error) {
    errorHandler.handle(error, { function: 'generateReadableId', separator, wordCount });
    return `readable-fallback-${Date.now()}`;
  }
}
/**
 * Creates a batch of unique IDs
 * @param count - Number of IDs to generate
 * @param generator - ID generation function
 * @param maxAttempts - Maximum attempts to ensure uniqueness
 * @returns Array of unique IDs
 */
export function generateIdBatch(
  count: number,
  generator: () => string = generateMessageId,
  maxAttempts: number = 1000
): string[] {
  const ids = new Set<string>();
  let attempts = 0;
  try {
    while (ids.size < count && attempts < maxAttempts) {
      const id = generator();
      ids.add(id);
      attempts++;
    }
    if (ids.size < count) {
    }
    return Array.from(ids);
  } catch (error) {
    errorHandler.handle(error, { function: 'generateIdBatch', count, attempts });
    // Return whatever IDs we managed to generate
    return Array.from(ids);
  }
}
/**
 * Checks if an ID appears to be securely generated
 * @param id - The ID to analyze
 * @returns Security assessment
 */
export function assessIdSecurity(id: string): {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  try {
    // Length assessment
    if (id.length < 8) {
      score -= 30;
      issues.push('ID is too short for security');
      recommendations.push('Use at least 8 characters');
    } else if (id.length < 12) {
      score -= 15;
      issues.push('ID length is below recommended minimum');
      recommendations.push('Consider using at least 12 characters');
    }
    // Character diversity
    const hasLower = /[a-z]/.test(id);
    const hasUpper = /[A-Z]/.test(id);
    const hasNumbers = /[0-9]/.test(id);
    const hasSpecial = /[^a-zA-Z0-9]/.test(id);
    const charTypes = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;
    if (charTypes < 2) {
      score -= 25;
      issues.push('ID uses only one type of character');
      recommendations.push('Use a mix of letters, numbers, and symbols');
    } else if (charTypes < 3) {
      score -= 10;
      recommendations.push('Consider adding more character types for better security');
    }
    // Pattern analysis
    if (/^\d+$/.test(id)) {
      score -= 40;
      issues.push('ID is numeric only - easily guessable');
    }
    if (/^[a-zA-Z]+$/.test(id)) {
      score -= 20;
      issues.push('ID is alphabetic only - reduced security');
    }
    if (/(..).*\1/.test(id)) {
      score -= 15;
      issues.push('ID contains repeated patterns');
    }
    // Sequential characters
    if (/(?:abc|bcd|cde|def|123|234|345|456|789)/.test(id.toLowerCase())) {
      score -= 20;
      issues.push('ID contains sequential characters');
    }
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    // Determine security level
    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score >= 80) level = 'strong';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else level = 'weak';
    return { score, level, issues, recommendations };
  } catch (error) {
    errorHandler.handle(error, { function: 'assessIdSecurity', id: id?.substring(0, 20) });
    return {
      score: 0,
      level: 'weak',
      issues: ['Unable to assess ID security'],
      recommendations: ['Use a proper ID generation function']
    };
  }
}
/**
 * Resets the message counter (useful for testing or specific use cases)
 * @param newValue - New counter value (optional, defaults to 0)
 */
export function resetMessageCounter(newValue: number = 0): void {
  try {
    if (typeof newValue !== 'number' || !Number.isInteger(newValue) || newValue < 0) {
      throw new ValidationError('Counter value must be a non-negative integer', { provided: newValue });
    }
    messageCounter = newValue % MAX_COUNTER;
  } catch (error) {
    errorHandler.handle(error, { function: 'resetMessageCounter', newValue });
  }
}
/**
 * Gets the current message counter value
 * @returns Current counter value
 */
export function getMessageCounter(): number {
  return messageCounter;
}

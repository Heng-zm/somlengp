import crypto from 'crypto';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


export interface OTPData {
  code: string;
  email: string;
  expires: Date;
  attempts: number;
  createdAt: Date;
}

// In-memory storage for demonstration (in production, use Redis or database)
const otpStore = new Map<string, OTPData>();

export class OTPService {
  private static readonly CODE_LENGTH = 6;
  private static readonly EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random OTP code
   */
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store OTP data for an email
   */
  static storeOTP(email: string, code: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + this.EXPIRY_MINUTES);

    otpStore.set(normalizedEmail, {
      code,
      email: normalizedEmail,
      expires,
      attempts: 0,
      createdAt: new Date(),
    });
  }

  /**
   * Verify OTP code for an email
   */
  static verifyOTP(email: string, code: string): {
    success: boolean;
    error?: string;
    attemptsRemaining?: number;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const otpData = otpStore.get(normalizedEmail);

    if (!otpData) {
      return {
        success: false,
        error: 'OTP not found. Please request a new code.',
      };
    }

    // Check if OTP has expired
    if (new Date() > otpData.expires) {
      otpStore.delete(normalizedEmail);
      return {
        success: false,
        error: 'OTP has expired. Please request a new code.',
      };
    }

    // Check if max attempts reached
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      otpStore.delete(normalizedEmail);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Increment attempts
    otpData.attempts++;

    // Verify code
    if (otpData.code === code) {
      otpStore.delete(normalizedEmail);
      return {
        success: true,
      };
    }

    // Update attempts in store
    otpStore.set(normalizedEmail, otpData);

    return {
      success: false,
      error: 'Invalid OTP code.',
      attemptsRemaining: this.MAX_ATTEMPTS - otpData.attempts,
    };
  }

  /**
   * Clean up expired OTP codes
   */
  static cleanupExpired(): void {
    const now = new Date();
    for (const [email, otpData] of otpStore.entries()) {
      if (now > otpData.expires) {
        otpStore.delete(email);
      }
    }
  }

  /**
   * Get OTP status for an email
   */
  static getOTPStatus(email: string): {
    exists: boolean;
    expires?: Date;
    attempts?: number;
    maxAttempts?: number;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const otpData = otpStore.get(normalizedEmail);

    if (!otpData) {
      return { exists: false };
    }

    return {
      exists: true,
      expires: otpData.expires,
      attempts: otpData.attempts,
      maxAttempts: this.MAX_ATTEMPTS,
    };
  }

  /**
   * Remove OTP for an email
   */
  static removeOTP(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    otpStore.delete(normalizedEmail);
  }
}

// Clean up expired OTPs every minute
setInterval(() => {
  OTPService.cleanupExpired();
}, 60000);

import crypto from 'crypto';

export interface SignupVerificationData {
  email: string;
  verificationCode: string;
  firstName: string;
  lastName: string;
  password: string;
  expires: Date;
  attempts: number;
  createdAt: Date;
  verified: boolean;
}

// In-memory storage for pending signups (in production, use Redis or database)
const pendingSignups = new Map<string, SignupVerificationData>();

export class EmailVerificationService {
  private static readonly CODE_LENGTH = 6;
  private static readonly EXPIRY_MINUTES = 10; // 10 minutes for signup verification
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random verification code
   */
  static generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store signup data with verification code
   */
  static storePendingSignup(
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): string {
    const normalizedEmail = email.toLowerCase().trim();
    const verificationCode = this.generateVerificationCode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + this.EXPIRY_MINUTES);

    pendingSignups.set(normalizedEmail, {
      email: normalizedEmail,
      verificationCode,
      firstName,
      lastName,
      password,
      expires,
      attempts: 0,
      createdAt: new Date(),
      verified: false,
    });

    return verificationCode;
  }

  /**
   * Verify email with code and get signup data
   */
  static verifySignupCode(email: string, code: string): {
    success: boolean;
    error?: string;
    attemptsRemaining?: number;
    signupData?: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
    };
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const signupData = pendingSignups.get(normalizedEmail);

    if (!signupData) {
      return {
        success: false,
        error: 'Verification code not found. Please start the signup process again.',
      };
    }

    // Check if code has expired
    if (new Date() > signupData.expires) {
      pendingSignups.delete(normalizedEmail);
      return {
        success: false,
        error: 'Verification code has expired. Please start the signup process again.',
      };
    }

    // Check if max attempts reached
    if (signupData.attempts >= this.MAX_ATTEMPTS) {
      pendingSignups.delete(normalizedEmail);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please start the signup process again.',
      };
    }

    // Increment attempts
    signupData.attempts++;

    // Verify code
    if (signupData.verificationCode === code) {
      // Mark as verified but keep the data for account creation
      signupData.verified = true;
      pendingSignups.set(normalizedEmail, signupData);
      
      return {
        success: true,
        signupData: {
          email: signupData.email,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          password: signupData.password,
        },
      };
    }

    // Update attempts in store
    pendingSignups.set(normalizedEmail, signupData);

    return {
      success: false,
      error: 'Invalid verification code.',
      attemptsRemaining: this.MAX_ATTEMPTS - signupData.attempts,
    };
  }

  /**
   * Get verification status for an email
   */
  static getVerificationStatus(email: string): {
    exists: boolean;
    expires?: Date;
    attempts?: number;
    maxAttempts?: number;
    verified?: boolean;
    timeRemaining?: number;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const signupData = pendingSignups.get(normalizedEmail);

    if (!signupData) {
      return { exists: false };
    }

    const timeRemaining = Math.max(0, Math.floor((signupData.expires.getTime() - new Date().getTime()) / 1000));

    return {
      exists: true,
      expires: signupData.expires,
      attempts: signupData.attempts,
      maxAttempts: this.MAX_ATTEMPTS,
      verified: signupData.verified,
      timeRemaining,
    };
  }

  /**
   * Complete signup (remove from pending after successful account creation)
   */
  static completeSignup(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    pendingSignups.delete(normalizedEmail);
  }

  /**
   * Resend verification code for existing signup
   */
  static resendVerificationCode(email: string): {
    success: boolean;
    error?: string;
    newCode?: string;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const signupData = pendingSignups.get(normalizedEmail);

    if (!signupData) {
      return {
        success: false,
        error: 'No pending signup found for this email.',
      };
    }

    // Generate new code and extend expiry
    const newCode = this.generateVerificationCode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + this.EXPIRY_MINUTES);

    signupData.verificationCode = newCode;
    signupData.expires = expires;
    signupData.attempts = 0; // Reset attempts
    signupData.verified = false; // Reset verification status

    pendingSignups.set(normalizedEmail, signupData);

    return {
      success: true,
      newCode,
    };
  }

  /**
   * Check if email already has a pending signup
   */
  static hasPendingSignup(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const signupData = pendingSignups.get(normalizedEmail);
    
    if (!signupData) return false;
    
    // Check if expired
    if (new Date() > signupData.expires) {
      pendingSignups.delete(normalizedEmail);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired pending signups
   */
  static cleanupExpired(): void {
    const now = new Date();
    for (const [email, signupData] of pendingSignups.entries()) {
      if (now > signupData.expires) {
        pendingSignups.delete(email);
      }
    }
  }

  /**
   * Remove pending signup
   */
  static removePendingSignup(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    pendingSignups.delete(normalizedEmail);
  }
}

// Clean up expired signups every 5 minutes
setInterval(() => {
  EmailVerificationService.cleanupExpired();
}, 300000);

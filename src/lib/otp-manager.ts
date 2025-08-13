import { OTPService } from './otp-service';
import { GmailService, EmailConfig } from './gmail-service';

export interface OTPManagerConfig {
  gmail: EmailConfig;
  options?: {
    companyName?: string;
    codeLength?: number;
    expiryMinutes?: number;
    maxAttempts?: number;
  };
}

export class OTPManager {
  private gmailService: GmailService;
  private options: {
    companyName: string;
    expiryMinutes: number;
  };

  constructor(config: OTPManagerConfig) {
    this.gmailService = new GmailService(config.gmail);
    this.options = {
      companyName: config.options?.companyName || 'SomlengP',
      expiryMinutes: config.options?.expiryMinutes || 5,
    };
  }

  /**
   * Send OTP code to email
   */
  async sendOTP(
    email: string,
    options?: {
      subject?: string;
      customMessage?: string;
    }
  ): Promise<{
    success: boolean;
    code?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Check if there's already an active OTP
      const existingOTP = OTPService.getOTPStatus(email);
      if (existingOTP.exists) {
        const timeUntilExpiry = existingOTP.expires
          ? Math.ceil((existingOTP.expires.getTime() - new Date().getTime()) / 1000 / 60)
          : 0;

        return {
          success: false,
          error: `An OTP is already active for this email. Please wait ${timeUntilExpiry} minutes or use the existing code.`,
        };
      }

      // Generate new OTP
      const otp = OTPService.generateOTP();

      // Store OTP
      OTPService.storeOTP(email, otp);

      // Send email
      const emailResult = await this.gmailService.sendOTPEmail(otp, email, {
        subject: options?.subject,
        companyName: this.options.companyName,
        expiryMinutes: this.options.expiryMinutes,
      });

      if (!emailResult.success) {
        // Remove OTP if email failed to send
        OTPService.removeOTP(email);
        return {
          success: false,
          error: `Failed to send email: ${emailResult.error}`,
        };
      }

      return {
        success: true,
        code: otp, // In production, don't return the code for security
        messageId: emailResult.messageId,
      };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    email: string,
    code: string
  ): Promise<{
    success: boolean;
    error?: string;
    attemptsRemaining?: number;
  }> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Validate code format
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return {
          success: false,
          error: 'Invalid OTP format. Code must be 6 digits.',
        };
      }

      // Verify OTP
      const result = OTPService.verifyOTP(email, code);
      return result;
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  /**
   * Resend OTP (removes existing and sends new)
   */
  async resendOTP(
    email: string,
    options?: {
      subject?: string;
      customMessage?: string;
    }
  ): Promise<{
    success: boolean;
    code?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Remove existing OTP
      OTPService.removeOTP(email);

      // Send new OTP
      return await this.sendOTP(email, options);
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      };
    }
  }

  /**
   * Get OTP status for an email
   */
  getOTPStatus(email: string): {
    exists: boolean;
    expires?: Date;
    attempts?: number;
    maxAttempts?: number;
    timeRemaining?: number; // in seconds
  } {
    const status = OTPService.getOTPStatus(email);
    
    if (status.exists && status.expires) {
      const timeRemaining = Math.max(0, Math.floor((status.expires.getTime() - new Date().getTime()) / 1000));
      return {
        ...status,
        timeRemaining,
      };
    }

    return status;
  }

  /**
   * Cancel OTP for an email
   */
  cancelOTP(email: string): { success: boolean } {
    try {
      OTPService.removeOTP(email);
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel OTP:', error);
      return { success: false };
    }
  }

  /**
   * Test Gmail connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return await this.gmailService.testConnection();
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeOTPs: number;
    serviceName: string;
    version: string;
  } {
    // This is a simple implementation - in production you might want more detailed stats
    return {
      activeOTPs: 0, // Would need to modify OTPService to expose this
      serviceName: this.options.companyName,
      version: '1.0.0',
    };
  }
}

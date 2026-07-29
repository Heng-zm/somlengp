import { EmailConfig, GmailService } from './gmail-service';
import { OTPService } from './otp-service';

export interface OTPManagerConfig {
  gmail: EmailConfig;
  options?: {
    companyName?: string;
    codeLength?: number;
    expiryMinutes?: number;
  };
}

export interface SendOTPResult {
  success: boolean;
  code?: string;
  messageId?: string;
  error?: string;
}

export class OTPManager {
  private readonly gmailService: GmailService;
  private readonly options: {
    companyName: string;
    codeLength: number;
    expiryMinutes: number;
  };

  constructor(config: OTPManagerConfig) {
    this.gmailService = new GmailService(config.gmail);
    this.options = {
      companyName: config.options?.companyName || 'SomlengP',
      codeLength: config.options?.codeLength || 6,
      expiryMinutes: config.options?.expiryMinutes || 5,
    };
  }

  async sendOTP(
    email: string,
    options?: { subject?: string }
  ): Promise<SendOTPResult> {
    const normalizedEmail = OTPService.normalizeEmail(email);

    if (!OTPService.isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Invalid email format' };
    }

    try {
      const code = OTPService.generateOTP(this.options.codeLength);
      const emailResult = await this.gmailService.sendOTPEmail(
        code,
        normalizedEmail,
        {
          subject: options?.subject,
          companyName: this.options.companyName,
          expiryMinutes: this.options.expiryMinutes,
        }
      );

      if (!emailResult.success) {
        return {
          success: false,
          error: emailResult.error || 'Email provider rejected the message',
        };
      }

      return {
        success: true,
        code,
        messageId: emailResult.messageId,
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.gmailService.testConnection();
  }
}

import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export interface EmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  user: string; // Your Gmail address
}

export class GmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Initialize Gmail OAuth2 transporter
   */
  private async initializeTransporter(): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        'https://developers.google.com/oauthplayground'
      );

      oauth2Client.setCredentials({
        refresh_token: this.config.refreshToken,
      });

      const accessToken = await oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.config.user,
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
          refreshToken: this.config.refreshToken,
          accessToken: accessToken.token || '',
        },
      });
    } catch (error) {
      console.error('Failed to initialize Gmail transporter:', error);
      throw new Error('Failed to initialize Gmail service');
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(
    otp: string,
    to: string,
    options?: {
      subject?: string;
      companyName?: string;
      expiryMinutes?: number;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const {
        subject = 'Your Verification Code',
        companyName = 'SomlengP',
        expiryMinutes = 5,
      } = options || {};

      const htmlContent = this.generateOTPEmailHTML(otp, companyName, expiryMinutes);
      const textContent = this.generateOTPEmailText(otp, companyName, expiryMinutes);

      const mailOptions = {
        from: `${companyName} <${this.config.user}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate HTML content for OTP email
   */
  private generateOTPEmailHTML(
    otp: string,
    companyName: string,
    expiryMinutes: number
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            background-color: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
            display: inline-block;
            border: 2px dashed #667eea;
          }
          .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #555;
          }
          .expiry-notice {
            font-size: 14px;
            color: #e74c3c;
            background-color: #fdf2f2;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #e74c3c;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>Verification Code</p>
          </div>
          <div class="content">
            <p class="message">
              Please use the verification code below to complete your action:
            </p>
            <div class="otp-code">${otp}</div>
            <div class="expiry-notice">
              ⏰ This code will expire in ${expiryMinutes} minutes
            </div>
            <div class="security-note">
              🔒 <strong>Security Note:</strong> Never share this code with anyone. ${companyName} will never ask for your verification code via phone or email.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from ${companyName}.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate text content for OTP email (fallback for non-HTML clients)
   */
  private generateOTPEmailText(
    otp: string,
    companyName: string,
    expiryMinutes: number
  ): string {
    return `
${companyName} - Verification Code

Your verification code is: ${otp}

This code will expire in ${expiryMinutes} minutes.

For security reasons:
- Never share this code with anyone
- ${companyName} will never ask for your verification code

If you didn't request this code, please ignore this email.

---
This is an automated message from ${companyName}.
    `.trim();
  }

  /**
   * Test the Gmail connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      await this.transporter!.verify();
      return { success: true };
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

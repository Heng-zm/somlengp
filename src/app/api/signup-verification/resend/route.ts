import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationService } from '@/lib/email-verification-service';
import { OTPManager } from '@/lib/otp-manager';

// Initialize OTP Manager with environment variables
const getOTPManager = () => {
  const requiredEnvVars = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET', 
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_USER_EMAIL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return new OTPManager({
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
      user: process.env.GMAIL_USER_EMAIL!,
    },
    options: {
      companyName: process.env.COMPANY_NAME || 'SomlengP',
      expiryMinutes: 10, // 10 minutes for signup verification
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Resend verification code
    const resendResult = EmailVerificationService.resendVerificationCode(email);
    
    if (!resendResult.success) {
      return NextResponse.json(
        { success: false, error: resendResult.error },
        { status: 400 }
      );
    }

    // Get verification status to get firstName for personalized email
    const status = EmailVerificationService.getVerificationStatus(email);
    const signupData = (EmailVerificationService as any).pendingSignups?.get(email.toLowerCase().trim());
    const firstName = signupData?.firstName || 'there';

    // Initialize OTP Manager
    const otpManager = getOTPManager();

    // Send new verification email
    const emailResult = await otpManager.sendOTP(email, {
      subject: 'New Verification Code - Complete Your Account Setup',
      customMessage: `Hi ${firstName}! Here's your new verification code to complete your SomlengP account creation.`,
      code: resendResult.newCode!,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'New verification code sent successfully',
        messageId: emailResult.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend Signup Verification API Error:', error);
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return NextResponse.json(
        { success: false, error: 'Email service configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}

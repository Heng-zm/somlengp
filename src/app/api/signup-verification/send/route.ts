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
    const { email, firstName, lastName, password } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if there's already a pending signup for this email
    const hasPending = EmailVerificationService.hasPendingSignup(email);
    let verificationCode: string;

    if (hasPending) {
      // Resend verification code for existing signup
      const resendResult = EmailVerificationService.resendVerificationCode(email);
      if (!resendResult.success) {
        return NextResponse.json(
          { success: false, error: resendResult.error },
          { status: 400 }
        );
      }
      verificationCode = resendResult.newCode!;
    } else {
      // Store new pending signup
      verificationCode = EmailVerificationService.storePendingSignup(
        email,
        firstName,
        lastName,
        password
      );
    }

    // Initialize OTP Manager
    const otpManager = getOTPManager();

    // Send verification email
    const emailResult = await otpManager.sendOTP(email, {
      subject: 'Verify Your Email Address - Complete Your Account Setup',
      customMessage: `Welcome to SomlengP, ${firstName}! Please use the verification code below to complete your account creation.`,
      code: verificationCode,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        messageId: emailResult.messageId,
      });
    } else {
      // Remove the stored signup data if email failed
      EmailVerificationService.removePendingSignup(email);
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send Signup Verification API Error:', error);
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return NextResponse.json(
        { success: false, error: 'Email service configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get verification status
    const status = EmailVerificationService.getVerificationStatus(email);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get Signup Verification Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

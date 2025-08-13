import { NextRequest, NextResponse } from 'next/server';
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
      expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5'),
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Initialize OTP Manager
    const otpManager = getOTPManager();

    // Verify OTP
    const result = await otpManager.verifyOTP(email, code);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
      });
    } else {
      const statusCode = result.error?.includes('expired') || 
                        result.error?.includes('not found') ? 410 : 400;

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

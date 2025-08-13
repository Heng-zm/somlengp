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
    const { email, subject, customMessage } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Initialize OTP Manager
    const otpManager = getOTPManager();

    // Send OTP
    const result = await otpManager.sendOTP(email, {
      subject,
      customMessage,
    });

    if (result.success) {
      // Don't return the actual code in production for security
      const response = {
        success: true,
        messageId: result.messageId,
        message: 'OTP sent successfully',
        // code: result.code, // Only for development/testing
      };

      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Send OTP API Error:', error);
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
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

    // Initialize OTP Manager
    const otpManager = getOTPManager();

    // Get OTP status
    const status = otpManager.getOTPStatus(email);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get OTP Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get OTP status' },
      { status: 500 }
    );
  }
}

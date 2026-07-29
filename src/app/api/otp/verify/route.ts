import { NextRequest, NextResponse } from 'next/server';
import {
  clearChallengeCookie,
  getChallengeToken,
  getOTPChallengeConfiguration,
  setChallengeCookie,
} from '@/lib/otp-route-utils';
import { OTPService } from '@/lib/otp-service';
import { isRequestOriginAllowed } from '@/lib/request-security';
import {
  checkRateLimit,
  createRateLimitResponse,
  getClientAddress,
  hashRateLimitValue,
} from '@/lib/server-rate-limit';

interface VerifyOTPBody {
  email?: unknown;
  code?: unknown;
}

export async function POST(request: NextRequest) {
  if (!isRequestOriginAllowed(request)) {
    return NextResponse.json(
      { success: false, error: 'Request origin is not allowed' },
      { status: 403 }
    );
  }

  let body: VerifyOTPBody;
  try {
    body = (await request.json()) as VerifyOTPBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'A valid JSON body is required' },
      { status: 400 }
    );
  }

  if (typeof body.email !== 'string' || !OTPService.isValidEmail(body.email)) {
    return NextResponse.json(
      { success: false, error: 'A valid email address is required' },
      { status: 400 }
    );
  }

  const email = OTPService.normalizeEmail(body.email);
  const addressLimit = checkRateLimit(
    `otp-verify:ip:${getClientAddress(request)}`,
    20,
    5 * 60_000
  );
  if (!addressLimit.allowed) {
    return createRateLimitResponse(addressLimit);
  }

  const emailLimit = checkRateLimit(
    `otp-verify:email:${hashRateLimitValue(email)}`,
    10,
    5 * 60_000
  );
  if (!emailLimit.allowed) {
    return createRateLimitResponse(emailLimit);
  }

  try {
    const { secret, codeLength } = getOTPChallengeConfiguration();
    const code =
      typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';

    if (!new RegExp(`^\\d{${codeLength}}$`).test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: `Verification code must contain ${codeLength} digits`,
        },
        { status: 400 }
      );
    }

    const result = OTPService.verifyChallenge(
      getChallengeToken(request),
      email,
      code,
      secret
    );

    if (result.status === 'success') {
      const response = NextResponse.json({
        success: true,
        message: 'Verification completed successfully',
      });
      clearChallengeCookie(response);
      return response;
    }

    if (result.status === 'missing' || result.status === 'expired') {
      const response = NextResponse.json(
        {
          success: false,
          error:
            result.status === 'expired'
              ? 'Verification code has expired. Please request a new code.'
              : 'No active verification request was found.',
          attemptsRemaining: 0,
        },
        { status: 410 }
      );
      clearChallengeCookie(response);
      return response;
    }

    if (!('updatedToken' in result)) {
      return NextResponse.json(
        { success: false, error: 'Failed to verify the code' },
        { status: 500 }
      );
    }

    const locked = result.status === 'locked';
    const response = NextResponse.json(
      {
        success: false,
        error: locked
          ? 'Maximum verification attempts reached. Please request a new code.'
          : 'The verification code is incorrect.',
        attemptsRemaining: result.attemptsRemaining,
      },
      { status: locked ? 429 : 400 }
    );
    setChallengeCookie(response, result.updatedToken, result.expiresAt);
    return response;
  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify the code' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getChallengeToken,
  getOTPChallengeConfiguration,
  getOTPRouteConfiguration,
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

interface ResendOTPBody {
  email?: unknown;
  subject?: unknown;
}

export async function POST(request: NextRequest) {
  if (!isRequestOriginAllowed(request)) {
    return NextResponse.json(
      { success: false, error: 'Request origin is not allowed' },
      { status: 403 }
    );
  }

  let body: ResendOTPBody;
  try {
    body = (await request.json()) as ResendOTPBody;
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

  if (
    body.subject !== undefined &&
    (typeof body.subject !== 'string' || body.subject.trim().length > 160)
  ) {
    return NextResponse.json(
      { success: false, error: 'Subject must be 160 characters or fewer' },
      { status: 400 }
    );
  }

  const email = OTPService.normalizeEmail(body.email);
  const addressLimit = checkRateLimit(
    `otp-send:ip:${getClientAddress(request)}`,
    10,
    15 * 60_000
  );
  if (!addressLimit.allowed) {
    return createRateLimitResponse(addressLimit);
  }

  const emailLimit = checkRateLimit(
    `otp-send:email:${hashRateLimitValue(email)}`,
    3,
    15 * 60_000
  );
  if (!emailLimit.allowed) {
    return createRateLimitResponse(emailLimit);
  }

  try {
    const challengeConfiguration = getOTPChallengeConfiguration();
    const currentStatus = OTPService.getChallengeStatus(
      getChallengeToken(request),
      email,
      challengeConfiguration.secret
    );

    if (currentStatus.exists && (currentStatus.resendAvailableIn || 0) > 0) {
      const retryAfter = currentStatus.resendAvailableIn || 1;
      const response = NextResponse.json(
        {
          success: false,
          error: 'Please wait before requesting another code',
          retryAfter,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(retryAfter));
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const { manager, secret, challengeOptions, codeLength } =
      getOTPRouteConfiguration();
    const sendResult = await manager.sendOTP(email, {
      subject:
        typeof body.subject === 'string'
          ? body.subject.trim() || 'Your new verification code'
          : 'Your new verification code',
    });

    if (!sendResult.success || !sendResult.code) {
      console.error('OTP resend delivery failed:', sendResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to send the verification email. Please try again later.',
        },
        { status: 502 }
      );
    }

    const challenge = OTPService.createChallenge(
      email,
      sendResult.code,
      secret,
      challengeOptions
    );
    const now = Date.now();
    const response = NextResponse.json({
      success: true,
      message: 'A new verification code was sent',
      expiresIn: Math.max(0, Math.ceil((challenge.expiresAt - now) / 1_000)),
      resendAvailableIn: Math.max(
        0,
        Math.ceil((challenge.resendAvailableAt - now) / 1_000)
      ),
      codeLength,
    });
    setChallengeCookie(response, challenge.token, challenge.expiresAt);
    return response;
  } catch (error) {
    console.error('Resend OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend the verification code' },
      { status: 500 }
    );
  }
}

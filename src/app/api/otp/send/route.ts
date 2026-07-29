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

const SEND_WINDOW_MS = 15 * 60_000;

interface SendOTPBody {
  email?: unknown;
  subject?: unknown;
}

function configurationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('environment variable') ||
      error.message.includes('OTP_SECRET'))
  );
}

export async function POST(request: NextRequest) {
  if (!isRequestOriginAllowed(request)) {
    return NextResponse.json(
      { success: false, error: 'Request origin is not allowed' },
      { status: 403 }
    );
  }

  let body: SendOTPBody;
  try {
    body = (await request.json()) as SendOTPBody;
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
    SEND_WINDOW_MS
  );
  if (!addressLimit.allowed) {
    return createRateLimitResponse(addressLimit);
  }

  const emailLimit = checkRateLimit(
    `otp-send:email:${hashRateLimitValue(email)}`,
    3,
    SEND_WINDOW_MS
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
          status: currentStatus,
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
        typeof body.subject === 'string' ? body.subject.trim() || undefined : undefined,
    });

    if (!sendResult.success || !sendResult.code) {
      console.error('OTP email delivery failed:', sendResult.error);
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
    const expiresIn = Math.max(
      0,
      Math.ceil((challenge.expiresAt - Date.now()) / 1_000)
    );
    const resendAvailableIn = Math.max(
      0,
      Math.ceil((challenge.resendAvailableAt - Date.now()) / 1_000)
    );
    const response = NextResponse.json({
      success: true,
      message: 'Verification code sent',
      expiresIn,
      resendAvailableIn,
      codeLength,
    });
    setChallengeCookie(response, challenge.token, challenge.expiresAt);
    return response;
  } catch (error) {
    console.error('Send OTP API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: configurationError(error)
          ? 'Verification service is not configured'
          : 'Failed to send the verification code',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || '';

  if (!OTPService.isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'A valid email parameter is required' },
      { status: 400 }
    );
  }

  try {
    const { secret, codeLength } = getOTPChallengeConfiguration();
    const status = OTPService.getChallengeStatus(
      getChallengeToken(request),
      email,
      secret
    );
    const response = NextResponse.json({
      success: true,
      status: {
        ...status,
        expires: status.expiresAt
          ? new Date(status.expiresAt).toISOString()
          : undefined,
      },
      codeLength,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Get OTP status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

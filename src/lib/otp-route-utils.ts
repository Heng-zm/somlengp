import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { OTPManager } from './otp-manager';
import { OTPChallengeOptions, OTPService } from './otp-service';

export const OTP_CHALLENGE_COOKIE = 'somlengp_otp_challenge';

export interface OTPRouteConfiguration {
  manager: OTPManager;
  secret: string;
  challengeOptions: Required<OTPChallengeOptions>;
  codeLength: number;
}

export interface OTPChallengeConfiguration {
  secret: string;
  challengeOptions: Required<OTPChallengeOptions>;
  codeLength: number;
}

function readInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function getOTPChallengeConfiguration(): OTPChallengeConfiguration {
  const expiryMinutes = readInteger('OTP_EXPIRY_MINUTES', 5, 1, 15);
  const maxAttempts = readInteger('OTP_MAX_ATTEMPTS', 3, 1, 10);
  const resendCooldownSeconds = readInteger(
    'OTP_RESEND_COOLDOWN_SECONDS',
    60,
    10,
    300
  );
  const codeLength = readInteger('OTP_CODE_LENGTH', 6, 4, 8);
  const secret = process.env.OTP_SECRET || process.env.GMAIL_CLIENT_SECRET;

  if (!secret) {
    throw new Error(
      'Missing required environment variable: OTP_SECRET or GMAIL_CLIENT_SECRET'
    );
  }

  if (secret.length < 16) {
    throw new Error('OTP_SECRET must contain at least 16 characters');
  }

  return {
    secret,
    challengeOptions: {
      expiryMinutes,
      maxAttempts,
      resendCooldownSeconds,
    },
    codeLength,
  };
}

export function getOTPRouteConfiguration(): OTPRouteConfiguration {
  const requiredEnvironment = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_USER_EMAIL',
  ] as const;

  for (const name of requiredEnvironment) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const challengeConfiguration = getOTPChallengeConfiguration();

  return {
    ...challengeConfiguration,
    manager: new OTPManager({
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID!,
        clientSecret: process.env.GMAIL_CLIENT_SECRET!,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
        user: process.env.GMAIL_USER_EMAIL!,
      },
      options: {
        companyName: process.env.COMPANY_NAME || 'SomlengP',
        codeLength: challengeConfiguration.codeLength,
        expiryMinutes: challengeConfiguration.challengeOptions.expiryMinutes,
      },
    }),
  };
}

export function getChallengeToken(request: NextRequest): string | undefined {
  return request.cookies.get(OTP_CHALLENGE_COOKIE)?.value;
}

export function setChallengeCookie(
  response: NextResponse,
  token: string,
  expiresAt: number
): void {
  response.cookies.set({
    name: OTP_CHALLENGE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/otp',
    expires: new Date(expiresAt),
  });
  response.headers.set('Cache-Control', 'no-store');
}

export function clearChallengeCookie(response: NextResponse): void {
  response.cookies.set({
    name: OTP_CHALLENGE_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/otp',
    expires: new Date(0),
    maxAge: 0,
  });
  response.headers.set('Cache-Control', 'no-store');
}

export function getOTPStatus(request: NextRequest, email: string) {
  const { secret } = getOTPChallengeConfiguration();
  return OTPService.getChallengeStatus(
    getChallengeToken(request),
    email,
    secret
  );
}

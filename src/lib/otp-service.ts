import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';

export interface OTPChallengeOptions {
  expiryMinutes?: number;
  maxAttempts?: number;
  resendCooldownSeconds?: number;
}

interface OTPChallengePayload {
  version: 1;
  email: string;
  codeDigest: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  resendAvailableAt: number;
  attempts: number;
  maxAttempts: number;
}

export interface OTPChallenge {
  token: string;
  expiresAt: number;
  resendAvailableAt: number;
}

export interface OTPChallengeStatus {
  exists: boolean;
  expiresAt?: number;
  attempts?: number;
  maxAttempts?: number;
  attemptsRemaining?: number;
  timeRemaining?: number;
  resendAvailableIn?: number;
}

export type OTPVerificationResult =
  | { status: 'success'; attemptsRemaining: number }
  | { status: 'missing' | 'expired'; attemptsRemaining: 0 }
  | {
      status: 'invalid' | 'locked';
      attemptsRemaining: number;
      updatedToken: string;
      expiresAt: number;
    };

const DEFAULT_EXPIRY_MINUTES = 5;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

function clampInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.trunc(value as number)));
}

function sign(secret: string, purpose: string, value: string): Buffer {
  return createHmac('sha256', secret)
    .update(`${purpose}\0${value}`, 'utf8')
    .digest();
}

function safelyEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

function serializePayload(payload: OTPChallengePayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const signature = sign(secret, 'otp-challenge', encodedPayload).toString(
    'base64url'
  );

  return `${encodedPayload}.${signature}`;
}

function isPayload(value: unknown): value is OTPChallengePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<OTPChallengePayload>;

  return (
    payload.version === 1 &&
    typeof payload.email === 'string' &&
    typeof payload.codeDigest === 'string' &&
    typeof payload.nonce === 'string' &&
    Number.isSafeInteger(payload.issuedAt) &&
    Number.isSafeInteger(payload.expiresAt) &&
    Number.isSafeInteger(payload.resendAvailableAt) &&
    Number.isSafeInteger(payload.attempts) &&
    Number.isSafeInteger(payload.maxAttempts) &&
    (payload.attempts as number) >= 0 &&
    (payload.maxAttempts as number) >= 1 &&
    (payload.attempts as number) <= (payload.maxAttempts as number) &&
    (payload.expiresAt as number) > (payload.issuedAt as number)
  );
}

function parsePayload(
  token: string | undefined,
  secret: string
): OTPChallengePayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature, extraPart] = token.split('.');
  if (!encodedPayload || !encodedSignature || extraPart !== undefined) {
    return null;
  }

  try {
    const suppliedSignature = Buffer.from(encodedSignature, 'base64url');
    const expectedSignature = sign(secret, 'otp-challenge', encodedPayload);

    if (!safelyEqual(suppliedSignature, expectedSignature)) {
      return null;
    }

    const parsed: unknown = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createCodeDigest(
  email: string,
  nonce: string,
  code: string,
  secret: string
): Buffer {
  return sign(secret, 'otp-code', `${email}\0${nonce}\0${code}`);
}

export class OTPService {
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static isValidEmail(email: string): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    return (
      normalizedEmail.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    );
  }

  static generateOTP(length = 6): string {
    const safeLength = clampInteger(length, 6, 4, 8);
    return randomInt(0, 10 ** safeLength)
      .toString()
      .padStart(safeLength, '0');
  }

  static createChallenge(
    email: string,
    code: string,
    secret: string,
    options: OTPChallengeOptions = {},
    now = Date.now()
  ): OTPChallenge {
    const normalizedEmail = this.normalizeEmail(email);
    const expiryMinutes = clampInteger(
      options.expiryMinutes,
      DEFAULT_EXPIRY_MINUTES,
      1,
      15
    );
    const maxAttempts = clampInteger(
      options.maxAttempts,
      DEFAULT_MAX_ATTEMPTS,
      1,
      10
    );
    const resendCooldownSeconds = clampInteger(
      options.resendCooldownSeconds,
      DEFAULT_RESEND_COOLDOWN_SECONDS,
      10,
      300
    );
    const nonce = randomBytes(18).toString('base64url');
    const expiresAt = now + expiryMinutes * 60_000;
    const resendAvailableAt = Math.min(
      expiresAt,
      now + resendCooldownSeconds * 1_000
    );
    const payload: OTPChallengePayload = {
      version: 1,
      email: normalizedEmail,
      codeDigest: createCodeDigest(
        normalizedEmail,
        nonce,
        code,
        secret
      ).toString('base64url'),
      nonce,
      issuedAt: now,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      maxAttempts,
    };

    return {
      token: serializePayload(payload, secret),
      expiresAt,
      resendAvailableAt,
    };
  }

  static getChallengeStatus(
    token: string | undefined,
    email: string,
    secret: string,
    now = Date.now()
  ): OTPChallengeStatus {
    const payload = parsePayload(token, secret);
    const normalizedEmail = this.normalizeEmail(email);

    if (
      !payload ||
      payload.email !== normalizedEmail ||
      payload.expiresAt <= now
    ) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: payload.expiresAt,
      attempts: payload.attempts,
      maxAttempts: payload.maxAttempts,
      attemptsRemaining: payload.maxAttempts - payload.attempts,
      timeRemaining: Math.max(0, Math.ceil((payload.expiresAt - now) / 1_000)),
      resendAvailableIn: Math.max(
        0,
        Math.ceil((payload.resendAvailableAt - now) / 1_000)
      ),
    };
  }

  static verifyChallenge(
    token: string | undefined,
    email: string,
    code: string,
    secret: string,
    now = Date.now()
  ): OTPVerificationResult {
    const payload = parsePayload(token, secret);
    const normalizedEmail = this.normalizeEmail(email);

    if (!payload || payload.email !== normalizedEmail) {
      return { status: 'missing', attemptsRemaining: 0 };
    }

    if (payload.expiresAt <= now) {
      return { status: 'expired', attemptsRemaining: 0 };
    }

    if (payload.attempts >= payload.maxAttempts) {
      return {
        status: 'locked',
        attemptsRemaining: 0,
        updatedToken: token as string,
        expiresAt: payload.expiresAt,
      };
    }

    const suppliedDigest = createCodeDigest(
      normalizedEmail,
      payload.nonce,
      code,
      secret
    );
    const expectedDigest = Buffer.from(payload.codeDigest, 'base64url');

    if (safelyEqual(suppliedDigest, expectedDigest)) {
      return {
        status: 'success',
        attemptsRemaining: payload.maxAttempts - payload.attempts,
      };
    }

    const attempts = payload.attempts + 1;
    const attemptsRemaining = Math.max(0, payload.maxAttempts - attempts);
    const updatedPayload = { ...payload, attempts };

    return {
      status: attemptsRemaining === 0 ? 'locked' : 'invalid',
      attemptsRemaining,
      updatedToken: serializePayload(updatedPayload, secret),
      expiresAt: payload.expiresAt,
    };
  }
}

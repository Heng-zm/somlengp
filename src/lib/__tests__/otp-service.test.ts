import { OTPService } from '../otp-service';

const SECRET = 'test-only-secret-with-more-than-sixteen-characters';
const EMAIL = 'person@example.com';
const CODE = '042731';
const NOW = 1_800_000_000_000;

describe('OTPService signed challenges', () => {
  it('generates fixed-length numeric codes, including supported custom lengths', () => {
    expect(OTPService.generateOTP()).toMatch(/^\d{6}$/);
    expect(OTPService.generateOTP(4)).toMatch(/^\d{4}$/);
    expect(OTPService.generateOTP(8)).toMatch(/^\d{8}$/);
  });

  it('verifies a correct code for the normalized email', () => {
    const challenge = OTPService.createChallenge(
      `  ${EMAIL.toUpperCase()} `,
      CODE,
      SECRET,
      undefined,
      NOW
    );

    expect(
      OTPService.verifyChallenge(
        challenge.token,
        EMAIL,
        CODE,
        SECRET,
        NOW + 1_000
      )
    ).toMatchObject({ status: 'success' });
  });

  it('rejects tampered challenges without exposing their contents', () => {
    const challenge = OTPService.createChallenge(
      EMAIL,
      CODE,
      SECRET,
      undefined,
      NOW
    );
    const tamperedToken = `${challenge.token.slice(0, -1)}x`;

    expect(
      OTPService.verifyChallenge(
        tamperedToken,
        EMAIL,
        CODE,
        SECRET,
        NOW + 1_000
      )
    ).toEqual({ status: 'missing', attemptsRemaining: 0 });
  });

  it('persists failed attempts in the replacement token and locks at the limit', () => {
    const challenge = OTPService.createChallenge(
      EMAIL,
      CODE,
      SECRET,
      { maxAttempts: 3 },
      NOW
    );

    const first = OTPService.verifyChallenge(
      challenge.token,
      EMAIL,
      '111111',
      SECRET,
      NOW + 1_000
    );
    expect(first).toMatchObject({ status: 'invalid', attemptsRemaining: 2 });
    expect('updatedToken' in first).toBe(true);

    if (!('updatedToken' in first)) {
      throw new Error('Expected the failed attempt to return an updated token');
    }

    const second = OTPService.verifyChallenge(
      first.updatedToken,
      EMAIL,
      '222222',
      SECRET,
      NOW + 2_000
    );
    expect(second).toMatchObject({ status: 'invalid', attemptsRemaining: 1 });

    if (!('updatedToken' in second)) {
      throw new Error('Expected the failed attempt to return an updated token');
    }

    expect(
      OTPService.verifyChallenge(
        second.updatedToken,
        EMAIL,
        '333333',
        SECRET,
        NOW + 3_000
      )
    ).toMatchObject({ status: 'locked', attemptsRemaining: 0 });
  });

  it('expires challenges and reports resend timing accurately', () => {
    const challenge = OTPService.createChallenge(
      EMAIL,
      CODE,
      SECRET,
      { expiryMinutes: 1, resendCooldownSeconds: 30 },
      NOW
    );

    expect(
      OTPService.getChallengeStatus(
        challenge.token,
        EMAIL,
        SECRET,
        NOW + 10_000
      )
    ).toMatchObject({
      exists: true,
      timeRemaining: 50,
      resendAvailableIn: 20,
    });

    expect(
      OTPService.verifyChallenge(
        challenge.token,
        EMAIL,
        CODE,
        SECRET,
        NOW + 60_000
      )
    ).toEqual({ status: 'expired', attemptsRemaining: 0 });
  });
});

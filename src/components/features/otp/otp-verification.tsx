'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OTPVerificationProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  initialEmail?: string;
  title?: string;
  description?: string;
  className?: string;
}

interface OTPStatus {
  exists: boolean;
  attempts?: number;
  maxAttempts?: number;
  attemptsRemaining?: number;
  timeRemaining?: number;
  resendAvailableIn?: number;
}

interface OTPAPIResponse {
  success?: boolean;
  error?: string;
  message?: string;
  expiresIn?: number;
  resendAvailableIn?: number;
  retryAfter?: number;
  attemptsRemaining?: number;
  codeLength?: number;
  status?: OTPStatus;
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function readResponse(response: Response): Promise<OTPAPIResponse> {
  try {
    return (await response.json()) as OTPAPIResponse;
  } catch {
    return {
      success: false,
      error: response.ok
        ? 'The server returned an invalid response.'
        : 'The request could not be completed.',
    };
  }
}

export function OTPVerification({
  onSuccess,
  onError,
  initialEmail = '',
  title = 'Email Verification',
  description = 'Enter your email to receive a verification code',
  className = '',
}: OTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'verify' | 'verified'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [codeLength, setCodeLength] = useState(6);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpStatus, setOtpStatus] = useState<OTPStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [resendRemaining, setResendRemaining] = useState(0);

  const reportError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      onError?.(errorMessage);
    },
    [onError]
  );

  const checkOTPStatus = useCallback(async () => {
    if (!email) {
      return;
    }

    try {
      const response = await fetch(
        `/api/otp/send?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      const data = await readResponse(response);

      if (response.ok && data.success && data.status) {
        setOtpStatus(data.status);
        setTimeRemaining(data.status.timeRemaining || 0);
        setResendRemaining(data.status.resendAvailableIn || 0);
        if (data.codeLength && data.codeLength >= 4 && data.codeLength <= 8) {
          setCodeLength(data.codeLength);
        }
      }
    } catch (statusError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unable to refresh OTP status:', statusError);
      }
    }
  }, [email]);

  useEffect(() => {
    if (step !== 'verify') {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeRemaining((current) => Math.max(0, current - 1));
      setResendRemaining((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'verify') {
      void checkOTPStatus();
    }
  }, [checkOTPStatus, step]);

  const sendOTP = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      reportError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await readResponse(response);

      if (response.ok && data.success) {
        setEmail(normalizedEmail);
        setMessage(data.message || 'Verification code sent.');
        setStep('verify');
        setOtp('');
        setTimeRemaining(data.expiresIn || 0);
        setResendRemaining(data.resendAvailableIn || 0);
        if (data.codeLength && data.codeLength >= 4 && data.codeLength <= 8) {
          setCodeLength(data.codeLength);
        }
      } else {
        setResendRemaining(data.retryAfter || 0);
        reportError(data.error || 'Failed to send the verification code.');
      }
    } catch {
      reportError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (event: FormEvent) => {
    event.preventDefault();

    if (!new RegExp(`^\\d{${codeLength}}$`).test(otp)) {
      reportError(`Please enter the complete ${codeLength}-digit code.`);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await readResponse(response);

      if (response.ok && data.success) {
        setMessage(data.message || 'Email verified successfully.');
        setStep('verified');
        onSuccess?.(email);
      } else {
        const attempts =
          typeof data.attemptsRemaining === 'number'
            ? ` ${data.attemptsRemaining} attempt${
                data.attemptsRemaining === 1 ? '' : 's'
              } remaining.`
            : '';
        reportError(
          `${data.error || 'The verification code is invalid.'}${attempts}`
        );
        await checkOTPStatus();
      }
    } catch {
      reportError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendRemaining > 0) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(response);

      if (response.ok && data.success) {
        setMessage(data.message || 'A new verification code was sent.');
        setOtp('');
        setOtpStatus(null);
        setTimeRemaining(data.expiresIn || 0);
        setResendRemaining(data.resendAvailableIn || 0);
        if (data.codeLength && data.codeLength >= 4 && data.codeLength <= 8) {
          setCodeLength(data.codeLength);
        }
      } else {
        setResendRemaining(data.retryAfter || 0);
        reportError(data.error || 'Failed to resend the verification code.');
      }
    } catch {
      reportError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('email');
    setOtp('');
    setError('');
    setMessage('');
    setOtpStatus(null);
    setTimeRemaining(0);
    setResendRemaining(0);
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {step === 'verified' ? (
            <CheckCircle2 className="size-5" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-5" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-1">
          <CardTitle>{step === 'verified' ? 'Email verified' : title}</CardTitle>
          <CardDescription>
            {step === 'email'
              ? description
              : step === 'verify'
                ? `Enter the ${codeLength}-digit code sent to ${email}`
                : `${email} has been verified successfully.`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'email' && (
          <form className="space-y-4" onSubmit={sendOTP}>
            <div className="space-y-2">
              <Label htmlFor="otp-email">Email address</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="otp-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading || !email.trim()} className="w-full">
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loading ? 'Sending…' : 'Send verification code'}
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <form className="space-y-4" onSubmit={verifyOTP}>
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification code</Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={`[0-9]{${codeLength}}`}
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value.replace(/\D/g, '').slice(0, codeLength)
                  )
                }
                placeholder={'0'.repeat(codeLength)}
                maxLength={codeLength}
                disabled={loading}
                className="h-12 text-center text-xl tracking-[0.35em]"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {timeRemaining > 0
                  ? `Expires in ${formatTime(timeRemaining)}`
                  : 'Code expired'}
              </span>
              {otpStatus?.attempts !== undefined &&
                otpStatus.maxAttempts !== undefined && (
                  <span>
                    {otpStatus.attempts}/{otpStatus.maxAttempts} attempts used
                  </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={loading}
              >
                Change email
              </Button>
              <Button
                type="submit"
                disabled={loading || otp.length !== codeLength || timeRemaining <= 0}
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? 'Verifying…' : 'Verify code'}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resendOTP}
              disabled={resendRemaining > 0 || loading}
              className="w-full"
            >
              <RefreshCw className="mr-2 size-3.5" aria-hidden="true" />
              {resendRemaining > 0
                ? `Resend in ${formatTime(resendRemaining)}`
                : 'Send a new code'}
            </Button>
          </form>
        )}

        {step === 'verified' && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            Verification is complete. You can safely continue.
          </div>
        )}

        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          {message && step !== 'verified' && (
            <Alert>
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                {message}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

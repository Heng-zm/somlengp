'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Clock, RefreshCw } from 'lucide-react';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

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
  expires?: string;
  attempts?: number;
  maxAttempts?: number;
  timeRemaining?: number;
}

export function OTPVerification({
  onSuccess,
  onError,
  initialEmail = '',
  title = 'Email Verification',
  description = 'Enter your email to receive a verification code',
  className = '',
}: OTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpStatus, setOtpStatus] = useState<OTPStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check OTP status
  const checkOTPStatus = useCallback(async () => {
    if (!email) return;
    
    try {
      const response = await fetch(`/api/otp/send?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success && data.status) {
        setOtpStatus(data.status);
        if (data.status.timeRemaining) {
          setTimeRemaining(data.status.timeRemaining);
          setCanResend(false);
        } else {
          setCanResend(true);
        }
      }
    } catch (error) {
      console.error('Failed to check OTP status:', error);
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Check status when step changes to verify
  useEffect(() => {
    if (step === 'verify') {
      checkOTPStatus();
    }
  }, [step, checkOTPStatus]);

  const sendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Verification code sent successfully!');
        setStep('verify');
        setCanResend(false);
        setTimeRemaining(300); // 5 minutes
        await checkOTPStatus();
      } else {
        setError(data.error || 'Failed to send verification code');
        onError?.(data.error || 'Failed to send verification code');
      }
    } catch {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Email verified successfully!');
        onSuccess?.(email);
      } else {
        setError(data.error || 'Invalid verification code');
        onError?.(data.error || 'Invalid verification code');
        
        if (data.attemptsRemaining !== undefined) {
          setError(`${data.error} (${data.attemptsRemaining} attempts remaining)`);
        }
      }
    } catch {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('New verification code sent!');
        setCanResend(false);
        setTimeRemaining(300); // 5 minutes
        setOtp(''); // Clear the input
        await checkOTPStatus();
      } else {
        setError(data.error || 'Failed to resend verification code');
      }
    } catch {
      setError('Network error. Please try again.');
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
    setCanResend(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {step === 'email' ? description : `Enter the 6-digit code sent to ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'email' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
            <Button
              onClick={sendOTP}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={loading}
                className="text-center text-lg tracking-wider"
              />
            </div>

            {/* Timer */}
            {timeRemaining > 0 && (
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Clock className="mr-1 h-4 w-4" />
                Code expires in {formatTime(timeRemaining)}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={verifyOTP}
                disabled={loading || !otp || otp.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>

            {/* Resend button */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={resendOTP}
                disabled={!canResend || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    {canResend ? 'Resend Code' : 'Resend available soon'}
                  </>
                )}
              </Button>
            </div>

            {/* Status info */}
            {otpStatus && (
              <div className="text-xs text-gray-500 text-center">
                {otpStatus.attempts !== undefined && otpStatus.maxAttempts && (
                  <p>
                    Verification attempts: {otpStatus.attempts}/{otpStatus.maxAttempts}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <Alert>
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

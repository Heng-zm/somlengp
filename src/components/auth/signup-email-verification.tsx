'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Clock, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignupEmailVerificationProps {
  email: string;
  firstName: string;
  lastName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  className?: string;
}

interface VerificationStatus {
  exists: boolean;
  expires?: string;
  attempts?: number;
  maxAttempts?: number;
  verified?: boolean;
  timeRemaining?: number;
}

export function SignupEmailVerification({
  email,
  firstName,
  lastName,
  onSuccess,
  onError,
  onBack,
  className = '',
}: SignupEmailVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!email) return;
    
    try {
      const response = await fetch(`/api/signup-verification/send?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success && data.status) {
        setVerificationStatus(data.status);
        if (data.status.timeRemaining && data.status.timeRemaining > 0) {
          setTimeRemaining(data.status.timeRemaining);
          setCanResend(false);
        } else {
          setCanResend(true);
        }
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
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

  // Check status when component mounts
  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/signup-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Email verified and account created successfully!');
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError(data.error || 'Invalid verification code');
        onError?.(data.error || 'Invalid verification code');
        
        if (data.attemptsRemaining !== undefined) {
          setError(`${data.error} (${data.attemptsRemaining} attempts remaining)`);
        }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/signup-verification/resend', {
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
        setTimeRemaining(600); // 10 minutes
        setCode(''); // Clear the input
        await checkVerificationStatus();
      } else {
        setError(data.error || 'Failed to resend verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    
    // Clear error when user starts typing
    if (error && numericValue.length > 0) {
      setError('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      verifyCode();
    }
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center space-y-4">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
          <Mail className="w-8 h-8 text-white" />
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            We've sent a verification code to
            <br />
            <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
          </CardDescription>
        </div>

        {/* Welcome message */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Welcome, <span className="font-medium">{firstName}</span>! 
            Please enter the 6-digit code to complete your account creation.
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Code Input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              className={cn(
                "text-center text-2xl font-mono tracking-[0.5em] h-14",
                "border-2 focus:ring-2 transition-all duration-200",
                error 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20",
                code.length === 6 && !error && "border-green-500"
              )}
            />
            {code.length === 6 && !error && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center space-x-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-200",
                  i < code.length 
                    ? "bg-blue-500" 
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        {timeRemaining > 0 && (
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="mr-1 h-4 w-4" />
            Code expires in {formatTime(timeRemaining)}
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={verifyCode}
          disabled={loading || code.length !== 6}
          className={cn(
            "w-full h-12 text-base font-medium",
            "bg-gradient-to-r from-blue-600 to-green-600",
            "hover:from-blue-700 hover:to-green-700",
            "shadow-lg hover:shadow-xl transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Account
            </>
          )}
        </Button>

        {/* Resend Section */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the code?
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resendCode}
            disabled={!canResend || loading}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                {canResend ? 'Send new code' : 'Send new code available soon'}
              </>
            )}
          </Button>
        </div>

        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to signup form
          </Button>
        )}

        {/* Status info */}
        {verificationStatus && (
          <div className="text-xs text-gray-500 text-center space-y-1">
            {verificationStatus.attempts !== undefined && verificationStatus.maxAttempts && (
              <p>
                Verification attempts: {verificationStatus.attempts}/{verificationStatus.maxAttempts}
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300 font-medium">
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

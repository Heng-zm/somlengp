'use client';

import { OTPVerification } from '@/components/otp/otp-verification';
import { useState, memo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const OTPTestPageComponent = function OTPTestPage() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleSuccess = (email: string) => {
    setVerifiedEmail(email);
    setLastError(null);
  };

  const handleError = (error: string) => {
    setLastError(error);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">OTP Verification Test</h1>
        <p className="text-gray-600 mb-4">
          Test the OTP email verification system
        </p>
        
        {/* Status indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {verifiedEmail ? (
            <Badge variant="default" className="bg-green-500">
              ✓ Verified: {verifiedEmail}
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Verified
            </Badge>
          )}
        </div>
      </div>

      {/* OTP Verification Component */}
      <OTPVerification
        onSuccess={handleSuccess}
        onError={handleError}
        title="Test OTP Verification"
        description="Enter your email to test the OTP system"
        className="mb-6"
      />

      {/* Success Message */}
      {verifiedEmail && (
        <Alert className="mb-4">
          <AlertDescription className="text-green-700">
            🎉 Successfully verified email: <strong>{verifiedEmail}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {lastError && !verifiedEmail && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            ❌ {lastError}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter your Gmail email address</li>
          <li>Click &ldquo;Send Verification Code&rdquo;</li>
          <li>Check your Gmail inbox for the OTP code</li>
          <li>Enter the 6-digit code to verify</li>
        </ol>
        
        <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-amber-800 font-medium mb-2">⚠️ Setup Required:</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Make sure you have configured the following environment variables:
            <br />
            • GMAIL_CLIENT_ID
            <br />
            • GMAIL_CLIENT_SECRET
            <br />
            • GMAIL_REFRESH_TOKEN
            <br />
            • GMAIL_USER_EMAIL
          </p>
        </div>
      </div>
    </div>
  );
}


export default memo(OTPTestPageComponent);
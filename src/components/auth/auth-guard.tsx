"use client";

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, signInWithGoogle } = useAuth();

  // Google Icon Component
  const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Authenticating</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we verify your session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[500px] p-4">
        <Card className="w-full max-w-lg border-0 shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-900/80">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-purple-950/20 rounded-lg" />
          
          <div className="relative">
            <CardHeader className="text-center space-y-6 pt-8">
              {/* Security shield icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Secure Access Required
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                  Sign in with your Google account to access premium features securely.
                </CardDescription>
              </div>
              
              {/* Security features */}
              <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Private</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-8">
              <div className="space-y-4">
                {/* Primary Google Sign-in Button */}
                <Button 
                  onClick={() => signInWithGoogle()}
                  className={cn(
                    "w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
                    "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                    "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                  )}
                >
                  <GoogleIcon />
                  <span className="ml-3 text-base font-medium">Continue with Google</span>
                </Button>
                
                {/* Security note */}
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Your data is protected</p>
                    <p>We use industry-standard encryption and never store your Google password.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

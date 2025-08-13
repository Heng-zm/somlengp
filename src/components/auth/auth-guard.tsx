"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Lock, CheckCircle, Mail, Eye, EyeOff, LogIn, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, [form]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      
      // Store email in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      form.reset();
    } catch (error) {
      console.error("Login error:", error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      return;
    }
    
    try {
      await resetPassword(resetEmail);
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      // Error handling is done in the auth context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

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
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
                    "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                    "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                  )}
                >
                  <GoogleIcon />
                  <span className="ml-3 text-base font-medium">Continue with Google</span>
                </Button>

                {/* OR Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400 font-medium">
                      Or sign in with email
                    </span>
                  </div>
                </div>

                {/* Toggle to show email form */}
                {!showEmailForm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailForm(true)}
                    className="w-full h-12 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Sign in with Email & Password
                  </Button>
                ) : (
                  /* Email/Password Form */
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className={cn(
                                  "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                                  fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"
                                )} />
                                <Input
                                  placeholder="your.email@example.com"
                                  className={cn(
                                    "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                                    "focus:border-blue-500 focus:ring-blue-500/20 focus:ring-2",
                                    "transition-all duration-200",
                                    fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  )}
                                  type="email"
                                  autoComplete="email"
                                  {...field}
                                />
                                {!fieldState.error && field.value && field.value.includes('@') && (
                                  <CheckCircle2 className="absolute right-3 top-3.5 h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className={cn(
                                  "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                                  fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"
                                )} />
                                <Input
                                  placeholder="Enter your password"
                                  className={cn(
                                    "pl-10 pr-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                                    "focus:border-blue-500 focus:ring-blue-500/20 focus:ring-2",
                                    "transition-all duration-200",
                                    fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  )}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                  {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="remember-me"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(!!checked)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <Label 
                            htmlFor="remember-me" 
                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
                          >
                            Keep me signed in
                          </Label>
                        </div>
                        
                        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="link" 
                              className="px-0 font-medium text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              type="button"
                            >
                              Forgot password?
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-3 text-lg">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                Reset Password
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                                Enter your email address and we&apos;ll send you a secure link to reset your password.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="your.email@example.com"
                                  className="pl-10 h-12"
                                  type="email"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && resetEmail && resetEmail.includes('@')) {
                                      handlePasswordReset();
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handlePasswordReset}
                                disabled={!resetEmail || !resetEmail.includes('@')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Send Reset Link
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                          "w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600",
                          "hover:from-blue-700 hover:to-purple-700",
                          "text-white font-medium shadow-lg hover:shadow-xl",
                          "transition-all duration-300 hover:scale-[1.02]",
                          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        )}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                          </>
                        )}
                      </Button>

                      {/* Back to Google option */}
                      <Button
                        variant="ghost"
                        onClick={() => setShowEmailForm(false)}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        type="button"
                      >
                        ← Back to Google Sign-in
                      </Button>
                    </form>
                  </Form>
                )}
                
                {/* Security note */}
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Your data is protected</p>
                    <p>We use industry-standard encryption and never store your passwords.</p>
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

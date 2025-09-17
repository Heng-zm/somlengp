"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { BackIconButton } from "@/components/ui/back-button";
// Performance optimization needed: Consider memoizing inline styles, inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


// Google Icon Component
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
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

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
      
      // Redirect to home page after successful login
      router.push('/home');
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
      router.push('/home');
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, [form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-black dark:via-gray-900 dark:to-gray-800">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <BackIconButton 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg" 
        />
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-gray-300/10 to-gray-400/10 dark:from-gray-600/10 dark:to-gray-700/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-br from-gray-400/10 to-gray-500/10 dark:from-gray-700/10 dark:to-gray-800/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-grid-gray-100 dark:bg-grid-gray-800 opacity-30" />
      </div>

      {/* Main container */}
      <div className="relative min-h-screen flex items-center justify-center p-4 animate-fade-in-scale">
        <div className="w-full max-w-md">

          {/* Login card */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 will-change-transform">
            {/* Header */}
            <div className="text-center mb-8 login-field-group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-800 to-black dark:from-gray-200 dark:to-white rounded-2xl flex items-center justify-center mb-6 shadow-lg hover-scale">
                <LogIn className="h-8 w-8 text-white dark:text-gray-800 icon-spin-on-hover" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to continue your journey
              </p>
            </div>

            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 mb-6 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 login-field-group animate-slide-in-right hover-lift btn-press-feedback"
              style={{animationDelay: '0.2s'}}
            >
              <GoogleIcon />
              <span className="ml-3 font-medium text-gray-700 dark:text-gray-300">
                Continue with Google
              </span>
            </Button>

            {/* Divider */}
            <div className="relative my-6 login-field-group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="login-field-group animate-slide-in-right" style={{animationDelay: '0.4s'}}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 icon-bounce-on-hover" />
                            <Input
                              {...field}
                              type="email"
                              autoComplete="email"
                              placeholder="Enter your email"
                className={cn(
                  "pl-10 h-11 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg",
                  "focus:border-gray-600 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-500/20 transition-all focus-ring-animated hover-lift",
                  "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  fieldState.error && "border-red-400 focus:border-red-400 focus:ring-red-400/20 error-shake"
                )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Field */}
                <div className="login-field-group animate-slide-in-right" style={{animationDelay: '0.5s'}}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 icon-bounce-on-hover" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                className={cn(
                  "pl-10 pr-10 h-11 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg",
                  "focus:border-gray-600 dark:focus:border-gray-400 focus:ring-2 focus:ring-gray-500/20 transition-all focus-ring-animated hover-lift",
                  "text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
                  fieldState.error && "border-red-400 focus:border-red-400 focus:ring-red-400/20 error-shake"
                )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover-scale"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 icon-spin-on-hover" />
                              ) : (
                                <Eye className="h-4 w-4 icon-spin-on-hover" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex items-center justify-between login-field-group animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                  <div className="flex items-center">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 hover-scale transition-transform"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="link" className="px-0 text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium hover-lift transition-all">
                        Forgot password?
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in-scale rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white">Reset Password</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                          Enter your email address and we&apos;ll send you a link to reset your password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus-ring-animated hover-lift transition-all"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="hover-lift btn-press-feedback transition-all">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handlePasswordReset}
                          className="bg-gray-800 hover:bg-black dark:bg-gray-200 dark:hover:bg-white text-white dark:text-gray-800 hover-lift btn-press-feedback transition-all"
                        >
                          Send Reset Link
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Submit Button */}
                <div className="login-field-group animate-slide-in-bottom" style={{animationDelay: '0.7s'}}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 dark:from-gray-200 dark:to-white dark:hover:from-gray-100 dark:hover:to-gray-200 text-white dark:text-gray-800 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover-lift btn-press-feedback will-change-transform"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Sign up link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 login-field-group animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                New to our platform?{' '}
                <Link
                  href="/signup"
                  className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white font-medium transition-colors duration-200 hover-lift"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

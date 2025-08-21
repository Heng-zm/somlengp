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
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-emerald-950 dark:to-blue-950">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-orb absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-full blur-xl" />
        <div className="bg-orb absolute top-1/3 -left-20 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-2xl" />
        <div className="bg-orb absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-400/25 to-cyan-500/25 rounded-full blur-xl" />
        <div className="bg-orb absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-500/15 rounded-full blur-3xl" />
      </div>

      {/* Main content container */}
      <div className="login-container flex items-center justify-center">
        <div className="login-card">
          {/* Back Navigation */}
          <div className="flex justify-start animate-slide-in-top">
            <Link href="/home">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 dark:text-white/70 hover:text-gray-800 dark:hover:text-white hover:bg-white/10 border border-gray-300/20 dark:border-white/20 hover:border-gray-400/30 dark:hover:border-white/30 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Animated form container */}
          <div className="login-form-container glass-card p-6 sm:p-8 lg:p-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/50 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8 login-field-group">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-rotate-in">
                <LogIn className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in-scale">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-white/70 text-lg animate-slide-in-bottom animate-stagger-1">
                Sign in to continue your journey
              </p>
            </div>

            {/* Google Sign In */}
            <div className="mb-6 login-field-group">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium btn-press-feedback"
              >
                <GoogleIcon />
                <span className="ml-3">Continue with Google</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6 login-field-group">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-white/70">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div className="login-field-group">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-white font-medium text-sm">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white/50" />
                            <Input
                              {...field}
                              type="email"
                              autoComplete="email"
                              placeholder="Enter your email"
                              className={cn(
                                "pl-12 h-12 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50",
                                "focus:bg-white dark:focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50",
                                "backdrop-blur-sm transition-all duration-300",
                                fieldState.error && "border-red-400 focus:border-red-400 focus:ring-red-400/50"
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Field */}
                <div className="login-field-group">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-white font-medium text-sm">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white/50" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              className={cn(
                                "pl-12 pr-12 h-12 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50",
                                "focus:bg-white dark:focus:bg-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50",
                                "backdrop-blur-sm transition-all duration-300",
                                fieldState.error && "border-red-400 focus:border-red-400 focus:ring-red-400/50"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-colors duration-200"
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex items-center justify-between login-field-group">
                  <div className="flex items-center">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-white/30 bg-white dark:bg-white/10 text-emerald-600 focus:ring-emerald-400"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600 dark:text-white/70">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" className="px-0 text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm">
                          Forgot password?
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-white/20 dark:border-gray-700/50">
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
                            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handlePasswordReset}
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                          >
                            Send Reset Link
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="login-field-group">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none btn-press-feedback"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Sign up link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-white/10 login-field-group">
              <p className="text-gray-600 dark:text-white/70 text-sm">
                New to our platform?{' '}
                <Link
                  href="/signup"
                  className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
    </div>
  );
}

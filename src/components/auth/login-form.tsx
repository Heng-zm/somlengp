"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle2 } from "lucide-react";
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


// Google Icon Component - memoized for performance
const GoogleIcon = memo(() => (
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
));
GoogleIcon.displayName = 'GoogleIcon';

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

type LoginFormProps = Record<string, never>;

export const LoginForm = memo(function LoginForm({}: LoginFormProps) {
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDrawerOpen, setIsResetDrawerOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      
      // Store email in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Login error:", error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  }, [signInWithEmail, rememberMe, form]);

  const handlePasswordReset = useCallback(async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      return;
    }
    
    try {
      await resetPassword(resetEmail);
      setIsResetDrawerOpen(false);
      setResetEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      // Error handling is done in the auth context
    }
  }, [resetPassword, resetEmail, setIsResetDrawerOpen, setResetEmail]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      setIsOpen(false);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  }, [signInWithGoogle]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "relative overflow-hidden backdrop-blur-sm bg-white/70 hover:bg-white/90",
            "border border-white/30 shadow-lg hover:shadow-xl",
            "transition-all duration-500 hover:scale-[1.02] hover:border-blue-300/50",
            "dark:bg-gray-900/70 dark:hover:bg-gray-900/90 dark:border-white/10 dark:hover:border-blue-400/50",
            "h-8 px-3 text-xs sm:h-10 sm:px-5 sm:text-sm w-full sm:w-auto group",
            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-purple-500/10",
            "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500"
          )}
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-1.5 mr-3 shadow-md group-hover:shadow-lg transition-all duration-500 group-hover:from-blue-400 group-hover:to-purple-500">
            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
          </div>
          <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-500 relative z-10">Login</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-l border-white/20 dark:border-gray-700/50">
        <SheetHeader className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
          <div className="relative mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-800 to-black dark:from-gray-200 dark:to-white rounded-full flex items-center justify-center shadow-2xl ring-2 sm:ring-4 ring-white/50 dark:ring-gray-800/50">
              <LogIn className="w-7 h-7 sm:w-9 sm:h-9 text-white dark:text-gray-800 drop-shadow-lg" />
            </div>
          </div>
          
          <div className="space-y-2">
            <SheetTitle className="login-title text-center text-gray-900 dark:text-white">
              Welcome Back
            </SheetTitle>
            
            <SheetDescription className="login-subtitle text-center leading-relaxed px-2">
              Sign in to your account to continue your journey
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="mt-10 space-y-8 px-1">
          {/* Quick Social Login Section */}
          <div className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={cn(
                "group relative w-full h-14 bg-white hover:bg-gray-50 text-gray-900",
                "border border-gray-200 hover:border-gray-300 rounded-xl",
                "shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]",
                "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
                "focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:outline-none",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/5 before:to-purple-500/5",
                "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:rounded-xl"
              )}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="p-1 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <GoogleIcon />
                </div>
                <span className="font-semibold text-base">Continue with Google</span>
              </div>
            </Button>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-900 px-6 text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300",
                          fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 group-focus-within:scale-110"
                        )} />
                        <Input
                          placeholder="your.email@example.com"
                          className={cn(
                            "login-input pl-12 pr-12 rounded-xl border-2 mobile-text",
                            "bg-gray-50/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800",
                            "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                            "focus:border-gray-600 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800 login-focus",
                            "focus:ring-4 focus:ring-gray-500/10 login-animation",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                            fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10"
                          )}
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                        {!fieldState.error && field.value && field.value.includes('@') && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in zoom-in-75 duration-200" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className={cn(
                          "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300",
                          fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 group-focus-within:scale-110"
                        )} />
                        <Input
                          placeholder="Enter your password"
                          className={cn(
                            "login-input pl-12 pr-12 rounded-xl border-2 mobile-text",
                            "bg-gray-50/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800",
                            "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                            "focus:border-gray-600 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800 login-focus",
                            "focus:ring-4 focus:ring-gray-500/10 login-animation",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                            fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10"
                          )}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110"
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-medium" />
                  </FormItem>
                )}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-3 group">
                  <Checkbox 
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className={cn(
                      "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500",
                      "data-[state=checked]:border-blue-500 border-2 rounded-md",
                      "transition-all duration-300 group-hover:scale-105"
                    )}
                  />
                  <Label 
                    htmlFor="remember-me" 
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300"
                  >
                    Keep me signed in
                  </Label>
                </div>
                
                <Sheet open={isResetDrawerOpen} onOpenChange={setIsResetDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="link" 
                      className="px-0 font-semibold text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-all duration-300 hover:scale-105"
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md rounded-xl">
                    <SheetHeader className="space-y-4 pb-6">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <SheetTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                        Reset Password
                      </SheetTitle>
                      <SheetDescription className="text-center text-gray-600 dark:text-gray-400">
                        Enter your email address and we&apos;ll send you a secure link to reset your password.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6 mt-6">
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors" />
                        <Input
                          placeholder="your.email@example.com"
                          className={cn(
                            "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                            "focus:border-gray-600 dark:focus:border-gray-400 focus:ring-gray-500/20 focus:ring-2",
                            "transition-all duration-200"
                          )}
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && resetEmail && resetEmail.includes('@')) {
                              handlePasswordReset();
                            }
                          }}
                          autoComplete="email"
                        />
                        {resetEmail && resetEmail.includes('@') && (
                          <CheckCircle2 className="absolute right-3 top-3.5 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      
                      <div className="space-y-3 pt-4">
                        <Button
                          onClick={handlePasswordReset}
                          disabled={!resetEmail || !resetEmail.includes('@')}
                          className={cn(
                            "w-full h-12 bg-gradient-to-r from-gray-800 to-black",
                            "hover:from-gray-900 hover:to-gray-800 dark:from-gray-200 dark:to-white dark:hover:from-gray-100 dark:hover:to-gray-200",
                            "text-white dark:text-gray-800 font-medium shadow-lg hover:shadow-xl",
                            "transition-all duration-300 hover:scale-[1.02]",
                            "focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                          )}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reset Link
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsResetDrawerOpen(false);
                            setResetEmail("");
                          }}
                          className="w-full h-12 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    
                    <SheetFooter className="mt-8">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mx-auto">
                        <Lock className="w-3 h-3" />
                        <span>Your email will be kept secure and private</span>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-5 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "group relative w-full h-14 overflow-hidden rounded-xl",
                    "bg-gradient-to-r from-gray-800 to-black",
                    "hover:from-gray-900 hover:to-gray-800 dark:from-gray-200 dark:to-white dark:hover:from-gray-100 dark:hover:to-gray-200",
                    "text-white dark:text-gray-800 font-semibold text-base shadow-2xl",
                    "transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]",
                    "focus:ring-4 focus:ring-gray-500/20 focus:outline-none",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-white/10 before:to-white/20",
                    "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                  )}
                >
                  <div className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                        <span className="animate-pulse">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        Sign In
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </Form>

        </div>

        <SheetFooter className="mt-8">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mx-auto">
            <Lock className="w-3 h-3" />
            <span>Your data is protected with industry-standard encryption</span>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

LoginForm.displayName = 'LoginForm';

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
  const router = useRouter();
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
      
      setIsOpen(false);
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
      setIsResetDrawerOpen(false);
      setResetEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      // Error handling is done in the auth context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setIsOpen(false);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100",
            "text-gray-700 border border-blue-200 shadow-sm",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-blue-300",
            "dark:from-blue-950/30 dark:to-purple-950/30 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40",
            "dark:bg-gray-900 dark:text-gray-200 dark:border-blue-600 dark:hover:bg-gray-800",
            "h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm w-full sm:w-auto group"
          )}
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-1 mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">Login</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          
          <SheetTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </SheetTitle>
          
          <SheetDescription className="text-center text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Quick Social Login Section */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={cn(
                "w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300",
                "shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]",
                "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
                "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
              <GoogleIcon />
              <span className="ml-3 font-medium">Continue with Google</span>
            </Button>
            
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
          </div>

          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                
                <Sheet open={isResetDrawerOpen} onOpenChange={setIsResetDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="link" 
                      className="px-0 font-medium text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      type="button"
                    >
                      Forgot password?
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader className="space-y-4 pb-6">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <SheetTitle className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        Reset Password
                      </SheetTitle>
                      <SheetDescription className="text-center text-gray-600 dark:text-gray-400">
                        Enter your email address and we&apos;ll send you a secure link to reset your password.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6 mt-6">
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                        <Input
                          placeholder="your.email@example.com"
                          className={cn(
                            "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                            "focus:border-red-500 focus:ring-red-500/20 focus:ring-2",
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
                            "w-full h-12 bg-gradient-to-r from-red-600 to-orange-600",
                            "hover:from-red-700 hover:to-orange-700",
                            "text-white font-medium shadow-lg hover:shadow-xl",
                            "transition-all duration-300 hover:scale-[1.02]",
                            "focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
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
              <div className="space-y-3 pt-4">
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
                
                {/* Switch to Sign Up */}
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{" "}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-semibold text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => {
                      setIsOpen(false);
                      if (onSwitchToSignup) {
                        onSwitchToSignup();
                      } else {
                        // Navigate to signup page if no callback is provided
                        router.push('/signup');
                      }
                    }}
                  >
                    Create account
                  </Button>
                </div>
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
}

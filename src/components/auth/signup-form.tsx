"use client";

import { useState } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Loader2, 
  CheckCircle2,
  User
} from "lucide-react";
import Link from "next/link";

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
const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms and conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  onError?: (error: Error | unknown) => void;
  className?: string;
  showGoogleButton?: boolean;
  showTitle?: boolean;
  compact?: boolean;
}

export function SignupForm({ 
  onSuccess, 
  onError, 
  className,
  showGoogleButton = true,
  showTitle = true,
  compact = false
}: SignupFormProps) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      onSuccess?.();
    } catch (error) {
      console.error("Signup error:", error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error("Google signup error:", error);
      onError?.(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {showTitle && (
        <div className="text-center space-y-2">
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 dark:ring-gray-800/50">
              <UserPlus className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Join us today and start your journey
          </p>
        </div>
      )}

      {showGoogleButton && (
        <>
          <Button
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className={cn(
              "w-full bg-white hover:bg-gray-50 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
              "border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
              "shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
              compact ? "h-10" : "h-12"
            )}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2 font-medium">Continue with Google</span>
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400 font-medium">
                Or sign up with email
              </span>
            </div>
          </div>
        </>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", compact && "space-y-3")}>
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="First name"
                        className={cn(
                          "pl-10 border-2 transition-colors",
                          "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                          "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                          "focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700",
                          fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
                          compact ? "h-9" : "h-10"
                        )}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="Last name"
                        className={cn(
                          "pl-10 border-2 transition-colors",
                          "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                          "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                          "focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700",
                          fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
                          compact ? "h-9" : "h-10"
                        )}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Email Field */}
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
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500"
                    )} />
                    <Input
                      placeholder="your.email@example.com"
                      className={cn(
                        "pl-10 pr-10 border-2 transition-colors",
                        "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                        "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                        "focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700",
                        fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
                        compact ? "h-9" : "h-10"
                      )}
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                    {!fieldState.error && field.value && field.value.includes('@') && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          {/* Password Field */}
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
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-500"
                    )} />
                    <Input
                      placeholder="Create a strong password"
                      className={cn(
                        "pl-10 pr-10 border-2 transition-colors",
                        "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                        "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                        "focus:border-purple-500 focus:bg-white dark:focus:bg-gray-700",
                        fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
                        compact ? "h-9" : "h-10"
                      )}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                      fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-500"
                    )} />
                    <Input
                      placeholder="Confirm your password"
                      className={cn(
                        "pl-10 pr-10 border-2 transition-colors",
                        "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                        "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                        "focus:border-purple-500 focus:bg-white dark:focus:bg-gray-700",
                        fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10",
                        compact ? "h-9" : "h-10"
                      )}
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-500" />
              </FormItem>
            )}
          />

          {/* Terms Agreement */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field, fieldState }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={cn(
                      "mt-0.5",
                      fieldState.error && "border-red-500"
                    )}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className={cn(
                    "text-xs font-medium cursor-pointer select-none leading-relaxed",
                    fieldState.error ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                  )}>
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage className="text-xs text-red-500" />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className={cn(
              "w-full bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600",
              "hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700",
              "text-white font-medium shadow-md hover:shadow-lg",
              "transition-all duration-300 hover:scale-[1.02]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
              compact ? "h-10" : "h-11"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

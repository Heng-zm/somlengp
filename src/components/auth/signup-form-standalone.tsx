"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, UserPlus, User } from "lucide-react";
import { z } from "zod";

// Zod schema for form validation
const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters") // Reduced from 8 to match Firebase requirement
    .max(128, "Password is too long"),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

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

interface SignupFormStandaloneProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupFormStandalone({ onSuccess, onSwitchToLogin }: SignupFormStandaloneProps) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      onSuccess?.();
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  }, [signInWithGoogle, onSuccess]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);


  return (
    <div className="space-y-6">
      {/* Animated header */}
      <div className="login-header text-center">
        <div className="login-field-group mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4 hover-scale will-change-transform">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="login-title login-field-group font-bold text-center bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Create Account
        </h2>
        
        <p className="login-subtitle login-field-group text-center mt-2">
          Join us today and get started in seconds
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="login-section space-y-4">
          {/* Name fields with staggered animation */}
          <div className="login-field-group grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="First name"
                        className={cn(
                          "login-input pl-10 border-gray-200 dark:border-gray-700",
                          "focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2",
                          "hover-lift transition-all duration-200",
                          fieldState.error && "error-state border-red-500 focus:border-red-500"
                        )}
                        autoComplete="given-name"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs animate-fade-in-scale" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="Last name"
                        className={cn(
                          "login-input pl-10 border-gray-200 dark:border-gray-700",
                          "focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2",
                          "hover-lift transition-all duration-200",
                          fieldState.error && "error-state border-red-500 focus:border-red-500"
                        )}
                        autoComplete="family-name"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs animate-fade-in-scale" />
                </FormItem>
              )}
            />
          </div>

          {/* Email field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem className="login-field-group">
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Mail className={cn(
                      "absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200",
                      fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                    )} />
                    <Input
                      placeholder="your.email@example.com"
                      className={cn(
                        "login-input pl-10 border-gray-200 dark:border-gray-700",
                        "focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2",
                        "hover-lift transition-all duration-200",
                        fieldState.error && "error-state border-red-500 focus:border-red-500"
                      )}
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs animate-fade-in-scale" />
              </FormItem>
            )}
          />

          {/* Password fields */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem className="login-field-group">
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className={cn(
                        "absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="Create a strong password"
                        className={cn(
                          "login-input pl-10 pr-10 border-gray-200 dark:border-gray-700",
                          "focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2",
                          "hover-lift transition-all duration-200",
                          fieldState.error && "error-state border-red-500 focus:border-red-500"
                        )}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 icon-spin-on-hover"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs animate-fade-in-scale" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem className="login-field-group">
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Lock className={cn(
                        "absolute left-3 top-3.5 h-4 w-4 transition-colors duration-200",
                        fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500"
                      )} />
                      <Input
                        placeholder="Confirm your password"
                        className={cn(
                          "login-input pl-10 pr-10 border-gray-200 dark:border-gray-700",
                          "focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-2",
                          "hover-lift transition-all duration-200",
                          fieldState.error && "error-state border-red-500 focus:border-red-500"
                        )}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={toggleShowConfirmPassword}
                        className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-200 icon-spin-on-hover"
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs animate-fade-in-scale" />
                </FormItem>
              )}
            />
          </div>

          {/* Terms checkbox */}
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field, fieldState }) => (
              <FormItem className="login-field-group">
                <div className="flex items-start space-x-3 pt-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className={cn(
                        "mt-0.5 rounded transition-colors duration-200",
                        "focus:ring-2 focus:ring-emerald-500/20",
                        fieldState.error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
                        field.value && "bg-emerald-600 border-emerald-600"
                      )}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none leading-5">
                    I agree to the{" "}
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline hover-lift"
                      type="button"
                    >
                      Terms of Service
                    </Button>
                    {" "}and{" "}
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline hover-lift"
                      type="button"
                    >
                      Privacy Policy
                    </Button>
                  </Label>
                </div>
                <FormMessage className="text-xs animate-fade-in-scale" />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <div className="login-field-group pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "login-button w-full bg-gradient-to-r from-emerald-600 to-blue-600",
                "hover:from-emerald-700 hover:to-blue-700",
                "text-white font-medium shadow-lg hover:shadow-xl",
                "btn-press-feedback hover-scale will-change-transform",
                "focus-ring-animated transition-all duration-300",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
                isLoading && "loading-state"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-bounce-dot w-4 h-4 bg-white rounded-full mr-2" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span>Create Account</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Divider with animation */}
      <div className="login-field-group relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-gray-500 dark:text-gray-400 font-medium">
            Or sign up with
          </span>
        </div>
      </div>

      {/* Google signup button */}
      <div className="login-field-group">
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className={cn(
            "w-full login-button bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm",
            "hover:shadow-md btn-press-feedback hover-scale will-change-transform",
            "focus-ring-animated transition-all duration-300",
            "dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          <GoogleIcon />
          <span className="ml-3 font-medium">Sign up with Google</span>
        </Button>
      </div>

      {/* Switch to login */}
      {onSwitchToLogin && (
        <div className="login-field-group text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
          </span>
          <Button
            variant="link"
            className="px-0 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover-lift"
            onClick={onSwitchToLogin}
          >
            Sign in instead
          </Button>
        </div>
      )}

      {/* Security notice */}
      <div className="login-field-group flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 justify-center">
        <Lock className="w-3 h-3" />
        <span>Your data is protected with industry-standard encryption</span>
      </div>
    </div>
  );
}

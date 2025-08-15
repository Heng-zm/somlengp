"use client";

import { useState, useCallback, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, UserPlus, User, CheckCircle2 } from "lucide-react";
import { z } from "zod";

// Zod schema for form validation
const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
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

interface SignupFormProps {
  onSwitchToLogin?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignupForm({ onSwitchToLogin, isOpen: externalIsOpen, onOpenChange }: SignupFormProps) {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const formDefaultValues = useMemo(() => ({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  }), []);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: formDefaultValues,
  });

  const onSubmit = useCallback(async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Sheet form: Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [signUpWithEmail, form, setIsOpen]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      setIsOpen(false);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  }, [signInWithGoogle, setIsOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="sm"
          className={cn(
            "relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600",
            "hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700",
            "text-white border-0 shadow-lg hover:shadow-xl",
            "transition-all duration-300 hover:scale-[1.02]",
            "h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm w-full sm:w-auto"
          )}
        >
          <div className="bg-white/20 rounded-full p-0.5 sm:p-1 mr-1 sm:mr-2">
            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <span className="font-medium">Create Account</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              
              <SheetTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Create Account
              </SheetTitle>
              
              <SheetDescription className="text-center text-gray-600 dark:text-gray-400">
                Join us today and get started in seconds
              </SheetDescription>
            </SheetHeader>

            <div className="mt-8 space-y-6">
              {/* Quick Social Signup Section */}
              <div className="space-y-4">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300",
                    "shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]",
                    "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
                    "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
                      Or create account with email
                    </span>
                  </div>
                </div>
              </div>
          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
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
                            "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-green-500"
                          )} />
                          <Input
                            placeholder="First name"
                            className={cn(
                              "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                              "focus:border-green-500 focus:ring-green-500/20 focus:ring-2",
                              "transition-all duration-200",
                              fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            )}
                            autoComplete="given-name"
                            {...field}
                          />
                          {!fieldState.error && field.value && field.value.length >= 2 && (
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
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className={cn(
                            "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-green-500"
                          )} />
                          <Input
                            placeholder="Last name"
                            className={cn(
                              "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                              "focus:border-green-500 focus:ring-green-500/20 focus:ring-2",
                              "transition-all duration-200",
                              fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            )}
                            autoComplete="family-name"
                            {...field}
                          />
                          {!fieldState.error && field.value && field.value.length >= 2 && (
                            <CheckCircle2 className="absolute right-3 top-3.5 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
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
                          "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                          fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-green-500"
                        )} />
                        <Input
                          placeholder="your.email@example.com"
                          className={cn(
                            "pl-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                            "focus:border-green-500 focus:ring-green-500/20 focus:ring-2",
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


              {/* Password Fields */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => {
                    const password = field.value;
                    const hasUppercase = /[A-Z]/.test(password);
                    const hasLowercase = /[a-z]/.test(password);
                    const hasNumber = /[0-9]/.test(password);
                    const hasSpecial = /[^A-Za-z0-9]/.test(password);
                    const hasLength = password && password.length >= 8;
                    
                    return (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className={cn(
                              "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                              fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-green-500"
                            )} />
                            <Input
                              placeholder="Create a strong password"
                              className={cn(
                                "pl-10 pr-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                                "focus:border-green-500 focus:ring-green-500/20 focus:ring-2",
                                "transition-all duration-200",
                                fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                              )}
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
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
                        {password && (
                          <div className="mt-2 space-y-1">
                            <div className="flex flex-wrap gap-1 text-xs">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                hasLength ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                8+ chars
                              </span>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                hasUppercase ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                A-Z
                              </span>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                hasLowercase ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                a-z
                              </span>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                hasNumber ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                0-9
                              </span>
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                hasSpecial ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                !@#
                              </span>
                            </div>
                          </div>
                        )}
                        <FormMessage className="text-xs" />
                      </FormItem>
                    );
                  }}
                />

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
                            "absolute left-3 top-3.5 h-4 w-4 transition-colors",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-green-500"
                          )} />
                          <Input
                            placeholder="Confirm your password"
                            className={cn(
                              "pl-10 pr-10 h-12 text-sm border-gray-200 dark:border-gray-700",
                              "focus:border-green-500 focus:ring-green-500/20 focus:ring-2",
                              "transition-all duration-200",
                              fieldState.error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            )}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                          </button>
                          {!fieldState.error && field.value && form.getValues('password') === field.value && (
                            <CheckCircle2 className="absolute right-10 top-3.5 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox 
                  id="terms-agreement"
                  required
                  className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <Label 
                  htmlFor="terms-agreement"
                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none leading-5"
                >
                  I agree to the{" "}
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
                    type="button"
                  >
                    Terms of Service
                  </Button>
                  {" "}and{" "}
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
                    type="button"
                  >
                    Privacy Policy
                  </Button>
                </Label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 bg-gradient-to-r from-green-600 to-blue-600",
                    "hover:from-green-700 hover:to-blue-700",
                    "text-white font-medium shadow-lg hover:shadow-xl",
                    "transition-all duration-300 hover:scale-[1.02]",
                    "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
              
              {/* Switch to Login */}
              <div className="text-center pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 font-semibold text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => {
                    setIsOpen(false);
                    onSwitchToLogin?.();
                  }}
                >
                  Sign in instead
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
}

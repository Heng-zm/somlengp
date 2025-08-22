"use client";

import { useState } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

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
      router.push('/'); // Redirect to home page after successful signup
    } catch (error) {
      console.error("Signup error:", error);
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/'); // Redirect to home page after successful signup
    } catch (error) {
      console.error("Google signup error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4 animate-gradient-x">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-emerald-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}} />
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-md animate-fade-in-scale">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl card-hover-float will-change-transform">
          <CardHeader className="space-y-4 text-center pb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl ring-2 sm:ring-4 ring-white/50 dark:ring-gray-800/50 animate-glow hover-scale">
                <UserPlus className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-lg icon-bounce-on-hover" />
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Join us today and start your journey
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 animate-slide-in-bottom" style={{animationDelay: '0.2s'}}>
            {/* Google Sign Up Button */}
            <div className="animate-slide-in-right" style={{animationDelay: '0.3s'}}>
              <Button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
              className={cn(
                "w-full h-12 bg-white hover:bg-gray-50 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
                "border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover-lift btn-press-feedback",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 will-change-transform"
              )}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2 font-semibold">Continue with Google</span>
              </Button>
            </div>
            
            <div className="relative animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400 font-medium">
                  Or sign up with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4 animate-slide-in-right" style={{animationDelay: '0.5s'}}>
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          First Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className={cn(
                              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 icon-bounce-on-hover",
                              fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500 group-focus-within:scale-110"
                            )} />
                            <Input
                              placeholder="First name"
                              className={cn(
                                "pl-10 h-11 rounded-lg border-2 transition-all duration-300",
                                "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                                "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                                "focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 focus-ring-animated hover-lift",
                                "focus:ring-4 focus:ring-emerald-500/10",
                                fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10 error-shake"
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
                        <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className={cn(
                              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 icon-bounce-on-hover",
                              fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-emerald-500 group-focus-within:scale-110"
                            )} />
                            <Input
                              placeholder="Last name"
                              className={cn(
                                "pl-10 h-11 rounded-lg border-2 transition-all duration-300",
                                "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                                "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                                "focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 focus-ring-animated hover-lift",
                                "focus:ring-4 focus:ring-emerald-500/10",
                                fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10 error-shake"
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
                <div className="animate-slide-in-right" style={{animationDelay: '0.6s'}}>
                  <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 icon-bounce-on-hover",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-500 group-focus-within:scale-110"
                          )} />
                          <Input
                            placeholder="your.email@example.com"
                            className={cn(
                              "pl-10 pr-10 h-11 rounded-lg border-2 transition-all duration-300",
                              "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                              "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                              "focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 focus-ring-animated hover-lift",
                              "focus:ring-4 focus:ring-blue-500/10",
                              fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10 error-shake"
                            )}
                            type="email"
                            autoComplete="email"
                            {...field}
                          />
                          {!fieldState.error && field.value && field.value.includes('@') && (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 animate-fade-in-scale success-checkmark" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                    )}
                  />
                </div>

                {/* Password Field */}
                <div className="animate-slide-in-right" style={{animationDelay: '0.7s'}}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300 icon-bounce-on-hover",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-500 group-focus-within:scale-110"
                          )} />
                          <Input
                            placeholder="Create a strong password"
                            className={cn(
                              "pl-10 pr-10 h-11 rounded-lg border-2 transition-all duration-300",
                              "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                              "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                              "focus:border-purple-500 focus:bg-white dark:focus:bg-gray-700 focus-ring-animated hover-lift",
                              "focus:ring-4 focus:ring-purple-500/10",
                              fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10 error-shake"
                            )}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover-scale"
                          >
                            {showPassword ? <EyeOff className="icon-spin-on-hover" /> : <Eye className="icon-spin-on-hover" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                    )}
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="animate-slide-in-right" style={{animationDelay: '0.8s'}}>
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-300",
                            fieldState.error ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-500"
                          )} />
                          <Input
                            placeholder="Confirm your password"
                            className={cn(
                              "pl-10 pr-10 h-11 rounded-lg border-2",
                              "bg-gray-50/50 hover:bg-white dark:bg-gray-700/50 dark:hover:bg-gray-700",
                              "border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500",
                              "focus:border-purple-500 focus:bg-white dark:focus:bg-gray-700",
                              "focus:ring-4 focus:ring-purple-500/10",
                              fieldState.error && "border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10"
                            )}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover-scale"
                          >
                            {showConfirmPassword ? <EyeOff className="icon-spin-on-hover" /> : <Eye className="icon-spin-on-hover" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                </div>

                {/* Terms Agreement */}
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
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
                          "text-sm font-medium cursor-pointer select-none",
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
                    "w-full h-12 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600",
                    "hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700",
                    "text-white font-semibold shadow-lg hover:shadow-xl",
                    "transition-all duration-300 hover:scale-[1.02]",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          </CardContent>

          <CardFooter className="pt-6">
            <div className="w-full text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

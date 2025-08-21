"use client";

import { SignupFormStandalone } from "@/components/auth/signup-form-standalone";
import { AuthProvider } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  
  const handleSignupSuccess = () => {
    // Redirect to home or dashboard after successful signup
    router.push("/home");
  };
  
  const handleSwitchToLogin = () => {
    // Navigate to login page
    router.push("/login");
  };
  
  return (
    <AuthProvider>
      {/* Background with animated gradient */}
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
            {/* Animated form container */}
            <div className="login-form-container glass-card p-6 sm:p-8 lg:p-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-700/50 shadow-2xl">
              <SignupFormStandalone 
                onSuccess={handleSignupSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            </div>
          </div>
        </div>

        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>
    </AuthProvider>
  );
}

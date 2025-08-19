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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Use the standalone signup form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <SignupFormStandalone 
              onSuccess={handleSignupSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

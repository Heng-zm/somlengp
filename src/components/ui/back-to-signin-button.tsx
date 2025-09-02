"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToSignInButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  customText?: string;
}

export function BackToSignInButton({
  className,
  variant = "outline",
  size = "default",
  showText = true,
  customText = "Back to Sign In"
}: BackToSignInButtonProps) {
  const router = useRouter();

  const handleBackToSignIn = () => {
    router.push("/login");
  };

  return (
    <Button
      onClick={handleBackToSignIn}
      variant={variant}
      size={size}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <ArrowLeft className={cn(
          "transition-all duration-300 group-hover:-translate-x-0.5",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
        )} />
        {showText && (
          <span className="font-medium">{customText}</span>
        )}
        <LogIn className={cn(
          "transition-all duration-300 group-hover:scale-110",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
        )} />
      </div>
    </Button>
  );
}

// Alternative compact version - icon only
export function BackToSignInIconButton({
  className,
  size = "default"
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const router = useRouter();

  const handleBackToSignIn = () => {
    router.push("/login");
  };

  return (
    <Button
      onClick={handleBackToSignIn}
      variant="outline"
      size="icon"
      className={cn(
        "group relative overflow-hidden rounded-full",
        "bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800",
        "border border-white/30 hover:border-blue-300/50 dark:border-gray-700/50 dark:hover:border-blue-400/50",
        "shadow-lg hover:shadow-xl backdrop-blur-sm",
        "transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
        "focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10",
        className
      )}
      title="Back to Sign In"
    >
      <ArrowLeft className={cn(
        "transition-all duration-300 group-hover:-translate-x-0.5 group-hover:scale-110",
        size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
      )} />
    </Button>
  );
}

// Floating action button style
export function FloatingBackToSignInButton({
  className,
  position = "top-left"
}: {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const router = useRouter();

  const handleBackToSignIn = () => {
    router.push("/login");
  };

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4", 
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4"
  };

  return (
    <Button
      onClick={handleBackToSignIn}
      className={cn(
        "fixed z-50 h-12 w-12 rounded-full shadow-2xl",
        "bg-gradient-to-br from-blue-500 to-purple-600",
        "hover:from-blue-600 hover:to-purple-700",
        "text-white border-0",
        "transition-all duration-300 hover:scale-[1.1] active:scale-[0.9]",
        "focus:ring-4 focus:ring-blue-500/30 focus:outline-none",
        "backdrop-blur-sm",
        "group animate-fade-in-scale",
        positionClasses[position],
        className
      )}
      title="Back to Sign In"
    >
      <ArrowLeft className="h-5 w-5 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:scale-110" />
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  customText?: string;
  href?: string;
}

export function BackButton({
  className,
  variant = "ghost",
  size = "default",
  showText = true,
  customText = "Back",
  href = "/home"
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  return (
    <Button
      onClick={handleBack}
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
      </div>
    </Button>
  );
}

// Icon-only version
export function BackIconButton({
  className,
  size = "default",
  href = "/home"
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
  href?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="icon"
      className={cn(
        "group relative overflow-hidden rounded-full",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
        "focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10",
        className
      )}
      title="Go back"
    >
      <ArrowLeft className={cn(
        "transition-all duration-300 group-hover:-translate-x-0.5 group-hover:scale-110",
        size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
      )} />
    </Button>
  );
}

// Floating action button style
export function FloatingBackButton({
  className,
  position = "top-left",
  href = "/home"
}: {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  href?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4", 
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4"
  };

  return (
    <Button
      onClick={handleBack}
      className={cn(
        "fixed z-50 h-12 w-12 rounded-full shadow-2xl",
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
        "hover:bg-white dark:hover:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "text-gray-700 dark:text-gray-300",
        "transition-all duration-300 hover:scale-[1.1] active:scale-[0.9]",
        "focus:ring-4 focus:ring-blue-500/30 focus:outline-none",
        "group animate-fade-in-scale",
        positionClasses[position],
        className
      )}
      title="Go back"
    >
      <ArrowLeft className="h-5 w-5 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:scale-110" />
    </Button>
  );
}

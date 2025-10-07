"use client";

import { cn } from "@/lib/utils";
import { Loader2, Brain, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface EnhancedLoadingProps {
  variant?: "default" | "ai" | "processing" | "minimal";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  showIcon?: boolean;
}

const loadingVariants = {
  default: {
    icon: Loader2,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  ai: {
    icon: Brain,
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  processing: {
    icon: Zap,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  minimal: {
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-transparent",
  },
};

const sizeVariants = {
  sm: {
    container: "p-2",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  md: {
    container: "p-4",
    icon: "h-5 w-5", 
    text: "text-base",
  },
  lg: {
    container: "p-6",
    icon: "h-8 w-8",
    text: "text-lg",
  },
};

export function EnhancedLoading({
  variant = "default",
  size = "md",
  text,
  className,
  showIcon = true,
}: EnhancedLoadingProps) {
  const variantConfig = loadingVariants[variant];
  const sizeConfig = sizeVariants[size];
  const IconComponent = variantConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg",
        variantConfig.bgColor,
        sizeConfig.container,
        className
      )}
    >
      {showIcon && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <IconComponent 
            className={cn(
              sizeConfig.icon,
              variantConfig.color
            )}
          />
        </motion.div>
      )}
      
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "font-medium text-center",
            sizeConfig.text,
            variantConfig.color
          )}
        >
          {text}
        </motion.p>
      )}
      
      {/* Animated dots for processing indication */}
      <motion.div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn("w-1 h-1 rounded-full", variantConfig.color)}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

// Skeleton components for different UI elements
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
      </div>
    </div>
  );
}
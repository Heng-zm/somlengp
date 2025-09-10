'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  children?: React.ReactNode;
}

export function FloatingActionButton({
  onClick,
  icon,
  className,
  disabled = false,
  'aria-label': ariaLabel,
  children
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        "fixed bottom-6 right-6 z-50",
        "w-14 h-14 rounded-full",
        "shadow-2xl hover:shadow-3xl",
        "transition-all duration-300 ease-in-out",
        "transform hover:scale-110 active:scale-95",
        // Gradient background - monochrome
        "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
        "hover:from-gray-700 hover:via-gray-800 hover:to-gray-900",
        // Border and ring effects
        "border-2 border-white/10 hover:border-white/20",
        "ring-2 ring-gray-600/20 hover:ring-gray-500/40",
        // Text color
        "text-white",
        // Focus styles
        "focus:outline-none focus:ring-4 focus:ring-gray-500/50",
        // Disabled styles
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        // Smooth backdrop blur for glassmorphism effect
        "backdrop-blur-sm",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse" />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center">
        {children || icon}
      </div>
      
      {/* Ripple effect on hover */}
      <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </Button>
  );
}

// Preset variations
export const CameraFAB = (props: Omit<FloatingActionButtonProps, 'icon' | 'aria-label'>) => (
  <FloatingActionButton
    {...props}
    icon={
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    }
    aria-label="Open QR Scanner"
  />
);

export const QRScannerFAB = (props: Omit<FloatingActionButtonProps, 'icon' | 'aria-label'>) => (
  <FloatingActionButton
    {...props}
    icon={
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* QR Code Scanner Icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4V2m0 20v-2m8-10h2M2 12h2M6.343 6.343l1.414 1.414M16.243 16.243l1.414 1.414M6.343 17.657l1.414-1.414M16.243 7.757l1.414-1.414"
        />
        {/* QR squares */}
        <rect x="6" y="6" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="15" y="6" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="6" y="15" width="3" height="3" rx="0.5" fill="currentColor" />
        {/* Scanner line */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 12h8" opacity="0.7" />
      </svg>
    }
    aria-label="Scan QR Code"
  />
);

export const AddFAB = (props: Omit<FloatingActionButtonProps, 'icon' | 'aria-label'>) => (
  <FloatingActionButton
    {...props}
    icon={
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    }
    aria-label="Add"
  />
);

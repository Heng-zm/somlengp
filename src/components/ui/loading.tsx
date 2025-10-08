"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'skeleton';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-muted-foreground'
};

export function Loading({
  variant = 'spinner',
  size = 'md',
  className,
  text = 'Loading...',
  showText = false,
  color = 'primary'
}: LoadingProps) {
  const baseClasses = cn(
    'animate-spin',
    sizeClasses[size],
    colorClasses[color]
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return <Loader2 className={baseClasses} />;
      
      case 'dots':
        return (
          <div className={cn('flex gap-1', className)}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  size === 'sm' ? 'w-1 h-1' :
                  size === 'md' ? 'w-2 h-2' :
                  size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className={cn(
            'rounded-full bg-current animate-ping',
            sizeClasses[size],
            colorClasses[color]
          )} />
        );
      
      case 'bars':
        return (
          <div className={cn('flex gap-1', className)}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-current animate-pulse',
                  size === 'sm' ? 'w-1 h-3' :
                  size === 'md' ? 'w-1.5 h-4' :
                  size === 'lg' ? 'w-2 h-6' : 'w-3 h-8',
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </div>
        );
      
      case 'skeleton':
        return (
          <div className={cn(
            'bg-muted rounded animate-pulse',
            sizeClasses[size]
          )} />
        );
      
      default:
        return <Loader2 className={baseClasses} />;
    }
  };

  if (showText) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {renderSpinner()}
        <span className={cn(
          'text-muted-foreground font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </span>
      </div>
    );
  }

  return <div className={className}>{renderSpinner()}</div>;
}

// Specialized loading components
export function PageLoading({ text = 'Loading page...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading variant="spinner" size="lg" showText text={text} />
    </div>
  );
}

export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Loading variant="spinner" size={size} />;
}

export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Loading variant="dots" size="sm" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function CardLoading({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      <div className="space-y-2">
        <Loading variant="skeleton" className="h-4 w-3/4" />
        <Loading variant="skeleton" className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Loading variant="skeleton" className="h-3 w-full" />
        <Loading variant="skeleton" className="h-3 w-full" />
        <Loading variant="skeleton" className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// Full screen loading overlay
export function LoadingOverlay({ 
  show, 
  text = 'Loading...', 
  variant = 'spinner' 
}: { 
  show: boolean; 
  text?: string; 
  variant?: 'spinner' | 'dots' | 'pulse';
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg border">
        <Loading variant={variant} size="lg" showText text={text} />
      </div>
    </div>
  );
}
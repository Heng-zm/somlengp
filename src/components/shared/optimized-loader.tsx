'use client';

import { memo } from 'react';
import { ThreeDotsLoader } from './three-dots-loader';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedLoaderProps {
  variant?: 'dots' | 'skeleton' | 'spinner';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

// Optimized loader component with different variants
export const OptimizedLoader = memo(function OptimizedLoader({
  variant = 'dots',
  size = 'md',
  text,
  className = ''
}: OptimizedLoaderProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  if (variant === 'skeleton') {
    return (
      <div className={`flex flex-col ${containerClasses[size]} ${className}`}>
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        {text && (
          <p className={`text-muted-foreground ${sizeClasses[size]}`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default dots variant
  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <ThreeDotsLoader />
      {text && (
        <p className={`text-muted-foreground ${sizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
});

// Page-level loading component
export const PageLoader = memo(function PageLoader({
  text = 'Loading...',
  className = ''
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex h-screen w-full items-center justify-center bg-background ${className}`}>
      <OptimizedLoader variant="dots" size="lg" text={text} />
    </div>
  );
});

// Section-level loading component
export const SectionLoader = memo(function SectionLoader({
  text,
  className = '',
  height = 'h-32'
}: {
  text?: string;
  className?: string;
  height?: string;
}) {
  return (
    <div className={`flex w-full items-center justify-center ${height} ${className}`}>
      <OptimizedLoader variant="dots" size="md" text={text} />
    </div>
  );
});

// Inline loading component
export const InlineLoader = memo(function InlineLoader({
  text,
  className = ''
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center p-2 ${className}`}>
      <OptimizedLoader variant="spinner" size="sm" text={text} />
    </div>
  );
});

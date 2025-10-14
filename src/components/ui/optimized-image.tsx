"use client";

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete' | 'onError'> {
  fallbackSrc?: string;
  showError?: boolean;
  skeletonClassName?: string;
  errorClassName?: string;
  onLoadComplete?: () => void;
  onLoadError?: (error: string) => void;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showError = true,
  skeletonClassName,
  errorClassName,
  className,
  onLoadComplete,
  onLoadError,
  ...props
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    setImageState('error');
    onLoadError?.('Failed to load image');
  }, [fallbackSrc, currentSrc, onLoadError]);

  if (imageState === 'error' && showError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded border",
        "min-h-[100px] min-w-[100px]",
        errorClassName,
        className
      )}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
          <AlertCircle className="w-6 h-6" />
          <span className="text-sm text-center">Failed to load image</span>
        </div>
      </div>
    );
  }

  if (imageState === 'error' && !showError) {
    return null;
  }

  return (
    <div className="relative">
      {imageState === 'loading' && (
        <Skeleton className={cn(
          "absolute inset-0 z-10",
          skeletonClassName
        )} />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        className={cn(
          imageState === 'loading' ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-200',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

// Legacy wrapper for gradual migration
export function LegacyImageWrapper({ 
  src, 
  alt, 
  className, 
  width,
  height,
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <OptimizedImage
      src={src || ''}
      alt={alt || 'Image'}
      className={className}
      width={typeof width === 'string' ? parseInt(width) || 500 : width || 500}
      height={typeof height === 'string' ? parseInt(height) || 300 : height || 300}
      style={{ width: 'auto', height: 'auto' }}
      {...props}
    />
  );
}

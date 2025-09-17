'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
// Performance optimization needed: Consider memoizing inline styles
// Use useMemo for objects/arrays and useCallback for functions

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  'data-ai-hint'?: string;
}
// Image cache management
class ImageCache {
  private cache = new Map<string, boolean>();
  private preloadedImages = new Set<string>();
  isCached(src: string): boolean {
    return this.cache.has(src);
  }
  markAsCached(src: string): void {
    this.cache.set(src, true);
  }
  preloadImage(src: string, priority: boolean = false): Promise<void> {
    if (this.preloadedImages.has(src)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        this.markAsCached(src);
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      if (priority) {
        img.fetchPriority = 'high';
      }
      img.src = src;
    });
  }
  clear(): void {
    this.cache.clear();
    this.preloadedImages.clear();
  }
}
const imageCache = new ImageCache();
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  className,
  sizes,
  fill,
  onLoad,
  onError,
  'data-ai-hint': dataAiHint,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Generate responsive sizes if not provided
  const responsiveSizes = useMemo(() => {
    if (sizes) return sizes;
    if (fill) return '100vw';
    // Generate responsive sizes based on width
    if (width <= 256) return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    if (width <= 512) return '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw';
    return '(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 75vw';
  }, [sizes, fill, width]);
  // Generate blur placeholder if not provided
  const optimizedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder !== 'blur') return undefined;
    // Use a simple SVG blur placeholder for better performance
    const svg = `
      <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g">
            <stop stop-color="hsl(210, 10%, 90%)" offset="0%"/>
            <stop stop-color="hsl(210, 10%, 95%)" offset="100%"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#g)" />
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [blurDataURL, placeholder, width, height]);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  // Preload critical images
  useEffect(() => {
    if (priority && src && isMounted) {
      imageCache.preloadImage(src, true).catch(console.warn);
    }
  }, [src, priority, isMounted]);
  const handleLoad = () => {
    setIsLoaded(true);
    imageCache.markAsCached(src);
    onLoad?.();
  };
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  // Fallback for broken images
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm",
          className
        )}
        style={fill ? undefined : { width, height }}
        {...(dataAiHint && { 'data-ai-hint': dataAiHint })}
      >
        Image unavailable
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={optimizedBlurDataURL}
      sizes={responsiveSizes}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        objectFit: fill ? 'cover' : undefined,
      }}
      {...(dataAiHint && { 'data-ai-hint': dataAiHint })}
    />
  );
}
// Hook for preloading multiple images
export function useImagePreloader(images: string[], priority: boolean = false) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (images.length === 0) return;
    setIsLoading(true);
    setLoadedCount(0);
    const preloadPromises = images.map(async (src) => {
      try {
        await imageCache.preloadImage(src, priority);
        setLoadedCount(prev => prev + 1);
      } catch (error) {
        setLoadedCount(prev => prev + 1); // Count as "loaded" even if failed
      }
    });
    Promise.all(preloadPromises).finally(() => {
      setIsLoading(false);
    });
  }, [images, priority]);
  return {
    loadedCount,
    totalCount: images.length,
    isLoading,
    progress: images.length > 0 ? (loadedCount / images.length) * 100 : 100,
  };
}
// Utility to clear image cache
export function clearImageCache(): void {
  imageCache.clear();
}

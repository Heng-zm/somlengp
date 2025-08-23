'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedImageProps {
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
  progressive?: boolean;
  webpFallback?: boolean;
}

// Progressive image loading with quality steps
const QUALITY_STEPS = [10, 25, 50, 75, 90];

// WebP support detection
const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  return canvas.toDataURL('image/webp').indexOf('webp') > -1;
};

// Image format optimization
const getOptimizedSrc = (src: string, webpSupported: boolean) => {
  // If it's already optimized or external URL, return as-is
  if (src.includes('?') || src.startsWith('http')) {
    return src;
  }
  
  // For local images, add optimization parameters
  const params = new URLSearchParams();
  if (webpSupported) {
    params.set('format', 'webp');
  }
  params.set('optimize', 'true');
  
  return params.toString() ? `${src}?${params.toString()}` : src;
};

// Enhanced blur data URL generator
const generateEnhancedBlurDataURL = (width: number, height: number, dominantColor?: string): string => {
  const color = dominantColor || 'hsl(210, 10%, 92%)';
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" filter="url(#blur)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Image cache with size and format optimization
class EnhancedImageCache {
  private cache = new Map<string, { 
    blob: Blob; 
    timestamp: number; 
    format: string;
    size: number;
  }>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  async cacheImage(src: string, blob: Blob, format: string): Promise<void> {
    const size = blob.size;
    
    // Check if we need to clear cache
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.clearOldEntries();
    }
    
    this.cache.set(src, {
      blob,
      timestamp: Date.now(),
      format,
      size
    });
    
    this.currentCacheSize += size;
  }

  getCachedImage(src: string): Blob | null {
    const cached = this.cache.get(src);
    if (cached) {
      // Update timestamp for LRU
      cached.timestamp = Date.now();
      return cached.blob;
    }
    return null;
  }

  private clearOldEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 30% of entries
    const toRemove = Math.floor(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      const [key, value] = entries[i];
      this.cache.delete(key);
      this.currentCacheSize -= value.size;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }
}

const imageCache = new EnhancedImageCache();

export const EnhancedOptimizedImage = memo(function EnhancedOptimizedImage({
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
  progressive = false,
  webpFallback = true,
  ...props
}: EnhancedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(progressive ? QUALITY_STEPS[0] : quality);
  const [webpSupported, setWebpSupported] = useState(false);

  // Check WebP support
  useEffect(() => {
    if (webpFallback && typeof window !== 'undefined') {
      setWebpSupported(supportsWebP());
    }
  }, [webpFallback]);

  // Progressive quality enhancement
  useEffect(() => {
    if (progressive && isLoaded && currentQuality < quality) {
      const currentIndex = QUALITY_STEPS.indexOf(currentQuality);
      if (currentIndex < QUALITY_STEPS.length - 1) {
        const timer = setTimeout(() => {
          const nextQuality = QUALITY_STEPS[currentIndex + 1];
          setCurrentQuality(Math.min(nextQuality, quality));
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }
  }, [progressive, isLoaded, currentQuality, quality]);

  // Optimized source URL
  const optimizedSrc = useMemo(() => {
    return getOptimizedSrc(src, webpSupported);
  }, [src, webpSupported]);

  // Enhanced blur placeholder
  const optimizedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder !== 'blur') return undefined;
    
    return generateEnhancedBlurDataURL(width, height);
  }, [blurDataURL, placeholder, width, height]);

  // Responsive sizes optimization
  const responsiveSizes = useMemo(() => {
    if (sizes) return sizes;
    if (fill) return '100vw';
    
    // Advanced responsive sizing based on breakpoints and DPR
    if (width <= 200) return '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px';
    if (width <= 400) return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px';
    if (width <= 800) return '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 800px';
    return '(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 1200px';
  }, [sizes, fill, width]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Preload critical images
  useEffect(() => {
    if (priority && optimizedSrc && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      if (responsiveSizes) {
        link.imageSizes = responsiveSizes;
      }
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, optimizedSrc, responsiveSizes]);

  // Error fallback
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm border border-dashed",
          className
        )}
        style={fill ? undefined : { width, height }}
        {...(dataAiHint && { 'data-ai-hint': dataAiHint })}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={currentQuality}
        placeholder={placeholder}
        blurDataURL={optimizedBlurDataURL}
        sizes={responsiveSizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-all duration-500 ease-out",
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
          progressive && currentQuality < quality && "filter blur-[0.5px]"
        )}
        style={{
          objectFit: fill ? 'cover' : undefined,
        }}
        {...(dataAiHint && { 'data-ai-hint': dataAiHint })}
        {...props}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 animate-pulse">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Progressive quality indicator (development only) */}
      {progressive && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Q: {currentQuality}%
        </div>
      )}
    </div>
  );
});

// Hook for batch image preloading with progress tracking
export function useEnhancedImagePreloader(images: Array<{ src: string; priority?: boolean }>) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (images.length === 0) return;

    setIsLoading(true);
    setLoadedCount(0);
    setProgress(0);

    const preloadImage = async (src: string, priority: boolean = false) => {
      return new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        
        img.onload = () => {
          setLoadedCount(prev => {
            const newCount = prev + 1;
            setProgress((newCount / images.length) * 100);
            return newCount;
          });
          resolve();
        };
        
        img.onerror = () => {
          setLoadedCount(prev => {
            const newCount = prev + 1;
            setProgress((newCount / images.length) * 100);
            return newCount;
          });
          reject(new Error(`Failed to load ${src}`));
        };
        
        if (priority) {
          img.fetchPriority = 'high';
        }
        
        img.src = src;
      });
    };

    Promise.allSettled(
      images.map(({ src, priority }) => preloadImage(src, priority))
    ).finally(() => {
      setIsLoading(false);
    });
  }, [images]);

  return {
    loadedCount,
    totalCount: images.length,
    progress,
    isLoading,
    isComplete: loadedCount === images.length
  };
}

// Utility to clear enhanced image cache
export function clearEnhancedImageCache(): void {
  imageCache.clear();
}

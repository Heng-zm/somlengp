'use client';

import { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  memo, 
  CSSProperties,
  ImgHTMLAttributes
} from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

interface ResponsiveBreakpoint {
  breakpoint: number; // px
  width: number;
  height?: number;
  quality?: number;
}

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: boolean;
  priority?: boolean;
  placeholder?: 'blur' | 'empty' | 'shimmer' | string;
  sizes?: string;
  responsive?: ResponsiveBreakpoint[];
  lazy?: boolean;
  fallback?: string;
  retryAttempts?: number;
  timeout?: number;
  onOptimizationComplete?: (metrics: ImageLoadMetrics) => void;
  onError?: (error: Error) => void;
}

interface ImageLoadMetrics {
  loadTime: number;
  fileSize?: number;
  format: string;
  dimensions: { width: number; height: number };
  compressionRatio?: number;
  wasOptimized: boolean;
  cacheHit: boolean;
  retryCount: number;
  timestamp: number;
}

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  optimization?: ImageOptimizationOptions;
  className?: string;
  containerClassName?: string;
  style?: CSSProperties;
  onLoadComplete?: (metrics: ImageLoadMetrics) => void;
}

// Utility to detect optimal image format support
function detectOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg';
  
  // Check AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  
  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  
  return 'jpeg';
}

// Generate optimized image URL
function generateOptimizedUrl(
  src: string, 
  options: ImageOptimizationOptions, 
  breakpoint?: ResponsiveBreakpoint
): string {
  const url = new URL(src, window.location.origin);
  const params = new URLSearchParams();
  
  // Determine optimal format
  let format = options.format || 'auto';
  if (format === 'auto') {
    format = detectOptimalFormat();
  }
  
  // Set optimization parameters
  params.set('format', format);
  params.set('quality', (options.quality || breakpoint?.quality || 80).toString());
  
  if (breakpoint) {
    params.set('w', breakpoint.width.toString());
    if (breakpoint.height) {
      params.set('h', breakpoint.height.toString());
    }
  }
  
  // Add optimization flags
  params.set('auto', 'compress,format');
  
  // Return optimized URL (this would integrate with your image optimization service)
  return `${url.pathname}?${params.toString()}`;
}

// Generate responsive image sources
function generateResponsiveSources(
  src: string,
  options: ImageOptimizationOptions
): string {
  if (!options.responsive) return '';
  
  return options.responsive
    .map(bp => `${generateOptimizedUrl(src, options, bp)} ${bp.breakpoint}w`)
    .join(', ');
}

// Create placeholder shimmer effect
function createShimmerPlaceholder(width: number, height: number): string {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
        </linearGradient>
        <animate attributeName="x1" values="0%;100%" dur="1s" repeatCount="indefinite"/>
      </defs>
      <rect width="100%" height="100%" fill="url(#shimmer)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(shimmerSvg)}`;
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [ref, options, hasIntersected]);
  
  return { isIntersecting, hasIntersected };
}

const SmartImage = memo(function SmartImage({
  src,
  alt,
  width,
  height,
  optimization = {},
  className,
  containerClassName,
  style,
  onLoadComplete,
  ...props
}: SmartImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadMetrics, setLoadMetrics] = useState<ImageLoadMetrics | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const loadStartTime = useRef<number>(0);
  const performanceMonitor = getPerformanceMonitor();
  
  // Intersection observer for lazy loading
  const { hasIntersected } = useIntersectionObserver(
    containerRef,
    { 
      threshold: 0.1,
      rootMargin: '50px' // Start loading 50px before entering viewport
    }
  );
  
  const {
    quality = 80,
    format = 'auto',
    blur = false,
    priority = false,
    placeholder = 'shimmer',
    lazy = true,
    fallback,
    retryAttempts = 3,
    timeout = 10000,
    onOptimizationComplete,
    onError
  } = optimization;
  
  // Generate optimized image URL
  const optimizedSrc = useCallback(() => {
    if (cachedUrl) return cachedUrl;
    
    const optimizedUrl = generateOptimizedUrl(src, optimization);
    setCachedUrl(optimizedUrl);
    return optimizedUrl;
  }, [src, optimization, cachedUrl]);
  
  // Handle image load success
  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const loadEndTime = performance.now();
    const loadTime = loadEndTime - loadStartTime.current;
    
    const img = event.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate metrics
    const metrics: ImageLoadMetrics = {
      loadTime,
      format: format === 'auto' ? detectOptimalFormat() : format,
      dimensions: { width: naturalWidth, height: naturalHeight },
      wasOptimized: true,
      cacheHit: loadTime < 100, // Assume cache hit if very fast
      retryCount,
      timestamp: Date.now()
    };
    
    setLoadMetrics(metrics);
    setIsLoading(false);
    
    // Report to performance monitor
    if (performanceMonitor) {
      (performanceMonitor as any).trackCustomMetric?.('image_load_time', loadTime);
      (performanceMonitor as any).trackCustomMetric?.('image_optimization_success', 1);
    }
    
    // Call callbacks
    onOptimizationComplete?.(metrics);
    onLoadComplete?.(metrics);
    
    // Log performance data
    console.debug('Image optimization complete:', {
      src,
      metrics,
      optimized: true
    });
  }, [src, format, retryCount, performanceMonitor, onOptimizationComplete, onLoadComplete]);
  
  // Handle image load error
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const error = new Error(`Failed to load image: ${src}`);
    
    if (retryCount < retryAttempts) {
      console.warn(`Image load failed, retrying... (${retryCount + 1}/${retryAttempts})`);
      setRetryCount(prev => prev + 1);
      setCachedUrl(null); // Clear cache to force retry
      return;
    }
    
    setHasError(true);
    setIsLoading(false);
    
    // Report to performance monitor
    if (performanceMonitor) {
      (performanceMonitor as any).trackCustomMetric?.('image_optimization_error', 1);
    }
    
    // Call error callback
    onError?.(error);
    
    console.error('Image optimization failed:', { src, error, retryCount });
  }, [src, retryCount, retryAttempts, performanceMonitor, onError]);
  
  // Start load timer when component mounts or retry occurs
  useEffect(() => {
    if ((!lazy || hasIntersected) && !hasError) {
      loadStartTime.current = performance.now();
    }
  }, [lazy, hasIntersected, hasError, retryCount]);
  
  // Generate responsive sizes string
  const responsiveSizes = optimization.responsive
    ? generateResponsiveSources(src, optimization)
    : optimization.sizes || '100vw';
  
  // Generate placeholder
  const placeholderSrc = useMemo(() => {
    if (placeholder === 'shimmer' && width && height) {
      return createShimmerPlaceholder(width, height);
    }
    if (typeof placeholder === 'string' && placeholder !== 'shimmer' && placeholder !== 'empty') {
      return placeholder;
    }
    return undefined;
  }, [placeholder, width, height]);
  
  // Don't render anything if lazy loading and not intersected
  if (lazy && !hasIntersected) {
    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden', containerClassName)}
        style={{ width, height, ...style }}
      >
        {placeholderSrc && (
          <img
            src={placeholderSrc}
            alt=""
            className={cn('w-full h-full object-cover', className)}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
  
  // Show error fallback
  if (hasError) {
    if (fallback) {
      return (
        <div
          ref={containerRef}
          className={cn('relative overflow-hidden', containerClassName)}
          style={{ width, height, ...style }}
        >
          <img
            src={fallback}
            alt={alt}
            className={cn('w-full h-full object-cover', className)}
            {...props}
          />
        </div>
      );
    }
    
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-gray-100 flex items-center justify-center',
          containerClassName
        )}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-400 text-center p-4">
          <p className="text-sm">Failed to load image</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs mt-1 opacity-60">{src}</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width, height, ...style }}
    >
      {/* Loading placeholder */}
      {isLoading && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-100' : 'opacity-0',
            className
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Main optimized image */}
      <Image
        ref={imageRef}
        src={optimizedSrc()}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        sizes={responsiveSizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Development info overlay */}
      {process.env.NODE_ENV === 'development' && loadMetrics && (
        <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs p-1">
          {loadMetrics.loadTime.toFixed(0)}ms
        </div>
      )}
    </div>
  );
});

export { SmartImage, type SmartImageProps, type ImageOptimizationOptions, type ImageLoadMetrics };

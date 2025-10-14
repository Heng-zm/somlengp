'use client';

import React, { 
  useEffect, 
  useState, 
  useRef, 
  useCallback, 
  useMemo,
  memo 
} from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  renderTime?: number;
  domContentLoaded?: number;
  loadComplete?: number;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const startTime = useRef(performance.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            break;
            
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
            
          case 'first-input':
            setMetrics(prev => ({ 
              ...prev, 
              fid: (entry as any).processingStart - entry.startTime 
            }));
            break;
            
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({ 
                ...prev, 
                cls: (prev.cls || 0) + (entry as any).value 
              }));
            }
            break;
            
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              ttfb: navEntry.responseStart - navEntry.requestStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
              loadComplete: navEntry.loadEventEnd - navEntry.startTime
            }));
            break;
        }
      });
    });

    try {
      observer.observe({ 
        entryTypes: [
          'paint', 
          'largest-contentful-paint', 
          'first-input', 
          'layout-shift',
          'navigation'
        ] 
      });
    } catch (e) {
      console.warn('Performance Observer not supported:', e);
    }

    // Track render time
    const renderTime = performance.now() - startTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// ============================================================================
// INTERSECTION OBSERVER FOR LAZY LOADING
// ============================================================================

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return { ref, isIntersecting, hasIntersected };
}

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  sizes?: string;
  fill?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  className,
  lazy = true,
  onLoad,
  onError,
  sizes,
  fill = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority || !lazy);
  
  const { ref, hasIntersected } = useIntersectionObserver({
    rootMargin: '200px'
  });

  // Load image when it intersects or is priority
  useEffect(() => {
    if (!lazy || priority || hasIntersected) {
      setShouldLoad(true);
    }
  }, [lazy, priority, hasIntersected]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error(`Failed to load image: ${src}`));
  }, [onError, src]);

  // Generate blur placeholder if not provided
  const generatedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'blur') {
      // Simple base64 encoded 1x1 pixel image
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSyu5GUcBmAMGePBJ/ELmA0mFuLsxBgSLhUnnJqfg==';
    }
    return undefined;
  }, [blurDataURL, placeholder]);

  if (hasError) {
    return (
      <div 
        ref={ref}
        className={cn(
          'bg-gray-200 border-2 border-dashed border-gray-300 rounded flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-sm">Failed to load</div>
          <div className="text-xs mt-1">Image not available</div>
        </div>
      </div>
    );
  }

  if (!shouldLoad) {
    return (
      <div 
        ref={ref}
        className={cn('bg-gray-200 animate-pulse rounded', className)}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={generatedBlurDataURL}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        style={fill ? {} : { width: '100%', height: 'auto' }}
      />
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
});

// ============================================================================
// RESOURCE PRELOADING
// ============================================================================

export function useResourcePreloading(resources: Array<{
  href: string;
  as: 'style' | 'script' | 'font' | 'image' | 'fetch';
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
}>) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const preloadedLinks: HTMLLinkElement[] = [];

    resources.forEach(resource => {
      const existingLink = document.querySelector(
        `link[rel="preload"][href="${resource.href}"]`
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        
        if (resource.crossOrigin) {
          link.crossOrigin = resource.crossOrigin;
        }
        
        if (resource.media) {
          link.media = resource.media;
        }

        document.head.appendChild(link);
        preloadedLinks.push(link);
      }
    });

    // Cleanup on unmount
    return () => {
      preloadedLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [resources]);
}

// ============================================================================
// PREFETCHING FOR NAVIGATION
// ============================================================================

export function usePrefetch(hrefs: string[]) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const prefetchedLinks: HTMLLinkElement[] = [];

    hrefs.forEach(href => {
      const existingLink = document.querySelector(
        `link[rel="prefetch"][href="${href}"]`
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        
        document.head.appendChild(link);
        prefetchedLinks.push(link);
      }
    });

    return () => {
      prefetchedLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [hrefs]);
}

// ============================================================================
// CRITICAL CSS INLINING
// ============================================================================

export function useCriticalCSS(criticalCSS?: string) {
  useEffect(() => {
    if (!criticalCSS || typeof document === 'undefined') return;

    const styleElement = document.createElement('style');
    styleElement.textContent = criticalCSS;
    styleElement.setAttribute('data-critical', 'true');
    
    // Insert at the beginning of head for highest priority
    document.head.insertBefore(styleElement, document.head.firstChild);

    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [criticalCSS]);
}

// ============================================================================
// FONT OPTIMIZATION
// ============================================================================

export function useFontOptimization(fonts: Array<{
  family: string;
  weights: number[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}>) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const linkElements: HTMLLinkElement[] = [];

    fonts.forEach(font => {
      const weightsStr = font.weights.join(';');
      const href = `https://fonts.googleapis.com/css2?family=${font.family.replace(' ', '+')}:wght@${weightsStr}&display=${font.display || 'swap'}`;
      
      const existingLink = document.querySelector(`link[href="${href}"]`);
      
      if (!existingLink) {
        // Preconnect to Google Fonts
        const preconnectLink = document.createElement('link');
        preconnectLink.rel = 'preconnect';
        preconnectLink.href = 'https://fonts.gstatic.com';
        preconnectLink.crossOrigin = 'anonymous';
        document.head.appendChild(preconnectLink);

        // Load font
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = href;
        fontLink.media = 'print';
        fontLink.onload = () => {
          fontLink.media = 'all';
        };
        
        document.head.appendChild(fontLink);
        linkElements.push(preconnectLink, fontLink);
      }
    });

    return () => {
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [fonts]);
}

// ============================================================================
// LAZY CONTENT LOADING
// ============================================================================

interface LazyContentProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  fallback?: React.ReactNode;
  onVisible?: () => void;
}

export const LazyContent = memo(function LazyContent({
  children,
  placeholder,
  rootMargin = '100px',
  threshold = 0.1,
  fallback,
  onVisible
}: LazyContentProps) {
  const { ref, hasIntersected } = useIntersectionObserver({
    rootMargin,
    threshold
  });

  useEffect(() => {
    if (hasIntersected) {
      onVisible?.();
    }
  }, [hasIntersected, onVisible]);

  return (
    <div ref={ref}>
      {hasIntersected ? children : (placeholder || fallback || (
        <div className="h-32 bg-gray-100 animate-pulse rounded" />
      ))}
    </div>
  );
});

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

export function useServiceWorker(swUrl = '/sw.js') {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setIsSupported(true);

    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        setRegistration(registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('New content available! Please refresh.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });

    return () => {
      // Cleanup if needed
    };
  }, [swUrl]);

  return { registration, isSupported };
}

// ============================================================================
// CRITICAL RESOURCE HINTS
// ============================================================================

export function useCriticalResourceHints() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const resourceHints = [
      // DNS prefetch for external domains
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      
      // Preconnect for critical third-party resources
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ];

    const linkElements: HTMLLinkElement[] = [];

    resourceHints.forEach(hint => {
      const existingLink = document.querySelector(
        `link[rel="${hint.rel}"][href="${hint.href}"]`
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        
        if ('crossOrigin' in hint && hint.crossOrigin) {
          link.crossOrigin = hint.crossOrigin;
        }

        document.head.appendChild(link);
        linkElements.push(link);
      }
    });

    return () => {
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, []);
}

// ============================================================================
// PERFORMANCE OPTIMIZATION HOOK
// ============================================================================

export interface PerformanceConfig {
  preloadResources?: Array<{ href: string; as: 'style' | 'script' | 'font' | 'image' }>;
  prefetchLinks?: string[];
  criticalCSS?: string;
  fonts?: Array<{ family: string; weights: number[] }>;
  enableServiceWorker?: boolean;
  serviceWorkerUrl?: string;
}

export function useStaticPagePerformance(config: PerformanceConfig = {}) {
  const metrics = usePerformanceMonitoring();

  // Apply resource preloading
  useResourcePreloading(config.preloadResources || []);
  
  // Apply prefetching
  usePrefetch(config.prefetchLinks || []);
  
  // Apply critical CSS
  useCriticalCSS(config.criticalCSS);
  
  // Apply font optimization
  useFontOptimization(config.fonts || []);
  
  // Apply service worker
  const { registration } = useServiceWorker(
    config.enableServiceWorker ? config.serviceWorkerUrl : undefined
  );
  
  // Apply critical resource hints
  useCriticalResourceHints();

  return {
    metrics,
    serviceWorkerRegistration: registration
  };
}

// ============================================================================
// EXPORT PERFORMANCE UTILITIES
// ============================================================================

export const StaticPerformance = {
  // Hooks
  usePerformanceMonitoring,
  useIntersectionObserver,
  useResourcePreloading,
  usePrefetch,
  useCriticalCSS,
  useFontOptimization,
  useServiceWorker,
  useCriticalResourceHints,
  useStaticPagePerformance,
  
  // Components
  OptimizedImage,
  LazyContent
};

export default StaticPerformance;
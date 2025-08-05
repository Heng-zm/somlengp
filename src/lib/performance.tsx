// Performance utilities for optimizing page displays
import React from 'react';

// Debounce function for performance optimization
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility
export function createLazyComponent(
  importFunc: () => Promise<{ default: React.ComponentType<unknown> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc);
  
  const LazyWrapper = (props: Record<string, unknown>) => {
    const FallbackComponent = fallback;
    const fallbackElement = FallbackComponent ? <FallbackComponent /> : <div>Loading...</div>;
    
    return (
      <React.Suspense fallback={fallbackElement}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
  
  LazyWrapper.displayName = 'LazyWrapper';
  return LazyWrapper;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0%' }: IntersectionObserverInit = {}
): boolean {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, root, rootMargin]);

  return isVisible;
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
}

// Image optimization utility
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality = 75
): string {
  // This would integrate with your image optimization service
  // For now, return the original src
  // Parameters are available for future use: width, height, quality
  // Suppress unused variable warnings as these will be used in future implementations
  void width; void height; void quality;
  return src;
}

// Memory cleanup utility
export function useCleanup(cleanup: () => void, deps: React.DependencyList) {
  React.useEffect(() => {
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, ...deps]);
}

// Performance monitoring utility
export function measurePerformance(name: string, fn: () => void) {
  if (typeof window === 'undefined') return fn();
  
  // Performance measurement variables (for future analytics integration)
  void name; // Will be used when analytics are implemented
  
  const result = fn();
  
  return result;
}

// Virtual scrolling utility for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop,
  };
}


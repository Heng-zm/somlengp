import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading with better error boundaries and loading states
 */
export const createLazyComponent = <T = {}>(
  componentImport: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: React.ComponentType;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
) => {
  const { retryAttempts = 3, retryDelay = 1000 } = options;
  
  let retryCount = 0;
  
  const lazyLoader = (): Promise<{ default: ComponentType<T> }> => {
    return componentImport().catch((error) => {
      if (retryCount < retryAttempts) {
        retryCount++;
        return new Promise<{ default: ComponentType<T> }>((resolve) => {
          setTimeout(() => {
            resolve(lazyLoader());
          }, retryDelay);
        });
      }
      throw error;
    });
  };
  
  return lazy(lazyLoader);
};

/**
 * Preload a component for better UX
 */
export const preloadComponent = (componentImport: () => Promise<any>) => {
  if (typeof window !== 'undefined') {
    // Preload on idle or after interaction
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => componentImport());
    } else {
      setTimeout(() => componentImport(), 100);
    }
  }
};

/**
 * Check if the user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Detect slow network connections
 */
export const isSlowConnection = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return false;
  const connection = (navigator as any).connection;
  return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
};

/**
 * Memory usage optimization
 */
export const optimizeMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'gc' in window) {
    // Suggest garbage collection if available (Chrome DevTools)
    (window as any).gc();
  }
};

/**
 * Defer heavy operations until page is idle
 */
export const deferUntilIdle = (callback: () => void, timeout = 5000) => {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
};

/**
 * Load scripts dynamically with caching
 */
const scriptCache = new Set<string>();

export const loadScript = (src: string, options: { async?: boolean; defer?: boolean } = {}) => {
  return new Promise<void>((resolve, reject) => {
    if (scriptCache.has(src)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async ?? true;
    script.defer = options.defer ?? false;
    
    script.onload = () => {
      scriptCache.add(src);
      resolve();
    };
    
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
};

/**
 * Optimize images by creating WebP versions when supported
 */
export const getOptimizedImageSrc = (src: string, quality = 75) => {
  if (typeof window === 'undefined') return src;
  
  // Check WebP support
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') > 0;
  })();
  
  if (supportsWebP && src.includes('/')) {
    const url = new URL(src, window.location.origin);
    url.searchParams.set('f', 'webp');
    url.searchParams.set('q', quality.toString());
    return url.toString();
  }
  
  return src;
};

/**
 * Critical resource preloader
 */
export const preloadCriticalResources = () => {
  if (typeof document === 'undefined') return;
  
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
    '/fonts/cal-sans.woff2'
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // Preload critical images
  const criticalImages = [
    '/images/logo.webp',
    '/images/hero-bg.webp'
  ];
  
  criticalImages.forEach(image => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = image;
    document.head.appendChild(link);
  });
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async () => {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
    } catch (registrationError) {
      
    }
  }
};
'use client';

import { 
  useRef, 
  useCallback, 
  useEffect, 
  useState, 
  useMemo,
  RefObject,
  MutableRefObject
} from 'react';

// Types
interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

interface VirtualizedOptions {
  itemHeight: number;
  overscan?: number;
  scrollParent?: RefObject<HTMLElement>;
}

interface MemoryMonitorOptions {
  threshold?: number; // Memory usage threshold (0-1)
  interval?: number; // Check interval in milliseconds
  onThresholdExceeded?: () => void;
}

interface PerformanceMarks {
  [key: string]: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

interface MemoryInfo {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Memory management utility
class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Map<string, () => void> = new Map();
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  addCleanupTask(id: string, cleanup: () => void) {
    this.cleanupTasks.set(id, cleanup);
  }

  removeCleanupTask(id: string) {
    const cleanup = this.cleanupTasks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupTasks.delete(id);
    }
  }

  getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  startMemoryMonitoring(options: MemoryMonitorOptions) {
    if (this.memoryCheckInterval) return;

    const { threshold = 0.8, interval = 30000, onThresholdExceeded } = options;

    this.memoryCheckInterval = setInterval(() => {
      const memoryInfo = this.getMemoryUsage();
      if (memoryInfo) {
        const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        
        if (usageRatio > threshold) {
          console.warn(`High memory usage detected: ${(usageRatio * 100).toFixed(1)}%`);
          onThresholdExceeded?.();
          
          // Trigger garbage collection if possible
          if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc();
          }
        }
      }
    }, interval);
  }

  stopMemoryMonitoring() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  cleanup() {
    this.cleanupTasks.forEach((cleanup) => cleanup());
    this.cleanupTasks.clear();
    this.stopMemoryMonitoring();
  }
}

// Custom hooks

/**
 * Enhanced intersection observer hook with performance optimizations
 */
export function useIntersectionObserver(
  options: LazyLoadOptions = {}
): [RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0,
    rootMargin = '50px',
    triggerOnce = true,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || !targetRef.current || (triggerOnce && hasTriggered)) {
      return;
    }

    // Use a single observer instance for performance
    const observerKey = `${threshold}-${rootMargin}`;
    
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          const isIntersectingNow = entry.isIntersecting;
          
          setIsIntersecting(isIntersectingNow);
          
          if (isIntersectingNow && triggerOnce) {
            setHasTriggered(true);
          }
        },
        {
          threshold,
          rootMargin,
        }
      );
    }

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current && targetRef.current) {
        observerRef.current.unobserve(targetRef.current);
      }
    };
  }, [threshold, rootMargin, triggerOnce, enabled, hasTriggered]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const isVisible = triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting;
  return [targetRef, isVisible];
}

/**
 * Lazy loading hook for components
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  options: LazyLoadOptions = {}
): [RefObject<HTMLElement>, T | null, boolean, Error | null] {
  const [targetRef, isVisible] = useIntersectionObserver(options);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isVisible && !hasLoadedRef.current && !loading) {
      hasLoadedRef.current = true;
      setLoading(true);
      setError(null);

      loadFn()
        .then((result) => {
          setData(result);
        })
        .catch((err) => {
          setError(err);
          hasLoadedRef.current = false; // Allow retry
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isVisible, loadFn, loading]);

  return [targetRef, data, loading, error];
}

/**
 * Performance measurement hook
 */
export function usePerformanceMeasure(): {
  mark: (name: string) => void;
  measure: (name: string) => number | null;
  clearMarks: () => void;
  getAllMarks: () => PerformanceMarks;
} {
  const marksRef = useRef<PerformanceMarks>({});

  const mark = useCallback((name: string) => {
    if (marksRef.current[name] && !marksRef.current[name].endTime) {
      // End existing mark
      const startTime = marksRef.current[name].startTime;
      const endTime = performance.now();
      marksRef.current[name] = {
        startTime,
        endTime,
        duration: endTime - startTime,
      };
    } else {
      // Start new mark
      marksRef.current[name] = {
        startTime: performance.now(),
      };
    }
  }, []);

  const measure = useCallback((name: string): number | null => {
    const mark = marksRef.current[name];
    if (mark && mark.duration !== undefined) {
      return mark.duration;
    }
    if (mark && !mark.endTime) {
      // Calculate current duration
      return performance.now() - mark.startTime;
    }
    return null;
  }, []);

  const clearMarks = useCallback(() => {
    marksRef.current = {};
  }, []);

  const getAllMarks = useCallback(() => {
    return { ...marksRef.current };
  }, []);

  return { mark, measure, clearMarks, getAllMarks };
}

/**
 * Virtualized list hook for large datasets
 */
export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedOptions
): {
  containerRef: RefObject<HTMLElement>;
  visibleItems: Array<{ index: number; item: T; style: React.CSSProperties }>;
  scrollToIndex: (index: number) => void;
} {
  const { itemHeight, overscan = 3, scrollParent } = options;
  const containerRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const itemCount = items.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    const totalHeight = itemCount * itemHeight;

    return { startIndex, endIndex, totalHeight };
  }, [items.length, itemHeight, scrollTop, containerHeight, overscan]);

  // Create visible items with positioning
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => {
      const actualIndex = startIndex + index;
      return {
        index: actualIndex,
        item,
        style: {
          position: 'absolute' as const,
          top: actualIndex * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      };
    });
  }, [items, startIndex, endIndex, itemHeight]);

  // Handle scroll events
  useEffect(() => {
    const scrollContainer = scrollParent?.current || containerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setScrollTop(scrollContainer.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(scrollContainer.clientHeight);
    };

    handleResize(); // Initial call
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [scrollParent]);

  const scrollToIndex = useCallback((index: number) => {
    const scrollContainer = scrollParent?.current || containerRef.current;
    if (!scrollContainer) return;

    const targetScrollTop = index * itemHeight;
    scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [itemHeight, scrollParent]);

  return {
    containerRef,
    visibleItems,
    scrollToIndex,
  };
}

/**
 * Debounced value hook with performance optimizations
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        return callback(...args);
      } else {
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memory monitoring hook
 */
export function useMemoryMonitor(options: MemoryMonitorOptions = {}) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isHighUsage, setIsHighUsage] = useState(false);

  useEffect(() => {
    const manager = MemoryManager.getInstance();
    const { threshold = 0.8 } = options;

    const updateMemoryInfo = () => {
      const info = manager.getMemoryUsage();
      setMemoryInfo(info);
      
      if (info) {
        const usageRatio = info.usedJSHeapSize / info.jsHeapSizeLimit;
        setIsHighUsage(usageRatio > threshold);
      }
    };

    // Initial update
    updateMemoryInfo();

    // Start monitoring
    manager.startMemoryMonitoring({
      ...options,
      onThresholdExceeded: () => {
        updateMemoryInfo();
        options.onThresholdExceeded?.();
      },
    });

    // Update memory info periodically
    const interval = setInterval(updateMemoryInfo, options.interval || 30000);

    return () => {
      clearInterval(interval);
      manager.stopMemoryMonitoring();
    };
  }, [options.threshold, options.interval]);

  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      // Update memory info after GC
      setTimeout(() => {
        const manager = MemoryManager.getInstance();
        const info = manager.getMemoryUsage();
        setMemoryInfo(info);
      }, 100);
    }
  }, []);

  return {
    memoryInfo,
    isHighUsage,
    forceGarbageCollection,
  };
}

/**
 * Cleanup management hook
 */
export function useCleanup(cleanupId: string, cleanupFn: () => void) {
  useEffect(() => {
    const manager = MemoryManager.getInstance();
    manager.addCleanupTask(cleanupId, cleanupFn);

    return () => {
      manager.removeCleanupTask(cleanupId);
    };
  }, [cleanupId, cleanupFn]);
}

/**
 * Resource preloading hook
 */
export function usePreload(resources: string[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resources.length === 0) return;

    setLoading(true);
    setLoadedCount(0);

    const preloadPromises = resources.map((resource, index) => {
      return new Promise<void>((resolve, reject) => {
        if (resource.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
          // Preload images
          const img = new Image();
          img.onload = () => {
            setLoadedCount(prev => prev + 1);
            resolve();
          };
          img.onerror = reject;
          img.src = resource;
        } else if (resource.match(/\.(js|css)$/i)) {
          // Preload scripts and styles
          const link = document.createElement('link');
          link.rel = resource.endsWith('.js') ? 'modulepreload' : 'preload';
          link.href = resource;
          if (resource.endsWith('.css')) link.as = 'style';
          if (resource.endsWith('.js')) link.as = 'script';
          
          link.onload = () => {
            setLoadedCount(prev => prev + 1);
            resolve();
          };
          link.onerror = reject;
          document.head.appendChild(link);
        } else {
          // Generic fetch preload
          fetch(resource, { method: 'GET' })
            .then(() => {
              setLoadedCount(prev => prev + 1);
              resolve();
            })
            .catch(reject);
        }
      });
    });

    Promise.allSettled(preloadPromises)
      .then(() => {
        setLoading(false);
      });
  }, [resources]);

  const progress = resources.length > 0 ? loadedCount / resources.length : 1;

  return {
    loading,
    progress,
    loadedCount,
    totalCount: resources.length,
    isComplete: loadedCount === resources.length,
  };
}

/**
 * Frame rate monitoring hook
 */
export function useFrameRate() {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        const currentFPS = Math.round(
          (frameCountRef.current * 1000) / (now - lastTimeRef.current)
        );
        setFps(currentFPS);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateFPS);
    };

    animationFrameRef.current = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return fps;
}

/**
 * Optimized event listener hook
 */
export function useOptimizedEventListener<T extends HTMLElement = HTMLElement>(
  eventName: string,
  handler: (event: Event) => void,
  element?: RefObject<T>,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef<(event: Event) => void>();

  // Remember the latest handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element?.current || window;
    if (!targetElement || !targetElement.addEventListener) return;

    const eventListener = (event: Event) => savedHandler.current?.(event);

    targetElement.addEventListener(eventName, eventListener, {
      passive: true,
      ...options,
    });

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

export default {
  useIntersectionObserver,
  useLazyLoad,
  usePerformanceMeasure,
  useVirtualizedList,
  useDebouncedValue,
  useThrottledCallback,
  useMemoryMonitor,
  useCleanup,
  usePreload,
  useFrameRate,
  useOptimizedEventListener,
};

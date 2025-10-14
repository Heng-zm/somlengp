
import { useState, useCallback, useRef, useEffect } from 'react';

// Custom hook for debouncing
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for throttling
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};

// Memory usage tracker
export const useMemoryTracker = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          used: Math.round(((performance as any).memory.usedJSHeapSize / 1048576) * 100) / 100,
          total: Math.round(((performance as any).memory.totalJSHeapSize / 1048576) * 100) / 100,
          limit: Math.round(((performance as any).memory.jsHeapSizeLimit / 1048576) * 100) / 100
        });
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
};

// Performance observer hook
export const usePerformanceObserver = (
  callback: (entries: PerformanceEntry[]) => void,
  options: { entryTypes: string[] }
) => {
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe(options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
};

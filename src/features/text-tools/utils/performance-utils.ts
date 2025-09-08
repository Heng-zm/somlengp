// Performance optimization utilities for Text Tools

import { useCallback, useMemo, useRef } from 'react';

// Debounce hook for performance optimization
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttle hook for performance optimization
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized text transformation with performance monitoring
export function useMemoizedTransformation<T>(
  transformationFn: () => T,
  dependencies: any[],
  options?: {
    maxSize?: number; // Maximum input size to process
    timeout?: number; // Maximum processing time in ms
  }
): { result: T | null; isProcessing: boolean; error: string | null } {
  const { maxSize = 1000000, timeout = 5000 } = options || {};

  return useMemo(() => {
    try {
      // Check if any dependency exceeds size limit
      const totalSize = dependencies
        .filter(dep => typeof dep === 'string')
        .reduce((acc, str) => acc + str.length, 0);

      if (totalSize > maxSize) {
        return {
          result: null,
          isProcessing: false,
          error: `Input too large (${totalSize} characters). Maximum allowed: ${maxSize}`
        };
      }

      // Add timeout for long-running transformations
      const startTime = Date.now();
      const result = transformationFn();
      const processingTime = Date.now() - startTime;

      if (processingTime > timeout) {
        console.warn(`Text transformation took ${processingTime}ms, consider optimizing`);
      }

      return {
        result,
        isProcessing: false,
        error: null
      };
    } catch (error) {
      return {
        result: null,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error'
      };
    }
  }, dependencies);
}

// Virtual scrolling for large text outputs
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll(
  items: string[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;

  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;

    return {
      totalHeight,
      visibleCount,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
          items.length - 1,
          startIndex + visibleCount + overscan * 2
        );

        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex + 1),
          offsetY: startIndex * itemHeight
        };
      }
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const metricsRef = useRef<{
    operationsCount: number;
    totalTime: number;
    averageTime: number;
    lastOperationTime: number;
  }>({
    operationsCount: 0,
    totalTime: 0,
    averageTime: 0,
    lastOperationTime: 0
  });

  const measureOperation = useCallback(<T>(
    operation: () => T,
    operationName?: string
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Update metrics
    metricsRef.current.operationsCount++;
    metricsRef.current.totalTime += duration;
    metricsRef.current.averageTime = metricsRef.current.totalTime / metricsRef.current.operationsCount;
    metricsRef.current.lastOperationTime = duration;

    // Log slow operations
    if (duration > 100) {
      console.warn(
        `Slow text operation${operationName ? ` (${operationName})` : ''}: ${duration.toFixed(2)}ms`
      );
    }

    return result;
  }, []);

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      operationsCount: 0,
      totalTime: 0,
      averageTime: 0,
      lastOperationTime: 0
    };
  }, []);

  return {
    measureOperation,
    getMetrics,
    resetMetrics
  };
}

// Optimize text processing for large inputs
export function optimizeTextProcessing<T>(
  text: string,
  processor: (chunk: string) => T,
  combiner: (results: T[]) => T,
  chunkSize: number = 10000
): T {
  // For small texts, process directly
  if (text.length <= chunkSize) {
    return processor(text);
  }

  // Split into chunks and process
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  // Process chunks
  const results = chunks.map(chunk => processor(chunk));
  
  // Combine results
  return combiner(results);
}

// Worker-based processing for heavy operations
export class TextProcessingWorker {
  private worker: Worker | null = null;

  constructor() {
    // Create inline worker for text processing
    const workerScript = `
      self.onmessage = function(e) {
        const { operation, text, options } = e.data;
        
        try {
          let result;
          
          switch (operation) {
            case 'stats':
              result = calculateStats(text);
              break;
            case 'transform':
              result = transformText(text, options.transformType);
              break;
            default:
              throw new Error('Unknown operation: ' + operation);
          }
          
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ 
            success: false, 
            error: error.message 
          });
        }
      };
      
      function calculateStats(text) {
        return {
          characters: text.length,
          words: text.trim().split(/\\s+/).length,
          lines: text.split('\\n').length,
          paragraphs: text.split(/\\n\\s*\\n/).length
        };
      }
      
      function transformText(text, transformType) {
        switch (transformType) {
          case 'uppercase':
            return text.toUpperCase();
          case 'lowercase':
            return text.toLowerCase();
          case 'reverse':
            return text.split('').reverse().join('');
          default:
            return text;
        }
      }
    `;

    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Web Workers not supported, falling back to main thread');
    }
  }

  async processText(
    operation: string,
    text: string,
    options: any = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 10000); // 10 second timeout

      this.worker.onmessage = (e) => {
        clearTimeout(timeout);
        const { success, result, error } = e.data;
        
        if (success) {
          resolve(result);
        } else {
          reject(new Error(error));
        }
      };

      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.worker.postMessage({ operation, text, options });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Memory-efficient text chunking
export function* chunkText(text: string, chunkSize: number = 1000): Generator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
  }
}

// Lazy evaluation for expensive operations
export function createLazyEvaluator<T>(
  computeFn: () => T,
  dependencies: any[]
) {
  let cached: { value: T; deps: any[] } | null = null;

  return () => {
    // Check if dependencies have changed
    if (
      !cached || 
      cached.deps.length !== dependencies.length ||
      cached.deps.some((dep, i) => dep !== dependencies[i])
    ) {
      cached = {
        value: computeFn(),
        deps: [...dependencies]
      };
    }

    return cached.value;
  };
}

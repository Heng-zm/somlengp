/**
 * Cache Cleaner Utility
 * Removes various types of UI function caches and memoized components
 */

export interface CacheStats {
  clearedCaches: string[];
  errors: string[];
  totalClearedItems: number;
}

/**
 * Clear Next.js cache
 */
export function clearNextJsCache(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Clear Next.js router cache
      if (typeof window !== 'undefined' && window.next && window.next.router) {
        window.next.router.reload();
      }
      
      // Clear service worker cache
      if ('serviceWorker' in navigator && 'caches' in window) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        });
      }
      
      resolve(true);
    } catch (error) {
      console.error('Failed to clear Next.js cache:', error);
      resolve(false);
    }
  });
}

/**
 * Clear browser storage caches
 */
export function clearStorageCaches(): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('cache') || key.includes('memo') || key.includes('ui-')) {
        localStorage.removeItem(key);
        stats.totalClearedItems++;
      }
    });
    stats.clearedCaches.push('localStorage');
  } catch (error) {
    stats.errors.push(`localStorage: ${error}`);
  }

  try {
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('cache') || key.includes('memo') || key.includes('ui-')) {
        sessionStorage.removeItem(key);
        stats.totalClearedItems++;
      }
    });
    stats.clearedCaches.push('sessionStorage');
  } catch (error) {
    stats.errors.push(`sessionStorage: ${error}`);
  }

  return stats;
}

/**
 * Clear React component memo caches
 */
export function clearReactMemoCache(): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear React DevTools cache if available
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.rendererInterfaces) {
        hook.rendererInterfaces.forEach((rendererInterface: any) => {
          if (rendererInterface.flushPendingEvents) {
            rendererInterface.flushPendingEvents();
          }
        });
      }
      stats.clearedCaches.push('React DevTools');
      stats.totalClearedItems++;
    }

    // Force React to re-render by clearing memo caches
    if (typeof window !== 'undefined' && (window as any).React) {
      const React = (window as any).React;
      if (React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
        // Clear React internal caches (use with caution)
        const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        if (internals.ReactCurrentDispatcher) {
          internals.ReactCurrentDispatcher.current = null;
        }
      }
      stats.clearedCaches.push('React internals');
      stats.totalClearedItems++;
    }
  } catch (error) {
    stats.errors.push(`React memo: ${error}`);
  }

  return stats;
}

/**
 * Clear web cache APIs
 */
export async function clearWebCaches(): Promise<CacheStats> {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        stats.totalClearedItems++;
      }
      
      stats.clearedCaches.push(`Web caches (${cacheNames.length} caches)`);
    } catch (error) {
      stats.errors.push(`Web caches: ${error}`);
    }
  }

  return stats;
}

/**
 * Clear API caches
 */
export function clearApiCaches(): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear any global API cache objects
    const globalObj = window as any;
    
    // Clear common API cache patterns
    const cacheKeys = ['__API_CACHE__', '__QUERY_CACHE__', '__DATA_CACHE__', 'apiCache', 'queryCache'];
    
    cacheKeys.forEach(key => {
      if (globalObj[key]) {
        if (typeof globalObj[key].clear === 'function') {
          globalObj[key].clear();
        } else {
          globalObj[key] = {};
        }
        stats.totalClearedItems++;
      }
    });

    stats.clearedCaches.push('API caches');
  } catch (error) {
    stats.errors.push(`API caches: ${error}`);
  }

  return stats;
}

/**
 * Clear image and media caches
 */
export function clearMediaCaches(): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear image cache by forcing reload of cached images
    const images = document.querySelectorAll('img[src]');
    images.forEach((img: HTMLImageElement) => {
      if (img.src && img.complete) {
        const src = img.src;
        img.src = '';
        img.src = src + (src.includes('?') ? '&' : '?') + '_cache_bust=' + Date.now();
        stats.totalClearedItems++;
      }
    });

    stats.clearedCaches.push(`Image cache (${images.length} images)`);
  } catch (error) {
    stats.errors.push(`Media caches: ${error}`);
  }

  return stats;
}

/**
 * Clear performance monitoring caches
 */
export function clearPerformanceCaches(): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear performance observer data
    if ('performance' in window && window.performance.clearResourceTimings) {
      window.performance.clearResourceTimings();
      stats.totalClearedItems++;
    }

    // Clear performance marks and measures
    if ('performance' in window && window.performance.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
      stats.totalClearedItems += 2;
    }

    stats.clearedCaches.push('Performance caches');
  } catch (error) {
    stats.errors.push(`Performance caches: ${error}`);
  }

  return stats;
}

/**
 * Master cache clearing function
 */
export async function clearAllUIFunctionCaches(): Promise<CacheStats> {
  const masterStats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  // Clear different types of caches
  const operations = [
    () => clearStorageCaches(),
    () => clearReactMemoCache(),
    () => clearApiCaches(),
    () => clearMediaCaches(),
    () => clearPerformanceCaches(),
    () => clearWebCaches(),
  ];

  for (const operation of operations) {
    try {
      const result = await operation();
      masterStats.clearedCaches.push(...result.clearedCaches);
      masterStats.errors.push(...result.errors);
      masterStats.totalClearedItems += result.totalClearedItems;
    } catch (error) {
      masterStats.errors.push(`Operation failed: ${error}`);
    }
  }

  // Clear Next.js cache last
  try {
    const nextCleared = await clearNextJsCache();
    if (nextCleared) {
      masterStats.clearedCaches.push('Next.js cache');
      masterStats.totalClearedItems++;
    }
  } catch (error) {
    masterStats.errors.push(`Next.js cache: ${error}`);
  }

  return masterStats;
}

/**
 * Selective cache clearing based on patterns
 */
export function clearCachesByPattern(patterns: string[]): CacheStats {
  const stats: CacheStats = {
    clearedCaches: [],
    errors: [],
    totalClearedItems: 0
  };

  try {
    // Clear localStorage items matching patterns
    Object.keys(localStorage).forEach(key => {
      if (patterns.some(pattern => key.includes(pattern))) {
        localStorage.removeItem(key);
        stats.totalClearedItems++;
      }
    });

    // Clear sessionStorage items matching patterns
    Object.keys(sessionStorage).forEach(key => {
      if (patterns.some(pattern => key.includes(pattern))) {
        sessionStorage.removeItem(key);
        stats.totalClearedItems++;
      }
    });

    stats.clearedCaches.push(`Pattern-based cache (${patterns.join(', ')})`);
  } catch (error) {
    stats.errors.push(`Pattern cache: ${error}`);
  }

  return stats;
}

/**
 * Create a cache monitoring utility
 */
export function createCacheMonitor() {
  const cacheUsage: { [key: string]: number } = {};

  return {
    track(cacheName: string, size: number) {
      cacheUsage[cacheName] = size;
    },

    getUsage() {
      return { ...cacheUsage };
    },

    getTotalSize() {
      return Object.values(cacheUsage).reduce((total, size) => total + size, 0);
    },

    clear() {
      Object.keys(cacheUsage).forEach(key => {
        delete cacheUsage[key];
      });
    }
  };
}
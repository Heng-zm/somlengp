
// Custom hook for managing cleanup operations
import { useEffect, useRef, useCallback } from 'react';

interface CleanupManager {
  addEventListenerCleanup: (element: Element | Window, event: string, handler: EventListener) => void;
  addIntervalCleanup: (intervalId: number) => void;
  addTimeoutCleanup: (timeoutId: number) => void;
  addGenericCleanup: (cleanupFn: () => void) => void;
}

export function useCleanup(): CleanupManager {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addEventListenerCleanup = useCallback((element: Element | Window, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    cleanupFunctions.current.push(() => {
      element.removeEventListener(event, handler);
    });
  }, []);

  const addIntervalCleanup = useCallback((intervalId: number) => {
    cleanupFunctions.current.push(() => {
      clearInterval(intervalId);
    });
  }, []);

  const addTimeoutCleanup = useCallback((timeoutId: number) => {
    cleanupFunctions.current.push(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const addGenericCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return {
    addEventListenerCleanup,
    addIntervalCleanup,
    addTimeoutCleanup,
    addGenericCleanup
  };
}

import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback that doesn't change between renders
 * but always calls the latest version of the callback
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);
  
  // Update the ref with the latest callback
  callbackRef.current = callback;
  
  // Return a stable callback that calls the latest version
  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Creates a memoized value that only updates when dependencies actually change
 * (deep comparison for objects/arrays)
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();
  
  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }
  
  return ref.current.value;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * A more stable version of useCallback that ignores function reference changes
 * when the function body hasn't actually changed
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const memoizedDeps = useDeepMemo(() => deps, deps);
  return useCallback(callback, memoizedDeps);
}
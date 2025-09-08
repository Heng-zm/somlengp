// Lazy-loaded components for Text Tools optimization
"use client";

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy loading spinner component
function LazyLoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-blue-600 absolute inset-0"></div>
          </div>
          <p className="text-sm text-slate-600 font-medium">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Lazy load heavy components
export const LazyTextInputArea = lazy(() =>
  import('./text-utility-components').then(module => ({
    default: module.TextInputArea
  }))
);

export const LazyTextOutputArea = lazy(() =>
  import('./text-utility-components').then(module => ({
    default: module.TextOutputArea
  }))
);

export const LazyUtilityActionCard = lazy(() =>
  import('./text-utility-components').then(module => ({
    default: module.UtilityActionCard
  }))
);

export const LazyComparisonView = lazy(() =>
  import('./text-utility-components').then(module => ({
    default: module.ComparisonView
  }))
);

// Note: Keyboard shortcuts dialog would be loaded when implemented
// export const LazyKeyboardShortcuts = lazy(() =>
//   import('./keyboard-shortcuts-dialog').then(module => ({
//     default: module.KeyboardShortcutsDialog
//   }))
// );

// Wrapped components with Suspense
export function SuspenseTextInputArea(props: any) {
  return (
    <Suspense fallback={<LazyLoadingSpinner message="Loading text input..." />}>
      <LazyTextInputArea {...props} />
    </Suspense>
  );
}

export function SuspenseTextOutputArea(props: any) {
  return (
    <Suspense fallback={<LazyLoadingSpinner message="Loading text output..." />}>
      <LazyTextOutputArea {...props} />
    </Suspense>
  );
}

export function SuspenseUtilityActionCard(props: any) {
  return (
    <Suspense fallback={<LazyLoadingSpinner message="Loading tool..." />}>
      <LazyUtilityActionCard {...props} />
    </Suspense>
  );
}

export function SuspenseComparisonView(props: any) {
  return (
    <Suspense fallback={<LazyLoadingSpinner message="Loading comparison..." />}>
      <LazyComparisonView {...props} />
    </Suspense>
  );
}

// Progressive loading hook for better UX
import { useState, useEffect } from 'react';

export function useProgressiveLoading(delay: number = 100) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isLoaded;
}

// Code splitting utility for dynamic imports
export async function loadTextProcessor(processorName: string) {
  try {
    switch (processorName) {
      case 'advanced-stats':
        // Future: advanced text processors
        return await import('../utils/text-processors');
      case 'diff-engine':
        // Future: dedicated diff engine
        return await import('../utils/text-processors');
      case 'regex-tools':
        // Future: regex utilities
        return await import('../utils/text-processors');
      default:
        return await import('../utils/text-processors');
    }
  } catch (error) {
    console.error(`Failed to load text processor: ${processorName}`, error);
    // Fallback to basic processors
    return await import('../utils/text-processors');
  }
}

// Bundle size optimization utilities
export const BUNDLE_CONFIG = {
  // Critical components loaded immediately
  critical: ['TextInputArea', 'TextOutputArea'],
  
  // Secondary components loaded on demand
  secondary: ['UtilityActionCard', 'ComparisonView'],
  
  // Heavy components loaded lazily
  heavy: ['KeyboardShortcuts', 'AdvancedStats', 'RegexTools'],
  
  // Chunk size limits
  maxChunkSize: 50000, // 50KB
  
  // Prefetch priority
  prefetchPriority: {
    high: ['text-processors'],
    medium: ['performance-utils'],
    low: ['advanced-features']
  }
};

// Dynamic component loader with error boundaries
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType<any>
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedLazyComponent(props: P) {
    return (
      <Suspense fallback={<LazyLoadingSpinner />}>
        <ErrorBoundary fallback={fallback}>
          <LazyComponent {...(props as any)} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

// Simple error boundary for lazy components
import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent />;
      }
      
      return (
        <Card className="w-full border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-700 text-sm">
              <p className="font-medium">Component failed to load</p>
              <p className="text-xs mt-1">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Resource preloader for better performance
export class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedModules = new Map<string, any>();

  static getInstance() {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  async preload(moduleName: string, importFn: () => Promise<any>) {
    if (this.preloadedModules.has(moduleName)) {
      return this.preloadedModules.get(moduleName);
    }

    try {
      const module = await importFn();
      this.preloadedModules.set(moduleName, module);
      return module;
    } catch (error) {
      console.warn(`Failed to preload module: ${moduleName}`, error);
      return null;
    }
  }

  getPreloaded(moduleName: string) {
    return this.preloadedModules.get(moduleName);
  }

  // Preload critical modules on app start
  async preloadCritical() {
    const criticalModules = [
      {
        name: 'text-processors',
        import: () => import('../utils/text-processors')
      },
      {
        name: 'performance-utils',
        import: () => import('../utils/performance-utils')
      }
    ];

    await Promise.allSettled(
      criticalModules.map(module => 
        this.preload(module.name, module.import)
      )
    );
  }
}

// Initialize preloader
if (typeof window !== 'undefined') {
  // Preload critical modules when the browser is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      ResourcePreloader.getInstance().preloadCritical();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      ResourcePreloader.getInstance().preloadCritical();
    }, 1000);
  }
}

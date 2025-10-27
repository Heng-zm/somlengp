/**
 * Dynamic Import Optimization Utilities
 * Provides advanced code splitting and lazy loading patterns
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { lazy, ComponentType } from 'react';

// ============================================================================
// DYNAMIC IMPORT FACTORIES
// ============================================================================

/**
 * Creates a dynamically imported component with optimized loading states
 */
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
    preload?: boolean;
  } = {}
) {
  const { 
    loading = () => <div className="animate-pulse bg-gray-200 rounded h-32" />,
    ssr = true,
    preload = false 
  } = options;

  const DynamicComponent = dynamic(importFn, {
    loading: ({ isLoading, error }) => {
      if (error) {
        return (
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <p className="text-red-700">Failed to load component</p>
          </div>
        );
      }
      
      if (isLoading) {
        const LoadingComponent = loading as React.ComponentType<any>;
        return <LoadingComponent />;
      }
      
      return null;
    },
    ssr
  });

  // Preload component on component mount if requested
  if (preload && typeof window !== 'undefined') {
    // Preload after a short delay to avoid blocking initial render
    setTimeout(() => {
      importFn();
    }, 100);
  }

  return DynamicComponent;
}

/**
 * Creates a lazy-loaded component with React.lazy
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>
) {
  return lazy(importFn);
}

// ============================================================================
// COMPONENT-SPECIFIC DYNAMIC IMPORTS
// ============================================================================

// Charts and Data Visualization
export const DynamicChart = createDynamicComponent(
  () => import('@/components/ui/chart'),
  { 
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false // Charts often use browser APIs
  }
);

export const DynamicDataGrid = createDynamicComponent(
  () => import('@/components/ui/data-grid'),
  {
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
  }
);

// Calendar and Date Pickers
export const DynamicCalendar = createDynamicComponent(
  () => import('@/components/ui/calendar'),
  {
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
  }
);

// QR Code Components
export const DynamicQRGenerator = createDynamicComponent(
  () => import('@/components/qr-generator/qr-mobile-optimized'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading QR Generator...</div>
    </div>
  }
);

export const DynamicQRScanner = createDynamicComponent(
  () => import('@/components/qr-scanner'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading QR Scanner...</div>
    </div>,
    ssr: false // Camera access requires browser
  }
);

// AI Assistant Components
export const DynamicAIChat = createDynamicComponent(
  () => import('@/components/ai-assistant/optimized-message-list'),
  {
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
  }
);

// Comments System
export const DynamicCommentsSystem = createDynamicComponent(
  () => import('@/components/features/comments/OptimizedCommentsSystem'),
  {
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
);

// Image Processing Components
export const DynamicImageProcessor = createDynamicComponent(
  () => import('@/components/enhanced-mobile-image-uploader'),
  {
    loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
    ssr: false // Image processing uses browser APIs
  }
);

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// ============================================================================

// Page-level components for route-based splitting
export const DynamicHomePage = createDynamicComponent(
  () => import('@/app/home/page')
);

export const DynamicQRPage = createDynamicComponent(
  () => import('@/app/generate-qr-code/page')
);

export const DynamicAIPage = createDynamicComponent(
  () => import('@/app/ai-assistant/page')
);

export const DynamicHistoryPage = createDynamicComponent(
  () => import('@/app/history/page')
);

// ============================================================================
// FEATURE-BASED DYNAMIC LOADING
// ============================================================================

/**
 * Feature flags for conditional loading
 */
export interface FeatureFlags {
  qrGeneration: boolean;
  aiAssistant: boolean;
  comments: boolean;
  imageProcessing: boolean;
  analytics: boolean;
}

/**
 * Conditionally loads features based on flags
 */
export function createConditionalComponent<T extends React.JSX.IntrinsicAttributes = {}>(
  featureKey: keyof FeatureFlags,
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType<T>
) {
  return function ConditionalComponent(props: T & { features?: FeatureFlags }) {
    const { features, ...componentProps } = props;
    
    if (features && !features[featureKey]) {
      const FallbackComponent = fallback;
      return FallbackComponent ? <FallbackComponent {...componentProps as T} /> : null;
    }
    
    const DynamicComponent = createDynamicComponent(importFn);
    return <DynamicComponent {...componentProps as T} />;
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Monitors dynamic import performance
 */
export class DynamicImportMonitor {
  private static instance: DynamicImportMonitor;
  private metrics: Map<string, { loadTime: number; size?: number }> = new Map();

  static getInstance() {
    if (!DynamicImportMonitor.instance) {
      DynamicImportMonitor.instance = new DynamicImportMonitor();
    }
    return DynamicImportMonitor.instance;
  }

  startTiming(componentName: string) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        this.metrics.set(componentName, { loadTime });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Dynamic component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        }
        
        return loadTime;
      }
    };
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metrics]) => ({
      component: name,
      ...metrics
    }));
  }

  reset() {
    this.metrics.clear();
  }
}

/**
 * HOC for monitoring dynamic component load times
 */
export function withLoadTimeMonitoring<T extends {}>(
  WrappedComponent: ComponentType<T>,
  componentName: string
) {
  const monitor = DynamicImportMonitor.getInstance();
  
  return function MonitoredComponent(props: T) {
    const timer = monitor.startTiming(componentName);
    
    React.useEffect(() => {
      // Start timing when component mounts, end when it unmounts
      return () => {
        timer.end();
      };
    }, [timer]);
    
    return <WrappedComponent {...props} />;
  };
}

// ============================================================================
// PRELOADING STRATEGIES
// ============================================================================

/**
 * Preloads components on user interaction
 */
export function preloadOnHover(importFn: () => Promise<any>) {
  return {
    onMouseEnter: () => {
      importFn();
    },
    onFocus: () => {
      importFn();
    }
  };
}

/**
 * Preloads components on viewport intersection
 */
export function preloadOnViewport(importFn: () => Promise<any>, threshold = 0.1) {
  return function usePreloadOnViewport(ref: React.RefObject<Element>) {
    React.useEffect(() => {
      if (!ref.current) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              importFn();
              observer.disconnect();
            }
          });
        },
        { threshold }
      );
      
      observer.observe(ref.current);
      
      return () => observer.disconnect();
    }, [ref]);
  };
}

/**
 * Preloads components based on network conditions
 */
export function preloadOnNetwork(
  importFn: () => Promise<any>,
  conditions: {
    connectionType?: string[];
    minDownlink?: number;
  } = {}
) {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return;
  }
  
  const connection = (navigator as any).connection;
  
  if (conditions.connectionType && !conditions.connectionType.includes(connection.effectiveType)) {
    return;
  }
  
  if (conditions.minDownlink && connection.downlink < conditions.minDownlink) {
    return;
  }
  
  importFn();
}

// ============================================================================
// BUNDLE ANALYSIS HELPERS
// ============================================================================

/**
 * Analyzes bundle impact of dynamic imports
 */
export function analyzeBundleImpact() {
  if (process.env.NODE_ENV === 'development') {
    const monitor = DynamicImportMonitor.getInstance();
    const metrics = monitor.getMetrics();
    
    console.table(metrics);
    
    const totalLoadTime = metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    console.log(`Total dynamic load time: ${totalLoadTime.toFixed(2)}ms`);
    
    return metrics;
  }
  
  return [];
}

export default {
  createDynamicComponent,
  createLazyComponent,
  DynamicChart,
  DynamicDataGrid,
  DynamicCalendar,
  DynamicQRGenerator,
  DynamicQRScanner,
  DynamicAIChat,
  DynamicCommentsSystem,
  DynamicImageProcessor,
  createConditionalComponent,
  DynamicImportMonitor,
  withLoadTimeMonitoring,
  preloadOnHover,
  preloadOnViewport,
  preloadOnNetwork,
  analyzeBundleImpact
};
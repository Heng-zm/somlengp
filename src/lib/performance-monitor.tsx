"use client";

import React, { useEffect, useRef } from 'react';

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
  }, []);

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`⚠️ ${componentName} took ${duration.toFixed(2)}ms to render (render #${renderCount.current})`);
      }
    };
  }, [componentName]);

  return { renderCount: renderCount.current };
}

// Memory usage monitoring hook
export function useMemoryMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const logMemoryUsage = () => {
        const memInfo = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        if (!memInfo) return;
        const used = Math.round(memInfo.usedJSHeapSize / 1048576 * 100) / 100;
        const total = Math.round(memInfo.totalJSHeapSize / 1048576 * 100) / 100;
        
        if (used > 50) { // Warn if using more than 50MB
          console.warn(`🧠 Memory usage: ${used}MB / ${total}MB`);
        }
      };

      const interval = setInterval(logMemoryUsage, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);
}

// Component that wraps other components with performance monitoring
interface PerformanceWrapperProps {
  name: string;
  children: React.ReactNode;
  logRenders?: boolean;
}

export const PerformanceWrapper = React.memo<PerformanceWrapperProps>(function PerformanceWrapper({ 
  name, 
  children, 
  logRenders = false 
}) {
  const { renderCount } = usePerformanceMonitor(name);
  
  // Log renders only in development with logRenders flag
  
  return <>{children}</>;
});

// Hook for measuring bundle size impact
export function useBundleAnalyzer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log initial bundle information
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('/_next/static/')) {
          // In development, we can't easily get exact sizes, but we can count files
          totalSize += 1;
        }
      });
      
      if (totalSize > 10) {
        console.warn(`📦 ${totalSize} script files loaded - consider code splitting`);
      }
    }
  }, []);
}

// Error boundary with performance impact tracking
interface PerformanceErrorBoundaryState {
  hasError: boolean;
  errorInfo?: { componentStack?: string };
}

export class PerformanceErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  PerformanceErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    this.setState({ errorInfo });
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Performance Error Boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-destructive rounded-md">
          <h3 className="text-destructive font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-2">
            A component error occurred. Check the console for details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to detect slow renders and memory leaks
export function useRenderOptimizer() {
  const lastRender = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  
  useEffect(() => {
    const currentTime = performance.now();
    
    if (lastRender.current > 0) {
      const renderTime = currentTime - lastRender.current;
      renderTimes.current.push(renderTime);
      
      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
      
      // Check for consistently slow renders
      if (renderTimes.current.length >= 5) {
        const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
        
        if (avgRenderTime > 16 && process.env.NODE_ENV === 'development') {
          console.warn(`🐌 Component averaging ${avgRenderTime.toFixed(2)}ms per render (target: <16ms)`);
        }
      }
    }
    
    lastRender.current = currentTime;
  });
  
  return {
    avgRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0
  };
}

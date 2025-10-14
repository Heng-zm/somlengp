'use client';

import React, { memo, useCallback, useMemo, ErrorInfo, Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface OptimizedWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enablePerformanceMonitoring?: boolean;
}

interface OptimizedWrapperState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class OptimizedWrapperComponent extends Component<OptimizedWrapperProps, OptimizedWrapperState> {
  private performanceStart = 0;
  private performanceObserver?: PerformanceObserver;

  constructor(props: OptimizedWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): OptimizedWrapperState {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OptimizedWrapper caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    if (this.props.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
    this.performanceStart = performance.now();
  }

  componentDidUpdate() {
    if (this.props.enablePerformanceMonitoring) {
      const renderTime = performance.now() - this.performanceStart;
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
      }
    }
  }

  componentWillUnmount() {
    this.performanceObserver?.disconnect();
  }

  private setupPerformanceMonitoring = () => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            console.log(`Performance: ${entry.name} - ${entry.duration?.toFixed(2)}ms`);
          }
        });
      });
      
      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 text-center mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            disabled={this.state.retryCount >= 3}
          >
            <RefreshCw className="w-4 h-4" />
            {this.state.retryCount >= 3 ? 'Max retries reached' : 'Try again'}
          </button>
          {this.state.retryCount > 0 && (
            <p className="text-sm text-red-500 mt-2">Retry attempt: {this.state.retryCount}/3</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Memoized wrapper with performance optimizations
export const OptimizedWrapper = memo<OptimizedWrapperProps>((
  props: OptimizedWrapperProps
) => {
  const memoizedProps = useMemo(() => props, [
    props.children,
    props.fallback,
    props.onError,
    props.enablePerformanceMonitoring
  ]);

  return <OptimizedWrapperComponent {...memoizedProps} />;
});

OptimizedWrapper.displayName = 'OptimizedWrapper';

// Higher-order component for adding performance monitoring
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  const WithPerformanceMonitoringComponent = memo((props: T) => {
    const handleError = useCallback((error: Error, errorInfo: ErrorInfo) => {
      console.error('Performance monitored component error:', error, errorInfo);
    }, []);

    return (
      <OptimizedWrapper
        enablePerformanceMonitoring
        onError={handleError}
      >
        <WrappedComponent {...props} />
      </OptimizedWrapper>
    );
  });

  WithPerformanceMonitoringComponent.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithPerformanceMonitoringComponent;
}

// Hook for component performance tracking
export function useComponentPerformance(componentName: string) {
  const startTime = useMemo(() => performance.now(), []);
  
  React.useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 50) { // Log components that take more than 50ms to mount
      console.log(`${componentName} mount time: ${duration.toFixed(2)}ms`);
    }
    
    return () => {
      const unmountTime = performance.now();
      console.log(`${componentName} was mounted for: ${(unmountTime - endTime).toFixed(2)}ms`);
    };
  }, [componentName, startTime]);
  
  return useMemo(() => ({
    startTime,
    measureRender: (renderName: string) => {
      const measureStart = performance.now();
      return () => {
        const measureEnd = performance.now();
        console.log(`${componentName}.${renderName}: ${(measureEnd - measureStart).toFixed(2)}ms`);
      };
    }
  }), [componentName, startTime]);
}

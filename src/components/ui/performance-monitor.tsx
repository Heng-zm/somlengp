"use client";

import { useEffect, useState, useRef } from 'react';
import { useStableCallback } from '@/hooks/use-stable-callback';

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    limit: number;
  };
  timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  networkStatus: 'online' | 'offline';
  connectionType?: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  intervalMs?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugOverlay?: boolean;
  threshold?: {
    minFps?: number;
    maxMemoryMB?: number;
  };
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  intervalMs = 1000,
  onMetricsUpdate,
  showDebugOverlay = false,
  threshold = { minFps: 30, maxMemoryMB: 100 }
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  const calculateFPS = useStableCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    
    if (delta >= intervalMs) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      return fps;
    }
    
    frameCountRef.current++;
    return null;
  });

  const getMemoryInfo = useStableCallback((): { used: number; limit: number } => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      };
    }
    return { used: 0, limit: 0 };
  });

  const getTimingMetrics = useStableCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime || 0,
      loadComplete: navigation?.loadEventEnd - navigation?.startTime || 0,
      firstPaint,
      firstContentfulPaint,
    };
  });

  const getNetworkInfo = useStableCallback(() => {
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    const connectionType = (navigator as any).connection?.effectiveType || 'unknown';
    
    return { networkStatus, connectionType };
  }, []);

  const checkThresholds = useStableCallback((currentMetrics: PerformanceMetrics) => {
    const newWarnings: string[] = [];
    
    if (threshold.minFps && currentMetrics.fps < threshold.minFps) {
      newWarnings.push(`Low FPS: ${currentMetrics.fps} (threshold: ${threshold.minFps})`);
    }
    
    if (threshold.maxMemoryMB && currentMetrics.memory.used > threshold.maxMemoryMB) {
      newWarnings.push(`High memory usage: ${currentMetrics.memory.used}MB (threshold: ${threshold.maxMemoryMB}MB)`);
    }
    
    if (currentMetrics.networkStatus === 'offline') {
      newWarnings.push('Network offline');
    }
    
    setWarnings(newWarnings);
    
    // Log warnings to console in development
    if (process.env.NODE_ENV === 'development' && newWarnings.length > 0) {
      console.warn('Performance warnings:', newWarnings);
    }
  }, [threshold]);

  const updateMetrics = useStableCallback(() => {
    if (!enabled) return;

    const fps = calculateFPS();
    if (fps === null) return; // Skip if FPS calculation is not ready

    const memory = getMemoryInfo();
    const timing = getTimingMetrics();
    const { networkStatus, connectionType } = getNetworkInfo();

    const currentMetrics: PerformanceMetrics = {
      fps,
      memory,
      timing,
      networkStatus: networkStatus as 'online' | 'offline',
      connectionType,
    };

    setMetrics(currentMetrics);
    checkThresholds(currentMetrics);
    onMetricsUpdate?.(currentMetrics);
  }, [enabled, calculateFPS, getMemoryInfo, getTimingMetrics, getNetworkInfo, checkThresholds, onMetricsUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(updateMetrics, intervalMs);
    
    // Initial metrics collection
    updateMetrics();

    // Listen for network changes
    const handleOnline = () => updateMetrics();
    const handleOffline = () => updateMetrics();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, intervalMs, updateMetrics]);

  // Performance observer for detailed metrics
  useEffect(() => {
    if (!enabled || typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
          // Log long tasks in development
          if (process.env.NODE_ENV === 'development' && entry.duration > 50) {
            console.warn(`Long task detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'longtask'] });
    } catch (e) {
      console.warn('Performance observer not fully supported');
    }

    return () => observer.disconnect();
  }, [enabled]);

  if (!showDebugOverlay || !metrics) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 p-3 bg-black/80 text-white rounded-lg text-xs font-mono backdrop-blur-sm max-w-xs">
      <div className="mb-2 font-semibold text-green-400">Performance Monitor</div>
      
      <div className="space-y-1">
        <div className={`${metrics.fps < (threshold.minFps || 30) ? 'text-red-400' : 'text-green-400'}`}>
          FPS: {metrics.fps}
        </div>
        
        <div className={`${metrics.memory.used > (threshold.maxMemoryMB || 100) ? 'text-red-400' : 'text-blue-400'}`}>
          Memory: {metrics.memory.used}MB / {metrics.memory.limit}MB
        </div>
        
        <div className="text-yellow-400">
          Network: {metrics.networkStatus} ({metrics.connectionType})
        </div>
        
        <div className="text-purple-400">
          DOM: {metrics.timing.domContentLoaded.toFixed(0)}ms
        </div>
        
        <div className="text-cyan-400">
          FCP: {metrics.timing.firstContentfulPaint.toFixed(0)}ms
        </div>
        
        {warnings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-red-400/30">
            <div className="text-red-400 mb-1">Warnings:</div>
            {warnings.map((warning, index) => (
              <div key={index} className="text-red-300 text-xs">
                • {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for accessing performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  useEffect(() => {
    const monitor = document.querySelector('[data-performance-monitor]');
    if (!monitor) return;
    
    const handleMetricsUpdate = (event: CustomEvent<PerformanceMetrics>) => {
      setMetrics(event.detail);
    };
    
    monitor.addEventListener('metricsUpdate', handleMetricsUpdate as EventListener);
    
    return () => {
      monitor.removeEventListener('metricsUpdate', handleMetricsUpdate as EventListener);
    };
  }, []);
  
  return metrics;
}

// Utility function for measuring custom performance
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  performance.mark(`${name}-start`);
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
  
  if (process.env.NODE_ENV === 'development' && duration > 16) {
    console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

// Component for measuring render performance
export function RenderPerformanceWrapper({ 
  name, 
  children 
}: { 
  name: string; 
  children: React.ReactNode; 
}) {
  const renderStart = useRef(performance.now());
  
  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;
    
    performance.mark(`${name}-render-end`);
    performance.measure(`${name}-render`, renderStart.current, renderEnd);
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`Slow render detected: ${name} took ${renderTime.toFixed(2)}ms`);
    }
  });
  
  renderStart.current = performance.now();
  performance.mark(`${name}-render-start`);
  
  return <>{children}</>;
}
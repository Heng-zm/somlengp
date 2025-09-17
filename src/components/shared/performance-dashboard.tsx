'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Timer, Eye, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  domContentLoaded?: number;
  fullyLoaded?: number;
  memoryUsage?: number;
  connectionType?: string;
  renderCount?: number;
  bundleSize?: number;
}
interface PerformanceThresholds {
  good: number;
  needs_improvement: number;
}
const METRIC_THRESHOLDS: Record<string, PerformanceThresholds> = {
  fcp: { good: 1800, needs_improvement: 3000 },
  lcp: { good: 2500, needs_improvement: 4000 },
  fid: { good: 100, needs_improvement: 300 },
  cls: { good: 0.1, needs_improvement: 0.25 },
  ttfb: { good: 800, needs_improvement: 1800 },
  domContentLoaded: { good: 1500, needs_improvement: 3000 },
  fullyLoaded: { good: 3000, needs_improvement: 5000 }
};
const getPerformanceRating = (value: number, metric: keyof typeof METRIC_THRESHOLDS): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = METRIC_THRESHOLDS[metric];
  if (!thresholds) return 'good';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needs_improvement) return 'needs-improvement';
  return 'poor';
};
const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'good': return 'text-green-600 bg-green-50 border-green-200';
    case 'needs-improvement': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'poor': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
const formatMetricValue = (value: number, metric: string): string => {
  if (metric === 'cls') return value.toFixed(3);
  if (metric === 'memoryUsage') return `${Math.round(value / 1024 / 1024)}MB`;
  return `${Math.round(value)}ms`;
};
// Real-time performance monitor
class RealTimePerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.startMemoryMonitoring();
    }
  }
  private initializeObservers() {
    // Observe paint metrics (FCP, LCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('fcp', entry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
    }
    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
    }
    // Observe FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & { processingStart: number };
          this.updateMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
    }
    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
            this.updateMetric('cls', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
    }
    // Observe navigation timing
    this.observeNavigationTiming();
  }
  private observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const updateNavigationMetrics = () => {
        const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entry) {
          this.updateMetric('ttfb', entry.responseStart - entry.requestStart);
          this.updateMetric('domContentLoaded', entry.domContentLoadedEventEnd - entry.fetchStart);
          this.updateMetric('fullyLoaded', entry.loadEventEnd - entry.fetchStart);
        }
      };
      if (document.readyState === 'complete') {
        updateNavigationMetrics();
      } else {
        window.addEventListener('load', updateNavigationMetrics);
      }
    }
  }
  private memoryCheckInterval?: NodeJS.Timeout;
  private startMemoryMonitoring() {
    const checkMemory = () => {
      try {
        if ('memory' in performance) {
          const memInfo = (performance as any).memory;
          if (memInfo && typeof memInfo.usedJSHeapSize === 'number') {
            this.updateMetric('memoryUsage', memInfo.usedJSHeapSize);
          }
        }
      } catch (error) {
      }
    };
    checkMemory();
    this.memoryCheckInterval = setInterval(checkMemory, 5000); // Check every 5 seconds
  }
  private updateMetric(key: Exclude<keyof PerformanceMetrics, 'connectionType'>, value: number) {
    // Type assertion is safe here since we've excluded non-numeric properties
    (this.metrics as Record<string, number>)[key] = value;
    this.notifyCallbacks();
  }
  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback({ ...this.metrics }));
  }
  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    // Immediately call with current metrics
    callback({ ...this.metrics });
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  public getConnectionType(): string {
    const nav = navigator as unknown as { connection?: { effectiveType?: string } };
    if (nav.connection) {
      return nav.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.callbacks = [];
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
  }
}
// Metric card component
const MetricCard = memo(function MetricCard({ 
  title, 
  value, 
  metric, 
  icon: Icon, 
  description 
}: { 
  title: string; 
  value: number | undefined; 
  metric: string; 
  icon: React.ElementType; 
  description: string; 
}) {
  if (value === undefined) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </div>
      </Card>
    );
  }
  const rating = getPerformanceRating(value, metric as keyof typeof METRIC_THRESHOLDS);
  const colorClass = getRatingColor(rating);
  const formattedValue = formatMetricValue(value, metric);
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="space-y-2">
        <Badge className={cn("font-mono", colorClass)}>
          {formattedValue}
        </Badge>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
});
// Performance score calculator
const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  const weights = {
    fcp: 0.15,
    lcp: 0.25,
    fid: 0.25,
    cls: 0.15,
    ttfb: 0.1,
    domContentLoaded: 0.1
  };
  let totalScore = 0;
  let totalWeight = 0;
  Object.entries(weights).forEach(([metric, weight]) => {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (typeof value === 'number') {
      const rating = getPerformanceRating(value, metric as keyof typeof METRIC_THRESHOLDS);
      const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
      totalScore += score * weight;
      totalWeight += weight;
    }
  });
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};
interface PerformanceDashboardProps {
  className?: string;
  compact?: boolean;
  autoRefresh?: boolean;
}
export const PerformanceDashboard = memo(function PerformanceDashboard({ 
  className, 
  compact = false, 
  autoRefresh = true 
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);
  const monitorRef = useRef<RealTimePerformanceMonitor>();
  useEffect(() => {
    if (autoRefresh && typeof window !== 'undefined') {
      monitorRef.current = new RealTimePerformanceMonitor();
      const unsubscribe = monitorRef.current.subscribe(setMetrics);
      return () => {
        unsubscribe();
        monitorRef.current?.destroy();
      };
    }
  }, [autoRefresh]);
  const performanceScore = calculatePerformanceScore(metrics);
  const scoreColor = performanceScore >= 80 ? 'text-green-600' : performanceScore >= 50 ? 'text-orange-600' : 'text-red-600';
  if (compact) {
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Performance</span>
              <span className={cn("text-lg font-bold", scoreColor)}>
                {performanceScore}
              </span>
            </div>
            <Progress value={performanceScore} className="h-1 mt-1" />
          </div>
        </div>
      </Card>
    );
  }
  return (
    <div className={cn("space-y-4", className)}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Dashboard
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? 'Hide' : 'Show'} Details
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={cn("text-3xl font-bold", scoreColor)}>
                {performanceScore}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="flex-1">
              <Progress value={performanceScore} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                Performance Score (0-100)
              </div>
            </div>
          </div>
          {monitorRef.current && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="w-4 h-4" />
              Connection: {monitorRef.current.getConnectionType()}
            </div>
          )}
        </div>
      </Card>
      {isVisible && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="First Contentful Paint"
            value={metrics.fcp}
            metric="fcp"
            icon={Eye}
            description="Time until first content appears"
          />
          <MetricCard
            title="Largest Contentful Paint"
            value={metrics.lcp}
            metric="lcp"
            icon={Zap}
            description="Time until largest content loads"
          />
          <MetricCard
            title="First Input Delay"
            value={metrics.fid}
            metric="fid"
            icon={Timer}
            description="Delay before first interaction"
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={metrics.cls}
            metric="cls"
            icon={Activity}
            description="Visual stability score"
          />
          <MetricCard
            title="Time to First Byte"
            value={metrics.ttfb}
            metric="ttfb"
            icon={Wifi}
            description="Server response time"
          />
          <MetricCard
            title="DOM Content Loaded"
            value={metrics.domContentLoaded}
            metric="domContentLoaded"
            icon={Timer}
            description="Time until DOM is ready"
          />
        </div>
      )}
    </div>
  );
});
// Development-only performance overlay
export const PerformanceOverlay = memo(function PerformanceOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <PerformanceDashboard compact />
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
});

// Default export for lazy loading
export default PerformanceDashboard;

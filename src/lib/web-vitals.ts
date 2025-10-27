'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Enhanced Web Vitals tracking with analytics integration
export interface VitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: VitalMetric) {
  // Send to your analytics service
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Example: Google Analytics 4
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.rating,
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Fail silently for analytics
    });
  }
}

export function reportWebVitals(onPerfEntry?: (metric: VitalMetric) => void) {
  if (typeof window === 'undefined') return;

  const handleMetric = (metric: any) => {
    const enhancedMetric: VitalMetric = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: getRating(metric.name, metric.value),
    };

    // Send to analytics
    sendToAnalytics(enhancedMetric);

    // Call custom callback if provided
    if (onPerfEntry) {
      onPerfEntry(enhancedMetric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const color = 
        enhancedMetric.rating === 'good' ? '#0f5132' :
        enhancedMetric.rating === 'needs-improvement' ? '#664d03' : '#842029';
      
      console.log(`%c${enhancedMetric.name}: ${enhancedMetric.value / 100}ms (${enhancedMetric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }
  };

  // Measure all Core Web Vitals
  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

// Advanced performance monitoring
export class PerformanceObserver {
  private static instance: PerformanceObserver;
  private observers: Map<string, any> = new Map();
  private metrics: Map<string, VitalMetric> = new Map();

  static getInstance(): PerformanceObserver {
    if (!PerformanceObserver.instance) {
      PerformanceObserver.instance = new PerformanceObserver();
    }
    return PerformanceObserver.instance;
  }

  start() {
    if (typeof window === 'undefined') return;

    reportWebVitals((metric) => {
      this.metrics.set(metric.name, metric);
      this.emitMetric(metric);
    });

    // Additional performance monitoring
    this.monitorResourceTiming();
    this.monitorLongTasks();
    this.monitorMemoryUsage();
  }

  private monitorResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.transferSize > 1000000) { // Resources larger than 1MB
            console.warn(`Large resource detected: ${entry.name} (${(entry.transferSize / 1024 / 1024).toFixed(2)}MB)`);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', observer);
      } catch (e) {
        console.warn('Resource timing observer not supported');
      }
    }
  }

  private monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.warn(`Long task detected: ${entry.duration}ms`);
          
          // Send long task data to analytics
          if (process.env.NODE_ENV === 'production') {
            this.sendToAnalytics({
              type: 'long-task',
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', observer);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          console.warn(`High memory usage: ${usedPercent.toFixed(1)}%`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private emitMetric(metric: VitalMetric) {
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('perf-metric', { detail: metric }));
  }

  private sendToAnalytics(data: any) {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(() => {
      // Fail silently
    });
  }

  getMetrics(): Map<string, VitalMetric> {
    return this.metrics;
  }

  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// React hook for using performance metrics
import { useEffect, useState } from 'react';

export function useWebVitals() {
  const [metrics, setMetrics] = useState<Map<string, VitalMetric>>(new Map());

  useEffect(() => {
    const observer = PerformanceObserver.getInstance();
    observer.start();

    const handleMetric = (event: any) => {
      const metric = event.detail as VitalMetric;
      setMetrics(prev => new Map(prev.set(metric.name, metric)));
    };

    window.addEventListener('perf-metric', handleMetric);

    return () => {
      window.removeEventListener('perf-metric', handleMetric);
    };
  }, []);

  return metrics;
}
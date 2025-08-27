'use client';

import { useEffect, useRef, memo } from 'react';
import { usePathname } from 'next/navigation';
import { getPerformanceTracker } from '@/lib/performance-tracker';

// Extended analytics interface for performance tracking
interface AnalyticsData {
  event: string;
  properties?: Record<string, string | number | boolean>;
  performance?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    loadTime?: number;
  };
  user?: {
    connection?: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
}

// Enhanced analytics event tracking
class EnhancedAnalytics {
  private performanceTracker = getPerformanceTracker();
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.setupErrorTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track page views with performance data
  trackPageView(url: string) {
    const performanceData = this.performanceTracker.getPerformanceData();
    const vitalsMap = performanceData.vitals.reduce((acc, vital) => ({
      ...acc,
      [vital.name]: vital.value
    }), {});

    this.track('page_view', {
      url,
      referrer: document.referrer,
      sessionId: this.sessionId,
      performance: vitalsMap,
      user: {
        connection: performanceData.connection,
        userAgent: performanceData.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    });
  }

  // Track performance violations
  trackPerformanceViolation(metric: string, value: number, threshold: number) {
    this.track('performance_violation', {
      metric,
      value,
      threshold,
      severity: value > threshold * 2 ? 'high' : 'medium',
      sessionId: this.sessionId
    });
  }

  // Track user interactions with performance context
  trackInteraction(action: string, element?: string, context?: Record<string, string | number | boolean>) {
    this.track('user_interaction', {
      action,
      ...(element && { element }),
      sessionId: this.sessionId,
      pageLoadTime: Date.now() - this.startTime,
      ...context
    });
  }

  // Track errors with performance context
  trackError(error: Error, context?: Record<string, string | number | boolean>) {
    const performanceData = this.performanceTracker.getPerformanceData();
    
    this.track('error', {
      message: error.message,
      ...(error.stack && { stack: error.stack }),
      sessionId: this.sessionId,
      url: window.location.href,
      performance: performanceData.vitals.reduce((acc, vital) => ({
        ...acc,
        [vital.name]: vital.value
      }), {}),
      ...context
    });
  }

  // Core tracking function with multiple providers
  private track(event: string, data: Record<string, string | number | boolean | object> = {}) {
    // Filter out object values for properties to match the expected type
    const properties = Object.entries(data)
      .filter(([_, value]) => typeof value !== 'object' || value === null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value as string | number | boolean }), {});
    
    const eventData: AnalyticsData = {
      event,
      properties,
      performance: typeof data.performance === 'object' && data.performance !== null ? data.performance as AnalyticsData['performance'] : undefined,
      user: typeof data.user === 'object' && data.user !== null ? data.user as AnalyticsData['user'] : undefined
    };

    // Send to Vercel Analytics (if available)
    if (typeof window !== 'undefined' && 'va' in window) {
      (window as { va: (action: string, event: string, properties?: Record<string, string | number | boolean>) => void }).va('track', event, eventData.properties);
    }

    // Send to Google Analytics (if available)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as unknown as { gtag: (command: string, action: string, parameters?: Record<string, string | number | boolean>) => void }).gtag;
      gtag('event', event, eventData.properties);
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(eventData);

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, eventData);
    }
  }

  // Send to custom analytics API
  private async sendToCustomAnalytics(data: AnalyticsData) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          url: window.location.href,
          sessionId: this.sessionId
        }),
      });
    } catch (error) {
      // Fail silently for analytics
      if (process.env.NODE_ENV === 'development') {
        console.warn('Analytics endpoint failed:', error);
      }
    }
  }

  // Setup global error tracking
  private setupErrorTracking() {
    if (typeof window === 'undefined') return;

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandled_promise_rejection'
      });
    });

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Performance violations
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure' && entry.duration > 50) {
              this.trackPerformanceViolation(entry.name, entry.duration, 50);
            }
          });
        });
        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  // Monitor performance budgets
  monitorPerformanceBudgets() {
    const performanceData = this.performanceTracker.getPerformanceData();
    const budgets = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 200
    };

    performanceData.vitals.forEach(vital => {
      const budget = budgets[vital.name as keyof typeof budgets];
      if (budget && vital.value > budget) {
        this.trackPerformanceViolation(vital.name, vital.value, budget);
      }
    });
  }
}

// Singleton instance
let analyticsInstance: EnhancedAnalytics | null = null;

export function getAnalytics(): EnhancedAnalytics {
  if (!analyticsInstance && typeof window !== 'undefined') {
    analyticsInstance = new EnhancedAnalytics();
  }
  return analyticsInstance!;
}

// React component wrapper
interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

export const AnalyticsWrapper = memo(function AnalyticsWrapper({ 
  children 
}: AnalyticsWrapperProps) {
  const pathname = usePathname();
  const analyticsRef = useRef<EnhancedAnalytics>();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      analyticsRef.current = getAnalytics();
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (analyticsRef.current && pathname) {
      // Small delay to ensure performance metrics are available
      setTimeout(() => {
        analyticsRef.current!.trackPageView(pathname);
        analyticsRef.current!.monitorPerformanceBudgets();
      }, 100);
    }
  }, [pathname]);

  // Setup intersection observer for scroll tracking
  useEffect(() => {
    if (typeof window === 'undefined' || !analyticsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const elementId = element.id;
            const elementClass = element.className;
            
            if (elementId || elementClass) {
              analyticsRef.current!.trackInteraction('scroll_view', elementId || elementClass, {
                scrollPercentage: Math.round((window.scrollY / document.body.scrollHeight) * 100)
              });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe key elements
    const observeElements = document.querySelectorAll('[data-analytics-track]');
    observeElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
});

// Hook for component-level analytics
export function useAnalytics() {
  const analytics = getAnalytics();

  return {
    track: (event: string, properties?: Record<string, string | number | boolean>) => {
      analytics.trackInteraction(event, undefined, properties);
    },
    trackError: (error: Error, context?: Record<string, string | number | boolean>) => {
      analytics.trackError(error, context);
    },
    trackPerformance: () => {
      analytics.monitorPerformanceBudgets();
    }
  };
}

// Utility functions for manual tracking
export const trackEvent = (event: string, properties?: Record<string, string | number | boolean>) => {
  const analytics = getAnalytics();
  analytics.trackInteraction(event, undefined, properties);
};

export const trackError = (error: Error, context?: Record<string, string | number | boolean>) => {
  const analytics = getAnalytics();
  analytics.trackError(error, context);
};

export const trackPerformance = () => {
  const analytics = getAnalytics();
  analytics.monitorPerformanceBudgets();
};

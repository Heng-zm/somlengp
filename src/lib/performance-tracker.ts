'use client';

// Extend the Navigator interface to include connection
declare global {
  interface Navigator {
    connection?: {
      effectiveType?: string;
    };
  }
}

// Extend PerformanceEntry for specific entry types
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface WebVital {
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
  id: string;
}

interface PerformanceData {
  url: string;
  timestamp: number;
  userAgent: string;
  connection?: string;
  vitals: WebVital[];
}

interface IPerformanceTracker {
  getPerformanceData(): PerformanceData;
  disable(): void;
  enable(): void;
  checkBudget(budgets: Record<string, number>): { passed: boolean; violations: string[] };
}

class PerformanceTracker implements IPerformanceTracker {
  private data: PerformanceData;
  private isEnabled: boolean = true;

  constructor() {
    this.data = {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionType(),
      vitals: []
    };

    if (typeof window !== 'undefined') {
      this.setupWebVitalsTracking();
      this.trackPageLoadMetrics();
    }
  }

  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private setupWebVitalsTracking() {
    // Track Core Web Vitals
    if ('web-vital' in window) {
      // This would normally use the web-vitals library
      // For now, we'll track what we can manually
      this.trackLCP();
      this.trackFID();
      this.trackCLS();
    }
  }

  private trackLCP() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.addVital({
            name: 'LCP',
            value: lastEntry.startTime,
            delta: lastEntry.startTime,
            entries: [lastEntry],
            id: `lcp-${Date.now()}`
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP tracking failed:', error);
      }
    }
  }

  private trackFID() {
    // First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const fidEntry = entry as FirstInputEntry;
            this.addVital({
              name: 'FID',
              value: fidEntry.processingStart - fidEntry.startTime,
              delta: fidEntry.processingStart - fidEntry.startTime,
              entries: [entry],
              id: `fid-${Date.now()}`
            });
          });
        });

        observer.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID tracking failed:', error);
      }
    }
  }

  private trackCLS() {
    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const clsEntry = entry as LayoutShiftEntry;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;

              this.addVital({
                name: 'CLS',
                value: clsValue,
                delta: clsEntry.value,
                entries: [entry],
                id: `cls-${Date.now()}`
              });
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS tracking failed:', error);
      }
    }
  }

  private trackPageLoadMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            // DNS Lookup Time
            const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
            this.addVital({
              name: 'DNS',
              value: dnsTime,
              delta: dnsTime,
              entries: [navigation],
              id: `dns-${Date.now()}`
            });

            // Time to First Byte
            const ttfb = navigation.responseStart - navigation.requestStart;
            this.addVital({
              name: 'TTFB',
              value: ttfb,
              delta: ttfb,
              entries: [navigation],
              id: `ttfb-${Date.now()}`
            });

            // DOM Content Loaded
            const dcl = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            this.addVital({
              name: 'DCL',
              value: dcl,
              delta: dcl,
              entries: [navigation],
              id: `dcl-${Date.now()}`
            });

            // Full Page Load
            const load = navigation.loadEventEnd - navigation.fetchStart;
            this.addVital({
              name: 'LOAD',
              value: load,
              delta: load,
              entries: [navigation],
              id: `load-${Date.now()}`
            });
          }
        }, 0);
      });
    }
  }

  private addVital(vital: WebVital) {
    if (!this.isEnabled) return;
    
    this.data.vitals.push(vital);
    this.logVital(vital);
    
    // Send to analytics if needed
    if (this.shouldSendAnalytics(vital)) {
      this.sendToAnalytics(vital);
    }
  }

  private logVital(vital: WebVital) {
    const color = this.getVitalColor(vital);
    console.log(
      `%c${vital.name}: ${Math.round(vital.value * 100) / 100}ms`,
      `color: ${color}; font-weight: bold;`
    );
  }

  private getVitalColor(vital: WebVital): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 200, poor: 500 },
      DNS: { good: 50, poor: 200 },
      DCL: { good: 1500, poor: 3000 },
      LOAD: { good: 2000, poor: 4000 }
    };

    const threshold = thresholds[vital.name as keyof typeof thresholds];
    if (!threshold) return '#666';

    if (vital.value <= threshold.good) return '#0f5132'; // Good - green
    if (vital.value <= threshold.poor) return '#664d03'; // Needs improvement - yellow
    return '#842029'; // Poor - red
  }

  private shouldSendAnalytics(vital: WebVital): boolean {
    // Only send final values for some metrics
    const finalMetrics = ['LCP', 'LOAD', 'DCL'];
    return finalMetrics.includes(vital.name) || Math.random() < 0.1; // Sample 10%
  }

  private async sendToAnalytics(vital: WebVital) {
    try {
      // This would typically send to your analytics service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metric: vital.name,
            value: vital.value,
            url: this.data.url,
            userAgent: this.data.userAgent,
            connection: this.data.connection,
            timestamp: Date.now()
          }),
        });
      }
    } catch {
      // Fail silently for analytics
    }
  }

  public getPerformanceData(): PerformanceData {
    return { ...this.data };
  }

  public disable() {
    this.isEnabled = false;
  }

  public enable() {
    this.isEnabled = true;
  }

  // Performance budget checking
  public checkBudget(budgets: Record<string, number>): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    
    this.data.vitals.forEach(vital => {
      const budget = budgets[vital.name];
      if (budget && vital.value > budget) {
        violations.push(`${vital.name}: ${Math.round(vital.value)}ms > ${budget}ms budget`);
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  }
}

// Performance budgets (in milliseconds)
export const DEFAULT_BUDGETS = {
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  TTFB: 200,
  DNS: 50,
  DCL: 1500,
  LOAD: 3000
};

// Singleton instance
let performanceTracker: PerformanceTracker | null = null;

export function getPerformanceTracker(): IPerformanceTracker {
  if (typeof window === 'undefined') {
    // Return a no-op tracker for SSR
    return {
      getPerformanceData: () => ({ url: '', timestamp: 0, userAgent: '', vitals: [] }),
      disable: () => {},
      enable: () => {},
      checkBudget: () => ({ passed: true, violations: [] })
    };
  }
  
  if (!performanceTracker) {
    performanceTracker = new PerformanceTracker();
  }
  
  return performanceTracker;
}

export { PerformanceTracker };

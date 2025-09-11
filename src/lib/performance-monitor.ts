'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Types for performance monitoring
interface PerformanceMetrics {
  // Core Web Vitals
  CLS: number | null;
  FCP: number | null;
  FID: number | null;
  LCP: number | null;
  TTFB: number | null;
  
  // Additional metrics
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // Custom metrics
  firstInteraction: number | null;
  domInteractive: number | null;
  domContentLoaded: number | null;
  bundleLoadTime: number | null;
  
  // Timing
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
}

interface PerformanceConfig {
  enableReporting: boolean;
  reportingEndpoint?: string;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  maxReports: number;
  enableConsoleLogging: boolean;
  thresholds: {
    LCP: { good: number; poor: number };
    FID: { good: number; poor: number };
    CLS: { good: number; poor: number };
    FCP: { good: number; poor: number };
    TTFB: { good: number; poor: number };
  };
}

interface PerformanceReport {
  id: string;
  sessionId: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'error';
    suggestion: string;
  }>;
  deviceInfo: {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: string;
    viewport: { width: number; height: number };
  };
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableReporting: true,
  sampleRate: 1.0, // Monitor 100% in development
  maxReports: 50,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  thresholds: {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  },
};

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Partial<PerformanceMetrics> = {};
  private reports: PerformanceReport[] = [];
  private sessionId: string;
  private observers: Array<PerformanceObserver | ResizeObserver> = [];
  private isInitialized = false;
  private reportQueue: PerformanceReport[] = [];
  private isReporting = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    // Only initialize if we're in the browser and should sample this session
    if (typeof window !== 'undefined' && this.shouldSample()) {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private initialize() {
    if (this.isInitialized) return;
    
    try {
      this.collectWebVitals();
      this.collectCustomMetrics();
      this.setupMemoryMonitoring();
      this.setupNavigationTiming();
      this.loadStoredReports();
      
      // Set up periodic reporting
      this.schedulePeriodicReporting();
      
      this.isInitialized = true;
      this.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  private collectWebVitals() {
    // Collect Core Web Vitals
    onCLS((metric) => this.handleMetric('CLS', metric));
    onFCP((metric) => this.handleMetric('FCP', metric));
    onINP((metric) => this.handleMetric('FID', metric)); // INP replaces FID in newer versions
    onLCP((metric) => this.handleMetric('LCP', metric));
    onTTFB((metric) => this.handleMetric('TTFB', metric));
  }

  private handleMetric(name: string, metric: Metric) {
    (this.metrics as any)[name] = metric.value;
    
    this.log(`${name}: ${metric.value}`, {
      delta: metric.delta,
      rating: this.rateMetric(name, metric.value),
    });

    // Trigger report generation if we have enough metrics
    this.checkForCompleteReport();
  }

  private collectCustomMetrics() {
    // Collect additional performance metrics
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.metrics.domInteractive = navigation.domInteractive;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      }

      // Track first interaction
      const trackFirstInteraction = () => {
        if (this.metrics.firstInteraction === null) {
          this.metrics.firstInteraction = performance.now();
        }
      };

      ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, trackFirstInteraction, { once: true, passive: true });
      });
    }
  }

  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.metrics.memory = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      };

      // Monitor memory usage periodically
      const memoryInterval = setInterval(() => {
        if (this.metrics.memory && memoryInfo) {
          this.metrics.memory.usedJSHeapSize = memoryInfo.usedJSHeapSize;
          this.metrics.memory.totalJSHeapSize = memoryInfo.totalJSHeapSize;
          
          // Check for memory leaks
          const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
          if (usageRatio > 0.8) {
            this.log('High memory usage detected', { usageRatio });
          }
        }
      }, 30000); // Check every 30 seconds

      // Clean up interval after 10 minutes
      setTimeout(() => clearInterval(memoryInterval), 600000);
    }
  }

  private setupNavigationTiming() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          // Calculate bundle load time from script resources
          const scriptEntries = entries.filter(entry => 
            entry.name.includes('.js') && entry.name.includes('_next')
          );
          
          if (scriptEntries.length > 0) {
            const totalLoadTime = scriptEntries.reduce((total, entry) => {
              const resourceEntry = entry as PerformanceResourceTiming;
              // Use responseEnd as the completion time for resource timing
              return total + resourceEntry.responseEnd - resourceEntry.startTime;
            }, 0);
            this.metrics.bundleLoadTime = totalLoadTime;
          }
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.duration > 50) {
              this.log('Long task detected', { duration: entry.duration });
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);

      } catch (error) {
        console.warn('Failed to setup performance observers:', error);
      }
    }
  }

  private rateMetric(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.config.thresholds[name as keyof typeof this.config.thresholds];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private checkForCompleteReport() {
    // Generate report if we have key metrics
    const hasKeyMetrics = this.metrics.LCP !== undefined || this.metrics.FID !== undefined;
    
    if (hasKeyMetrics) {
      this.generateReport();
    }
  }

  private generateReport(): PerformanceReport {
    const currentMetrics: PerformanceMetrics = {
      CLS: this.metrics.CLS ?? null,
      FCP: this.metrics.FCP ?? null,
      FID: this.metrics.FID ?? null,
      LCP: this.metrics.LCP ?? null,
      TTFB: this.metrics.TTFB ?? null,
      memory: this.metrics.memory,
      firstInteraction: this.metrics.firstInteraction ?? null,
      domInteractive: this.metrics.domInteractive ?? null,
      domContentLoaded: this.metrics.domContentLoaded ?? null,
      bundleLoadTime: this.metrics.bundleLoadTime ?? null,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: this.getConnectionInfo(),
    };

    const issues = this.analyzeIssues(currentMetrics);
    const score = this.calculateScore(currentMetrics);
    const grade = this.calculateGrade(score);

    const report: PerformanceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: currentMetrics,
      score,
      grade,
      issues,
      deviceInfo: this.getDeviceInfo(),
    };

    this.addReport(report);
    
    if (this.config.enableReporting) {
      this.queueReport(report);
    }

    return report;
  }

  private analyzeIssues(metrics: PerformanceMetrics): Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'error';
    suggestion: string;
  }> {
    const issues: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'error';
      suggestion: string;
    }> = [];

    Object.entries(this.config.thresholds).forEach(([metricName, thresholds]) => {
      const value = metrics[metricName as keyof PerformanceMetrics] as number;
      if (value !== null && typeof value === 'number') {
        if (value > thresholds.poor) {
          issues.push({
            metric: metricName,
            value,
            threshold: thresholds.poor,
            severity: 'error' as const,
            suggestion: this.getSuggestion(metricName, 'error'),
          });
        } else if (value > thresholds.good) {
          issues.push({
            metric: metricName,
            value,
            threshold: thresholds.good,
            severity: 'warning' as const,
            suggestion: this.getSuggestion(metricName, 'warning'),
          });
        }
      }
    });

    return issues;
  }

  private getSuggestion(metric: string, severity: 'warning' | 'error'): string {
    const suggestions = {
      LCP: {
        warning: 'Consider optimizing images and lazy loading below-the-fold content.',
        error: 'Critical: Implement image optimization, code splitting, and server-side rendering.',
      },
      FID: {
        warning: 'Reduce JavaScript execution time and consider code splitting.',
        error: 'Critical: Break up long tasks and defer non-essential JavaScript.',
      },
      CLS: {
        warning: 'Set size attributes on images and avoid inserting content above existing content.',
        error: 'Critical: Reserve space for dynamic content and avoid layout shifts.',
      },
      FCP: {
        warning: 'Optimize critical resources and consider preloading key assets.',
        error: 'Critical: Implement server-side rendering and optimize resource loading.',
      },
      TTFB: {
        warning: 'Consider using a CDN and optimizing server response time.',
        error: 'Critical: Investigate server performance and database query optimization.',
      },
    };

    return suggestions[metric as keyof typeof suggestions]?.[severity] || 'Consider optimizing this metric.';
  }

  private calculateScore(metrics: PerformanceMetrics): number {
    let totalScore = 0;
    let metricCount = 0;

    Object.entries(this.config.thresholds).forEach(([metricName, thresholds]) => {
      const value = metrics[metricName as keyof PerformanceMetrics] as number;
      if (value !== null && typeof value === 'number') {
        let score = 100;
        
        if (value > thresholds.good) {
          const range = thresholds.poor - thresholds.good;
          const excess = Math.min(value - thresholds.good, range);
          score = Math.max(0, 100 - (excess / range) * 50);
        }
        
        if (value > thresholds.poor) {
          score = Math.max(0, score - 50);
        }

        totalScore += score;
        metricCount++;
      }
    });

    return metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private getConnectionInfo(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      return conn ? `${conn.effectiveType} (${conn.downlink}Mbps)` : '';
    }
    return '';
  }

  private getDeviceInfo() {
    return {
      deviceMemory: (navigator as any)?.deviceMemory,
      hardwareConcurrency: navigator?.hardwareConcurrency,
      connection: this.getConnectionInfo(),
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      },
    };
  }

  private addReport(report: PerformanceReport) {
    this.reports.unshift(report);
    
    // Keep only the most recent reports
    if (this.reports.length > this.config.maxReports) {
      this.reports = this.reports.slice(0, this.config.maxReports);
    }

    this.saveReports();
  }

  private saveReports() {
    if (typeof window !== 'undefined') {
      try {
        const reportsToSave = this.reports.slice(0, 10); // Save only 10 most recent
        localStorage.setItem('performance_reports', JSON.stringify(reportsToSave));
      } catch (error) {
        console.warn('Failed to save performance reports:', error);
      }
    }
  }

  private loadStoredReports() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('performance_reports');
        if (stored) {
          this.reports = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load stored reports:', error);
      }
    }
  }

  private queueReport(report: PerformanceReport) {
    this.reportQueue.push(report);
    this.processReportQueue();
  }

  private async processReportQueue() {
    if (this.isReporting || this.reportQueue.length === 0) return;

    this.isReporting = true;

    try {
      while (this.reportQueue.length > 0) {
        const report = this.reportQueue.shift()!;
        await this.sendReport(report);
        
        // Add small delay between reports
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.warn('Failed to process report queue:', error);
    } finally {
      this.isReporting = false;
    }
  }

  private async sendReport(report: PerformanceReport) {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true,
      });

      this.log('Report sent successfully', { reportId: report.id });
    } catch (error) {
      console.warn('Failed to send performance report:', error);
      // Re-queue the report for retry
      this.reportQueue.unshift(report);
    }
  }

  private schedulePeriodicReporting() {
    // Generate reports periodically
    setInterval(() => {
      if (Object.keys(this.metrics).length > 0) {
        this.generateReport();
      }
    }, 60000); // Every minute

    // Clean up old data periodically
    setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
  }

  private cleanupOldData() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.reports = this.reports.filter(report => report.timestamp > cutoff);
    this.saveReports();
  }

  private log(message: string, data?: any) {
    if (this.config.enableConsoleLogging) {
      console.log(`[PerformanceMonitor] ${message}`, data || '');
    }
  }

  // Public methods
  public getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  public getLatestReport(): PerformanceReport | null {
    return this.reports[0] || null;
  }

  public getCurrentMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public forceReport(): PerformanceReport {
    return this.generateReport();
  }

  public updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public trackCustomMetric(name: string, value: number) {
    (this.metrics as any)[name] = value;
    this.log(`Custom metric ${name}: ${value}`);
  }

  public cleanup() {
    // Clean up observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    });
    this.observers = [];

    // Process any remaining reports
    this.processReportQueue();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor | null {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor(config);
  }
  return performanceMonitor;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor();

  return {
    getReports: () => monitor?.getReports() || [],
    getLatestReport: () => monitor?.getLatestReport(),
    getCurrentMetrics: () => monitor?.getCurrentMetrics() || {},
    forceReport: () => monitor?.forceReport(),
    updateConfig: (config: Partial<PerformanceConfig>) => monitor?.updateConfig(config),
  };
}

// Utility functions
export function trackCustomMetric(name: string, value: number) {
  const monitor = getPerformanceMonitor();
  if (monitor) {
    (monitor as any).metrics[name] = value;
  }
}

export function markFeatureUsage(featureName: string) {
  trackCustomMetric(`feature_${featureName}_time`, performance.now());
}

export { PerformanceMonitor, type PerformanceMetrics, type PerformanceReport, type PerformanceConfig };

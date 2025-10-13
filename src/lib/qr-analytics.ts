/**
 * QR Code Analytics and Performance Monitoring
 * Tracks usage patterns, performance metrics, and user behavior
 */

interface QRCodeAnalytics {
  sessionId: string;
  userId?: string;
  timestamp: number;
  action: 'generate' | 'download' | 'copy' | 'share' | 'template_change' | 'settings_change';
  metadata: {
    template?: string;
    format?: string;
    size?: number;
    errorCorrection?: string;
    contentLength?: number;
    generationTime?: number;
    userAgent?: string;
    viewport?: { width: number; height: number };
    colorScheme?: 'light' | 'dark';
  };
}

interface PerformanceMetrics {
  sessionId: string;
  timestamp: number;
  metric: 'generation_time' | 'preview_time' | 'download_time' | 'copy_time';
  value: number;
  context: {
    size: number;
    format: string;
    contentLength: number;
    template: string;
  };
}

interface UsageStats {
  totalGenerations: number;
  totalDownloads: number;
  totalShares: number;
  totalCopies: number;
  averageGenerationTime: number;
  averagePreviewTime: number;
  popularTemplates: { [key: string]: number };
  popularFormats: { [key: string]: number };
  popularSizes: { [key: string]: number };
  sessionsToday: number;
  lastUsed: number;
}

class QRAnalyticsManager {
  private sessionId: string;
  private userId?: string;
  private analytics: QRCodeAnalytics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private usageStats: UsageStats;
  private isEnabled: boolean = true;

  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId;
    this.usageStats = this.loadUsageStats();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUsageStats(): UsageStats {
    if (typeof window === 'undefined') return this.getDefaultStats();
    
    try {
      const stored = localStorage.getItem('qr_usage_stats');
      if (stored) {
        const stats = JSON.parse(stored);
        // Check if it's a new day
        const today = new Date().toDateString();
        const lastUsedDate = new Date(stats.lastUsed).toDateString();
        
        if (today !== lastUsedDate) {
          stats.sessionsToday = 0;
        }
        
        return { ...this.getDefaultStats(), ...stats };
      }
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
    }
    
    return this.getDefaultStats();
  }

  private getDefaultStats(): UsageStats {
    return {
      totalGenerations: 0,
      totalDownloads: 0,
      totalShares: 0,
      totalCopies: 0,
      averageGenerationTime: 0,
      averagePreviewTime: 0,
      popularTemplates: {},
      popularFormats: {},
      popularSizes: {},
      sessionsToday: 0,
      lastUsed: Date.now()
    };
  }

  private saveUsageStats(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.usageStats.lastUsed = Date.now();
      localStorage.setItem('qr_usage_stats', JSON.stringify(this.usageStats));
    } catch (error) {
      console.warn('Failed to save usage stats:', error);
    }
  }

  private initializeSession(): void {
    this.usageStats.sessionsToday++;
    this.saveUsageStats();

    // Clean up old analytics data (keep last 1000 entries)
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  // Public methods for tracking events
  trackGeneration(options: {
    template: string;
    format: string;
    size: number;
    errorCorrection: string;
    contentLength: number;
    generationTime: number;
  }): void {
    if (!this.isEnabled) return;

    const analytics: QRCodeAnalytics = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'generate',
      metadata: {
        ...options,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined,
        colorScheme: typeof window !== 'undefined' && window.matchMedia ? 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : undefined
      }
    };

    this.analytics.push(analytics);

    // Track performance
    const performanceMetric: PerformanceMetrics = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metric: 'generation_time',
      value: options.generationTime,
      context: {
        size: options.size,
        format: options.format,
        contentLength: options.contentLength,
        template: options.template
      }
    };

    this.performanceMetrics.push(performanceMetric);

    // Update usage stats
    this.usageStats.totalGenerations++;
    this.usageStats.popularTemplates[options.template] = (this.usageStats.popularTemplates[options.template] || 0) + 1;
    this.usageStats.popularFormats[options.format] = (this.usageStats.popularFormats[options.format] || 0) + 1;
    this.usageStats.popularSizes[options.size.toString()] = (this.usageStats.popularSizes[options.size.toString()] || 0) + 1;

    // Update average generation time
    const totalTime = this.usageStats.averageGenerationTime * (this.usageStats.totalGenerations - 1) + options.generationTime;
    this.usageStats.averageGenerationTime = totalTime / this.usageStats.totalGenerations;

    this.saveUsageStats();
  }

  trackDownload(format: string): void {
    if (!this.isEnabled) return;

    this.analytics.push({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'download',
      metadata: { format }
    });

    this.usageStats.totalDownloads++;
    this.saveUsageStats();
  }

  trackCopy(): void {
    if (!this.isEnabled) return;

    this.analytics.push({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'copy',
      metadata: {}
    });

    this.usageStats.totalCopies++;
    this.saveUsageStats();
  }

  trackShare(): void {
    if (!this.isEnabled) return;

    this.analytics.push({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'share',
      metadata: {}
    });

    this.usageStats.totalShares++;
    this.saveUsageStats();
  }

  trackTemplateChange(template: string): void {
    if (!this.isEnabled) return;

    this.analytics.push({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'template_change',
      metadata: { template }
    });
  }

  trackSettingsChange(settings: any): void {
    if (!this.isEnabled) return;

    this.analytics.push({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      action: 'settings_change',
      metadata: settings
    });
  }

  trackPreviewTime(time: number, context: { size: number; format: string; contentLength: number; template: string }): void {
    if (!this.isEnabled) return;

    const performanceMetric: PerformanceMetrics = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metric: 'preview_time',
      value: time,
      context
    };

    this.performanceMetrics.push(performanceMetric);

    // Update average preview time
    const previewMetrics = this.performanceMetrics.filter(m => m.metric === 'preview_time');
    const totalTime = previewMetrics.reduce((sum, m) => sum + m.value, 0);
    this.usageStats.averagePreviewTime = totalTime / previewMetrics.length;

    this.saveUsageStats();
  }

  // Analytics getters
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  getSessionAnalytics(): QRCodeAnalytics[] {
    return this.analytics.filter(a => a.sessionId === this.sessionId);
  }

  getAllAnalytics(): QRCodeAnalytics[] {
    return [...this.analytics];
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  getPerformanceInsights(): {
    averageGenerationTime: number;
    averagePreviewTime: number;
    slowestOperations: PerformanceMetrics[];
    performanceTrend: { date: string; avgTime: number }[];
  } {
    const generationTimes = this.performanceMetrics
      .filter(m => m.metric === 'generation_time')
      .map(m => m.value);

    const previewTimes = this.performanceMetrics
      .filter(m => m.metric === 'preview_time')
      .map(m => m.value);

    const slowestOperations = this.performanceMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Performance trend over last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > sevenDaysAgo);
    
    const dailyMetrics = new Map<string, number[]>();
    recentMetrics.forEach(metric => {
      const date = new Date(metric.timestamp).toDateString();
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, []);
      }
      dailyMetrics.get(date)!.push(metric.value);
    });

    const performanceTrend = Array.from(dailyMetrics.entries()).map(([date, times]) => ({
      date,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }));

    return {
      averageGenerationTime: generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length || 0,
      averagePreviewTime: previewTimes.reduce((sum, time) => sum + time, 0) / previewTimes.length || 0,
      slowestOperations,
      performanceTrend
    };
  }

  getPopularityInsights(): {
    mostUsedTemplate: string;
    mostUsedFormat: string;
    mostUsedSize: string;
    templateUsage: { template: string; count: number; percentage: number }[];
    formatUsage: { format: string; count: number; percentage: number }[];
    sizeUsage: { size: string; count: number; percentage: number }[];
  } {
    const templates = Object.entries(this.usageStats.popularTemplates);
    const formats = Object.entries(this.usageStats.popularFormats);
    const sizes = Object.entries(this.usageStats.popularSizes);

    const totalGenerations = this.usageStats.totalGenerations || 1;

    return {
      mostUsedTemplate: templates.sort((a, b) => b[1] - a[1])[0]?.[0] || 'text',
      mostUsedFormat: formats.sort((a, b) => b[1] - a[1])[0]?.[0] || 'png',
      mostUsedSize: sizes.sort((a, b) => b[1] - a[1])[0]?.[0] || '256',
      templateUsage: templates.map(([template, count]) => ({
        template,
        count,
        percentage: Math.round((count / totalGenerations) * 100)
      })).sort((a, b) => b.count - a.count),
      formatUsage: formats.map(([format, count]) => ({
        format,
        count,
        percentage: Math.round((count / totalGenerations) * 100)
      })).sort((a, b) => b.count - a.count),
      sizeUsage: sizes.map(([size, count]) => ({
        size,
        count,
        percentage: Math.round((count / totalGenerations) * 100)
      })).sort((a, b) => b.count - a.count)
    };
  }

  // Privacy and settings
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr_analytics_enabled', enabled.toString());
    }
  }

  isAnalyticsEnabled(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qr_analytics_enabled');
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return this.isEnabled;
  }

  clearAnalytics(): void {
    this.analytics = [];
    this.performanceMetrics = [];
    this.usageStats = this.getDefaultStats();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qr_usage_stats');
      localStorage.removeItem('qr_analytics_data');
    }
  }

  exportData(): {
    analytics: QRCodeAnalytics[];
    performanceMetrics: PerformanceMetrics[];
    usageStats: UsageStats;
    exportDate: string;
  } {
    return {
      analytics: this.analytics,
      performanceMetrics: this.performanceMetrics,
      usageStats: this.usageStats,
      exportDate: new Date().toISOString()
    };
  }
}

// Singleton instance
let analyticsManager: QRAnalyticsManager | null = null;

export function getQRAnalytics(userId?: string): QRAnalyticsManager {
  if (!analyticsManager) {
    analyticsManager = new QRAnalyticsManager(userId);
  }
  return analyticsManager;
}

export type { QRCodeAnalytics, PerformanceMetrics, UsageStats };
export { QRAnalyticsManager };
'use client';
import { safeSync, safeAsync, ValidationError, errorHandler, NetworkError } from './error-utils';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

interface AlertConfig {
  metric: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
}
// Constants for validation
const MAX_ALERTS_STORED = 1000;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_URL_LENGTH = 2000;
const MAX_USER_AGENT_LENGTH = 1000;
const VALID_METRICS = ['LCP', 'FID', 'CLS', 'TTFB', 'DCL', 'LOAD'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const MIN_THRESHOLD = 0;
const MAX_THRESHOLD = 1000000; // 1 million ms or units
interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
  resolved: boolean;
  description: string;
}
interface AlertingOptions {
  enableNotifications: boolean;
  enableSlackWebhook: boolean;
  enableEmailAlerts: boolean;
  slackWebhookUrl?: string;
  emailEndpoint?: string;
  debounceTime: number; // milliseconds
}
// Default alert configurations for Core Web Vitals and other metrics
const DEFAULT_ALERT_CONFIGS: AlertConfig[] = [
  {
    metric: 'LCP',
    threshold: 2500,
    severity: 'medium',
    enabled: true,
    description: 'Largest Contentful Paint exceeds good threshold (2.5s)'
  },
  {
    metric: 'LCP',
    threshold: 4000,
    severity: 'high',
    enabled: true,
    description: 'Largest Contentful Paint exceeds poor threshold (4s)'
  },
  {
    metric: 'FID',
    threshold: 100,
    severity: 'medium',
    enabled: true,
    description: 'First Input Delay exceeds good threshold (100ms)'
  },
  {
    metric: 'FID',
    threshold: 300,
    severity: 'high',
    enabled: true,
    description: 'First Input Delay exceeds poor threshold (300ms)'
  },
  {
    metric: 'CLS',
    threshold: 0.1,
    severity: 'medium',
    enabled: true,
    description: 'Cumulative Layout Shift exceeds good threshold (0.1)'
  },
  {
    metric: 'CLS',
    threshold: 0.25,
    severity: 'high',
    enabled: true,
    description: 'Cumulative Layout Shift exceeds poor threshold (0.25)'
  },
  {
    metric: 'TTFB',
    threshold: 800,
    severity: 'low',
    enabled: true,
    description: 'Time to First Byte exceeds good threshold (800ms)'
  },
  {
    metric: 'TTFB',
    threshold: 1800,
    severity: 'medium',
    enabled: true,
    description: 'Time to First Byte exceeds poor threshold (1800ms)'
  },
  {
    metric: 'DCL',
    threshold: 3000,
    severity: 'medium',
    enabled: true,
    description: 'DOM Content Loaded exceeds threshold (3s)'
  },
  {
    metric: 'LOAD',
    threshold: 5000,
    severity: 'high',
    enabled: true,
    description: 'Page Load exceeds threshold (5s)'
  }
];
class PerformanceAlerting {
  private alerts: PerformanceAlert[] = [];
  private alertConfigs: AlertConfig[] = [...DEFAULT_ALERT_CONFIGS];
  private options: AlertingOptions = {
    enableNotifications: true,
    enableSlackWebhook: false,
    enableEmailAlerts: false,
    debounceTime: 5000 // 5 seconds
  };
  private alertQueue = new Map<string, NodeJS.Timeout>();
  private notificationPermission: NotificationPermission = 'default';
  constructor(options?: Partial<AlertingOptions>) {
    this.options = { ...this.options, ...options };
    this.initializeNotifications();
    this.loadStoredAlerts();
  }
  // Initialize browser notifications
  private async initializeNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    this.notificationPermission = Notification.permission;
    if (this.notificationPermission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    }
  }
  // Load stored alerts from localStorage
  private loadStoredAlerts() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('performance_alerts');
      if (stored) {
        this.alerts = JSON.parse(stored);
        // Clean up old alerts (older than 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
        this.saveAlerts();
      }
    } catch (error) {
    }
  }
  // Save alerts to localStorage
  private saveAlerts() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('performance_alerts', JSON.stringify(this.alerts));
    } catch (error) {
    }
  }
  // Check if a metric value violates any alert thresholds
  checkMetric(metric: string, value: number, context: {
    url?: string;
    userAgent?: string;
    connection?: string;
  } = {}) {
    const relevantConfigs = this.alertConfigs.filter(
      config => config.enabled && config.metric === metric && value > config.threshold
    );
    // Find the highest severity violation
    const highestSeverityConfig = relevantConfigs.reduce((highest, current) => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityOrder[current.severity] > severityOrder[highest?.severity || 'low'] 
        ? current : highest;
    }, relevantConfigs[0]);
    if (highestSeverityConfig) {
      this.triggerAlert(metric, value, highestSeverityConfig, context);
    }
  }
  // Trigger an alert with debouncing
  private triggerAlert(
    metric: string, 
    value: number, 
    config: AlertConfig, 
    context: {
      url?: string;
      userAgent?: string;
      connection?: string;
    }
  ) {
    const alertKey = `${metric}_${config.severity}`;
    // Clear existing timeout for this alert type
    if (this.alertQueue.has(alertKey)) {
      clearTimeout(this.alertQueue.get(alertKey)!);
    }
    // Set debounced alert
    const timeout = setTimeout(() => {
      const alert: PerformanceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metric,
        value,
        threshold: config.threshold,
        severity: config.severity,
        timestamp: Date.now(),
        url: context.url || (typeof window !== 'undefined' ? window.location.href : ''),
        userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        connection: context.connection,
        resolved: false,
        description: config.description
      };
      this.alerts.push(alert);
      this.saveAlerts();
      this.sendAlert(alert);
      this.alertQueue.delete(alertKey);
    }, this.options.debounceTime);
    this.alertQueue.set(alertKey, timeout);
  }
  // Send alert through configured channels
  private async sendAlert(alert: PerformanceAlert) {
    // Browser notification
    if (this.options.enableNotifications && this.notificationPermission === 'granted') {
      this.sendBrowserNotification(alert);
    }
    // Slack webhook
    if (this.options.enableSlackWebhook && this.options.slackWebhookUrl) {
      this.sendSlackAlert(alert);
    }
    // Email alert
    if (this.options.enableEmailAlerts && this.options.emailEndpoint) {
      this.sendEmailAlert(alert);
    }
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Performance Alert [${alert.severity.toUpperCase()}]:`,
        `${alert.metric} = ${alert.value}${alert.metric === 'CLS' ? '' : 'ms'} exceeds threshold of ${alert.threshold}${alert.metric === 'CLS' ? '' : 'ms'}`
      );
    }
    // Send to custom analytics
    this.trackAlert(alert);
  }
  // Send browser notification
  private sendBrowserNotification(alert: PerformanceAlert) {
    if (typeof window === 'undefined') return;
    const title = `Performance Alert: ${alert.metric}`;
    const body = `${alert.description}
Value: ${alert.value}${alert.metric === 'CLS' ? '' : 'ms'}`;
    const notification = new Notification(title, {
      body,
      icon: '/icon.svg',
      tag: `performance_${alert.metric}`,
      requireInteraction: alert.severity === 'critical'
    });
    // Auto-close non-critical notifications
    if (alert.severity !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }
  }
  // Send Slack alert
  private async sendSlackAlert(alert: PerformanceAlert) {
    try {
      const color = this.getSeverityColor(alert.severity);
      const payload = {
        attachments: [{
          color,
          title: `🚨 Performance Alert: ${alert.metric}`,
          fields: [
            {
              title: 'Metric',
              value: alert.metric,
              short: true
            },
            {
              title: 'Value',
              value: `${alert.value}${alert.metric === 'CLS' ? '' : 'ms'}`,
              short: true
            },
            {
              title: 'Threshold',
              value: `${alert.threshold}${alert.metric === 'CLS' ? '' : 'ms'}`,
              short: true
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'URL',
              value: alert.url,
              short: false
            },
            {
              title: 'Description',
              value: alert.description,
              short: false
            }
          ],
          footer: 'Performance Monitoring',
          ts: Math.floor(alert.timestamp / 1000)
        }]
      };
      await fetch(this.options.slackWebhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
  // Send email alert
  private async sendEmailAlert(alert: PerformanceAlert) {
    try {
      await fetch(this.options.emailEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Performance Alert: ${alert.metric} - ${alert.severity}`,
          template: 'performance_alert',
          data: alert
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
  // Track alert in analytics
  private trackAlert(alert: PerformanceAlert) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_alert', {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity,
        custom_parameter: JSON.stringify({
          url: alert.url,
          connection: alert.connection
        })
      });
    }
  }
  // Get color for severity level
  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange
      high: '#ff0000',     // Red
      critical: '#8b0000'  // Dark Red
    };
    return colors[severity as keyof typeof colors] || '#999999';
  }
  // Configure alert settings
  updateConfig(updates: Partial<AlertingOptions>) {
    this.options = { ...this.options, ...updates };
  }
  // Add custom alert configuration
  addAlertConfig(config: AlertConfig) {
    this.alertConfigs.push(config);
  }
  // Remove alert configuration
  removeAlertConfig(metric: string, threshold: number) {
    this.alertConfigs = this.alertConfigs.filter(
      config => !(config.metric === metric && config.threshold === threshold)
    );
  }
  // Get current alerts
  getAlerts(unresolved = false): PerformanceAlert[] {
    return unresolved 
      ? this.alerts.filter(alert => !alert.resolved)
      : [...this.alerts];
  }
  // Mark alert as resolved
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.saveAlerts();
    }
  }
  // Clear all alerts
  clearAlerts() {
    this.alerts = [];
    this.saveAlerts();
  }
  // Get alert statistics
  getAlertStats(timeRange = 24 * 60 * 60 * 1000): {
    total: number;
    byMetric: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
  } {
    const cutoff = Date.now() - timeRange;
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    const byMetric: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    recentAlerts.forEach(alert => {
      byMetric[alert.metric] = (byMetric[alert.metric] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });
    return {
      total: recentAlerts.length,
      byMetric,
      bySeverity,
      resolved: recentAlerts.filter(alert => alert.resolved).length
    };
  }
  // Enable/disable alerting
  setEnabled(enabled: boolean) {
    this.options.enableNotifications = enabled;
  }
  // Check if alerting is enabled
  isEnabled(): boolean {
    return this.options.enableNotifications;
  }
}
// Singleton instance
let alertingInstance: PerformanceAlerting | null = null;
export function getPerformanceAlerting(options?: Partial<AlertingOptions>): PerformanceAlerting {
  if (!alertingInstance && typeof window !== 'undefined') {
    alertingInstance = new PerformanceAlerting(options);
  }
  return alertingInstance!;
}
// Utility function to check performance and trigger alerts
export function checkPerformanceMetrics(metrics: Record<string, number>, context?: {
  url?: string;
  userAgent?: string;
  connection?: string;
}) {
  const alerting = getPerformanceAlerting();
  Object.entries(metrics).forEach(([metric, value]) => {
    if (typeof value === 'number' && value > 0) {
      alerting.checkMetric(metric, value, context);
    }
  });
}
// React hook for performance alerting
export function usePerformanceAlerting() {
  const alerting = getPerformanceAlerting();
  return {
    checkMetric: (metric: string, value: number, context?: any) => 
      alerting.checkMetric(metric, value, context),
    getAlerts: (unresolved?: boolean) => alerting.getAlerts(unresolved),
    resolveAlert: (alertId: string) => alerting.resolveAlert(alertId),
    clearAlerts: () => alerting.clearAlerts(),
    getStats: (timeRange?: number) => alerting.getAlertStats(timeRange),
    updateConfig: (config: Partial<AlertingOptions>) => alerting.updateConfig(config),
    setEnabled: (enabled: boolean) => alerting.setEnabled(enabled),
    isEnabled: () => alerting.isEnabled()
  };
}
export type { PerformanceAlert, AlertConfig, AlertingOptions };
export { PerformanceAlerting, DEFAULT_ALERT_CONFIGS };

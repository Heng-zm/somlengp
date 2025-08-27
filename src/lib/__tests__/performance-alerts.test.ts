import {
  getPerformanceAlerting,
  checkPerformanceMetrics,
  usePerformanceAlerting,
  PerformanceAlerting,
  DEFAULT_ALERT_CONFIGS,
  type PerformanceAlert,
  type AlertConfig,
  type AlertingOptions,
} from '../performance-alerts';
import { renderHook, act } from '@testing-library/react';
import { mockTimers, waitForTimeout } from '@/lib/test-setup';

// Mock window globals
const mockWindow = {
  location: { href: 'https://test.com' },
  Notification: {
    permission: 'default' as NotificationPermission,
    requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission),
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  gtag: jest.fn(),
};

const mockNavigator = {
  userAgent: 'Jest Test User Agent',
};

// Mock fetch for network requests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Setup window and navigator mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock console methods to reduce noise
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
};

describe('PerformanceAlerting', () => {
  let alerting: PerformanceAlerting;
  let timers: ReturnType<typeof mockTimers>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow.localStorage.getItem.mockReturnValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    
    // Create a fresh instance for each test
    alerting = new PerformanceAlerting();
    timers = mockTimers();
  });

  afterEach(() => {
    timers.restore();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe('Constructor and Initialization', () => {
    it('initializes with default options', () => {
      const alerting = new PerformanceAlerting();
      expect(alerting.isEnabled()).toBe(true);
    });

    it('initializes with custom options', () => {
      const customOptions: Partial<AlertingOptions> = {
        enableNotifications: false,
        enableSlackWebhook: true,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        debounceTime: 10000,
      };

      const alerting = new PerformanceAlerting(customOptions);
      expect(alerting.isEnabled()).toBe(false);
    });

    it('loads stored alerts from localStorage', () => {
      const storedAlerts = [
        {
          id: 'test-1',
          metric: 'LCP',
          value: 3000,
          threshold: 2500,
          severity: 'medium',
          timestamp: Date.now() - 1000,
          url: 'https://test.com',
          userAgent: 'test',
          resolved: false,
          description: 'Test alert',
        },
      ];

      mockWindow.localStorage.getItem.mockReturnValue(
        JSON.stringify(storedAlerts)
      );

      const alerting = new PerformanceAlerting();
      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].metric).toBe('LCP');
    });

    it('cleans up old alerts on initialization', () => {
      const oldAlert = {
        id: 'old-alert',
        metric: 'LCP',
        value: 3000,
        threshold: 2500,
        severity: 'medium',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        url: 'https://test.com',
        userAgent: 'test',
        resolved: false,
        description: 'Old alert',
      };

      const recentAlert = {
        id: 'recent-alert',
        metric: 'FID',
        value: 150,
        threshold: 100,
        severity: 'medium',
        timestamp: Date.now() - 1000,
        url: 'https://test.com',
        userAgent: 'test',
        resolved: false,
        description: 'Recent alert',
      };

      mockWindow.localStorage.getItem.mockReturnValue(
        JSON.stringify([oldAlert, recentAlert])
      );

      const alerting = new PerformanceAlerting();
      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('recent-alert');
    });
  });

  describe('Metric Checking and Alert Triggering', () => {
    it('triggers alert when metric exceeds threshold', async () => {
      alerting.checkMetric('LCP', 3000, {
        url: 'https://test.com',
        userAgent: 'test-agent',
      });

      // Advance timers to trigger debounced alert
      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].metric).toBe('LCP');
      expect(alerts[0].value).toBe(3000);
      expect(alerts[0].severity).toBe('medium');
    });

    it('selects highest severity when multiple thresholds are exceeded', async () => {
      alerting.checkMetric('LCP', 5000); // Should trigger both medium and high severity

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('high'); // Should use highest severity
    });

    it('does not trigger alert when metric is below threshold', async () => {
      alerting.checkMetric('LCP', 2000); // Below 2500ms threshold

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('debounces multiple alerts for same metric and severity', async () => {
      alerting.checkMetric('LCP', 3000);
      alerting.checkMetric('LCP', 3100);
      alerting.checkMetric('LCP', 3200);

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(1); // Should only create one alert
      expect(alerts[0].value).toBe(3200); // Should use latest value
    });

    it('handles different metric types correctly', async () => {
      const testCases = [
        { metric: 'FID', value: 150, expectedSeverity: 'medium' },
        { metric: 'CLS', value: 0.15, expectedSeverity: 'medium' },
        { metric: 'TTFB', value: 1000, expectedSeverity: 'low' },
        { metric: 'DCL', value: 4000, expectedSeverity: 'medium' },
        { metric: 'LOAD', value: 6000, expectedSeverity: 'high' },
      ];

      testCases.forEach(({ metric, value }) => {
        alerting.checkMetric(metric, value);
      });

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(testCases.length);
      
      testCases.forEach(({ metric, expectedSeverity }, index) => {
        const alert = alerts.find(a => a.metric === metric);
        expect(alert).toBeDefined();
        expect(alert!.severity).toBe(expectedSeverity);
      });
    });
  });

  describe('Alert Management', () => {
    beforeEach(async () => {
      // Add some test alerts
      alerting.checkMetric('LCP', 3000);
      alerting.checkMetric('FID', 200);
      
      act(() => {
        timers.advanceByTime(5000);
      });
    });

    it('retrieves all alerts', () => {
      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(2);
    });

    it('retrieves only unresolved alerts', () => {
      const alerts = alerting.getAlerts();
      alerting.resolveAlert(alerts[0].id);

      const unresolvedAlerts = alerting.getAlerts(true);
      expect(unresolvedAlerts).toHaveLength(1);
    });

    it('resolves alerts correctly', () => {
      const alerts = alerting.getAlerts();
      const alertId = alerts[0].id;
      
      alerting.resolveAlert(alertId);
      
      const updatedAlerts = alerting.getAlerts();
      const resolvedAlert = updatedAlerts.find(a => a.id === alertId);
      expect(resolvedAlert?.resolved).toBe(true);
    });

    it('clears all alerts', () => {
      alerting.clearAlerts();
      const alerts = alerting.getAlerts();
      expect(alerts).toHaveLength(0);
    });

    it('saves alerts to localStorage', () => {
      expect(mockWindow.localStorage.setItem).toHaveBeenCalled();
      const saveCall = mockWindow.localStorage.setItem.mock.calls.find(
        call => call[0] === 'performance_alerts'
      );
      expect(saveCall).toBeDefined();
    });
  });

  describe('Alert Statistics', () => {
    beforeEach(async () => {
      // Add alerts with different metrics and severities
      alerting.checkMetric('LCP', 3000); // medium
      alerting.checkMetric('FID', 350); // high
      alerting.checkMetric('CLS', 0.2); // medium
      alerting.checkMetric('TTFB', 2000); // medium

      act(() => {
        timers.advanceByTime(5000);
      });

      // Resolve one alert
      const alerts = alerting.getAlerts();
      alerting.resolveAlert(alerts[0].id);
    });

    it('calculates alert statistics correctly', () => {
      const stats = alerting.getAlertStats();
      
      expect(stats.total).toBe(4);
      expect(stats.resolved).toBe(1);
      expect(stats.byMetric.LCP).toBe(1);
      expect(stats.byMetric.FID).toBe(1);
      expect(stats.byMetric.CLS).toBe(1);
      expect(stats.byMetric.TTFB).toBe(1);
      expect(stats.bySeverity.medium).toBe(3);
      expect(stats.bySeverity.high).toBe(1);
    });

    it('filters statistics by time range', () => {
      // Test with very short time range (should return 0)
      const recentStats = alerting.getAlertStats(100); // 100ms ago
      expect(recentStats.total).toBe(0);

      // Test with long time range (should return all)
      const allTimeStats = alerting.getAlertStats(24 * 60 * 60 * 1000); // 24 hours
      expect(allTimeStats.total).toBe(4);
    });
  });

  describe('Configuration Management', () => {
    it('updates configuration', () => {
      const newConfig: Partial<AlertingOptions> = {
        enableNotifications: false,
        enableSlackWebhook: true,
        slackWebhookUrl: 'https://hooks.slack.com/new',
        debounceTime: 10000,
      };

      alerting.updateConfig(newConfig);
      expect(alerting.isEnabled()).toBe(false);
    });

    it('adds custom alert configuration', () => {
      const customConfig: AlertConfig = {
        metric: 'CUSTOM',
        threshold: 1000,
        severity: 'high',
        enabled: true,
        description: 'Custom metric alert',
      };

      alerting.addAlertConfig(customConfig);
      alerting.checkMetric('CUSTOM', 1500);

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts.some(a => a.metric === 'CUSTOM')).toBe(true);
    });

    it('removes alert configuration', () => {
      alerting.removeAlertConfig('LCP', 2500);
      alerting.checkMetric('LCP', 3000); // Should not trigger alert

      act(() => {
        timers.advanceByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts.some(a => a.metric === 'LCP' && a.threshold === 2500)).toBe(false);
    });

    it('enables/disables alerting', () => {
      alerting.setEnabled(false);
      expect(alerting.isEnabled()).toBe(false);

      alerting.setEnabled(true);
      expect(alerting.isEnabled()).toBe(true);
    });
  });

  describe('Notification Systems', () => {
    beforeEach(() => {
      // Mock Notification constructor
      global.Notification = jest.fn().mockImplementation((title, options) => ({
        title,
        ...options,
        close: jest.fn(),
      })) as any;
      
      // Add static properties to the mock
      Object.assign(global.Notification, {
        permission: 'granted' as NotificationPermission,
        requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission),
      });
    });

    it('sends browser notification when enabled and permission granted', async () => {
      mockWindow.Notification.permission = 'granted';
      
      const alerting = new PerformanceAlerting({
        enableNotifications: true,
      });

      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      expect(global.Notification).toHaveBeenCalled();
    });

    it('sends Slack webhook when configured', async () => {
      const slackUrl = 'https://hooks.slack.com/test';
      const alerting = new PerformanceAlerting({
        enableSlackWebhook: true,
        slackWebhookUrl: slackUrl,
      });

      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      await waitForTimeout(100); // Allow async operations to complete

      expect(mockFetch).toHaveBeenCalledWith(
        slackUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Performance Alert'),
        })
      );
    });

    it('sends email alert when configured', async () => {
      const emailEndpoint = '/api/send-email';
      const alerting = new PerformanceAlerting({
        enableEmailAlerts: true,
        emailEndpoint,
      });

      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      await waitForTimeout(100);

      expect(mockFetch).toHaveBeenCalledWith(
        emailEndpoint,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('performance_alert'),
        })
      );
    });

    it('tracks alerts with gtag when available', async () => {
      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      expect(mockWindow.gtag).toHaveBeenCalledWith(
        'event',
        'performance_alert',
        expect.objectContaining({
          metric: 'LCP',
          value: 3000,
          severity: 'medium',
        })
      );
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const alerting = new PerformanceAlerting({
        enableSlackWebhook: true,
        slackWebhookUrl: 'https://hooks.slack.com/test',
      });

      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      await waitForTimeout(100);

      // Should not throw error
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to send Slack alert:',
        expect.any(Error)
      );
    });
  });

  describe('Default Alert Configurations', () => {
    it('includes all required Core Web Vitals configurations', () => {
      const lcpConfigs = DEFAULT_ALERT_CONFIGS.filter(c => c.metric === 'LCP');
      const fidConfigs = DEFAULT_ALERT_CONFIGS.filter(c => c.metric === 'FID');
      const clsConfigs = DEFAULT_ALERT_CONFIGS.filter(c => c.metric === 'CLS');
      const ttfbConfigs = DEFAULT_ALERT_CONFIGS.filter(c => c.metric === 'TTFB');

      expect(lcpConfigs.length).toBeGreaterThan(0);
      expect(fidConfigs.length).toBeGreaterThan(0);
      expect(clsConfigs.length).toBeGreaterThan(0);
      expect(ttfbConfigs.length).toBeGreaterThan(0);
    });

    it('has proper threshold ordering for each metric', () => {
      const lcpConfigs = DEFAULT_ALERT_CONFIGS
        .filter(c => c.metric === 'LCP')
        .sort((a, b) => a.threshold - b.threshold);
      
      expect(lcpConfigs[0].severity).toBe('medium'); // Lower threshold = medium
      expect(lcpConfigs[1].severity).toBe('high'); // Higher threshold = high
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      mockWindow.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      const alerting = new PerformanceAlerting();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to load stored alerts:',
        expect.any(Error)
      );
    });

    it('handles localStorage save errors gracefully', () => {
      mockWindow.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage save error');
      });

      alerting.checkMetric('LCP', 3000);

      act(() => {
        timers.advanceByTime(5000);
      });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to save alerts:',
        expect.any(Error)
      );
    });
  });
});

describe('Utility Functions', () => {
  describe('getPerformanceAlerting', () => {
    it('returns singleton instance', () => {
      const instance1 = getPerformanceAlerting();
      const instance2 = getPerformanceAlerting();
      expect(instance1).toBe(instance2);
    });

    it('accepts initial options', () => {
      const options = { enableNotifications: false };
      const instance = getPerformanceAlerting(options);
      expect(instance.isEnabled()).toBe(false);
    });
  });

  describe('checkPerformanceMetrics', () => {
    it('checks multiple metrics at once', () => {
      const metrics = {
        LCP: 3000,
        FID: 150,
        CLS: 0.15,
        TTFB: 1000,
      };

      checkPerformanceMetrics(metrics, {
        url: 'https://test.com',
        userAgent: 'test-agent',
      });

      // Should trigger alerts for each metric
      const alerting = getPerformanceAlerting();
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const alerts = alerting.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('ignores invalid metric values', () => {
      const metrics = {
        LCP: 3000,
        FID: -1, // Invalid negative value
        CLS: 0, // Zero value (ignored)
        TTFB: 'invalid' as any, // Invalid type
      };

      // Should not throw
      checkPerformanceMetrics(metrics);
    });
  });
});

describe('usePerformanceAlerting Hook', () => {
  it('provides alerting functionality', () => {
    const { result } = renderHook(() => usePerformanceAlerting());

    expect(typeof result.current.checkMetric).toBe('function');
    expect(typeof result.current.getAlerts).toBe('function');
    expect(typeof result.current.resolveAlert).toBe('function');
    expect(typeof result.current.clearAlerts).toBe('function');
    expect(typeof result.current.getStats).toBe('function');
    expect(typeof result.current.updateConfig).toBe('function');
    expect(typeof result.current.setEnabled).toBe('function');
    expect(typeof result.current.isEnabled).toBe('function');
  });

  it('triggers and retrieves alerts', () => {
    const { result } = renderHook(() => usePerformanceAlerting());

    act(() => {
      result.current.checkMetric('LCP', 3000);
      jest.advanceTimersByTime(5000);
    });

    const alerts = result.current.getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('updates configuration', () => {
    const { result } = renderHook(() => usePerformanceAlerting());

    act(() => {
      result.current.updateConfig({ enableNotifications: false });
    });

    expect(result.current.isEnabled()).toBe(false);
  });
});

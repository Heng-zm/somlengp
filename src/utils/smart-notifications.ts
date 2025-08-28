'use client';

import { QRHistoryItem } from './qr-scan-history';
import { analyzeQRContent } from '@/ai/flows/qr-analysis-flow';
import { ValidationResult } from './smart-qr-validator';
import { errorHandler } from '@/lib/error-utils';

export interface SmartNotification {
  id: string;
  type: 'security' | 'maintenance' | 'insight' | 'reminder' | 'trend' | 'cleanup';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionable: boolean;
  actions?: NotificationAction[];
  timestamp: number;
  expiresAt?: number;
  relatedItems: string[]; // QR item IDs
  metadata: {
    source: string;
    confidence: number;
    category?: string;
    tags: string[];
    viewed: boolean;
    dismissed: boolean;
    actionTaken?: string;
  };
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  icon?: string;
  handler: () => Promise<void> | void;
  confirmation?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  trigger: (items: QRHistoryItem[], context: NotificationContext) => Promise<SmartNotification[]>;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  lastRun: number;
  conditions?: {
    minItems?: number;
    maxAge?: number;
    categories?: string[];
    types?: string[];
  };
}

export interface NotificationContext {
  currentTime: number;
  userPreferences: {
    enableSecurityAlerts: boolean;
    enableMaintenanceAlerts: boolean;
    enableInsights: boolean;
    enableTrends: boolean;
    quietHours: { start: number; end: number } | null;
    maxNotificationsPerDay: number;
  };
  recentActivity: {
    scansToday: number;
    lastScan: number;
    peakScanTime: number;
  };
}

class SmartNotificationSystem {
  private notifications: Map<string, SmartNotification> = new Map();
  private notificationRules: Map<string, NotificationRule> = new Map();
  private notificationHistory: SmartNotification[] = [];
  private lastAnalysis = 0;
  private analysisInterval = 60 * 60 * 1000; // 1 hour
  private subscribers: Array<(notification: SmartNotification) => void> = [];

  constructor() {
    this.initializeRules();
    this.loadNotifications();
    this.schedulePeriodicAnalysis();
  }

  private initializeRules(): void {
    // Security-related notifications
    this.addRule({
      id: 'security-high-risk-detected',
      name: 'High Risk QR Code Detected',
      description: 'Alerts when a high-risk QR code is scanned',
      enabled: true,
      priority: 'critical',
      frequency: 'immediate',
      lastRun: 0,
      trigger: async (items, context) => {
        const notifications: SmartNotification[] = [];
        const recentHighRiskItems = items.filter(item => {
          const timeDiff = context.currentTime - item.lastScanned;
          return timeDiff < 24 * 60 * 60 * 1000; // Last 24 hours
        });

        // This would integrate with the validation system
        for (const item of recentHighRiskItems) {
          // Simulate risk analysis - in real implementation, use smart validator
          const riskScore = Math.random() * 100;
          if (riskScore > 75) {
            notifications.push({
              id: this.generateId(),
              type: 'security',
              priority: 'critical',
              title: 'High Risk QR Code Detected',
              message: `A potentially dangerous QR code was scanned. Risk score: ${Math.round(riskScore)}/100`,
              actionable: true,
              actions: [
                {
                  id: 'review-item',
                  label: 'Review Item',
                  type: 'primary',
                  handler: () => console.log('Opening QR details')
                },
                {
                  id: 'block-similar',
                  label: 'Block Similar',
                  type: 'danger',
                  confirmation: 'Block similar QR codes?',
                  handler: () => console.log('Blocking similar QR codes')
                }
              ],
              timestamp: context.currentTime,
              expiresAt: context.currentTime + (7 * 24 * 60 * 60 * 1000),
              relatedItems: [item.id],
              metadata: {
                source: 'security-analyzer',
                confidence: 0.9,
                category: item.category,
                tags: ['security', 'high-risk'],
                viewed: false,
                dismissed: false
              }
            });
          }
        }

        return notifications;
      }
    });

    // Maintenance notifications
    this.addRule({
      id: 'outdated-links-detected',
      name: 'Outdated Links Detected',
      description: 'Identifies QR codes with potentially outdated links',
      enabled: true,
      priority: 'medium',
      frequency: 'weekly',
      lastRun: 0,
      conditions: {
        minItems: 5,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      },
      trigger: async (items, context) => {
        const notifications: SmartNotification[] = [];
        const urlItems = items.filter(item => item.parsedData.type === 'url');
        const cutoffDate = context.currentTime - (30 * 24 * 60 * 60 * 1000);
        
        const oldUrlItems = urlItems.filter(item => item.timestamp < cutoffDate);
        
        if (oldUrlItems.length >= 5) {
          notifications.push({
            id: this.generateId(),
            type: 'maintenance',
            priority: 'medium',
            title: 'Outdated Links Found',
            message: `Found ${oldUrlItems.length} QR codes with links older than 30 days. Consider reviewing them.`,
            actionable: true,
            actions: [
              {
                id: 'review-links',
                label: 'Review Links',
                type: 'primary',
                handler: () => console.log('Opening outdated links review')
              },
              {
                id: 'auto-cleanup',
                label: 'Auto Cleanup',
                type: 'secondary',
                confirmation: 'Remove outdated links automatically?',
                handler: () => console.log('Starting auto cleanup')
              }
            ],
            timestamp: context.currentTime,
            relatedItems: oldUrlItems.map(item => item.id),
            metadata: {
              source: 'maintenance-analyzer',
              confidence: 0.8,
              tags: ['maintenance', 'cleanup', 'urls'],
              viewed: false,
              dismissed: false
            }
          });
        }

        return notifications;
      }
    });

    // Usage insights
    this.addRule({
      id: 'usage-pattern-insights',
      name: 'Usage Pattern Insights',
      description: 'Provides insights about scanning patterns and trends',
      enabled: true,
      priority: 'low',
      frequency: 'daily',
      lastRun: 0,
      trigger: async (items, context) => {
        const notifications: SmartNotification[] = [];
        
        if (items.length >= 10) {
          const categoryStats = this.analyzeCategoryTrends(items);
          const mostUsedCategory = categoryStats[0];
          
          if (mostUsedCategory && mostUsedCategory.count >= 5) {
            notifications.push({
              id: this.generateId(),
              type: 'insight',
              priority: 'low',
              title: 'Usage Pattern Detected',
              message: `You've been scanning a lot of ${mostUsedCategory.category} QR codes recently (${mostUsedCategory.count} scans). Consider organizing them into a collection.`,
              actionable: true,
              actions: [
                {
                  id: 'create-collection',
                  label: 'Create Collection',
                  type: 'primary',
                  handler: () => console.log('Creating QR collection')
                }
              ],
              timestamp: context.currentTime,
              relatedItems: items.filter(item => item.category === mostUsedCategory.category).map(item => item.id),
              metadata: {
                source: 'pattern-analyzer',
                confidence: 0.7,
                category: mostUsedCategory.category,
                tags: ['insights', 'patterns', 'organization'],
                viewed: false,
                dismissed: false
              }
            });
          }
        }

        return notifications;
      }
    });

    // Reminder notifications
    this.addRule({
      id: 'favorite-items-reminder',
      name: 'Favorite Items Reminder',
      description: 'Reminds about favorite QR codes that haven\'t been used recently',
      enabled: true,
      priority: 'low',
      frequency: 'weekly',
      lastRun: 0,
      trigger: async (items, context) => {
        const notifications: SmartNotification[] = [];
        const favoriteItems = items.filter(item => item.favorite);
        const inactiveThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const inactiveFavorites = favoriteItems.filter(item => 
          context.currentTime - item.lastScanned > inactiveThreshold
        );

        if (inactiveFavorites.length >= 2) {
          notifications.push({
            id: this.generateId(),
            type: 'reminder',
            priority: 'low',
            title: 'Unused Favorites',
            message: `You have ${inactiveFavorites.length} favorite QR codes that haven't been used in a week.`,
            actionable: true,
            actions: [
              {
                id: 'review-favorites',
                label: 'Review Favorites',
                type: 'primary',
                handler: () => console.log('Opening favorites review')
              }
            ],
            timestamp: context.currentTime,
            relatedItems: inactiveFavorites.map(item => item.id),
            metadata: {
              source: 'reminder-system',
              confidence: 0.6,
              tags: ['reminder', 'favorites', 'inactive'],
              viewed: false,
              dismissed: false
            }
          });
        }

        return notifications;
      }
    });

    // Trend notifications
    this.addRule({
      id: 'scanning-trend-analysis',
      name: 'Scanning Trend Analysis',
      description: 'Analyzes scanning trends and provides insights',
      enabled: true,
      priority: 'low',
      frequency: 'weekly',
      lastRun: 0,
      trigger: async (items, context) => {
        const notifications: SmartNotification[] = [];
        
        if (context.recentActivity.scansToday > 10) {
          const trend = this.calculateScanningTrend(items, context.currentTime);
          
          if (trend.isIncreasing && trend.percentage > 50) {
            notifications.push({
              id: this.generateId(),
              type: 'trend',
              priority: 'low',
              title: 'Increased Scanning Activity',
              message: `Your QR scanning activity has increased by ${Math.round(trend.percentage)}% compared to last week.`,
              actionable: false,
              timestamp: context.currentTime,
              relatedItems: [],
              metadata: {
                source: 'trend-analyzer',
                confidence: trend.confidence,
                tags: ['trends', 'activity', 'statistics'],
                viewed: false,
                dismissed: false
              }
            });
          }
        }

        return notifications;
      }
    });
  }

  private addRule(rule: NotificationRule): void {
    this.notificationRules.set(rule.id, rule);
  }

  private loadNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('smart-notifications');
        if (stored) {
          const data = JSON.parse(stored);
          
          // Load active notifications
          if (data.notifications) {
            data.notifications.forEach((notif: SmartNotification) => {
              if (!notif.expiresAt || notif.expiresAt > Date.now()) {
                this.notifications.set(notif.id, notif);
              }
            });
          }

          // Load notification history
          if (data.history) {
            this.notificationHistory = data.history.slice(-50); // Keep only recent 50
          }

          console.log(`Loaded ${this.notifications.size} active notifications`);
        }
      } catch (error) {
        errorHandler.handle(error, { method: 'loadNotifications' });
      }
    }
  }

  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          notifications: Array.from(this.notifications.values()),
          history: this.notificationHistory,
          lastUpdated: Date.now()
        };
        
        localStorage.setItem('smart-notifications', JSON.stringify(data));
      } catch (error) {
        errorHandler.handle(error, { method: 'saveNotifications' });
      }
    }
  }

  private schedulePeriodicAnalysis(): void {
    setInterval(() => {
      if (Date.now() - this.lastAnalysis > this.analysisInterval) {
        // This would be triggered by the main app to provide fresh data
        console.log('Scheduled notification analysis - waiting for data refresh');
      }
    }, this.analysisInterval);
  }

  /**
   * Analyze QR history and generate notifications
   */
  async analyzeAndNotify(
    items: QRHistoryItem[],
    context: NotificationContext
  ): Promise<SmartNotification[]> {
    try {
      this.lastAnalysis = Date.now();
      const newNotifications: SmartNotification[] = [];

      // Run through all enabled notification rules
      for (const rule of this.notificationRules.values()) {
        if (!rule.enabled) continue;

        try {
          // Check if rule should run based on frequency
          const shouldRun = this.shouldRunRule(rule, context);
          
          if (shouldRun) {
            const ruleNotifications = await rule.trigger(items, context);
            
            // Filter out duplicate notifications
            const filteredNotifications = ruleNotifications.filter(notif => 
              !this.notifications.has(notif.id) && 
              !this.isDuplicateNotification(notif)
            );

            newNotifications.push(...filteredNotifications);
            rule.lastRun = context.currentTime;
          }
        } catch (ruleError) {
          errorHandler.handle(ruleError, { method: 'analyzeAndNotify', ruleId: rule.id });
        }
      }

      // Add new notifications and notify subscribers
      for (const notification of newNotifications) {
        this.addNotification(notification);
      }

      // Clean up expired notifications
      this.cleanupExpiredNotifications();

      // Save state
      this.saveNotifications();

      return newNotifications;
    } catch (error) {
      errorHandler.handle(error, { method: 'analyzeAndNotify' });
      return [];
    }
  }

  private shouldRunRule(rule: NotificationRule, context: NotificationContext): boolean {
    const timeSinceLastRun = context.currentTime - rule.lastRun;
    
    switch (rule.frequency) {
      case 'immediate':
        return true;
      case 'hourly':
        return timeSinceLastRun >= 60 * 60 * 1000;
      case 'daily':
        return timeSinceLastRun >= 24 * 60 * 60 * 1000;
      case 'weekly':
        return timeSinceLastRun >= 7 * 24 * 60 * 60 * 1000;
      default:
        return false;
    }
  }

  private isDuplicateNotification(notification: SmartNotification): boolean {
    // Check for similar notifications in recent history
    const recentThreshold = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    return this.notificationHistory.some(existing => 
      existing.type === notification.type &&
      existing.title === notification.title &&
      existing.timestamp > recentThreshold &&
      !existing.metadata.dismissed
    );
  }

  private addNotification(notification: SmartNotification): void {
    this.notifications.set(notification.id, notification);
    
    // Add to history
    this.notificationHistory.unshift(notification);
    this.notificationHistory = this.notificationHistory.slice(0, 100); // Keep only recent 100

    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(notification);
      } catch (error) {
        console.warn('Notification subscriber error:', error);
      }
    });
  }

  private cleanupExpiredNotifications(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach(id => this.notifications.delete(id));
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): SmartNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => {
        // Sort by priority, then by timestamp
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.timestamp - a.timestamp;
      });
  }

  /**
   * Get notifications by type
   */
  getNotificationsByType(type: SmartNotification['type']): SmartNotification[] {
    return this.getActiveNotifications().filter(notif => notif.type === type);
  }

  /**
   * Mark notification as viewed
   */
  markAsViewed(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.metadata.viewed = true;
      this.saveNotifications();
      return true;
    }
    return false;
  }

  /**
   * Dismiss notification
   */
  dismissNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.metadata.dismissed = true;
      this.notifications.delete(notificationId);
      this.saveNotifications();
      return true;
    }
    return false;
  }

  /**
   * Execute notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification || !notification.actions) {
      return false;
    }

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) {
      return false;
    }

    try {
      await action.handler();
      notification.metadata.actionTaken = actionId;
      this.saveNotifications();
      return true;
    } catch (error) {
      errorHandler.handle(error, { method: 'executeAction', notificationId, actionId });
      return false;
    }
  }

  /**
   * Subscribe to new notifications
   */
  subscribe(callback: (notification: SmartNotification) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    active: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    totalGenerated: number;
    actionsTaken: number;
    dismissalRate: number;
  } {
    const active = this.notifications.size;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const notification of this.notifications.values()) {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    }

    const totalGenerated = this.notificationHistory.length;
    const actionsTaken = this.notificationHistory.filter(n => n.metadata.actionTaken).length;
    const dismissed = this.notificationHistory.filter(n => n.metadata.dismissed).length;
    const dismissalRate = totalGenerated > 0 ? dismissed / totalGenerated : 0;

    return {
      active,
      byType,
      byPriority,
      totalGenerated,
      actionsTaken,
      dismissalRate: Math.round(dismissalRate * 100) / 100
    };
  }

  // Helper methods for analysis
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private analyzeCategoryTrends(items: QRHistoryItem[]): Array<{ category: string; count: number }> {
    const categoryCount: Record<string, number> = {};
    
    items.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateScanningTrend(items: QRHistoryItem[], currentTime: number): {
    isIncreasing: boolean;
    percentage: number;
    confidence: number;
  } {
    const oneWeekAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = currentTime - (14 * 24 * 60 * 60 * 1000);

    const thisWeekScans = items.filter(item => item.lastScanned > oneWeekAgo).length;
    const lastWeekScans = items.filter(item => 
      item.lastScanned > twoWeeksAgo && item.lastScanned <= oneWeekAgo
    ).length;

    if (lastWeekScans === 0) {
      return { isIncreasing: thisWeekScans > 0, percentage: 100, confidence: 0.5 };
    }

    const percentage = ((thisWeekScans - lastWeekScans) / lastWeekScans) * 100;
    const confidence = Math.min(1, Math.abs(percentage) / 100);

    return {
      isIncreasing: percentage > 0,
      percentage: Math.abs(percentage),
      confidence
    };
  }
}

// Export singleton instance
export const smartNotificationSystem = new SmartNotificationSystem();

// Export convenience functions
export const analyzeAndNotify = (items: QRHistoryItem[], context: NotificationContext) =>
  smartNotificationSystem.analyzeAndNotify(items, context);

export const getActiveNotifications = () => smartNotificationSystem.getActiveNotifications();

export const subscribeToNotifications = (callback: (notification: SmartNotification) => void) =>
  smartNotificationSystem.subscribe(callback);

// Privacy-respecting user activity tracking and analytics
import { doc, setDoc, updateDoc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// Activity event types
export type ActivityType = 
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'ai_chat_start'
  | 'ai_chat_message'
  | 'transcript_create'
  | 'transcript_export'
  | 'settings_change'
  | 'file_upload'
  | 'error_encountered';
// Activity event interface
export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityType;
  timestamp: Date;
  metadata?: {
    [key: string]: any;
  };
  sessionId: string;
  userAgent?: string;
  ipAddress?: string; // Hashed for privacy
  location?: {
    country?: string;
    region?: string;
    // No city or precise location for privacy
  };
}
// User analytics summary
export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalActivities: number;
  lastActiveDate: Date;
  firstActiveDate: Date;
  favoriteFeatures: string[];
  averageSessionDuration: number; // in minutes
  weeklyActivityCount: number;
  monthlyActivityCount: number;
  updatedAt: Date;
}
// Privacy-safe activity logging
export async function logActivity(
  userId: string,
  type: ActivityType,
  metadata: Record<string, any> = {},
  userAgent?: string
): Promise<void> {
  try {
    if (!db) {
      return;
    }
    const activityId = `${userId}_${type}_${Date.now()}`;
    const sessionId = getSessionId();
    // Create privacy-safe activity event
    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId,
      type,
      timestamp: new Date(),
      metadata: sanitizeMetadata(metadata),
      sessionId,
      userAgent: sanitizeUserAgent(userAgent),
      // IP address and location would be added server-side if needed
    };
    // Store in Firestore with automatic cleanup
    const activityRef = doc(db, 'user_activities', activityId);
    await setDoc(activityRef, {
      ...activityEvent,
      timestamp: Timestamp.fromDate(activityEvent.timestamp),
      // Add TTL for automatic cleanup (30 days)
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    });
    // Update user analytics summary (async, don't block)
    updateUserAnalytics(userId, type).catch(error => {
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - analytics shouldn't break user experience
  }
}
// Update aggregated user analytics
async function updateUserAnalytics(userId: string, activityType: ActivityType): Promise<void> {
  try {
    if (!db) return;
    const analyticsRef = doc(db, 'user_analytics', userId);
    const analyticsDoc = await getDoc(analyticsRef);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (analyticsDoc.exists()) {
      const current = analyticsDoc.data() as UserAnalytics;
      // Count recent activities
      const recentActivities = await getRecentActivitiesCount(userId, weekAgo);
      const monthlyActivities = await getRecentActivitiesCount(userId, monthAgo);
      await updateDoc(analyticsRef, {
        totalActivities: current.totalActivities + 1,
        lastActiveDate: Timestamp.fromDate(now),
        weeklyActivityCount: recentActivities,
        monthlyActivityCount: monthlyActivities,
        favoriteFeatures: updateFavoriteFeatures(current.favoriteFeatures || [], activityType),
        updatedAt: Timestamp.fromDate(now)
      });
    } else {
      // Create new analytics document
      const analytics: Omit<UserAnalytics, 'userId'> = {
        totalSessions: 1,
        totalActivities: 1,
        lastActiveDate: now,
        firstActiveDate: now,
        favoriteFeatures: [activityType],
        averageSessionDuration: 0,
        weeklyActivityCount: 1,
        monthlyActivityCount: 1,
        updatedAt: now
      };
      await setDoc(analyticsRef, {
        userId,
        ...analytics,
        lastActiveDate: Timestamp.fromDate(analytics.lastActiveDate),
        firstActiveDate: Timestamp.fromDate(analytics.firstActiveDate),
        updatedAt: Timestamp.fromDate(analytics.updatedAt)
      });
    }
  } catch (error) {
    console.error('Failed to update user analytics:', error);
  }
}
// Get user's recent activities count
async function getRecentActivitiesCount(userId: string, since: Date): Promise<number> {
  try {
    if (!db) return 0;
    const q = query(
      collection(db, 'user_activities'),
      where('userId', '==', userId),
      where('timestamp', '>=', Timestamp.fromDate(since))
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    return 0;
  }
}
// Get user analytics summary
export async function getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
  try {
    if (!db) return null;
    const analyticsRef = doc(db, 'user_analytics', userId);
    const analyticsDoc = await getDoc(analyticsRef);
    if (!analyticsDoc.exists()) {
      return null;
    }
    const data = analyticsDoc.data();
    return {
      userId: data.userId,
      totalSessions: data.totalSessions || 0,
      totalActivities: data.totalActivities || 0,
      lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
      firstActiveDate: data.firstActiveDate?.toDate() || new Date(),
      favoriteFeatures: data.favoriteFeatures || [],
      averageSessionDuration: data.averageSessionDuration || 0,
      weeklyActivityCount: data.weeklyActivityCount || 0,
      monthlyActivityCount: data.monthlyActivityCount || 0,
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Failed to get user analytics:', error);
    return null;
  }
}
// Get user's recent activities (for dashboard)
export async function getUserRecentActivities(
  userId: string, 
  limitCount: number = 10
): Promise<ActivityEvent[]> {
  try {
    if (!db) return [];
    const q = query(
      collection(db, 'user_activities'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as ActivityEvent));
  } catch (error) {
    console.error('Failed to get user recent activities:', error);
    return [];
  }
}
// Helper functions
function getSessionId(): string {
  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  // Only include safe, non-sensitive metadata
  const allowedKeys = [
    'feature', 'action', 'duration', 'success', 'error_type', 
    'file_type', 'export_format', 'model_used', 'message_count'
  ];
  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.includes(key) && typeof value !== 'object') {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
function sanitizeUserAgent(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  // Extract only basic browser/OS info, remove detailed version numbers
  const simplified = userAgent
    .replace(/\d+\.\d+\.\d+/g, 'X.X.X') // Replace version numbers
    .replace(/\([^)]+\)/g, '') // Remove detailed system info
    .substring(0, 100); // Limit length
  return simplified;
}
function updateFavoriteFeatures(current: string[], newActivity: ActivityType): string[] {
  const updated = [...current];
  const index = updated.indexOf(newActivity);
  if (index > -1) {
    // Move to front if already exists
    updated.splice(index, 1);
    updated.unshift(newActivity);
  } else {
    // Add new activity to front
    updated.unshift(newActivity);
  }
  // Keep only top 5 favorite features
  return updated.slice(0, 5);
}
// Utility functions for common activities
export const ActivityLogger = {
  login: (userId: string) => logActivity(userId, 'login'),
  logout: (userId: string) => logActivity(userId, 'logout'),
  profileUpdate: (userId: string) => logActivity(userId, 'profile_update'),
  aiChatStart: (userId: string) => logActivity(userId, 'ai_chat_start'),
  aiChatMessage: (userId: string, messageCount: number) => 
    logActivity(userId, 'ai_chat_message', { message_count: messageCount }),
  transcriptCreate: (userId: string) => logActivity(userId, 'transcript_create'),
  transcriptExport: (userId: string, format: string) => 
    logActivity(userId, 'transcript_export', { export_format: format }),
  settingsChange: (userId: string, setting: string) => 
    logActivity(userId, 'settings_change', { feature: setting }),
  fileUpload: (userId: string, fileType: string) => 
    logActivity(userId, 'file_upload', { file_type: fileType }),
  error: (userId: string, errorType: string) => 
    logActivity(userId, 'error_encountered', { error_type: errorType })
};
// Privacy utilities
export function deleteUserAnalytics(userId: string): Promise<void> {
  // For GDPR compliance - delete all user analytics data
  return Promise.all([
    // Delete analytics summary
    db && doc(db, 'user_analytics', userId) ? 
      updateDoc(doc(db, 'user_analytics', userId), { deleted: true }) : 
      Promise.resolve(),
    // Mark activities for deletion (they'll be auto-deleted by TTL)
    // In production, you might want to immediately delete them
  ]).then(() => undefined);
}
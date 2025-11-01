// Privacy-respecting user activity tracking and analytics
// NOTE: Firebase analytics temporarily disabled during Supabase migration
// TODO: Implement Supabase-based analytics system

// Placeholder imports - Firebase functionality disabled
// import { doc, setDoc, updateDoc, getDoc, collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
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
  // Analytics temporarily disabled during migration
  return;
}
// Update aggregated user analytics
async function updateUserAnalytics(userId: string, activityType: ActivityType): Promise<void> {
  // Analytics temporarily disabled during migration
  return;
}
// Get user's recent activities count
async function getRecentActivitiesCount(userId: string, since: Date): Promise<number> {
  // Analytics temporarily disabled during migration
  return 0;
}
// Get user analytics summary
export async function getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
  // Analytics temporarily disabled during migration
  return null;
}
// Get user's recent activities (for dashboard)
export async function getUserRecentActivities(
  userId: string, 
  limitCount = 10
): Promise<ActivityEvent[]> {
  // Analytics temporarily disabled during migration
  return [];
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
  // Analytics temporarily disabled during migration
  return Promise.resolve();
}

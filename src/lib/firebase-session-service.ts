'use client';

// Firebase session service temporarily disabled during Supabase migration
// TODO: Implement Supabase-based session management

// Keep only the interfaces for type compatibility
type Timestamp = Date;

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'host-left';
  sessionId: string;
  userId: string;
  data?: any;
  timestamp: Timestamp;
}

export interface SessionData {
  id: string;
  hostId: string;
  hostName?: string;
  participants: string[];
  isActive: boolean;
  createdAt: Timestamp;
  lastActivity: Timestamp;
  messages?: SignalingMessage[];
}

export interface SessionParticipant {
  id: string;
  name?: string;
  joinedAt: Timestamp;
  isHost: boolean;
}

// Disabled class implementation
class FirebaseSessionService {
  private listeners: Map<string, () => void> = new Map();
  private messageListeners: Map<string, (messages: SignalingMessage[]) => void> = new Map();

  generateUserId(): string {
    return `user_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }

  generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  async createSession(hostId: string, hostName?: string): Promise<string> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async joinSession(sessionId: string, userId: string, userName?: string): Promise<boolean> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async sendMessage(message: SignalingMessage): Promise<void> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  listenForMessages(sessionId: string, userId: string, callback: (message: SignalingMessage) => void): string {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  listenForSession(sessionId: string, callback: (session: SessionData | null) => void): string {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  stopListening(listenerId: string): void {
    // Allow this to work silently
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async cleanupExpiredSessions(): Promise<void> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  async getActiveSessionsCount(): Promise<number> {
    throw new Error('Firebase session service temporarily disabled during Supabase migration.');
  }

  cleanup(): void {
    this.listeners.clear();
    this.messageListeners.clear();
  }
}

// Export singleton instance
export const firebaseSessionService = new FirebaseSessionService();
export default firebaseSessionService;
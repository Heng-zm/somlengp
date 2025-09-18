'use client';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  sessionId: string;
  userId: string;
  data?: any;
  timestamp?: number;
}

interface SessionData {
  id: string;
  hostId: string;
  participants: string[];
  messages: SignalingMessage[];
  createdAt: number;
}

class SignalingService {
  private listeners: Map<string, (message: SignalingMessage) => void> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private lastMessageTimestamp: number = 0;

  // Generate unique user ID
  generateUserId(): string {
    return `user_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Create a new session
  createSession(hostId: string): string {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const session: SessionData = {
      id: sessionId,
      hostId,
      participants: [hostId],
      messages: [],
      createdAt: Date.now()
    };

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    return sessionId;
  }

  // Join an existing session
  joinSession(sessionId: string, userId: string): boolean {
    try {
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      if (!sessionData) {
        return false;
      }

      const session: SessionData = JSON.parse(sessionData);
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
      }

      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      return false;
    }
  }

  // Leave a session
  leaveSession(sessionId: string, userId: string): void {
    try {
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      if (!sessionData) return;

      const session: SessionData = JSON.parse(sessionData);
      session.participants = session.participants.filter(id => id !== userId);

      if (session.participants.length === 0) {
        // Remove session if no participants left
        localStorage.removeItem(`session_${sessionId}`);
      } else {
        localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  // Send a message to a session
  sendMessage(message: SignalingMessage): void {
    try {
      const sessionData = localStorage.getItem(`session_${message.sessionId}`);
      if (!sessionData) {
        console.error('Session not found:', message.sessionId);
        return;
      }

      const session: SessionData = JSON.parse(sessionData);
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || Date.now()
      };

      session.messages.push(messageWithTimestamp);
      
      // Keep only last 50 messages to prevent storage overflow
      if (session.messages.length > 50) {
        session.messages = session.messages.slice(-50);
      }

      localStorage.setItem(`session_${message.sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  // Listen for messages in a session
  listen(sessionId: string, userId: string, callback: (message: SignalingMessage) => void): void {
    const listenerId = `${sessionId}_${userId}`;
    this.listeners.set(listenerId, callback);

    // Start polling if not already started
    if (!this.pollInterval) {
      this.startPolling();
    }
  }

  // Stop listening for messages
  stopListening(sessionId: string, userId: string): void {
    const listenerId = `${sessionId}_${userId}`;
    this.listeners.delete(listenerId);

    // Stop polling if no listeners
    if (this.listeners.size === 0 && this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Start polling for new messages
  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.pollMessages();
    }, 1000); // Poll every second
  }

  // Poll for new messages
  private pollMessages(): void {
    try {
      const sessionIds = new Set<string>();
      
      // Get all session IDs from listeners
      this.listeners.forEach((_, listenerId) => {
        const sessionId = listenerId.split('_')[0];
        sessionIds.add(sessionId);
      });

      // Check each session for new messages
      sessionIds.forEach(sessionId => {
        const sessionData = localStorage.getItem(`session_${sessionId}`);
        if (!sessionData) return;

        const session: SessionData = JSON.parse(sessionData);
        
        // Find new messages since last check
        const newMessages = session.messages.filter(
          msg => (msg.timestamp || 0) > this.lastMessageTimestamp
        );

        // Notify listeners of new messages
        newMessages.forEach(message => {
          this.listeners.forEach((callback, listenerId) => {
            const [listenerSessionId, listenerUserId] = listenerId.split('_');
            
            // Only send messages to the right session and not to the sender
            if (listenerSessionId === sessionId && listenerUserId !== message.userId) {
              callback(message);
            }
          });
        });
      });

      // Update last message timestamp
      this.lastMessageTimestamp = Date.now();
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }

  // Get session info
  getSession(sessionId: string): SessionData | null {
    try {
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Check if session exists
  sessionExists(sessionId: string): boolean {
    return localStorage.getItem(`session_${sessionId}`) !== null;
  }

  // Clean up old sessions (older than 24 hours)
  cleanupOldSessions(): void {
    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('session_')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session: SessionData = JSON.parse(sessionData);
            if (session.createdAt < cutoffTime) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}

// Export singleton instance
export const signalingService = new SignalingService();

// Cleanup old sessions on initialization
if (typeof window !== 'undefined') {
  signalingService.cleanupOldSessions();
}
'use client';

import firebaseSessionService, { 
  SignalingMessage, 
  SessionData 
} from './firebase-session-service';

// Legacy interface for backward compatibility
interface LegacySessionData {
  id: string;
  hostId: string;
  participants: string[];
  messages: SignalingMessage[];
  createdAt: number;
}

class SignalingService {
  private messageListeners: Map<string, string> = new Map(); // Maps listenerId to Firebase listenerId
  private sessionListeners: Map<string, string> = new Map();

  constructor() {
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  // Generate unique user ID
  generateUserId(): string {
    return firebaseSessionService.generateUserId();
  }

  // Create a new session
  async createSession(hostId: string, hostName?: string): Promise<string> {
    try {
      return await firebaseSessionService.createSession(hostId, hostName);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create session. Please check your connection.');
    }
  }

  // Join an existing session
  async joinSession(sessionId: string, userId: string, userName?: string): Promise<boolean> {
    try {
      return await firebaseSessionService.joinSession(sessionId, userId, userName);
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }

  // Leave a session
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      await firebaseSessionService.leaveSession(sessionId, userId);
      
      // Clean up local listeners
      const messageListenerId = `${sessionId}_${userId}`;
      const sessionListenerId = `${sessionId}_session`;
      
      this.stopListening(sessionId, userId);
      this.stopSessionListener(sessionListenerId);
      
    } catch (error) {
      console.error('Failed to leave session:', error);
      throw error;
    }
  }

  // Send a message to a session
  async sendMessage(message: SignalingMessage): Promise<void> {
    try {
      await firebaseSessionService.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Listen for messages in a session
  listen(sessionId: string, userId: string, callback: (message: SignalingMessage) => void): void {
    try {
      const listenerId = `${sessionId}_${userId}`;
      
      // Stop existing listener if any
      this.stopListening(sessionId, userId);
      
      const firebaseListenerId = firebaseSessionService.listenForMessages(
        sessionId, 
        userId, 
        callback
      );
      
      this.messageListeners.set(listenerId, firebaseListenerId);
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  }

  // Listen for session updates
  listenForSession(sessionId: string, callback: (session: SessionData | null) => void): string {
    try {
      const listenerId = `${sessionId}_session`;
      
      const firebaseListenerId = firebaseSessionService.listenForSession(
        sessionId,
        callback
      );
      
      this.sessionListeners.set(listenerId, firebaseListenerId);
      return listenerId;
    } catch (error) {
      console.error('Failed to listen for session updates:', error);
      throw error;
    }
  }

  // Stop listening for messages
  stopListening(sessionId: string, userId: string): void {
    const listenerId = `${sessionId}_${userId}`;
    const firebaseListenerId = this.messageListeners.get(listenerId);
    
    if (firebaseListenerId) {
      firebaseSessionService.stopListening(firebaseListenerId);
      this.messageListeners.delete(listenerId);
    }
  }

  // Stop listening for session updates
  stopSessionListener(listenerId: string): void {
    const firebaseListenerId = this.sessionListeners.get(listenerId);
    
    if (firebaseListenerId) {
      firebaseSessionService.stopListening(firebaseListenerId);
      this.sessionListeners.delete(listenerId);
    }
  }

  // Get session info
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      return await firebaseSessionService.getSession(sessionId);
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Check if session exists
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      return await firebaseSessionService.sessionExists(sessionId);
    } catch (error) {
      console.error('Failed to check session existence:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility - converts to new format
  async getLegacySession(sessionId: string): Promise<LegacySessionData | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return null;
      
      return {
        id: session.id,
        hostId: session.hostId,
        participants: session.participants,
        messages: [], // Messages are now handled via real-time listeners
        createdAt: session.createdAt?.toMillis() || Date.now()
      };
    } catch (error) {
      console.error('Failed to get legacy session:', error);
      return null;
    }
  }

  // Clean up all listeners
  cleanup(): void {
    // Clean up message listeners
    this.messageListeners.forEach((firebaseListenerId) => {
      firebaseSessionService.stopListening(firebaseListenerId);
    });
    this.messageListeners.clear();
    
    // Clean up session listeners
    this.sessionListeners.forEach((firebaseListenerId) => {
      firebaseSessionService.stopListening(firebaseListenerId);
    });
    this.sessionListeners.clear();
    
    // Clean up Firebase service
    firebaseSessionService.cleanup();
  }

}

// Export singleton instance
export const signalingService = new SignalingService();

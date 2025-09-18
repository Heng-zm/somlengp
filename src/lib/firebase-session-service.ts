'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to ensure Firebase is initialized
function ensureFirebaseInitialized() {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your Firebase configuration.');
  }
  return db;
}

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

class FirebaseSessionService {
  private listeners: Map<string, () => void> = new Map();
  private messageListeners: Map<string, (messages: SignalingMessage[]) => void> = new Map();

  /**
   * Generate a unique user ID
   */
  generateUserId(): string {
    return `user_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  }

  /**
   * Create a new session in Firebase
   */
  async createSession(hostId: string, hostName?: string): Promise<string> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionId = this.generateSessionId();
      const sessionData: SessionData = {
        id: sessionId,
        hostId,
        hostName: hostName || 'Anonymous Host',
        participants: [hostId],
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        lastActivity: serverTimestamp() as Timestamp,
      };

      await setDoc(doc(firestore, 'sessions', sessionId), sessionData);
      
      // Create a subcollection for messages
      const messagesRef = collection(firestore, 'sessions', sessionId, 'messages');
      // Add initial join message
      await this.sendMessage({
        type: 'join',
        sessionId,
        userId: hostId,
        data: { action: 'host_created_session', userName: hostName },
        timestamp: serverTimestamp() as Timestamp
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create session. Please check your Firebase configuration.');
    }
  }

  /**
   * Join an existing session
   */
  async joinSession(sessionId: string, userId: string, userName?: string): Promise<boolean> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionRef = doc(firestore, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionSnap.data() as SessionData;
      
      if (!sessionData.isActive) {
        throw new Error('Session is no longer active');
      }

      // Add user to participants if not already present
      if (!sessionData.participants.includes(userId)) {
        await updateDoc(sessionRef, {
          participants: arrayUnion(userId),
          lastActivity: serverTimestamp()
        });

        // Send join message
        await this.sendMessage({
          type: 'join',
          sessionId,
          userId,
          data: { action: 'user_joined', userName: userName || 'Anonymous User' },
          timestamp: serverTimestamp() as Timestamp
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to join session. Please check the session ID.');
    }
  }

  /**
   * Leave a session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionRef = doc(firestore, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        return; // Session doesn't exist, nothing to leave
      }

      const sessionData = sessionSnap.data() as SessionData;

      // Send leave message before removing from participants
      await this.sendMessage({
        type: 'leave',
        sessionId,
        userId,
        data: { action: 'user_left' },
        timestamp: serverTimestamp() as Timestamp
      });

      // If host is leaving, notify other participants and mark session as inactive
      if (sessionData.hostId === userId) {
        await this.sendMessage({
          type: 'host-left',
          sessionId,
          userId,
          data: { action: 'host_left_session' },
          timestamp: serverTimestamp() as Timestamp
        });

        // Mark session as inactive
        await updateDoc(sessionRef, {
          isActive: false,
          lastActivity: serverTimestamp()
        });
      } else {
        // Remove participant
        await updateDoc(sessionRef, {
          participants: arrayRemove(userId),
          lastActivity: serverTimestamp()
        });
      }

      // Clean up listener
      const listenerId = `${sessionId}_${userId}`;
      this.stopListening(listenerId);

    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  }

  /**
   * Deserialize WebRTC data from Firestore
   */
  private deserializeWebRTCData(data: any): any {
    if (!data) return data;
    
    // Handle serialized RTCIceCandidate
    if (data.candidate !== undefined && typeof data.candidate === 'string') {
      // Return plain object that can be used to create RTCIceCandidate
      return {
        candidate: data.candidate,
        sdpMLineIndex: data.sdpMLineIndex,
        sdpMid: data.sdpMid,
        usernameFragment: data.usernameFragment
      };
    }
    
    // Handle serialized RTCSessionDescription
    if (data.type && (data.type === 'offer' || data.type === 'answer') && data.sdp) {
      return {
        type: data.type,
        sdp: data.sdp
      };
    }
    
    // Handle plain objects - recursively deserialize nested data
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const deserialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        deserialized[key] = this.deserializeWebRTCData(value);
      }
      return deserialized;
    }
    
    return data;
  }

  /**
   * Serialize WebRTC data for Firestore storage
   */
  private serializeWebRTCData(data: any): any {
    if (!data) return data;
    
    // Handle RTCIceCandidate (check for RTCIceCandidate in browser environment)
    if ((typeof RTCIceCandidate !== 'undefined' && data instanceof RTCIceCandidate) || 
        (data.candidate !== undefined && typeof data.candidate === 'string' && data.sdpMLineIndex !== undefined)) {
      return {
        candidate: data.candidate,
        sdpMLineIndex: data.sdpMLineIndex,
        sdpMid: data.sdpMid,
        usernameFragment: data.usernameFragment
      };
    }
    
    // Handle RTCSessionDescription (offer/answer)
    if (data.type && (data.type === 'offer' || data.type === 'answer') && data.sdp) {
      return {
        type: data.type,
        sdp: data.sdp
      };
    }
    
    // Handle plain objects - recursively serialize nested data
    if (typeof data === 'object' && data !== null) {
      const serialized: any = {};
      for (const [key, value] of Object.entries(data)) {
        serialized[key] = this.serializeWebRTCData(value);
      }
      return serialized;
    }
    
    return data;
  }

  /**
   * Send a signaling message
   */
  async sendMessage(message: SignalingMessage): Promise<void> {
    try {
      const firestore = ensureFirebaseInitialized();
      
      // Serialize the data to handle WebRTC objects
      const serializedData = this.serializeWebRTCData(message.data);
      
      const messageData = {
        type: message.type,
        sessionId: message.sessionId,
        userId: message.userId,
        data: serializedData,
        timestamp: serverTimestamp()
      };

      const messagesRef = collection(firestore, 'sessions', message.sessionId, 'messages');
      await setDoc(doc(messagesRef), messageData);

      // Update session last activity
      const sessionRef = doc(firestore, 'sessions', message.sessionId);
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp()
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Message data that failed:', message);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Listen for messages in a session
   */
  listenForMessages(sessionId: string, userId: string, callback: (message: SignalingMessage) => void): string {
    const listenerId = `${sessionId}_${userId}_messages`;
    
    try {
      const firestore = ensureFirebaseInitialized();
      const messagesRef = collection(firestore, 'sessions', sessionId, 'messages');
      const messagesQuery = query(
        messagesRef, 
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages: SignalingMessage[] = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const rawMessageData = change.doc.data();
            const messageData: SignalingMessage = {
              type: rawMessageData.type,
              sessionId: rawMessageData.sessionId,
              userId: rawMessageData.userId,
              data: this.deserializeWebRTCData(rawMessageData.data),
              timestamp: rawMessageData.timestamp
            };
            // Only notify if message is not from current user
            if (messageData.userId !== userId) {
              messages.push(messageData);
            }
          }
        });

        // Sort messages by timestamp and notify for each
        messages
          .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0))
          .forEach(message => callback(message));
      });

      this.listeners.set(listenerId, unsubscribe);
      return listenerId;
      
    } catch (error) {
      console.error('Failed to listen for messages:', error);
      throw new Error('Failed to listen for messages');
    }
  }

  /**
   * Listen for session updates
   */
  listenForSession(sessionId: string, callback: (session: SessionData | null) => void): string {
    const listenerId = `${sessionId}_session`;
    
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionRef = doc(firestore, 'sessions', sessionId);
      const unsubscribe = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data() as SessionData);
        } else {
          callback(null);
        }
      });

      this.listeners.set(listenerId, unsubscribe);
      return listenerId;
      
    } catch (error) {
      console.error('Failed to listen for session:', error);
      throw new Error('Failed to listen for session updates');
    }
  }

  /**
   * Stop listening
   */
  stopListening(listenerId: string): void {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionRef = doc(firestore, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        return sessionSnap.data() as SessionData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw new Error('Failed to retrieve session data');
    }
  }

  /**
   * Check if session exists and is active
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      return session !== null && session.isActive;
    } catch (error) {
      console.error('Failed to check session existence:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (call this periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionsRef = collection(firestore, 'sessions');
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24); // 24 hours ago
      
      const expiredQuery = query(
        sessionsRef,
        where('lastActivity', '<', Timestamp.fromDate(cutoffTime))
      );

      // Note: In a real application, you'd want to use a Cloud Function for this
      // to avoid client-side cleanup operations
      console.log('Cleanup would remove sessions older than', cutoffTime);
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Get active sessions count (for debugging)
   */
  async getActiveSessionsCount(): Promise<number> {
    try {
      const firestore = ensureFirebaseInitialized();
      const sessionsRef = collection(firestore, 'sessions');
      const activeQuery = query(sessionsRef, where('isActive', '==', true));
      
      // Note: In production, you'd want to use a server-side count
      console.log('Active sessions query created');
      return 0; // Placeholder
    } catch (error) {
      console.error('Failed to get active sessions count:', error);
      return 0;
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    this.messageListeners.clear();
  }
}

// Export singleton instance
export const firebaseSessionService = new FirebaseSessionService();
export default firebaseSessionService;
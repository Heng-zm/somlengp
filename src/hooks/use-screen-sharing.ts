'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebRTC } from './use-webrtc';
import { signalingService } from '@/lib/signaling-service';
import { serverTimestamp } from 'firebase/firestore';

// WebRTC message type (from useWebRTC hook)
interface WebRTCSignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  sessionId: string;
  userId: string;
  data?: any;
  timestamp?: number;
}

interface ScreenCaptureOptions {
  video: {
    width?: { ideal?: number; max?: number };
    height?: { ideal?: number; max?: number };
    frameRate?: { ideal?: number; max?: number };
  };
  audio: boolean;
}

interface SharingState {
  mode: 'idle' | 'hosting' | 'viewing';
  sessionId: string | null;
  participants: string[];
  remoteStream: MediaStream | null;
  userId: string;
  isConnected: boolean;
  isOfferSent: boolean;
  isAnswerSent: boolean;
}

export function useScreenSharing() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sharingState, setSharingState] = useState<SharingState>({
    mode: 'idle',
    sessionId: null,
    participants: [],
    remoteStream: null,
    userId: signalingService.generateUserId(),
    isConnected: false,
    isOfferSent: false,
    isAnswerSent: false
  });

  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const webrtc = useWebRTC();

  // Set up WebRTC signaling callbacks
  useEffect(() => {
    webrtc.setSignalingCallbacks({
      onSendMessage: async (message: WebRTCSignalingMessage) => {
        if (sharingState.sessionId) {
          try {
            // Convert WebRTC message to Firebase message format
            await signalingService.sendMessage({
              type: message.type,
              sessionId: sharingState.sessionId,
              userId: sharingState.userId,
              data: message.data,
              timestamp: serverTimestamp() as any // Firebase will set the server timestamp
            });
          } catch (error) {
            console.error('Failed to send signaling message:', error);
            setError('Failed to send message. Connection may be unstable.');
          }
        }
      }
    });
  }, [webrtc, sharingState.sessionId, sharingState.userId]);

  // Handle signaling messages
  useEffect(() => {
    if (sharingState.sessionId && sharingState.mode !== 'idle') {
      try {
        signalingService.listen(
          sharingState.sessionId,
          sharingState.userId,
          (message) => {
            console.log('Received signaling message:', message.type, 'from:', message.userId);
            
            // Prevent processing our own messages
            if (message.userId === sharingState.userId) {
              console.log('Ignoring own message');
              return;
            }
            
            // Handle different message types
            if (message.type === 'offer' && sharingState.mode === 'viewing' && !sharingState.isAnswerSent) {
              console.log('Processing offer as viewer');
              // Convert Firebase message to WebRTC message format
              const webrtcMessage: WebRTCSignalingMessage = {
                type: message.type,
                sessionId: message.sessionId,
                userId: message.userId,
                data: message.data,
                timestamp: message.timestamp?.toMillis()
              };
              webrtc.handleSignalingMessage(webrtcMessage);
              setSharingState(prev => ({ ...prev, isAnswerSent: true }));
            } else if (message.type === 'answer' && sharingState.mode === 'hosting' && sharingState.isOfferSent) {
              console.log('Processing answer as host');
              const webrtcMessage: WebRTCSignalingMessage = {
                type: message.type,
                sessionId: message.sessionId,
                userId: message.userId,
                data: message.data,
                timestamp: message.timestamp?.toMillis()
              };
              webrtc.handleSignalingMessage(webrtcMessage);
            } else if (message.type === 'ice-candidate') {
              console.log('Processing ICE candidate');
              const webrtcMessage: WebRTCSignalingMessage = {
                type: message.type,
                sessionId: message.sessionId,
                userId: message.userId,
                data: message.data,
                timestamp: message.timestamp?.toMillis()
              };
              webrtc.handleSignalingMessage(webrtcMessage);
            } else if (message.type === 'host-left') {
              console.log('Host left the session');
              setError('Host has left the session');
              stopSession();
            } else if (message.type === 'join' && sharingState.mode === 'hosting' && localStream) {
              // When someone joins and we're hosting, send them an offer after a short delay
              // to ensure they're ready to receive it
              console.log('Participant joined, sending offer in 1 second...');
              setTimeout(() => {
                if (sharingState.sessionId) {
                  webrtc.createOffer(localStream, sharingState.sessionId, sharingState.userId)
                    .then(() => {
                      console.log('Offer sent to new participant');
                      setSharingState(prev => ({ ...prev, isOfferSent: true }));
                    })
                    .catch(error => {
                      console.error('Failed to send offer to new participant:', error);
                    });
                }
              }, 1000);
            } else {
              console.log('Ignoring message:', message.type, 'in mode:', sharingState.mode);
            }
          }
        );
      } catch (error) {
        console.error('Failed to start listening for messages:', error);
        setError('Failed to connect to session messaging');
      }

      return () => {
        signalingService.stopListening(sharingState.sessionId!, sharingState.userId);
      };
    }
  }, [sharingState.sessionId, sharingState.mode, sharingState.userId, sharingState.isOfferSent, sharingState.isAnswerSent, webrtc]);

  // Handle remote stream updates
  useEffect(() => {
    setSharingState(prev => ({ 
      ...prev, 
      remoteStream: webrtc.remoteStream,
      isConnected: webrtc.isConnected 
    }));

    // Set remote stream to video element
    if (webrtc.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
    }
  }, [webrtc.remoteStream, webrtc.isConnected]);

  // Note: Participant detection is now handled through 'join' messages in the message listener above

  // Start screen capture
  const startScreenCapture = useCallback(async (options: Partial<ScreenCaptureOptions> = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in your browser');
      }

      const constraints = {
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          ...options.video
        },
        audio: options.audio !== undefined ? options.audio : true
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      setLocalStream(displayStream);
      setIsCapturing(true);
      localStreamRef.current = displayStream;

      // Display the stream in video element
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
      }

      // Handle track ended (user stops sharing)
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenCapture();
      });

      return displayStream;

    } catch (err: any) {
      console.error('Error starting screen capture:', err);
      let errorMessage = 'Failed to start screen capture';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Screen sharing permission was denied. Please allow access and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported by your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No screen sharing source was selected.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Screen sharing was cancelled by user.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop screen capture
  const stopScreenCapture = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setLocalStream(null);
    setIsCapturing(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start hosting a sharing session
  const startHosting = useCallback(async (options: Partial<ScreenCaptureOptions> = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await startScreenCapture(options);
      const sessionId = await signalingService.createSession(
        sharingState.userId, 
        `Host-${sharingState.userId.slice(-6)}`
      );
      
      setSharingState(prev => ({
        ...prev,
        mode: 'hosting',
        sessionId,
        participants: [sharingState.userId],
        isOfferSent: false,
        isAnswerSent: false
      }));

      // Offers will be sent when participants join (handled by participant listener)

    } catch (error: any) {
      console.error('Failed to start hosting:', error);
      setError(error?.message || 'Failed to start hosting session');
      
      // Clean up on error
      stopScreenCapture();
      setSharingState(prev => ({
        ...prev,
        mode: 'idle',
        sessionId: null
      }));
    } finally {
      setIsLoading(false);
    }
  }, [startScreenCapture, sharingState.userId, webrtc, stopScreenCapture]);

  // Join a sharing session as viewer
  const joinSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if session exists and is active
      const sessionExists = await signalingService.sessionExists(sessionId);
      if (!sessionExists) {
        throw new Error('Session not found or is no longer active');
      }

      // Join the session
      const joined = await signalingService.joinSession(
        sessionId, 
        sharingState.userId,
        `Viewer-${sharingState.userId.slice(-6)}`
      );
      
      if (!joined) {
        throw new Error('Failed to join session');
      }

      setSharingState(prev => ({
        ...prev,
        mode: 'viewing',
        sessionId,
        isOfferSent: false,
        isAnswerSent: false
      }));

      console.log('Successfully joined session as viewer. Waiting for host to send offer...');
      // The WebRTC connection will be established when we receive an offer

    } catch (error: any) {
      console.error('Failed to join session:', error);
      setError(error?.message || 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  }, [sharingState.userId]);

  // Stop hosting or viewing session
  const stopSession = useCallback(async () => {
    const currentSessionId = sharingState.sessionId;
    const currentUserId = sharingState.userId;
    
    // Clean up UI state first
    setSharingState(prev => ({
      ...prev,
      mode: 'idle',
      sessionId: null,
      participants: [],
      remoteStream: null,
      isConnected: false,
      isOfferSent: false,
      isAnswerSent: false
    }));
    
    if (sharingState.mode === 'hosting') {
      stopScreenCapture();
    }

    webrtc.closeConnection();
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Leave the Firebase session (async but non-blocking)
    if (currentSessionId) {
      try {
        await signalingService.leaveSession(currentSessionId, currentUserId);
      } catch (error) {
        console.error('Error leaving session:', error);
        // Don't show error to user since session is already stopped locally
      }
    }
  }, [sharingState.sessionId, sharingState.mode, sharingState.userId, stopScreenCapture, webrtc]);

  // Copy session link to clipboard
  const copySessionLink = useCallback(async () => {
    if (sharingState.sessionId) {
      const link = `${window.location.origin}/screen-share?join=${sharingState.sessionId}`;
      try {
        await navigator.clipboard.writeText(link);
        return true;
      } catch (error) {
        console.error('Failed to copy link:', error);
        return false;
      }
    }
    return false;
  }, [sharingState.sessionId]);

  // Get stream info
  const getStreamInfo = useCallback(() => {
    const stream = sharingState.mode === 'viewing' ? sharingState.remoteStream : localStream;
    if (!stream) return null;
    
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    
    return {
      video: videoTrack ? {
        label: videoTrack.label,
        settings: videoTrack.getSettings()
      } : null,
      audio: audioTrack ? {
        label: audioTrack.label,
        settings: audioTrack.getSettings()
      } : null
    };
  }, [localStream, sharingState.remoteStream, sharingState.mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Direct cleanup without calling stopSession to avoid infinite loops
      if (sharingState.sessionId) {
        // Fire and forget - don't await since this is cleanup
        signalingService.leaveSession(sharingState.sessionId, sharingState.userId)
          .catch(error => console.error('Cleanup: Error leaving session:', error));
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      webrtc.closeConnection();
      signalingService.cleanup();
    };
  }, []); // Empty dependency array to run only on unmount

  return {
    // State
    localStream,
    isCapturing,
    error,
    isLoading,
    sharingState,
    webrtcState: {
      isConnected: webrtc.isConnected,
      isConnecting: webrtc.isConnecting,
      error: webrtc.error
    },
    
    // Refs for video elements
    videoRef,
    remoteVideoRef,
    
    // Functions
    startHosting,
    joinSession,
    stopSession,
    copySessionLink,
    getStreamInfo,
    
    // Direct screen capture functions (for backward compatibility)
    startScreenCapture,
    stopScreenCapture
  };
}
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  sessionId: string;
  userId: string;
  data?: any;
  timestamp?: number;
}

interface WebRTCState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  remoteStream: MediaStream | null;
  connectionState: string;
  signalingState: string;
}

export function useWebRTC(config?: WebRTCConfig) {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    remoteStream: null,
    connectionState: 'new',
    signalingState: 'stable'
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentSessionRef = useRef<{ sessionId: string; userId: string } | null>(null);
  const signalingCallbacksRef = useRef<{
    onSendMessage?: (message: SignalingMessage) => void;
  }>({});

  // Default STUN servers for NAT traversal
  const defaultConfig: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  const rtcConfig = config || defaultConfig;

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && signalingCallbacksRef.current.onSendMessage && currentSessionRef.current) {
          signalingCallbacksRef.current.onSendMessage({
            type: 'ice-candidate',
            sessionId: currentSessionRef.current.sessionId,
            userId: currentSessionRef.current.userId,
            data: event.candidate
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track:', event);
        setState(prev => ({
          ...prev,
          remoteStream: event.streams[0]
        }));
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        setState(prev => ({
          ...prev,
          isConnected: pc.connectionState === 'connected',
          isConnecting: pc.connectionState === 'connecting',
          connectionState: pc.connectionState,
          error: pc.connectionState === 'failed' ? 'Connection failed' : null
        }));
      };

      // Handle signaling state changes
      pc.onsignalingstatechange = () => {
        console.log('Signaling state:', pc.signalingState);
        setState(prev => ({
          ...prev,
          signalingState: pc.signalingState
        }));
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize WebRTC connection'
      }));
      return null;
    }
  }, [rtcConfig]);

  // Create offer (for host)
  const createOffer = useCallback(async (localStream: MediaStream, sessionId: string, userId: string) => {
    const pc = initializePeerConnection();
    if (!pc) return null;

    // Store session info for ICE candidates
    currentSessionRef.current = { sessionId, userId };

    try {
      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      localStreamRef.current = localStream;

      // Create and set local description
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);

      // Send offer through signaling
      if (signalingCallbacksRef.current.onSendMessage) {
        signalingCallbacksRef.current.onSendMessage({
          type: 'offer',
          sessionId,
          userId,
          data: offer
        });
      }

      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create connection offer'
      }));
      return null;
    }
  }, [initializePeerConnection]);

  // Create answer (for viewer)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit, sessionId: string, userId: string) => {
    const pc = initializePeerConnection();
    if (!pc) return null;

    // Store session info for ICE candidates
    currentSessionRef.current = { sessionId, userId };

    console.log('Creating answer, current signaling state:', pc.signalingState);
    
    try {
      // Set remote description (offer)
      if (pc.signalingState === 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Remote offer set successfully');
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Local answer set successfully');

        // Send answer through signaling
        if (signalingCallbacksRef.current.onSendMessage) {
          signalingCallbacksRef.current.onSendMessage({
            type: 'answer',
            sessionId,
            userId,
            data: answer
          });
        }

        return answer;
      } else {
        console.warn('Cannot create answer in signaling state:', pc.signalingState);
        return null;
      }
    } catch (error) {
      console.error('Failed to create answer:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create connection answer'
      }));
      return null;
    }
  }, [initializePeerConnection]);

  // Handle received answer (for host)
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    console.log('Handling answer, current signaling state:', pc.signalingState);
    
    // Only set remote description if we're in the correct state
    if (pc.signalingState === 'have-local-offer') {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      } catch (error) {
        console.error('Failed to handle answer:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to process connection answer'
        }));
      }
    } else {
      console.warn('Cannot set remote description in state:', pc.signalingState);
    }
  }, []);

  // Handle received ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }, []);

  // Process signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    switch (message.type) {
      case 'offer':
        await createAnswer(message.data, message.sessionId, message.userId);
        break;
      case 'answer':
        await handleAnswer(message.data);
        break;
      case 'ice-candidate':
        await handleIceCandidate(message.data);
        break;
      default:
        console.log('Unknown signaling message type:', message.type);
    }
  }, [createAnswer, handleAnswer, handleIceCandidate]);

  // Set signaling callbacks
  const setSignalingCallbacks = useCallback((callbacks: {
    onSendMessage?: (message: SignalingMessage) => void;
  }) => {
    signalingCallbacksRef.current = callbacks;
  }, []);

  // Close connection
  const closeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    currentSessionRef.current = null;

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      remoteStream: null,
      connectionState: 'new',
      signalingState: 'stable'
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  return {
    ...state,
    createOffer,
    createAnswer,
    handleSignalingMessage,
    setSignalingCallbacks,
    closeConnection
  };
}
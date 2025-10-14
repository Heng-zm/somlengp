'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ScreenCaptureOptions {
  video?: {
    width?: { ideal?: number; max?: number };
    height?: { ideal?: number; max?: number };
    frameRate?: { ideal?: number; max?: number };
  };
  audio?: boolean;
}

interface ScreenCaptureState {
  stream: MediaStream | null;
  isCapturing: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useScreenCapture() {
  const [state, setState] = useState<ScreenCaptureState>({
    stream: null,
    isCapturing: false,
    isLoading: false,
    error: null
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    setState(prev => ({
      ...prev,
      stream: null,
      isCapturing: false,
      isLoading: false
    }));
    cleanupRef.current = null;
  }, [state.stream]);

  // Start screen capture
  const startCapture = useCallback(async (options: ScreenCaptureOptions = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if screen capture is supported
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen capture is not supported in your browser');
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

      // Set up cleanup when tracks end
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        cleanup();
      });

      cleanupRef.current = () => {
        displayStream.getTracks().forEach(track => track.stop());
      };

      setState({
        stream: displayStream,
        isCapturing: true,
        isLoading: false,
        error: null
      });

      return displayStream;

    } catch (err: any) {
      let errorMessage = 'Failed to start screen capture';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Screen sharing permission was denied';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No screen sharing source selected';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Screen sharing was cancelled';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      throw new Error(errorMessage);
    }
  }, [cleanup]);

  // Stop screen capture
  const stopCapture = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    cleanup();
  }, [cleanup]);

  // Get stream info
  const getStreamInfo = useCallback(() => {
    if (!state.stream) return null;

    const videoTrack = state.stream.getVideoTracks()[0];
    const audioTrack = state.stream.getAudioTracks()[0];

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
  }, [state.stream]);

  // Check browser support
  const isSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 
           !!navigator.mediaDevices?.getDisplayMedia;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    ...state,
    startCapture,
    stopCapture,
    getStreamInfo,
    isSupported
  };
}

// TODO: Memory leak fix needed - Add cleanup for event listeners:
// useEffect(() => {
//   const cleanup = () => {
//     // Add removeEventListener calls here
//   };
//   return cleanup;
// }, []);
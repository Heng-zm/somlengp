'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function CameraDebug() {
  const [debugInfo, setDebugInfo] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const addDebug = (message: string) => {
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message);
  };

  useEffect(() => {
    checkCameraSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCameraSupport = async () => {
    addDebug('=== Camera Support Check ===');
    addDebug(`User Agent: ${navigator.userAgent}`);
    addDebug(`Location: ${window.location.href}`);
    addDebug(`Secure Context: ${window.isSecureContext}`);
    
    if (!navigator.mediaDevices) {
      addDebug('❌ navigator.mediaDevices not available');
      setHasCamera(false);
      return;
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      addDebug('❌ getUserMedia not available');
      setHasCamera(false);
      return;
    }
    
    addDebug('✅ getUserMedia is available');
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      addDebug(`Found ${videoDevices.length} video input devices:`);
      
      videoDevices.forEach((device, index) => {
        addDebug(`  ${index + 1}. ${device.label || 'Unknown Camera'} (${device.deviceId})`);
      });
      
      if (videoDevices.length > 0) {
        setHasCamera(true);
        addDebug('✅ Camera devices found');
      } else {
        setHasCamera(false);
        addDebug('⚠️ No video devices found');
      }
    } catch (error) {
      addDebug(`❌ Error enumerating devices: ${error}`);
      setHasCamera(false);
    }
  };

  const testCameraAccess = async () => {
    addDebug('=== Testing Camera Access ===');
    
    try {
      addDebug('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 }
        } 
      });
      
      addDebug('✅ Camera access granted');
      addDebug(`Stream tracks: ${mediaStream.getTracks().length}`);
      
      mediaStream.getTracks().forEach((track, index) => {
        addDebug(`  Track ${index + 1}: ${track.kind} - ${track.label} (${track.readyState})`);
        const settings = track.getSettings();
        addDebug(`    Settings: ${JSON.stringify(settings)}`);
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        addDebug('✅ Video element srcObject set');
        
        videoRef.current.onloadedmetadata = () => {
          addDebug('✅ Video metadata loaded');
          addDebug(`Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        };
        
        videoRef.current.oncanplay = () => {
          addDebug('✅ Video can play');
        };
        
        videoRef.current.onplay = () => {
          addDebug('✅ Video started playing');
        };
        
        videoRef.current.onerror = (error) => {
          addDebug(`❌ Video error: ${error}`);
        };
        
        try {
          await videoRef.current.play();
          addDebug('✅ Video play() succeeded');
        } catch (playError) {
          addDebug(`❌ Video play() failed: ${playError}`);
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      addDebug(`❌ Camera access failed: ${err.name}: ${err.message}`);
      
      if (err.name === 'NotAllowedError') {
        addDebug('💡 Solution: Allow camera permissions in browser settings');
      } else if (err.name === 'NotFoundError') {
        addDebug('💡 Solution: Check if camera is connected and not used by other apps');
      } else if (err.name === 'NotReadableError') {
        addDebug('💡 Solution: Close other apps using the camera');
      } else if (err.name === 'OverconstrainedError') {
        addDebug('💡 Solution: Camera doesn\'t support requested constraints');
      } else {
        addDebug('💡 Check console for more details');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      addDebug('Stopping camera...');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      addDebug('✅ Camera stopped');
    }
  };

  const clearLog = () => {
    setDebugInfo('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📷 Camera Debug Tool</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkCameraSupport} variant="outline">
              🔍 Check Camera Support
            </Button>
            <Button onClick={testCameraAccess} variant="default" disabled={!hasCamera}>
              📹 Test Camera Access
            </Button>
            <Button onClick={stopCamera} variant="destructive" disabled={!stream}>
              ⏹️ Stop Camera
            </Button>
            <Button onClick={clearLog} variant="secondary">
              🗑️ Clear Log
            </Button>
          </div>

          {/* Video Preview */}
          {stream && (
            <div className="bg-black rounded-lg p-4">
              <h3 className="text-white mb-2">Camera Preview:</h3>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md mx-auto rounded border"
              />
            </div>
          )}

          {/* Debug Log */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Log:</h3>
            <pre className="text-xs bg-black text-green-400 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
              {debugInfo || 'Click "Check Camera Support" to start debugging...'}
            </pre>
          </div>

          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Status:</h3>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${hasCamera ? 'text-green-600' : 'text-red-600'}`}>
                {hasCamera ? '✅' : '❌'} Camera Available: {hasCamera ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${stream ? 'text-green-600' : 'text-gray-600'}`}>
                {stream ? '✅' : '⭕'} Camera Active: {stream ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${typeof window !== 'undefined' && window.isSecureContext ? 'text-green-600' : 'text-red-600'}`}>
                {typeof window !== 'undefined' && window.isSecureContext ? '✅' : '❌'} Secure Context: {typeof window !== 'undefined' ? (window.isSecureContext ? 'Yes' : 'No') : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

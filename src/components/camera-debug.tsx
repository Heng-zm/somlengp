'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCameraPermission } from '@/hooks/use-camera-permission';
import { checkCameraPermissionDetails, requestCameraPermission } from '@/utils/camera-permissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

export function CameraDebug() {
  const [debugInfo, setDebugInfo] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedQuality, setSelectedQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
  
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    permissionState,
    devices,
    error,
    requestPermission,
    requestWithDevice,
    requestWithQuality,
    requestWithFallback,
    stopCamera,
    refreshDevices,
    checkPermission
  } = useCameraPermission({ autoStop: true });

  const addDebug = (message: string) => {
    setDebugInfo(prev => prev + '\n' + new Date().toLocaleTimeString() + ': ' + message);
  };

  useEffect(() => {
    checkCameraSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
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
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const checkCameraSupport = async () => {
    addDebug('=== Camera Support Check (Enhanced) ===');
    
    try {
      const details = await checkCameraPermissionDetails();
      
      addDebug(`User Agent: ${details.userAgent}`);
      addDebug(`Location: ${details.location}`);
      addDebug(`Secure Context: ${details.secureContext}`);
      addDebug(`Media Devices Supported: ${details.mediaDevicesSupported}`);
      addDebug(`getUserMedia Supported: ${details.getUserMediaSupported}`);
      addDebug(`Permission Status: ${details.permissionStatus || 'Unknown'}`);
      addDebug(`Camera Supported: ${details.supported}`);
      
      if (details.devices.length > 0) {
        addDebug(`Found ${details.devices.length} video input devices:`);
        details.devices.forEach((device, index) => {
          addDebug(`  ${index + 1}. ${device.label} (${device.deviceId.slice(0, 12)}...)`);
        });
        addDebug('✅ Camera devices found');
      } else {
        addDebug('⚠️ No video devices found');
      }
    } catch (error) {
      addDebug(`❌ Error checking camera support: ${error}`);
    }
  };

  const testCameraAccess = async () => {
    addDebug('=== Testing Camera Access (Enhanced) ===');
    
    try {
      addDebug('Requesting camera access with new utilities...');
      const result = await requestWithQuality(selectedQuality);
      
      if (result.success && result.stream) {
        addDebug('✅ Camera access granted');
        addDebug(`Stream tracks: ${result.stream.getTracks().length}`);
        
        result.stream.getTracks().forEach((track, index) => {
          addDebug(`  Track ${index + 1}: ${track.kind} - ${track.label} (${track.readyState})`);
          const settings = track.getSettings();
          addDebug(`    Settings: ${JSON.stringify(settings)}`);
        });
      } else if (result.error) {
        addDebug(`❌ Camera access failed: ${result.error.name}: ${result.error.message}`);
        addDebug(`💡 ${result.error.message}`);
      }
    } catch (error) {
      addDebug(`❌ Unexpected error: ${error}`);
    }
  };

  const testFallbackAccess = async () => {
    addDebug('=== Testing Fallback Camera Access ===');
    
    try {
      addDebug('Requesting camera access with fallback constraints...');
      const result = await requestWithFallback();
      
      if (result.success && result.stream) {
        addDebug('✅ Fallback camera access granted');
        addDebug(`Stream tracks: ${result.stream.getTracks().length}`);
      } else if (result.error) {
        addDebug(`❌ Fallback access failed: ${result.error.name}: ${result.error.message}`);
        addDebug(`💡 ${result.error.message}`);
      }
    } catch (error) {
      addDebug(`❌ Unexpected error: ${error}`);
    }
  };

  const testDeviceCamera = async (deviceId: string) => {
    addDebug(`=== Testing Specific Device: ${deviceId.slice(0, 12)}... ===`);
    
    try {
      const result = await requestWithDevice(deviceId);
      
      if (result.success) {
        addDebug('✅ Device-specific camera access granted');
      } else if (result.error) {
        addDebug(`❌ Device access failed: ${result.error.message}`);
      }
    } catch (error) {
      addDebug(`❌ Unexpected error: ${error}`);
    }
  };

  const stopCameraStream = () => {
    addDebug('Stopping camera...');
    stopCamera();
    addDebug('✅ Camera stopped');
  };

  const clearLog = () => {
    setDebugInfo('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">📷 Camera Debug Tool</h2>
        
        <div className="space-y-4">
          {/* Quality Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Quality:</label>
            <Select value={selectedQuality} onValueChange={(value: 'low' | 'medium' | 'high' | 'ultra') => setSelectedQuality(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (320p)</SelectItem>
                <SelectItem value="medium">Medium (480p)</SelectItem>
                <SelectItem value="high">High (720p)</SelectItem>
                <SelectItem value="ultra">Ultra (1080p)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkCameraSupport} variant="outline">
              🔍 Check Camera Support
            </Button>
            <Button onClick={testCameraAccess} variant="default" disabled={!isSupported || isLoading}>
              {isLoading ? '⏳' : '📹'} Test Camera Access
            </Button>
            <Button onClick={testFallbackAccess} variant="outline" disabled={!isSupported || isLoading}>
              🔄 Test Fallback
            </Button>
            <Button onClick={stopCameraStream} variant="destructive" disabled={!stream}>
              ⏹️ Stop Camera
            </Button>
            <Button onClick={clearLog} variant="secondary">
              🗑️ Clear Log
            </Button>
          </div>

          {/* Device Selection */}
          {devices.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Available Cameras:</h4>
              <div className="flex gap-2 flex-wrap">
                {devices.map((device, index) => (
                  <Button
                    key={device.deviceId}
                    variant="outline"
                    size="sm"
                    onClick={() => testDeviceCamera(device.deviceId)}
                    disabled={isLoading}
                  >
                    📷 {device.label || `Camera ${index + 1}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-1">Error:</h4>
              <p className="text-sm text-red-700">{error.message}</p>
              {error.code && <p className="text-xs text-red-600 mt-1">Code: {error.code}</p>}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Requesting camera access...</span>
              </div>
            </div>
          )}

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
            <h3 className="font-semibold text-blue-800 mb-2">Enhanced Status:</h3>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                {isSupported ? '✅' : '❌'} Camera Supported: {isSupported ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${hasPermission ? 'text-green-600' : 'text-red-600'}`}>
                {hasPermission ? '✅' : '❌'} Permission Granted: {hasPermission ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${permissionState === 'granted' ? 'text-green-600' : permissionState === 'denied' ? 'text-red-600' : 'text-yellow-600'}`}>
                {permissionState === 'granted' ? '✅' : permissionState === 'denied' ? '❌' : '⚠️'} Permission State: {permissionState || 'Unknown'}
              </div>
              <div className={`flex items-center gap-2 ${devices.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {devices.length > 0 ? '✅' : '❌'} Devices Found: {devices.length}
              </div>
              <div className={`flex items-center gap-2 ${stream ? 'text-green-600' : 'text-gray-600'}`}>
                {stream ? '✅' : '⭕'} Camera Active: {stream ? 'Yes' : 'No'}
              </div>
              <div className={`flex items-center gap-2 ${typeof window !== 'undefined' && window.isSecureContext ? 'text-green-600' : 'text-red-600'}`}>
                {typeof window !== 'undefined' && window.isSecureContext ? '✅' : '❌'} Secure Context: {typeof window !== 'undefined' ? (window.isSecureContext ? 'Yes' : 'No') : 'Unknown'}
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  ⏳ Status: Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

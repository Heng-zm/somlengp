'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { OptimizedQRScanner } from './optimized-qr-scanner';
import { QRScanner } from './qr-scanner';

interface DebugInfo {
  timestamp: string;
  videoReady: boolean;
  videoWidth: number;
  videoHeight: number;
  readyState: number;
  paused: boolean;
  ended: boolean;
  currentTime: number;
  hasStream: boolean;
  streamActive: boolean;
  workerReady: boolean;
  permissionStatus: string;
}

export function QRScannerDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [scannerType, setScannerType] = useState<'optimized' | 'simple'>('optimized');
  const [isScanning, setIsScanning] = useState(false);
  const debugIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const collectDebugInfo = useCallback(async (): Promise<DebugInfo> => {
    const video = document.querySelector('video') as HTMLVideoElement;
    const stream = video?.srcObject as MediaStream;
    
    let permissionStatus = 'unknown';
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        permissionStatus = permission.state;
      }
    } catch (err) {
      permissionStatus = 'error';
    }

    return {
      timestamp: new Date().toLocaleTimeString(),
      videoReady: video ? video.videoWidth > 0 && video.videoHeight > 0 : false,
      videoWidth: video?.videoWidth || 0,
      videoHeight: video?.videoHeight || 0,
      readyState: video?.readyState || 0,
      paused: video?.paused || true,
      ended: video?.ended || false,
      currentTime: video?.currentTime || 0,
      hasStream: !!stream,
      streamActive: stream ? stream.active : false,
      workerReady: true, // We can't easily check this from here
      permissionStatus
    };
  }, []);

  const startDebugMonitoring = useCallback(() => {
    if (debugIntervalRef.current) return;
    
    debugIntervalRef.current = setInterval(async () => {
      const info = await collectDebugInfo();
      setDebugInfo(prev => [...prev.slice(-9), info]); // Keep last 10 entries
    }, 1000);
  }, [collectDebugInfo]);

  const stopDebugMonitoring = useCallback(() => {
    if (debugIntervalRef.current) {
      clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
    }
  }, []);

  const handleScanStart = useCallback(() => {
    setIsScanning(true);
    startDebugMonitoring();
  }, [startDebugMonitoring]);

  const handleScanStop = useCallback(() => {
    setIsScanning(false);
    stopDebugMonitoring();
  }, [stopDebugMonitoring]);

  const handleScanSuccess = useCallback((data: string) => {
    
    alert(`QR Code detected: ${data}`);
  }, []);

  const handleScanError = useCallback((error: string) => {
    console.error('❌ QR Scan error:', error);
  }, []);

  const getReadyStateText = (readyState: number) => {
    switch (readyState) {
      case 0: return 'HAVE_NOTHING';
      case 1: return 'HAVE_METADATA';
      case 2: return 'HAVE_CURRENT_DATA';
      case 3: return 'HAVE_FUTURE_DATA';
      case 4: return 'HAVE_ENOUGH_DATA';
      default: return 'UNKNOWN';
    }
  };

  const clearDebugLog = useCallback(() => {
    setDebugInfo([]);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">QR Scanner Debug Tool</h1>
        <p className="text-gray-600">Debug camera scanning issues with real-time monitoring</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => setScannerType('optimized')}
              variant={scannerType === 'optimized' ? 'default' : 'outline'}
            >
              Optimized Scanner
            </Button>
            <Button
              onClick={() => setScannerType('simple')}
              variant={scannerType === 'simple' ? 'default' : 'outline'}
            >
              Simple Scanner
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleScanStart} disabled={isScanning}>
              Start Scanner
            </Button>
            <Button onClick={handleScanStop} disabled={!isScanning}>
              Stop Scanner
            </Button>
            <Button onClick={clearDebugLog} variant="outline">
              Clear Debug Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scanner */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>
              {scannerType === 'optimized' ? 'Optimized' : 'Simple'} QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scannerType === 'optimized' ? (
              <OptimizedQRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onClose={handleScanStop}
                enableVibration={false}
                enableSound={false}
                scanQuality="balanced"
              />
            ) : (
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onClose={handleScanStop}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugInfo.map((info, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm">{info.timestamp}</span>
                    <div className="flex gap-2">
                      <Badge variant={info.videoReady ? "default" : "destructive"}>
                        {info.videoReady ? "Video Ready" : "Video Not Ready"}
                      </Badge>
                      <Badge variant={info.hasStream ? "default" : "destructive"}>
                        {info.hasStream ? "Has Stream" : "No Stream"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Dimensions:</span><br />
                      {info.videoWidth} &times; {info.videoHeight}
                    </div>
                    <div>
                      <span className="font-semibold">Ready State:</span><br />
                      {getReadyStateText(info.readyState)} ({info.readyState})
                    </div>
                    <div>
                      <span className="font-semibold">Playing State:</span><br />
                      {info.paused ? "Paused" : "Playing"} | {info.ended ? "Ended" : "Active"}
                    </div>
                    <div>
                      <span className="font-semibold">Stream:</span><br />
                      {info.streamActive ? "Active" : "Inactive"} | {info.permissionStatus}
                    </div>
                  </div>
                  
                  {!info.videoReady && (
                    <Alert className="mt-2">
                      <AlertDescription>
                        <strong>Issue detected:</strong> Video is not ready for scanning.
                        {info.videoWidth === 0 && " Video dimensions are 0×0."}
                        {info.readyState < 2 && " Video ready state is too low."}
                        {info.paused && " Video is paused."}
                        {!info.hasStream && " No video stream available."}
                        {!info.streamActive && " Stream is not active."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Video Ready:</strong> Video dimensions should be &gt; 0&times;0 and ready state should be ≥ 2</p>
          <p><strong>Stream Active:</strong> Camera stream should be active and not paused</p>
          <p><strong>Common Issues:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Video dimensions 0&times;0: Camera not initialized or failed</li>
            <li>Ready State &lt; 2: Video metadata not loaded</li>
            <li>Stream inactive: Camera permission denied or device busy</li>
            <li>Video paused: Playback not started automatically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
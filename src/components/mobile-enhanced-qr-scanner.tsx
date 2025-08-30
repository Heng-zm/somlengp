'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Camera, 
  X, 
  Upload, 
  Square, 
  Vibrate, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Maximize,
  Minimize,
  Zap,
  Target,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { detectQRCodeAdvanced, QRDetectionResult } from '@/utils/advanced-qr-detection';
import { AdvancedCameraControls } from '@/components/advanced-camera-controls';
import { useBackCamera } from '@/hooks/use-camera-permission';

export interface MobileEnhancedQRScannerProps {
  onScanResult: (data: string, result?: QRDetectionResult) => void;
  onClose: () => void;
  enableHaptics?: boolean;
  enableSoundFeedback?: boolean;
  autoFullscreen?: boolean;
  showCameraControls?: boolean;
}

interface ScanningOptions {
  enablePreprocessing: boolean;
  enableRotationCorrection: boolean;
  enableContrastEnhancement: boolean;
  enableBlurReduction: boolean;
  minQuality: number;
  scanSpeed: 'slow' | 'normal' | 'fast';
}

export function MobileEnhancedQRScanner({ 
  onScanResult, 
  onClose,
  enableHaptics = true,
  enableSoundFeedback = true,
  autoFullscreen = true,
  showCameraControls = true
}: MobileEnhancedQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSoundFeedback);
  const [hapticsEnabled, setHapticsEnabled] = useState(enableHaptics);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanningStats, setScanningStats] = useState({
    attempts: 0,
    successes: 0,
    averageTime: 0
  });
  const [scanningOptions, setScanningOptions] = useState<ScanningOptions>({
    enablePreprocessing: true,
    enableRotationCorrection: true,
    enableContrastEnhancement: true,
    enableBlurReduction: false, // Can be CPU intensive on mobile
    minQuality: 0.3,
    scanSpeed: 'normal'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  const { toast } = useToast();

  // Enhanced back camera hook
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestBackCameraWithFallback,
    stopCamera,
    currentFacingMode
  } = useBackCamera(false, 'high');

  // Scanning intervals based on speed
  const scanIntervals = useMemo(() => ({
    slow: 200,    // 5 FPS
    normal: 100,  // 10 FPS  
    fast: 50      // 20 FPS
  }), []);

  // Initialize audio context for sound feedback
  useEffect(() => {
    if (typeof window !== 'undefined' && soundEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [soundEnabled]);

  // Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (scanningRef.current) {
        clearTimeout(scanningRef.current);
      }
    };
  }, []);

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((pattern?: 'light' | 'medium' | 'heavy' | number[]) => {
    if (!hapticsEnabled || typeof window === 'undefined') return;

    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        if (pattern === 'light') {
          navigator.vibrate(25);
        } else if (pattern === 'medium') {
          navigator.vibrate(50);
        } else if (pattern === 'heavy') {
          navigator.vibrate([100, 50, 100]);
        } else if (Array.isArray(pattern)) {
          navigator.vibrate(pattern);
        } else {
          navigator.vibrate(50); // default
        }
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [hapticsEnabled]);

  // Sound feedback function
  const playSuccessSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Play a pleasant success sound (ascending notes)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      let time = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.start(time);
        osc.stop(time + 0.15);

        time += 0.1;
      });
    } catch (error) {
      console.warn('Sound feedback failed:', error);
    }
  }, [soundEnabled]);

  // Fullscreen handling
  const enterFullscreen = useCallback(async () => {
    if (!containerRef.current || !document.fullscreenEnabled) return;

    try {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
      
      // Lock screen orientation to portrait on mobile
      if ('screen' in window && 'orientation' in window.screen) {
        try {
          await (window.screen.orientation as any).lock('portrait');
        } catch (error) {
          console.warn('Screen orientation lock failed:', error);
        }
      }
      
      triggerHapticFeedback('light');
    } catch (error) {
      console.warn('Fullscreen failed:', error);
    }
  }, [triggerHapticFeedback]);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
      triggerHapticFeedback('light');
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  }, [triggerHapticFeedback]);

  // Enhanced QR scanning with advanced detection
  const scanQRCode = useCallback(async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current || !mountedRef.current) {
      return;
    }

    try {
      const startTime = performance.now();
      
      // Use advanced detection
      const result = await detectQRCodeAdvanced(videoRef.current, {
        enablePreprocessing: scanningOptions.enablePreprocessing,
        enableRotationCorrection: scanningOptions.enableRotationCorrection,
        enableContrastEnhancement: scanningOptions.enableContrastEnhancement,
        enableBlurReduction: scanningOptions.enableBlurReduction,
        minQuality: scanningOptions.minQuality,
        maxRetries: 1, // Keep low for real-time scanning
        timeoutMs: 1000
      });

      const processingTime = performance.now() - startTime;

      // Update stats
      setScanningStats(prev => ({
        attempts: prev.attempts + 1,
        successes: prev.successes + (result ? 1 : 0),
        averageTime: (prev.averageTime * prev.attempts + processingTime) / (prev.attempts + 1)
      }));

      if (result && mountedRef.current) {
        // Prevent duplicate scans within 1 second
        const now = Date.now();
        if (now - lastScanTime < 1000) return;
        
        setLastScanTime(now);
        setIsScanning(false);
        stopCamera();

        // Success feedback
        triggerHapticFeedback('heavy');
        playSuccessSound();

        // Visual feedback
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && result.location && videoRef.current) {
          // Draw detection overlay
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.beginPath();
          
          const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = result.location;
          ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
          ctx.lineTo(topRightCorner.x, topRightCorner.y);
          ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
          ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
          ctx.closePath();
          ctx.stroke();
          
          // Flash effect
          setTimeout(() => {
            if (mountedRef.current) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }, 500);
        }

        onScanResult(result.data, result);
        
        toast({
          title: "QR Code Detected!",
          description: `Found in ${result.processingTime.toFixed(0)}ms using ${result.strategy} method`,
        });
      }
    } catch (error) {
      console.warn('QR scanning error:', error);
    }

    // Schedule next scan
    if (isScanning && mountedRef.current) {
      const interval = scanIntervals[scanningOptions.scanSpeed];
      scanningRef.current = setTimeout(() => {
        if (mountedRef.current) {
          requestAnimationFrame(scanQRCode);
        }
      }, interval);
    }
  }, [
    isScanning,
    scanningOptions,
    lastScanTime,
    onScanResult,
    stopCamera,
    triggerHapticFeedback,
    playSuccessSound,
    toast,
    scanIntervals
  ]);

  // Auto-start camera when component mounts
  useEffect(() => {
    if (isSupported && !stream && !isLoading) {
      startCamera();
    }
  }, [isSupported, stream, isLoading]);

  const startCamera = useCallback(async () => {
    try {
      if (autoFullscreen) {
        await enterFullscreen();
      }

      const result = await requestBackCameraWithFallback('high');
      
      if (result.success) {
        triggerHapticFeedback('light');
        toast({
          title: "Camera Started",
          description: "Point your camera at a QR code to scan",
        });
      } else if (result.error) {
        toast({
          title: "Camera Error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }, [autoFullscreen, enterFullscreen, requestBackCameraWithFallback, triggerHapticFeedback, toast]);

  // Start scanning when video is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;

      const handleLoadedMetadata = () => {
        if (mountedRef.current) {
          console.log('Video metadata loaded, starting enhanced QR scanning...');
          setIsScanning(true);
          
          // Start scanning loop
          setTimeout(() => {
            if (mountedRef.current && scanningRef.current === null) {
              requestAnimationFrame(scanQRCode);
            }
          }, 500);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [stream, scanQRCode]);

  // Handle touch interactions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    triggerHapticFeedback('light');
  }, [triggerHapticFeedback]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Detect tap (small movement, quick time)
    if (deltaX < 10 && deltaY < 10 && deltaTime < 200) {
      // Manual focus trigger on tap
      triggerHapticFeedback('medium');
      
      if (videoRef.current) {
        // Try to trigger autofocus by tapping
        const rect = videoRef.current.getBoundingClientRect();
        const x = (touch.clientX - rect.left) / rect.width;
        const y = (touch.clientY - rect.top) / rect.height;
        
        console.log('Focus tap at:', { x, y });
        // Could implement focus point here if supported by camera
      }
    }

    touchStartRef.current = null;
  }, [triggerHapticFeedback]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = document.createElement('img');
      img.onload = async () => {
        try {
          const result = await detectQRCodeAdvanced(img, scanningOptions);
          
          if (result) {
            triggerHapticFeedback('heavy');
            playSuccessSound();
            onScanResult(result.data, result);
            
            toast({
              title: "QR Code Found!",
              description: `Successfully extracted QR code from image using ${result.strategy}`,
            });
          } else {
            triggerHapticFeedback('light');
            toast({
              title: "No QR Code Found",
              description: "Could not detect a QR code in this image",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Image scanning error:', error);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [scanningOptions, onScanResult, triggerHapticFeedback, playSuccessSound, toast]);

  const handleStop = useCallback(() => {
    setIsScanning(false);
    stopCamera();
    if (isFullscreen) {
      exitFullscreen();
    }
    triggerHapticFeedback('light');
  }, [stopCamera, isFullscreen, exitFullscreen, triggerHapticFeedback]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 flex flex-col z-50 transition-all duration-500 ${
        isFullscreen ? 'bg-black' : 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Enhanced Header with advanced glassmorphism */}
      <div className={`flex items-center justify-between p-4 sm:p-6 border-b border-white/20 backdrop-blur-2xl transition-all duration-300 ${
        isFullscreen ? 'bg-black/80' : 'bg-black/40'
      }`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-blue-600 via-cyan-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/40 border border-white/20">
              <Camera className="h-7 w-7 text-white animate-pulse" />
            </div>
            {/* Enhanced glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Smart QR Scanner
            </h2>
            {scanningStats.attempts > 0 && (
              <p className="text-xs sm:text-sm text-cyan-300/90 font-medium tracking-wide">
                {scanningStats.successes}/{scanningStats.attempts} success • {scanningStats.averageTime.toFixed(0)}ms avg
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Enhanced Settings toggles */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-white hover:bg-white/15 transition-all duration-300 rounded-xl w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 group ${
              soundEnabled ? 'bg-green-500/25 border-green-400/40 shadow-green-500/20' : 'bg-gray-500/20 border-gray-400/30'
            }`}
            title="Toggle sound feedback"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse text-green-300" />
            ) : (
              <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse text-gray-400" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHapticsEnabled(!hapticsEnabled)}
            className={`text-white hover:bg-white/15 transition-all duration-300 rounded-xl w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 group ${
              hapticsEnabled ? 'bg-purple-500/25 border-purple-400/40 shadow-purple-500/20' : 'bg-gray-500/20 border-gray-400/30'
            }`}
            title="Toggle haptic feedback"
          >
            <Vibrate className={`h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse ${
              hapticsEnabled ? 'text-purple-300' : 'text-gray-400'
            }`} />
          </Button>
          
          {document.fullscreenEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="text-white hover:bg-white/15 transition-all duration-300 rounded-xl w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 hover:border-white/30 group"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <Maximize className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-red-500/20 transition-all duration-300 rounded-xl w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-sm border border-white/10 hover:border-red-400/50 group"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {stream && isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover bg-black"
              style={{
                transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
            
            {/* Detection overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
            
            {/* Enhanced scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Main scanning area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative transition-all duration-500 ${
                  isFullscreen ? 'w-80 h-80' : 'w-72 h-72'
                } scanning-frame`}>
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent">
                    <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400 animate-pulse" />
                  </div>
                  
                  {/* Dynamic corner indicators */}
                  <div className="absolute -top-4 -left-4 w-12 h-12">
                    <div className="w-full h-full border-t-4 border-l-4 border-cyan-400 rounded-tl-3xl animate-pulse glow-effect" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12">
                    <div className="w-full h-full border-t-4 border-r-4 border-cyan-400 rounded-tr-3xl animate-pulse glow-effect" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12">
                    <div className="w-full h-full border-b-4 border-l-4 border-cyan-400 rounded-bl-3xl animate-pulse glow-effect" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12">
                    <div className="w-full h-full border-b-4 border-r-4 border-cyan-400 rounded-br-3xl animate-pulse glow-effect" />
                  </div>
                  
                  {/* Animated scanning line */}
                  <div className="absolute inset-6 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scan-line-mobile" />
                    </div>
                  </div>
                  
                  {/* Center target */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Target className="h-8 w-8 text-cyan-400 animate-ping" />
                    <div className="absolute inset-0">
                      <Target className="h-8 w-8 text-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Status display */}
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-3 border border-cyan-500/30">
                  <div className="flex items-center gap-3 text-white">
                    <ScanLine className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold">AI-Enhanced Scanning</p>
                      <p className="text-xs text-cyan-300">
                        {scanningOptions.scanSpeed} mode • {scanningOptions.enablePreprocessing ? 'Enhanced' : 'Basic'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Touch instruction */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                  <p className="text-white text-sm">Tap screen to focus</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6">
              {isLoading ? (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Camera className="h-12 w-12 text-white animate-bounce" />
                    </div>
                    <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-cyan-400 animate-ping" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Starting Enhanced Camera...</h3>
                    <p className="text-gray-400 text-lg">Preparing AI-powered scanning</p>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <X className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Camera Error</h3>
                    <p className="text-red-400 text-lg max-w-md mx-auto">{error.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-28 h-28 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto border border-gray-600">
                    <Zap className="h-14 w-14 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-3xl font-bold">Enhanced Scanner Ready</h3>
                    <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
                      Advanced AI-powered QR detection with mobile optimization
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      {showCameraControls && stream && (
        <AdvancedCameraControls 
          stream={stream} 
          className="mx-4 mb-2"
        />
      )}

      {/* Enhanced Controls */}
      <div className={`p-6 border-t border-white/10 backdrop-blur-sm ${
        isFullscreen ? 'bg-black/80' : 'bg-black/30'
      }`}>
        {stream && isScanning ? (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={handleStop}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-8 py-4 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95"
            >
              <Square className="h-6 w-6 mr-3" />
              Stop Scanning
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-4 text-lg rounded-2xl backdrop-blur-sm"
            >
              <Upload className="h-6 w-6 mr-3" />
              Upload
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isSupported && (
              <Button
                onClick={startCamera}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 py-6 text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 transform active:scale-95"
              >
                <Camera className="h-7 w-7 mr-3" />
                {isLoading ? 'Starting Enhanced Camera...' : 'Start AI Scanner'}
              </Button>
            )}
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-5 text-lg font-bold rounded-2xl backdrop-blur-sm"
            >
              <Upload className="h-6 w-6 mr-3" />
              Scan from Gallery
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* CSS for mobile animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .scanning-frame {
            animation: frame-pulse-mobile 2s ease-in-out infinite;
          }
          
          @keyframes frame-pulse-mobile {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          
          .scan-line-mobile {
            animation: scanline-mobile 2.5s ease-in-out infinite;
          }
          
          @keyframes scanline-mobile {
            0% { transform: translateY(-150%) scaleX(0.8); opacity: 0; }
            20% { opacity: 1; transform: translateY(-100%) scaleX(1); }
            50% { transform: translateY(0%) scaleX(1.1); }
            80% { opacity: 1; transform: translateY(100%) scaleX(1); }
            100% { transform: translateY(150%) scaleX(0.8); opacity: 0; }
          }
          
          .glow-effect {
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6));
          }
          
          @media (prefers-reduced-motion: reduce) {
            .scanning-frame,
            .scan-line-mobile {
              animation: none;
            }
          }
        `
      }} />
    </div>
  );
}

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Flashlight, FlashlightOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { QRResultDrawer } from '@/components/qr-result-drawer';

// QR code scanning library - we'll use jsqr for client-side scanning
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}


interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (data: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanResult }: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [scannedResult, setScannedResult] = useState('');
  const [showResultDrawer, setShowResultDrawer] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanningRef = useRef<number | null>(null);
  const initializationRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const { toast } = useToast();

  // Load jsQR library
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  // Check camera availability and auto-start camera immediately when modal opens
  useEffect(() => {
    let mounted = true;
    
    const checkCameraAndStart = async () => {
      if (!mounted) return;
      
      let debug = 'Camera Check Debug Info:\n';
      
      try {
        debug += '- Checking camera availability...\n';
        console.log('Checking camera availability...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          debug += '- MediaDevices API not supported\n';
          console.log('MediaDevices API not supported');
          if (mounted) {
            setHasCamera(false);
            setDebugInfo(debug);
          }
          return;
        }
        
        debug += '- MediaDevices API supported\n';
        
        // First check if we can enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        debug += `- Found ${cameras.length} video input devices\n`;
        debug += `- Devices: ${JSON.stringify(cameras.map(c => ({ label: c.label, deviceId: c.deviceId })), null, 2)}\n`;
        console.log('Found cameras:', cameras);
        
        if (!mounted) return;
        
        if (cameras.length > 0) {
          setHasCamera(true);
          debug += '- Camera available via device enumeration\n';
          // Auto-start camera IMMEDIATELY when drawer opens and camera is available
          if (mounted && isOpen && !isCameraActive) {
            console.log('Auto-starting camera after device enumeration...');
            startCamera();
          }
        } else {
          debug += '- No cameras found in enumeration, trying test stream...\n';
          // Sometimes enumeration doesn't work without permission
          // Try a test getUserMedia call
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
            testStream.getTracks().forEach(track => track.stop());
            if (mounted) {
              setHasCamera(true);
              debug += '- Camera available via test stream\n';
              console.log('Camera available via test stream');
              // Auto-start camera IMMEDIATELY when drawer opens and camera is available
              if (mounted && isOpen && !isCameraActive) {
                console.log('Auto-starting camera after test stream...');
                startCamera();
              }
            }
          } catch (testError) {
            if (mounted) {
              setHasCamera(false);
              debug += `- Test stream failed: ${testError}\n`;
              console.log('No camera available');
            }
          }
        }
        
        if (mounted) {
          setDebugInfo(debug);
        }
      } catch (error) {
        debug += `- Error checking camera: ${error}\n`;
        console.error('Error checking camera:', error);
        if (mounted) {
          setHasCamera(false);
          setDebugInfo(debug);
        }
      }
    };

    if (isOpen) {
      checkCameraAndStart();
    } else {
      // Stop camera when modal closes
      if (stream) {
        console.log('Stopping camera on modal close...');
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping track:', error);
          }
        });
        setStream(null);
      }
      if (scanningRef.current) {
        cancelAnimationFrame(scanningRef.current);
        scanningRef.current = null;
      }
      setIsCameraActive(false);
      setIsScanning(false);
      setFlashlightOn(false);
      setIsInitializing(false);
    }
    
    return () => {
      mounted = false;
      // Additional cleanup on unmount
      if (scanningRef.current) {
        cancelAnimationFrame(scanningRef.current);
        scanningRef.current = null;
      }
    };
  }, [isOpen, isCameraActive]);

  const startCamera = useCallback(async () => {
    // Simple check to prevent double initialization
    if (isCameraActive || !mountedRef.current) {
      console.log('Camera already active or component unmounted, skipping...', {
        isCameraActive,
        mountedRef: mountedRef.current
      });
      return;
    }
    
    try {
      setIsInitializing(true);
      console.log('Starting camera...');
      
      // Double check if component is still mounted
      if (!mountedRef.current) {
        return;
      }
      
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS or localhost');
      }
      
      // Check for getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // First try with basic constraints
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      let mediaStream;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got media stream with environment camera');
      } catch (envError) {
        console.log('Environment camera failed, trying any camera:', envError);
        // Fallback to any available camera with more relaxed constraints
        constraints = {
          video: {
            width: { ideal: 1280, min: 320 },
            height: { ideal: 720, min: 240 }
          }
        };
        
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Got media stream with any camera');
        } catch (fallbackError) {
          console.log('Fallback failed, trying most basic constraints:', fallbackError);
          // Final fallback with minimal constraints
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('Got media stream with minimal constraints');
        }
      }
      
      console.log('Media stream tracks:', mediaStream.getTracks());
      
      // Check again if component is still mounted before setting state
      if (!mountedRef.current) {
        // Clean up the stream if component was unmounted
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current && mountedRef.current) {
        const video = videoRef.current;
        
        // Clear any existing event listeners
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onplay = null;
        video.onerror = null;
        video.onloadstart = null;
        
        // Set the stream
        video.srcObject = mediaStream;
        
        // Force video element attributes with proper values
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.controls = false;
        
        // Add additional attributes for better mobile support
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x-webkit-airplay', 'deny');
        
        // Ensure video dimensions are properly set
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        // Multiple event handlers for better compatibility
        const startScanning = () => {
          console.log('Video started playing, video dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (mountedRef.current) {
            setIsScanning(true);
            setIsInitializing(false);
            setTimeout(() => {
              if (isOpen && mountedRef.current) {
                // Use a ref to get the latest scanQRCode function
                if (scanningRef.current === null) {
                  requestAnimationFrame(() => scanQRCode());
                }
              }
            }, 100);
          }
        };
        
        // Enhanced event handlers with better autoplay handling
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          if (video && mountedRef.current) {
            // Ensure video is ready to play
            if (video.readyState >= video.HAVE_CURRENT_DATA) {
              video.play().then(() => {
                console.log('Video play successful');
                startScanning();
              }).catch((playError) => {
                console.error('Video play error:', playError);
                // Handle autoplay restrictions gracefully
                if (playError.name === 'NotAllowedError') {
                  console.log('Autoplay blocked - video will play when user interacts');
                  // Set scanning state even if autoplay is blocked
                  if (mountedRef.current) {
                    setIsInitializing(false);
                    // The video is ready, just waiting for user interaction
                    startScanning();
                  }
                } else {
                  // For other errors, try again after a short delay
                  setTimeout(() => {
                    if (video && mountedRef.current && video.paused) {
                      video.play().then(startScanning).catch((retryError) => {
                        console.error('Retry video play error:', retryError);
                        // Still proceed with initialization
                        if (mountedRef.current) {
                          setIsInitializing(false);
                          startScanning();
                        }
                      });
                    }
                  }, 200);
                }
              });
            } else {
              // Wait for video to have enough data
              console.log('Video not ready yet, waiting...');
            }
          }
        };
        
        video.oncanplay = () => {
          console.log('Video can play, ready state:', video.readyState);
          if (video && video.paused && mountedRef.current) {
            video.play().then(startScanning).catch(console.error);
          }
        };
        
        video.onplay = () => {
          console.log('Video onplay event fired');
          if (mountedRef.current && !isScanning) {
            startScanning();
          }
        };
        
        video.onerror = (error) => {
          console.error('Video error:', error);
          if (mountedRef.current) {
            setIsInitializing(false);
            initializationRef.current = false;
          }
        };
        
        video.onloadstart = () => {
          console.log('Video load started');
        };
        
        // Multiple fallback timers for different scenarios
        const timeout1 = setTimeout(() => {
          if (video && video.readyState >= 2 && video.paused && mountedRef.current) {
            console.log('Video ready via timeout (1s), trying to play...');
            video.play().then(startScanning).catch(console.error);
          }
        }, 1000);
        
        const timeout2 = setTimeout(() => {
          if (video && !isScanning && mountedRef.current) {
            console.log('Force starting scan via timeout (2s)');
            startScanning();
          }
        }, 2000);
        
        // Final fallback to ensure initialization completes
        const timeout3 = setTimeout(() => {
          if (mountedRef.current && isInitializing) {
            console.log('Force completing initialization via timeout (3s)');
            setIsInitializing(false);
            initializationRef.current = false;
          }
        }, 3000);
        
        // Store timeouts for cleanup
        const timeouts = [timeout1, timeout2, timeout3];
        
        // Cleanup function
        const cleanup = () => {
          timeouts.forEach(clearTimeout);
        };
        
        // Store cleanup in a ref for later use
        if (!videoRef.current.dataset.cleanupSet) {
          videoRef.current.dataset.cleanupSet = 'true';
          // We'll clean up timeouts when the component unmounts
        }
      } else {
        console.error('Video ref not available or component unmounted');
        if (mountedRef.current) {
          setIsInitializing(false);
          initializationRef.current = false;
        }
      }
      
      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      
      let errorMessage = "Could not access camera. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions in your browser.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is being used by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += "Camera constraints not supported.";
        } else if (error.message.includes('HTTPS') || error.message.includes('localhost')) {
          errorMessage += "Camera requires HTTPS connection or localhost.";
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Reset states on error
      if (mountedRef.current) {
        setIsCameraActive(false);
        setIsScanning(false);
        setIsInitializing(false);
      }
    } finally {
      // Always reset the initialization ref
      initializationRef.current = false;
    }
  }, [isCameraActive, isOpen, isScanning, toast]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    
    // Stop media stream
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('Stopped track:', track.kind, track.label);
        } catch (error) {
          console.error('Error stopping camera track:', error);
        }
      });
      setStream(null);
    }
    
    // Clear video element
    if (videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.srcObject = null;
      video.load(); // Reset video element
      
      // Clear event listeners
      video.onloadedmetadata = null;
      video.oncanplay = null;
      video.onplay = null;
      video.onerror = null;
      video.onloadstart = null;
      
      // Remove cleanup marker
      delete video.dataset.cleanupSet;
    }
    
    // Cancel scanning animation frame
    if (scanningRef.current) {
      cancelAnimationFrame(scanningRef.current);
      scanningRef.current = null;
    }
    
    // Reset all states
    setIsCameraActive(false);
    setIsScanning(false);
    setFlashlightOn(false);
    setIsInitializing(false);
  }, [stream]);

  const toggleFlashlight = async () => {
    if (!stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (videoTrack && 'torch' in capabilities) {
        await videoTrack.applyConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ torch: !flashlightOn }] as any
        });
        setFlashlightOn(!flashlightOn);
        
        toast({
          title: flashlightOn ? "Flashlight Off" : "Flashlight On",
          description: `Flashlight ${flashlightOn ? 'disabled' : 'enabled'}`,
        });
      } else {
        toast({
          title: "Flashlight Not Available",
          description: "Your device doesn't support flashlight control",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling flashlight:', error);
      toast({
        title: "Flashlight Error",
        description: "Could not control flashlight",
        variant: "destructive",
      });
    }
  };

  const scanQRCode = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current || !window.jsQR) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          // Stop scanning and camera
          setIsScanning(false);
          stopCamera();
          
          // Set result and show drawer
          setScannedResult(code.data);
          setShowResultDrawer(true);
          
          // Also call the optional callback for backward compatibility
          onScanResult?.(code.data);
          
          toast({
            title: "QR Code Detected!",
            description: "Successfully scanned QR code",
          });
          return;
        }
      } catch (error) {
        console.error('Error during QR scanning:', error);
      }
    }

    if (isScanning) {
      scanningRef.current = requestAnimationFrame(scanQRCode);
    }
  }, [isScanning, onScanResult, stopCamera, toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        if (!canvasRef.current || !window.jsQR) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Set result and show drawer
            setScannedResult(code.data);
            setShowResultDrawer(true);
            
            // Also call the optional callback for backward compatibility
            onScanResult?.(code.data);
            
            toast({
              title: "QR Code Found!",
              description: "Successfully extracted QR code from image",
            });
          } else {
            toast({
              title: "No QR Code Found",
              description: "Could not detect a QR code in this image",
              variant: "destructive",
            });
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      initializationRef.current = false;
      // Direct cleanup to avoid circular dependency
      if (stream) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping track on unmount:', error);
          }
        });
      }
      if (scanningRef.current) {
        cancelAnimationFrame(scanningRef.current);
      }
    };
  }, [stream]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleResultClose = () => {
    setShowResultDrawer(false);
    setScannedResult('');
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-0 p-0">
          <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  Scan QR Code
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </SheetHeader>

            {/* Camera Section */}
            <div className="flex-1 flex flex-col">
              {isCameraActive ? (
                <div className="flex-1 relative bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover bg-black cursor-pointer"
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    onClick={() => {
                      // Click-to-play fallback for browsers that block autoplay
                      if (videoRef.current && videoRef.current.paused) {
                        console.log('User clicked to play video');
                        videoRef.current.play().catch(console.error);
                      }
                    }}
                    style={{
                      minWidth: '100%',
                      minHeight: '100%',
                      backgroundColor: '#000'
                    }}
                  />
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Dark overlay with transparent center */}
                      <div className="absolute inset-0 bg-black/60" />
                      
                      {/* Scanning frame */}
                      <div className="relative z-10">
                        <div className="w-64 h-64 relative">
                          <div className="w-full h-full border-2 border-white/30 rounded-2xl" />
                          
                          {/* Corner brackets */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                          
                          {/* Animated scanning line */}
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse scan-line" />
                          </div>
                        </div>
                        
                        {/* Instructions */}
                        <div className="text-center mt-6">
                          <p className="text-white text-lg font-medium">
                            Position QR code within the frame
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-8 max-w-sm">
                    {isInitializing ? (
                      <>
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Camera className="h-12 w-12 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Starting Camera...</h3>
                          <p className="text-gray-400 text-lg">
                            Please wait while we access your camera
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                          <Camera className="h-12 w-12 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Ready to Scan</h3>
                          <p className="text-gray-400 text-lg">
                            Start your camera or upload an image to scan QR codes
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-gray-700 space-y-4">
              {isCameraActive ? (
                <div className="flex items-center justify-center gap-4">
                  {/* Flashlight Toggle */}
                  <Button
                    onClick={toggleFlashlight}
                    size="lg"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-full w-16 h-16 p-0"
                  >
                    {flashlightOn ? (
                      <FlashlightOff className="h-6 w-6" />
                    ) : (
                      <Flashlight className="h-6 w-6" />
                    )}
                  </Button>
                  
                  {/* Stop Camera */}
                  <Button
                    onClick={stopCamera}
                    size="lg"
                    variant="destructive"
                    className="rounded-full px-8 h-16 text-lg font-semibold"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Stop Camera
                  </Button>
                  
                  {/* Upload Button */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    variant="outline"
                    className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-full w-16 h-16 p-0"
                  >
                    <Upload className="h-6 w-6" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Start Camera */}
                  {hasCamera && (
                    <Button
                      onClick={startCamera}
                      size="lg"
                      className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-semibold"
                    >
                      <Camera className="h-6 w-6 mr-3" />
                      Start Camera Scan
                    </Button>
                  )}
                  
                  {/* Upload File */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    variant="outline"
                    className="w-full h-16 bg-gray-800 border-gray-600 hover:bg-gray-700 text-white rounded-2xl text-lg font-semibold"
                  >
                    <Upload className="h-6 w-6 mr-3" />
                    Upload Image
                  </Button>
                </div>
              )}
              
              {!hasCamera && (
                <div className="bg-yellow-900/50 border border-yellow-600 rounded-2xl p-4 text-center space-y-3">
                  <p className="text-yellow-200 font-medium">Camera not available</p>
                  <p className="text-yellow-300 text-sm">You can upload images to scan QR codes</p>
                  
                  <Button
                    onClick={() => setShowDebug(!showDebug)}
                    variant="outline"
                    size="sm"
                    className="bg-yellow-800 border-yellow-600 hover:bg-yellow-700 text-yellow-200 text-xs"
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug Info
                  </Button>
                  
                  {showDebug && (
                    <div className="bg-black/30 rounded-lg p-2 text-left">
                      <pre className="text-xs text-yellow-200 whitespace-pre-wrap">
                        {debugInfo || 'No debug info yet'}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* CSS for scanning animation is handled by Tailwind classes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .scan-line {
            animation: scanline 2s ease-in-out infinite;
          }
          
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            50% { transform: translateY(0%); }
            100% { transform: translateY(100%); }
          }
        `
      }} />
      
      {/* QR Result Drawer */}
      <QRResultDrawer
        isOpen={showResultDrawer}
        onClose={handleResultClose}
        scannedData={scannedResult}
      />
    </>
  );
}

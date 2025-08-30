'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Flashlight, FlashlightOff, X, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { QRResultDrawer } from '@/components/qr-result-drawer';
import { qrPerformanceMonitor, trackCameraInit, trackLibraryLoad } from '@/utils/qr-performance';
import { useBackCamera } from '@/hooks/use-camera-permission';

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
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [scannedResult, setScannedResult] = useState('');
  const [showResultDrawer, setShowResultDrawer] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const { toast } = useToast();
  
  // Use the improved back camera hook with auto-start when modal opens
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    devices,
    backCameras,
    frontCameras,
    currentFacingMode,
    error,
    requestBackCameraWithFallback,
    switchFacingMode,
    stopCamera,
    refreshDevices
  } = useBackCamera(false, 'high'); // Don't auto-start, use high quality

  // Define scanQRCode function with proper cleanup and error handling
  const scanQRCode = useCallback(() => {
    // Early exit if component is unmounted or conditions not met
    if (!mountedRef.current || !isScanning || !videoRef.current || !canvasRef.current || !window.jsQR) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context && mountedRef.current) {
      try {
        // Update scan attempts for performance monitoring
        setScanAttempts(prev => prev + 1);
        setLastScanTime(Date.now());
        qrPerformanceMonitor.recordScanAttempt();
        
        // Optimize canvas size for better performance
        const targetWidth = Math.min(video.videoWidth, 800);
        const targetHeight = (video.videoHeight * targetWidth) / video.videoWidth;
        
        // Ensure valid dimensions
        if (targetWidth <= 0 || targetHeight <= 0) {
          console.warn('Invalid video dimensions detected');
          return;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Use image smoothing for better quality at reduced size
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'medium';
        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && mountedRef.current) {
          // Record successful scan
          qrPerformanceMonitor.recordSuccessfulScan(code.data);
          
          // Clear any pending scan timeouts first
          if (scanningRef.current) {
            clearTimeout(scanningRef.current);
            scanningRef.current = null;
          }
          
          // Stop scanning and camera
          setIsScanning(false);
          stopCamera();
          
          // Reset scan stats
          setScanAttempts(0);
          setLastScanTime(0);
          
          // Set result and show drawer
          setScannedResult(code.data);
          setShowResultDrawer(true);
          
          // Also call the optional callback for backward compatibility
          onScanResult?.(code.data);
          
          toast({
            title: "🎉 QR Code Detected!",
            description: `Successfully scanned: ${code.data.length > 50 ? code.data.substring(0, 50) + '...' : code.data}`,
          });
          return;
        }
      } catch (error) {
        console.error('Error during QR scanning:', error);
        // On error, stop scanning to prevent further issues
        if (mountedRef.current) {
          setIsScanning(false);
        }
        return;
      }
    }

    // Continue scanning only if still mounted and scanning is enabled
    if (isScanning && mountedRef.current) {
      // Clear any existing timeout first to prevent multiple timeouts
      if (scanningRef.current) {
        clearTimeout(scanningRef.current);
      }
      
          // Adaptive scanning frequency based on performance
      const scanDelay = scanAttempts > 50 ? 150 : 100; // Slow down after many attempts
      scanningRef.current = setTimeout(() => {
        if (mountedRef.current && isScanning) {
          requestAnimationFrame(scanQRCode);
        }
      }, scanDelay);
    }
  }, [isScanning, onScanResult, stopCamera, toast]);

  // Load jsQR library only when modal is opened for better performance
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.jsQR && isOpen) {
      const endLibraryTracking = trackLibraryLoad();
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;
      
      // Add loading state for jsQR
      script.onload = () => {
        console.log('jsQR library loaded successfully');
        endLibraryTracking();
      };
      
      script.onerror = () => {
        console.error('Failed to load jsQR library');
        endLibraryTracking();
        toast({
          title: "Scanner Error",
          description: "Failed to load QR scanning library",
          variant: "destructive",
        });
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isOpen, toast]);

  // Auto-start back camera when modal opens, with cleanup when it closes
  useEffect(() => {
    let isCancelled = false;
    
    if (isOpen && isSupported && !stream && mountedRef.current) {
      // Auto-start the back camera with fallback when modal opens
      console.log('Auto-starting back camera for QR scanning...');
      
      const startCamera = async () => {
        try {
          const result = await requestBackCameraWithFallback('high');
          
          // Check if the effect was cancelled or component unmounted
          if (isCancelled || !mountedRef.current) {
            if (result.success && result.stream) {
              // Clean up the stream if component was unmounted
              result.stream.getTracks().forEach(track => track.stop());
            }
            return;
          }
          
          if (result.success) {
            console.log('Back camera started successfully for QR scanning');
            toast({
              title: "Camera Ready",
              description: "Point your camera at a QR code to scan",
            });
          } else if (result.error) {
            console.error('Failed to start back camera:', result.error);
            toast({
              title: "Camera Error",
              description: result.error.message || "Failed to access camera",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Unexpected error starting camera:', error);
          if (!isCancelled && mountedRef.current) {
            toast({
              title: "Camera Error",
              description: "An unexpected error occurred while starting the camera",
              variant: "destructive",
            });
          }
        }
      };
      
      startCamera();
    } else if (!isOpen) {
      // Stop camera and clear scanning when modal closes
      if (stream) {
        console.log('Stopping camera as modal is closing...');
        stopCamera();
      }
      
      // Reset states
      setIsScanning(false);
      setFlashlightOn(false);
      setScannedResult('');
      setShowResultDrawer(false);
      setScanAttempts(0);
      setLastScanTime(0);
      
      // Clear any pending scan timeouts
      if (scanningRef.current) {
        clearTimeout(scanningRef.current);
        scanningRef.current = null;
      }
    }
    
    // Cleanup function for effect cancellation
    return () => {
      isCancelled = true;
    };
  }, [isOpen, isSupported, stream, requestBackCameraWithFallback, stopCamera, toast]);

  // Set up video element when stream is available from the hook
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      
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
      
      // Start scanning when video is ready
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, starting QR scanning...');
        if (mountedRef.current) {
          setIsScanning(true);
          qrPerformanceMonitor.startScanning();
          // Start scanning loop
          setTimeout(() => {
            if (mountedRef.current && scanningRef.current === null) {
              requestAnimationFrame(scanQRCode);
            }
          }, 100);
        }
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Handle autoplay issues
      const handleCanPlay = () => {
        if (video.paused && mountedRef.current) {
          video.play().catch(console.error);
        }
      };
      
      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
      };
    } else if (videoRef.current && !stream) {
      // Clear video when stream is removed
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  }, [stream, scanQRCode]);

  const toggleFlashlight = useCallback(async () => {
    if (!stream || !mountedRef.current) return;
    
    try {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }
      
      const videoTrack = videoTracks[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (videoTrack && 'torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashlightOn } as MediaTrackConstraintSet]
        });
        
        if (mountedRef.current) {
          setFlashlightOn(!flashlightOn);
          
          toast({
            title: flashlightOn ? "Flashlight Off" : "Flashlight On",
            description: `Flashlight ${flashlightOn ? 'disabled' : 'enabled'}`,
          });
        }
      } else {
        if (mountedRef.current) {
          toast({
            title: "Flashlight Not Available",
            description: "Your device doesn't support flashlight control",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error toggling flashlight:', error);
      if (mountedRef.current) {
        toast({
          title: "Flashlight Error",
          description: "Could not control flashlight",
          variant: "destructive",
        });
      }
    }
  }, [stream, flashlightOn, toast]);


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
    reader.onload = (e) => {
      if (!mountedRef.current) return;
      
      const img = document.createElement('img');
      img.onload = () => {
        if (!mountedRef.current || !canvasRef.current || !window.jsQR) {
          return;
        }
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          try {
            // Validate image dimensions
            if (img.width <= 0 || img.height <= 0) {
              throw new Error('Invalid image dimensions');
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code && mountedRef.current) {
              // Record successful scan
              qrPerformanceMonitor.recordSuccessfulScan(code.data);
              
              // Set result and show drawer
              setScannedResult(code.data);
              setShowResultDrawer(true);
              
              // Also call the optional callback for backward compatibility
              onScanResult?.(code.data);
              
              toast({
                title: "QR Code Found!",
                description: "Successfully extracted QR code from image",
              });
            } else if (mountedRef.current) {
              toast({
                title: "No QR Code Found",
                description: "Could not detect a QR code in this image",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error processing uploaded image:', error);
            if (mountedRef.current) {
              toast({
                title: "Processing Error",
                description: "Failed to process the uploaded image",
                variant: "destructive",
              });
            }
          }
        }
      };
      
      img.onerror = () => {
        if (mountedRef.current) {
          toast({
            title: "Invalid Image",
            description: "Could not load the selected image",
            variant: "destructive",
          });
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      if (mountedRef.current) {
        toast({
          title: "File Error",
          description: "Could not read the selected file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsDataURL(file);
  }, [toast, onScanResult]);

  // Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
        clearTimeout(scanningRef.current);
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
        <SheetContent side="bottom" className="h-[92vh] sm:h-[96vh] rounded-t-3xl border-0 p-0 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900">
          <div className="flex flex-col h-full text-white relative">
            {/* Enhanced animated background overlay with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-cyan-600/5 animate-pulse opacity-80"></div>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-purple-500/20 rounded-full blur-3xl animate-pulse opacity-60"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tr from-purple-500/20 via-violet-500/15 to-pink-500/20 rounded-full blur-3xl animate-pulse opacity-60" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-2xl animate-pulse opacity-40" style={{animationDelay: '4s'}}></div>
            
            {/* Enhanced Header with Glassmorphism and better spacing */}
            <SheetHeader className="relative z-10 p-4 sm:p-6 pb-4 sm:pb-5 border-b border-white/15 bg-black/25 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg sm:text-2xl font-bold text-white flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-white/20">
                      <Camera className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse text-white" />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 rounded-2xl blur-md opacity-30 animate-pulse"></div>
                  </div>
                  <div>
                    <div className="hidden sm:block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-black tracking-wide">Scan QR Code</div>
                    <div className="sm:hidden bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-black tracking-wide">Scan QR</div>
                    <div className="text-xs text-cyan-300/90 font-semibold mt-1 opacity-90 tracking-wider">AI-Powered Recognition</div>
                  </div>
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClose}
                  className="text-white/70 hover:text-white hover:bg-white/15 rounded-full w-12 h-12 sm:w-14 sm:h-14 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/30 group hover:border-white/40"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-90 transition-transform duration-300" />
                </Button>
              </div>
            </SheetHeader>

            {/* Enhanced Camera Section */}
            <div className="flex-1 flex flex-col relative z-10">
              {stream ? (
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
                  
                  {/* Scanning Overlay with Enhanced Modern Design */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-700">
                      {/* Gradient overlay with animated blur */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 animated-bg" />
                      
                      {/* Main scanning frame with enhanced design */}
                      <div className="relative z-10 px-4 sm:px-6">
                        {/* Outer frame with glow */}
                        <div className="relative">
                          <div className="w-56 h-56 sm:w-72 sm:h-72 relative animate-in zoom-in duration-500 mx-auto scanning-frame">
                            {/* Main border with gradient and glow */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-gradient-animated shadow-2xl shadow-cyan-500/20" 
                                 style={{background: 'linear-gradient(45deg, transparent 40%, rgba(6, 182, 212, 0.1) 50%, transparent 60%)'}} />
                            
                            {/* Corner brackets with enhanced styling */}
                            <div className="absolute -top-2 -left-2 w-8 h-8 sm:w-10 sm:h-10">
                              <div className="w-full h-full border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl corner-glow animate-pulse-slow drop-shadow-lg" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10">
                              <div className="w-full h-full border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl corner-glow animate-pulse-slow drop-shadow-lg" />
                            </div>
                            <div className="absolute -bottom-2 -left-2 w-8 h-8 sm:w-10 sm:h-10">
                              <div className="w-full h-full border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl corner-glow animate-pulse-slow drop-shadow-lg" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10">
                              <div className="w-full h-full border-b-4 border-r-4 border-cyan-400 rounded-br-2xl corner-glow animate-pulse-slow drop-shadow-lg" />
                            </div>
                            
                            {/* Animated scanning line with enhanced design */}
                            <div className="absolute inset-2 flex items-center justify-center overflow-hidden rounded-2xl">
                              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 via-white to-transparent scan-line-enhanced shadow-lg shadow-cyan-400/50" />
                            </div>
                            
                            {/* Grid overlay for better targeting */}
                            <div className="absolute inset-4 opacity-20">
                              <div className="w-full h-full grid-pattern" />
                            </div>
                            
                            {/* Center focus point */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                              <div className="w-2 h-2 bg-cyan-400 rounded-full absolute inset-0" />
                            </div>
                          </div>
                          
                          {/* Status indicator with enhanced design */}
                          <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 transform -translate-x-1/2 animate-in slide-in-from-bottom-2 duration-700 delay-300">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 border border-cyan-500/20 shadow-lg shadow-black/20">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                                <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse delay-100" />
                                <div className="w-1 h-1 bg-cyan-200 rounded-full animate-pulse delay-200" />
                              </div>
                              <span className="text-white text-sm sm:text-base font-semibold tracking-wide">Scanning for QR Code</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced instructions with better typography */}
                        <div className="text-center mt-8 sm:mt-12 animate-in slide-in-from-bottom-3 duration-700 delay-500 px-4 sm:px-6">
                          <div className="space-y-3">
                            <h3 className="text-white text-lg sm:text-xl font-bold tracking-wide">
                              Position QR Code in Frame
                            </h3>
                            <div className="space-y-1">
                              <p className="text-cyan-200 text-sm sm:text-base font-medium">
                                Keep the QR code steady and well-lit
                              </p>
                              <p className="text-white/60 text-xs sm:text-sm">
                                Detection will happen automatically
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                  <div className="text-center space-y-6 sm:space-y-8 max-w-xs sm:max-w-sm px-4">
                    {isLoading ? (
                      <div className="animate-in fade-in duration-500">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-blue-600/30">
                          <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-bounce" />
                        </div>
                        <div className="animate-in slide-in-from-bottom-2 duration-300 delay-200">
                          <h3 className="text-xl sm:text-2xl font-bold mb-2">Starting Camera...</h3>
                          <p className="text-gray-400 text-base sm:text-lg">
                            Please wait while we access your camera
                          </p>
                          {/* Loading progress indicator */}
                          <div className="mt-4">
                            <div className="w-32 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full animate-pulse loading-bar"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-500">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:bg-gray-700 hover:scale-105">
                          <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                        </div>
                        <div className="animate-in slide-in-from-bottom-2 duration-300 delay-100">
                          <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to Scan</h3>
                          <p className="text-gray-400 text-base sm:text-lg">
                            Start your camera or upload an image to scan QR codes
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Controls - Mobile Optimized */}
            <div className="relative z-10 p-4 sm:p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl space-y-3 sm:space-y-4">
              {stream ? (
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {/* Flashlight Toggle - Enhanced */}
                  <Button
                    onClick={toggleFlashlight}
                    variant="outline"
                    className={`glass-card-enhanced border-white/20 hover:border-white/30 text-white rounded-2xl w-14 h-14 sm:w-16 sm:h-16 p-0 transition-all duration-300 mobile-touch-target btn-ripple group ${
                      flashlightOn ? 'bg-yellow-500/20 border-yellow-500/30 shadow-glow-blue' : ''
                    }`}
                  >
                    {flashlightOn ? (
                      <FlashlightOff className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
                    ) : (
                      <Flashlight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
                    )}
                  </Button>
                  
                  {/* Stop Camera - Enhanced */}
                  <Button
                    onClick={stopCamera}
                    variant="destructive"
                    className="rounded-2xl px-6 sm:px-8 h-14 sm:h-16 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 mobile-touch-target btn-ripple group"
                  >
                    <Square className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:animate-bounce" />
                    <span className="hidden sm:inline">Stop Camera</span>
                    <span className="sm:hidden font-semibold">Stop</span>
                  </Button>
                  
                  {/* Upload Button - Enhanced */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="glass-card-enhanced border-white/20 hover:border-white/30 text-white rounded-2xl w-14 h-14 sm:w-16 sm:h-16 p-0 transition-all duration-300 mobile-touch-target btn-ripple group"
                  >
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-bounce" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {/* Start Camera - Enhanced Mobile */}
                  {isSupported && (
                    <Button
                      onClick={() => requestBackCameraWithFallback('high')}
                      disabled={isLoading}
                      size="lg"
                      className="w-full h-14 sm:h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 disabled:cursor-not-allowed rounded-2xl text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mobile-touch-target btn-ripple group"
                    >
                      <Camera className="h-5 w-5 sm:h-6 sm:w-6 mr-3 group-hover:animate-bounce" />
                      <span className="font-black tracking-wide">
                        {isLoading ? '🔄 Initializing...' : '📸 Start Camera Scan'}
                      </span>
                    </Button>
                  )}
                  
                  {/* Upload File - Enhanced Mobile */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    variant="outline"
                    className="w-full h-14 sm:h-16 glass-card-enhanced border-white/20 hover:border-white/30 text-white rounded-2xl text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mobile-touch-target btn-ripple group"
                  >
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 mr-3 group-hover:animate-bounce" />
                    <span className="font-black tracking-wide">🖼️ Upload Image</span>
                  </Button>
                </div>
              )}
              
              {!isSupported && (
                <div className="glass-card-enhanced border border-yellow-500/30 rounded-2xl p-5 text-center space-y-4 animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Camera className="h-8 w-8 text-yellow-300" />
                  </div>
                  <p className="text-yellow-200 font-bold text-lg">📷 Camera not available</p>
                  <p className="text-yellow-300 text-sm leading-relaxed">No worries! You can still upload images to scan QR codes</p>
                  
                  <Button
                    onClick={() => setShowDebug(!showDebug)}
                    variant="outline"
                    size="sm"
                    className="glass-button border-yellow-500/30 text-yellow-200 text-xs font-semibold mobile-touch-target transition-all duration-300 hover:scale-105"
                  >
                    {showDebug ? '🙈 Hide' : '🔍 Show'} Debug Info
                  </Button>
                  
                  {showDebug && (
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 text-left animate-in slide-in-from-top-2 duration-300">
                      <pre className="text-xs text-yellow-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {error ? `Camera Error: ${error.message}\nError Code: ${error.code || 'UNKNOWN'}` : 'Camera not supported on this device or browser'}
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
      
      {/* Enhanced CSS animations with modern effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Enhanced scanning line animation */
          .scan-line-enhanced {
            animation: scanline-enhanced 2.5s ease-in-out infinite;
          }
          
          @keyframes scanline-enhanced {
            0% { 
              transform: translateY(-120%) scaleX(0.8);
              opacity: 0;
              filter: blur(1px);
            }
            20% {
              opacity: 0.8;
              filter: blur(0px);
              transform: translateY(-80%) scaleX(1);
            }
            50% { 
              transform: translateY(0%) scaleX(1.1);
              opacity: 1;
              filter: blur(0px);
            }
            80% {
              opacity: 0.8;
              filter: blur(0px);
              transform: translateY(80%) scaleX(1);
            }
            100% { 
              transform: translateY(120%) scaleX(0.8);
              opacity: 0;
              filter: blur(1px);
            }
          }
          
          /* Corner glow effect */
          .corner-glow {
            position: relative;
          }
          
          .corner-glow::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: inherit;
            background: linear-gradient(45deg, #06b6d4, #0891b2, #06b6d4);
            filter: blur(8px);
            opacity: 0.6;
            z-index: -1;
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { opacity: 0.6; filter: blur(8px); }
            to { opacity: 0.8; filter: blur(12px); }
          }
          
          /* Animated background gradient */
          .animated-bg {
            animation: bg-shift 4s ease-in-out infinite;
          }
          
          @keyframes bg-shift {
            0%, 100% { background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.8)); }
            50% { background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(6,182,212,0.1), rgba(0,0,0,0.7)); }
          }
          
          /* Scanning frame pulse */
          .scanning-frame {
            animation: frame-pulse 3s ease-in-out infinite;
          }
          
          @keyframes frame-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          
          /* Border gradient animation */
          .border-gradient-animated {
            background: linear-gradient(45deg, transparent 30%, rgba(6, 182, 212, 0.5) 50%, transparent 70%);
            background-size: 200% 200%;
            animation: gradient-border 3s ease-in-out infinite;
          }
          
          @keyframes gradient-border {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
          }
          
          /* Grid pattern overlay */
          .grid-pattern {
            background-image: 
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
            animation: grid-move 4s linear infinite;
          }
          
          @keyframes grid-move {
            0% { background-position: 0 0; }
            100% { background-position: 20px 20px; }
          }
          
          /* Slower pulse animation */
          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
          
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          /* Loading bar animation */
          .loading-bar {
            animation: loading 2s ease-in-out infinite;
          }
          
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          
          /* Enhanced button hover effects */
          .btn-hover-glow {
            position: relative;
            overflow: hidden;
          }
          
          .btn-hover-glow::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .btn-hover-glow:hover::before {
            left: 100%;
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

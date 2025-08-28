'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Camera, 
  X, 
  Upload, 
  Square, 
  Download,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Layers,
  Target,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { detectQRCodeAdvanced, QRDetectionResult } from '@/utils/advanced-qr-detection';
import { parseQRData, ParsedQRData, getQRTypeColor } from '@/utils/qr-data-parser';
import { useBackCamera } from '@/hooks/use-camera-permission';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

export interface BatchQRScannerProps {
  onClose: () => void;
  onBatchComplete?: (results: BatchScanResult[]) => void;
  maxResults?: number;
  autoExport?: boolean;
}

export interface BatchScanResult {
  id: string;
  timestamp: Date;
  detectionResult: QRDetectionResult;
  parsedData: ParsedQRData;
  processed: boolean;
  error?: string;
}

interface ScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  active: boolean;
}

export function BatchQRScanner({ 
  onClose,
  onBatchComplete,
  maxResults = 50,
  autoExport = false
}: BatchQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<BatchScanResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [scanRegions, setScanRegions] = useState<ScanRegion[]>([]);
  const [processingStats, setProcessingStats] = useState({
    totalAttempts: 0,
    successfulScans: 0,
    duplicatesFound: 0,
    averageTime: 0
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const scannedDataSet = useRef<Set<string>>(new Set());
  
  const { toast } = useToast();
  
  const {
    stream,
    isLoading,
    isSupported,
    hasPermission,
    error,
    requestBackCameraWithFallback,
    stopCamera
  } = useBackCamera(false, 'high');

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

  // Initialize scan regions for batch detection
  const initializeScanRegions = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    // Create a grid of scanning regions
    const regions: ScanRegion[] = [];
    const cols = 3;
    const rows = 3;
    const regionWidth = width / cols;
    const regionHeight = height / rows;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        regions.push({
          id: `region-${row}-${col}`,
          x: col * regionWidth,
          y: row * regionHeight,
          width: regionWidth,
          height: regionHeight,
          active: true
        });
      }
    }
    
    // Add a full-frame region as well
    regions.push({
      id: 'full-frame',
      x: 0,
      y: 0,
      width,
      height,
      active: true
    });
    
    setScanRegions(regions);
  }, []);

  // Enhanced batch QR scanning with multiple detection strategies
  const scanQRCodes = useCallback(async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current || !mountedRef.current) {
      return;
    }

    try {
      const startTime = performance.now();
      const foundCodes: BatchScanResult[] = [];
      
      // First, try full-frame detection
      const fullFrameResult = await detectQRCodeAdvanced(videoRef.current, {
        enablePreprocessing: true,
        enableRotationCorrection: false, // Skip rotation for performance in batch mode
        enableContrastEnhancement: true,
        enableBlurReduction: false,
        minQuality: 0.4,
        maxRetries: 1,
        timeoutMs: 500
      });
      
      if (fullFrameResult && !scannedDataSet.current.has(fullFrameResult.data)) {
        try {
          const parsedData = parseQRData(fullFrameResult.data);
          const batchResult: BatchScanResult = {
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            detectionResult: fullFrameResult,
            parsedData,
            processed: false
          };
          
          foundCodes.push(batchResult);
          scannedDataSet.current.add(fullFrameResult.data);
        } catch (parseError) {
          console.warn('Failed to parse QR data:', parseError);
        }
      }

      // Then try region-based detection for multiple QR codes
      for (const region of scanRegions) {
        if (!region.active || foundCodes.length >= maxResults) break;
        
        try {
          // Create region-specific canvas
          const regionCanvas = document.createElement('canvas');
          regionCanvas.width = region.width;
          regionCanvas.height = region.height;
          const regionCtx = regionCanvas.getContext('2d');
          
          if (regionCtx && videoRef.current) {
            // Draw the region from the video
            regionCtx.drawImage(
              videoRef.current,
              region.x, region.y, region.width, region.height,
              0, 0, region.width, region.height
            );
            
            // Scan this region
            const regionResult = await detectQRCodeAdvanced(regionCanvas, {
              enablePreprocessing: true,
              enableRotationCorrection: false,
              enableContrastEnhancement: true,
              enableBlurReduction: false,
              minQuality: 0.3,
              maxRetries: 1,
              timeoutMs: 200
            });
            
            if (regionResult && !scannedDataSet.current.has(regionResult.data)) {
              try {
                const parsedData = parseQRData(regionResult.data);
                
                // Adjust coordinates to global frame
                if (regionResult.location) {
                  regionResult.location = {
                    topLeftCorner: { 
                      x: regionResult.location.topLeftCorner.x + region.x, 
                      y: regionResult.location.topLeftCorner.y + region.y 
                    },
                    topRightCorner: { 
                      x: regionResult.location.topRightCorner.x + region.x, 
                      y: regionResult.location.topRightCorner.y + region.y 
                    },
                    bottomLeftCorner: { 
                      x: regionResult.location.bottomLeftCorner.x + region.x, 
                      y: regionResult.location.bottomLeftCorner.y + region.y 
                    },
                    bottomRightCorner: { 
                      x: regionResult.location.bottomRightCorner.x + region.x, 
                      y: regionResult.location.bottomRightCorner.y + region.y 
                    }
                  };
                }
                
                const batchResult: BatchScanResult = {
                  id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: new Date(),
                  detectionResult: regionResult,
                  parsedData,
                  processed: false
                };
                
                foundCodes.push(batchResult);
                scannedDataSet.current.add(regionResult.data);
              } catch (parseError) {
                console.warn('Failed to parse QR data:', parseError);
              }
            }
          }
        } catch (error) {
          console.warn(`Region scanning failed for ${region.id}:`, error);
        }
      }

      const processingTime = performance.now() - startTime;
      
      // Update processing stats
      setProcessingStats(prev => ({
        totalAttempts: prev.totalAttempts + 1,
        successfulScans: prev.successfulScans + foundCodes.length,
        duplicatesFound: prev.duplicatesFound,
        averageTime: (prev.averageTime * prev.totalAttempts + processingTime) / (prev.totalAttempts + 1)
      }));

      // Add found codes to results
      if (foundCodes.length > 0) {
        setScanResults(prev => {
          const newResults = [...prev, ...foundCodes];
          
          // Visual feedback on canvas
          drawDetectionOverlays(foundCodes);
          
          // Show toast for new detections
          toast({
            title: `${foundCodes.length} QR Code${foundCodes.length > 1 ? 's' : ''} Found!`,
            description: `Total: ${newResults.length}/${maxResults}`,
          });
          
          // Auto-export if enabled and max reached
          if (autoExport && newResults.length >= maxResults) {
            setTimeout(() => exportResults(newResults), 1000);
          }
          
          return newResults.slice(0, maxResults);
        });
      }

    } catch (error) {
      console.warn('Batch QR scanning error:', error);
    }

    // Schedule next scan
    if (isScanning && mountedRef.current && scanResults.length < maxResults) {
      scanningRef.current = setTimeout(() => {
        if (mountedRef.current) {
          requestAnimationFrame(scanQRCodes);
        }
      }, 200); // 5 FPS for batch scanning
    }
  }, [
    isScanning, 
    scanRegions, 
    maxResults, 
    autoExport, 
    scanResults.length,
    toast
  ]);

  // Draw detection overlays on canvas
  const drawDetectionOverlays = useCallback((newResults: BatchScanResult[]) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all detection boxes
    newResults.forEach((result, index) => {
      if (result.detectionResult.location) {
        const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = result.detectionResult.location;
        
        // Different colors for different QR codes
        const colors = ['#00ff00', '#ff0080', '#0080ff', '#ffff00', '#ff8000'];
        const color = colors[index % colors.length];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
        ctx.lineTo(topRightCorner.x, topRightCorner.y);
        ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
        ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
        ctx.closePath();
        ctx.stroke();
        
        // Draw corner markers
        const drawCornerMarker = (x: number, y: number) => {
          ctx.fillStyle = color;
          ctx.fillRect(x - 4, y - 4, 8, 8);
        };
        
        drawCornerMarker(topLeftCorner.x, topLeftCorner.y);
        drawCornerMarker(topRightCorner.x, topRightCorner.y);
        drawCornerMarker(bottomLeftCorner.x, bottomLeftCorner.y);
        drawCornerMarker(bottomRightCorner.x, bottomRightCorner.y);
        
        // Draw type badge
        const centerX = (topLeftCorner.x + bottomRightCorner.x) / 2;
        const centerY = topLeftCorner.y - 10;
        
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(result.parsedData.type.toUpperCase(), centerX, centerY);
      }
    });
    
    // Auto-clear after 2 seconds
    setTimeout(() => {
      if (mountedRef.current && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 2000);
  }, []);

  // Start batch scanning
  const startScanning = useCallback(async () => {
    try {
      const result = await requestBackCameraWithFallback('high');
      
      if (result.success) {
        setIsScanning(true);
        toast({
          title: "Batch Scanner Started",
          description: "Scanning for multiple QR codes simultaneously",
        });
      } else if (result.error) {
        toast({
          title: "Camera Error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting batch scanner:', error);
    }
  }, [requestBackCameraWithFallback, toast]);

  // Stop batch scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    stopCamera();
    
    if (scanResults.length > 0) {
      setShowResults(true);
    }
    
    toast({
      title: "Batch Scan Complete",
      description: `Found ${scanResults.length} QR code${scanResults.length !== 1 ? 's' : ''}`,
    });
  }, [stopCamera, scanResults.length, toast]);

  // Start scanning when video is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;

      const handleLoadedMetadata = () => {
        if (mountedRef.current) {
          console.log('Video metadata loaded, initializing batch scanning...');
          initializeScanRegions();
          
          // Auto-start scanning
          setTimeout(() => {
            if (mountedRef.current && !isScanning) {
              setIsScanning(true);
              requestAnimationFrame(scanQRCodes);
            }
          }, 500);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [stream, initializeScanRegions, scanQRCodes, isScanning]);

  // Export results
  const exportResults = useCallback((results: BatchScanResult[] = scanResults) => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        totalResults: results.length,
        results: results.map(result => ({
          id: result.id,
          timestamp: result.timestamp.toISOString(),
          type: result.parsedData.type,
          data: result.detectionResult.data,
          processingTime: result.detectionResult.processingTime,
          strategy: result.detectionResult.strategy,
          confidence: result.detectionResult.confidence
        }))
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-qr-scan-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Results Exported",
        description: `${results.length} QR codes exported to JSON file`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Could not export batch scan results",
        variant: "destructive",
      });
    }
  }, [scanResults, toast]);

  // Clear all results
  const clearResults = useCallback(() => {
    setScanResults([]);
    scannedDataSet.current.clear();
    setProcessingStats({
      totalAttempts: 0,
      successfulScans: 0,
      duplicatesFound: 0,
      averageTime: 0
    });
    
    toast({
      title: "Results Cleared",
      description: "All scan results have been removed",
    });
  }, [toast]);

  // Handle file upload for batch processing
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const processFiles = async () => {
      const newResults: BatchScanResult[] = [];
      
      for (let i = 0; i < Math.min(files.length, maxResults - scanResults.length); i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) continue;
        
        try {
          const imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.src = imageData;
          });
          
          const result = await detectQRCodeAdvanced(img, {
            enablePreprocessing: true,
            enableRotationCorrection: true,
            enableContrastEnhancement: true,
            enableBlurReduction: true,
            minQuality: 0.2
          });
          
          if (result && !scannedDataSet.current.has(result.data)) {
            const parsedData = parseQRData(result.data);
            const batchResult: BatchScanResult = {
              id: `upload-${Date.now()}-${i}`,
              timestamp: new Date(),
              detectionResult: result,
              parsedData,
              processed: false
            };
            
            newResults.push(batchResult);
            scannedDataSet.current.add(result.data);
          }
          
        } catch (error) {
          console.warn(`Failed to process file ${file.name}:`, error);
        }
      }
      
      if (newResults.length > 0) {
        setScanResults(prev => [...prev, ...newResults].slice(0, maxResults));
        toast({
          title: "Batch Upload Complete",
          description: `Found ${newResults.length} QR codes in uploaded images`,
        });
      } else {
        toast({
          title: "No QR Codes Found",
          description: "Could not detect QR codes in uploaded images",
          variant: "destructive",
        });
      }
    };

    processFiles();
  }, [maxResults, scanResults.length, toast]);

  return (
    <div className="fixed inset-0 flex flex-col z-50 bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm bg-black/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Batch QR Scanner</h2>
            <p className="text-xs text-purple-300">
              {scanResults.length}/{maxResults} • {processingStats.averageTime.toFixed(0)}ms avg
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResults(true)}
            disabled={scanResults.length === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Results ({scanResults.length})
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
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
            />
            
            {/* Detection overlay */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
            
            {/* Scanning UI overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Status display */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-3 border border-purple-500/30">
                  <div className="flex items-center gap-3 text-white">
                    <Target className="h-5 w-5 text-purple-400 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold">Batch Scanning Active</p>
                      <p className="text-xs text-purple-300">
                        Finding multiple QR codes simultaneously
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results counter */}
              <div className="absolute bottom-32 right-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-4 py-2 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {scanResults.length}/{maxResults}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6">
              {isLoading ? (
                <>
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Camera className="h-12 w-12 text-white animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Starting Batch Scanner...</h3>
                    <p className="text-gray-400 text-lg">Preparing multi-QR detection</p>
                  </div>
                </>
              ) : error ? (
                <>
                  <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold">Camera Error</h3>
                    <p className="text-red-400 text-lg max-w-md mx-auto">{error.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-28 h-28 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto border border-gray-600">
                    <Layers className="h-14 w-14 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-3xl font-bold">Batch Scanner Ready</h3>
                    <p className="text-gray-400 text-lg max-w-sm mx-auto leading-relaxed">
                      Scan multiple QR codes simultaneously with intelligent detection
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-white/10 backdrop-blur-sm bg-black/30">
        {stream && isScanning ? (
          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={stopScanning}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-8 py-4 text-lg font-bold rounded-2xl"
            >
              <Square className="h-6 w-6 mr-3" />
              Stop Scanning
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-4 text-lg rounded-2xl"
            >
              <Upload className="h-6 w-6 mr-3" />
              Add Images
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isSupported && (
              <Button
                onClick={startScanning}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 py-6 text-xl font-bold rounded-2xl"
              >
                <Camera className="h-7 w-7 mr-3" />
                {isLoading ? 'Starting Batch Scanner...' : 'Start Batch Scan'}
              </Button>
            )}
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-5 text-lg font-bold rounded-2xl"
            >
              <Upload className="h-6 w-6 mr-3" />
              Upload Multiple Images
            </Button>
          </div>
        )}
      </div>

      {/* Results Sheet */}
      <Sheet open={showResults} onOpenChange={setShowResults}>
        <SheetContent side="right" className="w-full sm:w-96 bg-gray-900 text-white border-l border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Scan Results ({scanResults.length})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => exportResults()}
                disabled={scanResults.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                onClick={clearResults}
                disabled={scanResults.length === 0}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              
              <Button
                onClick={() => {
                  setScanResults([]);
                  setShowResults(false);
                  startScanning();
                }}
                disabled={!isSupported}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Rescan
              </Button>
            </div>
            
            {/* Results list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanResults.map((result, index) => (
                <div key={result.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant="secondary" 
                      className={`bg-${getQRTypeColor(result.parsedData.type)}-600/20 text-${getQRTypeColor(result.parsedData.type)}-300 border-${getQRTypeColor(result.parsedData.type)}-600/30`}
                    >
                      {result.parsedData.icon} {result.parsedData.type}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {result.detectionResult.processingTime.toFixed(0)}ms
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-sm mb-1">{result.parsedData.label}</h4>
                  <p className="text-xs text-gray-400 break-all mb-3 max-h-12 overflow-hidden">
                    {result.detectionResult.data}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(result.detectionResult.data);
                        toast({ title: "Copied to clipboard" });
                      }}
                      className="h-8 px-3 text-xs border-gray-600 hover:bg-gray-700"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    
                    {result.parsedData.actions[0] && (
                      <Button
                        size="sm"
                        onClick={result.parsedData.actions[0].action}
                        className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        {result.parsedData.actions[0].label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {scanResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No QR codes scanned yet</p>
                  <p className="text-sm mt-1">Start scanning to see results here</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file input for batch upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

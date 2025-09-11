"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FeaturePageLayout } from "@/layouts/feature-page-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Image as ImageIcon, 
  RefreshCw, 
  Upload, 
  Settings, 
  Zap, 
  Monitor,
  Smartphone,
  Instagram,
  Twitter,
  FileImage,
  Trash2,
  PlayCircle,
  SplitSquareHorizontal,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { getImageWorkerManager, type BatchProcessingProgress } from "@/lib/image-worker-manager";
import { OPTIMIZATION_PRESETS } from "@/lib/image-optimizer";
import { Dimension, DimensionUnit, DimensionPair } from "@/lib/types";
import { createDimension, convertDimension, formatDimensionPair } from "@/lib/dimension-utils";
import { DimensionPairInput, DimensionDisplay } from "@/components/ui/dimension-input";
import { QuickDimensionPresets } from "@/components/ui/dimension-presets";
import { VisualDimensionControl } from "@/components/ui/visual-dimension-control";

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  thumbnail?: string;
  processedUrl?: string;
  originalDimensions?: { width: number; height: number };
  targetDimensions?: { width: number; height: number };
  processing?: boolean;
  error?: string;
}

interface PresetConfig {
  name: string;
  description: string;
  width: number;
  height: number;
  quality: number;
  format: string;
  icon: React.ReactNode;
}

const SMART_PRESETS: PresetConfig[] = [
  {
    name: "Web Optimized",
    description: "Perfect for websites (1920px wide)",
    width: 1920,
    height: 0, // Auto height
    quality: 85,
    format: "webp",
    icon: <Monitor className="w-4 h-4" />
  },
  {
    name: "Mobile Friendly",
    description: "Optimized for mobile devices (800px wide)",
    width: 800,
    height: 0,
    quality: 80,
    format: "webp",
    icon: <Smartphone className="w-4 h-4" />
  },
  {
    name: "Instagram Square",
    description: "Perfect square for Instagram posts",
    width: 1080,
    height: 1080,
    quality: 90,
    format: "jpeg",
    icon: <Instagram className="w-4 h-4" />
  },
  {
    name: "Twitter Header",
    description: "Twitter header image dimensions",
    width: 1200,
    height: 675,
    quality: 85,
    format: "jpeg",
    icon: <Twitter className="w-4 h-4" />
  }
];

export default function ImageResizePage() {
  // File management
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  // Current file state
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  
  // Dimension system state
  const [dimensionMode, setDimensionMode] = useState<'pixels' | 'physical'>('pixels');
  const [currentDimensions, setCurrentDimensions] = useState<DimensionPair>({
    width: createDimension(800, DimensionUnit.PIXEL),
    height: createDimension(600, DimensionUnit.PIXEL)
  });
  const [physicalDPI, setPhysicalDPI] = useState<number>(300); // DPI for print calculations
  const [quality, setQuality] = useState<number>(90);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("webp");
  const [enableSharpening, setEnableSharpening] = useState<boolean>(true);
  const [adjustBrightness, setAdjustBrightness] = useState<number>(1);
  const [adjustContrast, setAdjustContrast] = useState<number>(1);
  
  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [batchProcessing, setBatchProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>("");
  
  // Preview and results
  const [previewMode, setPreviewMode] = useState<'before' | 'after' | 'split'>('before');
  const [outputUrls, setOutputUrls] = useState<Map<string, string>>(new Map());
  const [processedSizes, setProcessedSizes] = useState<Map<string, number>>(new Map());
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1);
  
  // Performance metrics
  const [processingStats, setProcessingStats] = useState<{
    totalProcessed: number;
    totalSaved: number;
    averageTime: number;
    compressionRatio: number;
  }>({ totalProcessed: 0, totalSaved: 0, averageTime: 0, compressionRatio: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const workerManager = getImageWorkerManager();

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId);
  }, [files, selectedFileId]);

  const ratio = useMemo(() => {
    if (!natural) return 1;
    return natural.w / natural.h;
  }, [natural]);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Handle file selection and drag-and-drop
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateFileId();
      const preview = URL.createObjectURL(file);
      
      // Generate thumbnail
      try {
        const thumbResult = await workerManager.generateThumbnail(file, 150);
        const thumbnail = thumbResult.success && thumbResult.data 
          ? await workerManager.arrayBufferToDataURL(thumbResult.data, 'image/jpeg')
          : preview;
          
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: fileId,
          preview,
          thumbnail
        });
        
        newFiles.push(fileWithPreview);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: fileId,
          preview,
          thumbnail: preview
        });
        newFiles.push(fileWithPreview);
      }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Select first file if none selected
    if (!selectedFileId && newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id);
      loadImageDimensions(newFiles[0]);
    }
  }, [generateFileId, workerManager, selectedFileId]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Load image dimensions
  const loadImageDimensions = useCallback(async (file: File) => {
    try {
      const dimensions = await workerManager.loadImageDimensions(file);
      setNatural({ w: dimensions.width, h: dimensions.height });
      setWidth(dimensions.width);
      setHeight(dimensions.height);
      
      // Update file with dimensions
      setFiles(prev => prev.map(f => 
        f.id === selectedFileId 
          ? { ...f, originalDimensions: dimensions }
          : f
      ));
    } catch (error) {
      console.error('Failed to load image dimensions:', error);
    }
  }, [workerManager, selectedFileId]);

  // Handle file selection
  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    const file = files.find(f => f.id === fileId);
    if (file) {
      loadImageDimensions(file);
      
      // Load processed result if exists
      const processedUrl = outputUrls.get(fileId);
      if (processedUrl) {
        setPreviewMode('after');
      } else {
        setPreviewMode('before');
      }
    }
  }, [files, loadImageDimensions, outputUrls]);

  // Dimension update handlers
  // Note: These handlers are used by VisualDimensionControl which handles its own aspect ratio logic
  // To avoid double application of aspect ratio, we don't apply it here when called from the control
  const updateWidth = useCallback((val: number) => {
    setWidth(val);
  }, []);

  const updateHeight = useCallback((val: number) => {
    setHeight(val);
  }, []);

  // Separate handlers for direct input changes that need aspect ratio logic
  const updateWidthWithAspect = useCallback((val: number) => {
    if (keepAspect && natural) {
      const newH = Math.round(val / ratio);
      setWidth(val);
      setHeight(newH);
    } else {
      setWidth(val);
    }
  }, [keepAspect, natural, ratio]);

  const updateHeightWithAspect = useCallback((val: number) => {
    if (keepAspect && natural) {
      const newW = Math.round(val * ratio);
      setHeight(val);
      setWidth(newW);
    } else {
      setHeight(val);
    }
  }, [keepAspect, natural, ratio]);

  // Apply preset configuration
  const applyPreset = useCallback((preset: PresetConfig) => {
    if (preset.height === 0 && natural) {
      // Auto height based on aspect ratio
      const autoHeight = Math.round(preset.width / ratio);
      setWidth(preset.width);
      setHeight(autoHeight);
    } else {
      setWidth(preset.width);
      setHeight(preset.height);
    }
    setQuality(preset.quality);
    setFormat(preset.format as any);
    setKeepAspect(preset.height === 0);
  }, [natural, ratio]);

  // Process single image
  const processImage = useCallback(async () => {
    if (!selectedFile || !natural) return;
    
    setProcessing(true);
    setProgressText("Processing image...");
    setProcessProgress(0);
    
    try {
      const startTime = Date.now();
      const originalSize = selectedFile.size;
      
      const result = await workerManager.processImage(
        selectedFile,
        Math.max(1, Math.min(8192, width)),
        Math.max(1, Math.min(8192, height)),
        quality,
        format,
        {
          enableSharpening,
          adjustBrightness: adjustBrightness !== 1 ? adjustBrightness : undefined,
          adjustContrast: adjustContrast !== 1 ? adjustContrast : undefined,
          stripMetadata: true
        }
      );
      
      if (result.success && result.data) {
        const dataUrl = await workerManager.arrayBufferToDataURL(
          result.data,
          `image/${format}`
        );
        
        setOutputUrls(prev => new Map(prev.set(selectedFile.id, dataUrl)));
        if (typeof result.size === 'number') {
          setProcessedSizes(prev => new Map(prev.set(selectedFile.id, result.size as number)));
        }
        setPreviewMode('after');
        
        // Update processing stats
        const processingTime = Date.now() - startTime;
        const savedBytes = Math.max(0, originalSize - (result.size || 0));
        const compressionRatio = result.size ? result.size / originalSize : 1;
        
        setProcessingStats(prev => ({
          totalProcessed: prev.totalProcessed + 1,
          totalSaved: prev.totalSaved + savedBytes,
          averageTime: (prev.averageTime * prev.totalProcessed + processingTime) / (prev.totalProcessed + 1),
          compressionRatio: (prev.compressionRatio * prev.totalProcessed + compressionRatio) / (prev.totalProcessed + 1)
        }));
        
        setProgressText("Processing complete!");
        setProcessProgress(100);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      alert(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProcessProgress(0);
        setProgressText("");
      }, 2000);
    }
  }, [selectedFile, natural, width, height, quality, format, enableSharpening, adjustBrightness, adjustContrast, workerManager]);

  // Process all files in batch
  const processBatch = useCallback(async () => {
    if (files.length === 0) return;
    
    setBatchProcessing(true);
    setProcessProgress(0);
    setProgressText("Starting batch processing...");
    
    try {
      const batchConfig = files.map(file => ({
        file,
        width: Math.max(1, Math.min(8192, width)),
        height: Math.max(1, Math.min(8192, height)),
        quality,
        format,
        options: {
          enableSharpening,
          adjustBrightness: adjustBrightness !== 1 ? adjustBrightness : undefined,
          adjustContrast: adjustContrast !== 1 ? adjustContrast : undefined,
          stripMetadata: true
        },
        originalName: file.name
      }));
      
      const results = await workerManager.processBatch(
        batchConfig,
        (progress: BatchProcessingProgress) => {
          setProcessProgress(progress.progress);
          setProgressText(`Processing ${progress.completed}/${progress.total} images...`);
        }
      );
      
      // Update output URLs for successful results
      const newOutputUrls = new Map(outputUrls);
      
      for (const result of results) {
        if (result.success && result.data && result.originalName) {
          const file = files.find(f => f.name === result.originalName);
          if (file) {
            const dataUrl = await workerManager.arrayBufferToDataURL(
              result.data,
              `image/${format}`
            );
            newOutputUrls.set(file.id, dataUrl);
            if (typeof result.size === 'number') {
              setProcessedSizes(prev => new Map(prev.set(file.id, result.size as number)));
            }
          }
        }
      }
      
      setOutputUrls(newOutputUrls);
      setProgressText(`Batch processing complete! Processed ${results.filter(r => r.success).length}/${results.length} images.`);
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert(`Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBatchProcessing(false);
      setTimeout(() => {
        setProcessProgress(0);
        setProgressText("");
      }, 3000);
    }
  }, [files, width, height, quality, format, enableSharpening, adjustBrightness, adjustContrast, workerManager, outputUrls]);

  // Download functions
  const downloadSingle = useCallback(() => {
    if (!selectedFile) return;
    const outputUrl = outputUrls.get(selectedFile.id);
    if (!outputUrl) return;
    
    const a = document.createElement("a");
    a.href = outputUrl;
    const base = selectedFile.name.replace(/\.[^.]+$/, "") || "image";
    const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";
    a.download = `${base}-${width}x${height}.${ext}`;
    a.click();
  }, [selectedFile, outputUrls, format, width, height]);

  const downloadAll = useCallback(() => {
    files.forEach((file) => {
      const outputUrl = outputUrls.get(file.id);
      if (outputUrl) {
        const a = document.createElement("a");
        a.href = outputUrl;
        const base = file.name.replace(/\.[^.]+$/, "") || "image";
        const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";
        a.download = `${base}-${width}x${height}.${ext}`;
        a.click();
        
        // Small delay between downloads to prevent browser blocking
        setTimeout(() => {}, 100);
      }
    });
  }, [files, outputUrls, format, width, height]);

  // Reset and cleanup functions
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Clean up URLs
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
    
    setOutputUrls(prev => {
      const updated = new Map(prev);
      const url = updated.get(fileId);
      if (url) {
        URL.revokeObjectURL(url);
        updated.delete(fileId);
      }
      return updated;
    });
    
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      if (remainingFiles.length > 0) {
        setSelectedFileId(remainingFiles[0].id);
        loadImageDimensions(remainingFiles[0]);
      } else {
        setSelectedFileId(null);
        setNatural(null);
      }
    }
  }, [files, selectedFileId, loadImageDimensions]);

  const clearAll = useCallback(() => {
    // Clean up all URLs
    files.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    outputUrls.forEach(url => URL.revokeObjectURL(url));
    
    setFiles([]);
    setSelectedFileId(null);
    setNatural(null);
    setOutputUrls(new Map());
    setProcessedSizes(new Map());
    setProcessProgress(0);
    setProgressText("");
  }, [files, outputUrls]);

  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      outputUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files, outputUrls]);

  return (
    <FeaturePageLayout title="Image Resize">
      <div className="max-w-7xl mx-auto p-2 sm:p-4 text-gray-900 dark:text-gray-100">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left: File Management */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 order-1 lg:order-1">
            {/* Upload Zone */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  Upload Images
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  ref={dropZoneRef}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className={`w-6 h-6 mx-auto mb-1 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {dragOver ? 'Release to upload' : 'Drop images here or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP • Up to 8K (8192×8192)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileChange}
                    aria-label="Select images to resize"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Files ({files.length})</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                          selectedFileId === file.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                        }`}
                        onClick={() => selectFile(file.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${file.name} for processing`}
                      >
                        <img
                          src={file.thumbnail || file.preview}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(file.size / 1024)}KB
                          </p>
                        </div>
                        {outputUrls.has(file.id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Stats - Compact */}
            {processingStats.totalProcessed > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Files:</span>
                      <span>{processingStats.totalProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saved:</span>
                      <span>{Math.round(processingStats.totalSaved / 1024)}KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{Math.round(processingStats.averageTime)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ratio:</span>
                      <span>{Math.round(processingStats.compressionRatio * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center: Preview */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 order-2 lg:order-2">
            {/* Preview Modes */}
            {selectedFile && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      Preview
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={previewMode === 'before' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 sm:h-7 px-3 sm:px-2 touch-manipulation"
                        onClick={() => setPreviewMode('before')}
                      >
                        Before
                      </Button>
                      <Button
                        variant={previewMode === 'after' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 sm:h-7 px-3 sm:px-2 touch-manipulation"
                        onClick={() => setPreviewMode('after')}
                        disabled={!outputUrls.has(selectedFile.id)}
                      >
                        After
                      </Button>
                      <Button
                        variant={previewMode === 'split' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-8 sm:h-7 px-3 sm:px-2 touch-manipulation"
                        onClick={() => setPreviewMode('split')}
                        disabled={!outputUrls.has(selectedFile.id)}
                      >
                        Split
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 sm:h-7 px-3 sm:px-2 touch-manipulation" 
                        onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4 sm:w-3 sm:h-3" />
                      </Button>
                      <div className="flex-1">
                        <Slider 
                          value={[zoom]} 
                          min={0.25} 
                          max={4} 
                          step={0.25} 
                          onValueChange={(v) => setZoom(v[0])} 
                          className="touch-manipulation"
                          aria-label="Zoom level"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 sm:h-7 px-3 sm:px-2 touch-manipulation" 
                        onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4 sm:w-3 sm:h-3" />
                      </Button>
                      <Badge className="ml-1" variant="outline">{Math.round(zoom * 100)}%</Badge>
                    </div>

                    <div className="relative w-full aspect-video bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden touch-pan-x touch-pan-y">
                      <div className="absolute inset-0 overflow-auto">
                        {/* Before Image */}
                        {selectedFile.preview && (
                          <img
                            src={selectedFile.preview}
                            alt="preview"
                            className="object-contain w-full h-full select-none"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                            draggable={false}
                          />
                        )}
                        {/* After Image - conditionally overlay for after or split */}
                        {outputUrls.has(selectedFile.id) && (
                          <img
                            src={outputUrls.get(selectedFile.id)!}
                            alt="result"
                            className="object-contain w-full h-full absolute inset-0 select-none"
                            style={{ 
                              transform: `scale(${zoom})`, 
                              transformOrigin: 'center center', 
                              clipPath: previewMode === 'split' ? `inset(0 ${100 - splitPosition}% 0 0)` : undefined,
                              opacity: previewMode === 'after' ? 1 : previewMode === 'before' ? 0 : 1
                            }}
                            draggable={false}
                          />
                        )}
                        {previewMode === 'after' && !outputUrls.has(selectedFile.id) && (
                          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                            Process to see preview
                          </div>
                        )}
                      </div>

                      {/* Split slider handle */}
                      {previewMode === 'split' && outputUrls.has(selectedFile.id) && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-0 bottom-0" style={{ left: `${splitPosition}%` }}>
                            <div className="w-1 sm:w-0.5 h-full bg-white/70 dark:bg-black/50 shadow" />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={splitPosition}
                            onChange={(e) => setSplitPosition(parseInt(e.target.value, 10))}
                            className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 sm:w-1/2 opacity-80 touch-manipulation"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Image Info - Compact */}
                  {natural && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <div className="text-center">
                        <div className="font-medium">Original</div>
                        <div>{natural.w}×{natural.h}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Target</div>
                        <div>{width}×{height}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Size</div>
                        <div>
                          {Math.round(selectedFile.size / 1024)}KB
                          {processedSizes.has(selectedFile.id) && (
                            <> → {Math.round((processedSizes.get(selectedFile.id)!)/1024)}KB</>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 order-3 lg:order-3">
            {/* Smart Presets - Compact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Presets</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {SMART_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 sm:p-2 text-xs flex flex-col items-center gap-1 touch-manipulation"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.icon}
                      <span className="font-medium leading-tight">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Dimension Controls */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Dimensions</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={dimensionMode === 'pixels' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 sm:h-6 px-3 sm:px-2 text-xs touch-manipulation"
                      onClick={() => {
                        setDimensionMode('pixels');
                        const pixelDims = {
                          width: createDimension(width, DimensionUnit.PIXEL),
                          height: createDimension(height, DimensionUnit.PIXEL)
                        };
                        setCurrentDimensions(pixelDims);
                      }}
                    >
                      Pixels
                    </Button>
                    <Button
                      variant={dimensionMode === 'physical' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 sm:h-6 px-3 sm:px-2 text-xs touch-manipulation"
                      onClick={() => {
                        setDimensionMode('physical');
                        // Convert current pixel dimensions to physical based on DPI
                        const inchWidth = width / physicalDPI;
                        const inchHeight = height / physicalDPI;
                        const physicalDims = {
                          width: createDimension(inchWidth, DimensionUnit.INCH),
                          height: createDimension(inchHeight, DimensionUnit.INCH)
                        };
                        setCurrentDimensions(physicalDims);
                      }}
                    >
                      Physical
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {dimensionMode === 'pixels' ? (
                  <VisualDimensionControl
                    width={width}
                    height={height}
                    originalWidth={natural?.w}
                    originalHeight={natural?.h}
                    onWidthChange={updateWidth}
                    onHeightChange={updateHeight}
                    keepAspectRatio={keepAspect}
                    onKeepAspectRatioChange={setKeepAspect}
                  />
                ) : (
                  <div className="space-y-3">
                    <DimensionPairInput
                      value={currentDimensions}
                      onChange={(newDims) => {
                        setCurrentDimensions(newDims);
                        // Convert to pixels for processing
                        const pixelWidth = convertDimension(newDims.width, DimensionUnit.PIXEL);
                        const pixelHeight = convertDimension(newDims.height, DimensionUnit.PIXEL);
                        setWidth(Math.round(pixelWidth.value));
                        setHeight(Math.round(pixelHeight.value));
                      }}
                      lockAspectRatio={keepAspect}
                      onAspectRatioToggle={setKeepAspect}
                      allowedUnits={[DimensionUnit.METER, DimensionUnit.CENTIMETER, DimensionUnit.MILLIMETER, DimensionUnit.INCH]}
                      className=""
                    />
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Print DPI</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={physicalDPI}
                          min={72}
                          max={600}
                          onChange={(e) => setPhysicalDPI(parseInt(e.target.value || "300", 10))}
                          className="h-8 w-20 text-sm"
                          placeholder="300"
                        />
                        <span className="text-xs text-gray-500">DPI</span>
                      </div>
                    </div>
                    
                    {/* Current dimensions display */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <DimensionDisplay 
                        pair={currentDimensions} 
                        precision={1}
                        className="justify-start"
                      />
                      <div>Pixels: {width} × {height}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Dimension Presets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Presets</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <QuickDimensionPresets
                  onSelect={(presetDims) => {
                    // Convert preset to current mode
                    let targetDims = presetDims;
                    if (dimensionMode === 'physical' && presetDims.width.unit === DimensionUnit.PIXEL) {
                      // Convert pixels to physical using DPI
                      const inchWidth = presetDims.width.value / physicalDPI;
                      const inchHeight = presetDims.height.value / physicalDPI;
                      targetDims = {
                        width: createDimension(inchWidth, DimensionUnit.INCH),
                        height: createDimension(inchHeight, DimensionUnit.INCH)
                      };
                    } else if (dimensionMode === 'pixels' && presetDims.width.unit !== DimensionUnit.PIXEL) {
                      targetDims = {
                        width: convertDimension(presetDims.width, DimensionUnit.PIXEL),
                        height: convertDimension(presetDims.height, DimensionUnit.PIXEL)
                      };
                    }
                    
                    setCurrentDimensions(targetDims);
                    const pixelWidth = convertDimension(targetDims.width, DimensionUnit.PIXEL);
                    const pixelHeight = convertDimension(targetDims.height, DimensionUnit.PIXEL);
                    setWidth(Math.round(pixelWidth.value));
                    setHeight(Math.round(pixelHeight.value));
                  }}
                  currentUnit={dimensionMode === 'pixels' ? DimensionUnit.PIXEL : DimensionUnit.INCH}
                  className=""
                />
              </CardContent>
            </Card>

            {/* Quality & Format - Compact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quality & Format</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <Label className="text-xs mb-1 block">Quality: {quality}%</Label>
                  <Slider
                    value={[quality]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) => setQuality(v[0])}
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant={format === "jpeg" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("jpeg")}
                    className="text-xs h-7"
                  >
                    JPEG
                  </Button>
                  <Button
                    variant={format === "png" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("png")}
                    className="text-xs h-7"
                  >
                    PNG
                  </Button>
                  <Button
                    variant={format === "webp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("webp")}
                    className="text-xs h-7"
                  >
                    WebP
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Actions - Compact */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                {/* Progress */}
                {(processing || batchProcessing || processProgress > 0) && (
                  <div className="space-y-1">
                    <Progress value={processProgress} className="h-1.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      {progressText}
                    </p>
                  </div>
                )}
                
                {/* Single Image Actions */}
                {selectedFile && (
                  <div className="flex gap-1">
                    <Button
                      onClick={processImage}
                      disabled={!selectedFile || processing || batchProcessing}
                      className="flex-1 text-xs h-8"
                      size="sm"
                      aria-label="Process current image"
                    >
                      <PlayCircle className="w-3 h-3 mr-1" />
                      Process
                    </Button>
                    <Button
                      onClick={downloadSingle}
                      disabled={!outputUrls.has(selectedFile.id)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 px-2"
                      aria-label="Download processed image"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                {/* Batch Actions */}
                {files.length > 1 && (
                  <div className="flex gap-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={processBatch}
                      disabled={files.length === 0 || processing || batchProcessing}
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs h-7"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Batch ({files.length})
                    </Button>
                    <Button
                      onClick={downloadAll}
                      disabled={outputUrls.size === 0}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FeaturePageLayout>
  );
}

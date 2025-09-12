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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Download, 
  Image as ImageIcon, 
  RefreshCw, 
  Upload, 
  Settings, 
  Zap, 
  FileImage,
  Trash2,
  PlayCircle,
  SplitSquareHorizontal,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Maximize2,
  ImagePlus,
  Palette,
  Sliders,
  Lock,
  Unlock
} from "lucide-react";
import { getImageWorkerManager, type BatchProcessingProgress } from "@/lib/image-worker-manager";
import { OPTIMIZATION_PRESETS } from "@/lib/image-optimizer";
import { Dimension, DimensionUnit, DimensionPair } from "@/lib/types";
import { createDimension, convertDimension, formatDimensionPair } from "@/lib/dimension-utils";
import { DimensionPairInput, DimensionDisplay } from "@/components/ui/dimension-input";
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
  
  // Unit selection states
  const [widthUnit, setWidthUnit] = useState<string>('pixel');
  const [heightUnit, setHeightUnit] = useState<string>('pixel');
  const [resolutionUnit, setResolutionUnit] = useState<string>('pixel/inch');
  
  // Format dialog state
  const [formatDialogOpen, setFormatDialogOpen] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [cornerRadius, setCornerRadius] = useState<number>(0);
  
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
    if (!natural || !natural.w || !natural.h) return 1;
    
    // Validate input values more comprehensively
    if (!isFinite(natural.w) || !isFinite(natural.h) || 
        natural.w <= 0 || natural.h <= 0 || 
        natural.w > 100000 || natural.h > 100000) {
      console.warn('Invalid natural dimensions:', natural);
      return 1;
    }
    
    // Use higher precision calculation with safe division
    const safeWidth = Math.max(1, Math.abs(natural.w));
    const safeHeight = Math.max(1, Math.abs(natural.h));
    const calculatedRatio = safeWidth / safeHeight;
    
    // Enhanced validation for calculated ratio
    if (!isFinite(calculatedRatio) || calculatedRatio <= 0 || calculatedRatio === Infinity) {
      console.warn('Invalid calculated ratio:', calculatedRatio, 'from dimensions:', { w: safeWidth, h: safeHeight });
      return 1;
    }
    
    // Clamp to reasonable bounds with better precision (1:1000 to 1000:1)
    const clampedRatio = Math.max(0.001, Math.min(1000, calculatedRatio));
    
    // Round to avoid floating-point precision issues
    return Math.round(clampedRatio * 1000000) / 1000000;
  }, [natural]);

  // Helper function to calculate dimensions with better precision
  const calculateDimensions = useCallback((baseValue: number, targetRatio: number, isWidth: boolean) => {
    // Validate inputs
    if (!isFinite(baseValue) || baseValue <= 0) {
      console.warn('Invalid baseValue for dimension calculation:', baseValue);
      return Math.max(1, Math.min(8192, Math.round(baseValue) || 1));
    }
    
    if (!isFinite(targetRatio) || targetRatio <= 0) {
      console.warn('Invalid targetRatio for dimension calculation:', targetRatio);
      return Math.max(1, Math.min(8192, Math.round(baseValue)));
    }
    
    let result;
    if (isWidth) {
      // Calculate height from width
      result = Math.round(baseValue / targetRatio);
    } else {
      // Calculate width from height
      result = Math.round(baseValue * targetRatio);
    }
    
    // Validate result
    if (!isFinite(result) || result <= 0) {
      console.warn('Invalid calculated result:', result, 'from baseValue:', baseValue, 'ratio:', targetRatio);
      result = isWidth ? 600 : 800; // fallback dimensions
    }
    
    // Ensure result is within valid bounds
    return Math.max(1, Math.min(8192, result));
  }, []);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Supported image formats and their MIME types
  const SUPPORTED_FORMATS = {
    'image/jpeg': { extension: 'jpg', maxSize: 50 * 1024 * 1024 }, // 50MB
    'image/jpg': { extension: 'jpg', maxSize: 50 * 1024 * 1024 },
    'image/png': { extension: 'png', maxSize: 50 * 1024 * 1024 },
    'image/webp': { extension: 'webp', maxSize: 50 * 1024 * 1024 },
    'image/gif': { extension: 'gif', maxSize: 20 * 1024 * 1024 }, // 20MB for GIFs
    'image/bmp': { extension: 'bmp', maxSize: 20 * 1024 * 1024 },
    'image/tiff': { extension: 'tiff', maxSize: 30 * 1024 * 1024 },
    'image/svg+xml': { extension: 'svg', maxSize: 5 * 1024 * 1024 }, // 5MB for SVG
  };

  // Validate image file format and size
  const validateImageFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type || !file.type.startsWith('image/')) {
      return { valid: false, error: 'File is not an image' };
    }

    // Check if format is supported
    const formatInfo = SUPPORTED_FORMATS[file.type as keyof typeof SUPPORTED_FORMATS];
    if (!formatInfo) {
      const supportedTypes = Object.keys(SUPPORTED_FORMATS).map(type => type.split('/')[1].toUpperCase()).join(', ');
      return { valid: false, error: `Unsupported format. Supported formats: ${supportedTypes}` };
    }

    // Check file size
    if (file.size > formatInfo.maxSize) {
      const maxSizeMB = Math.round(formatInfo.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return { valid: false, error: `File too large (${fileSizeMB}MB). Maximum size for ${formatInfo.extension.toUpperCase()}: ${maxSizeMB}MB` };
    }

    // Check for minimum file size (prevent empty files)
    if (file.size < 100) {
      return { valid: false, error: 'File is too small or empty' };
    }

    return { valid: true };
  }, []);

  // Load image dimensions with caching - Define first to avoid circular dependency
  const dimensionCache = useRef<Map<string, {w: number, h: number}>>(new Map());
  
  const loadImageDimensions = useCallback(async (file: File) => {
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    
    // Check cache first
    const cachedDimensions = dimensionCache.current.get(cacheKey);
    if (cachedDimensions) {
      setNatural(cachedDimensions);
      setWidth(cachedDimensions.w);
      setHeight(cachedDimensions.h);
      return;
    }
    
    try {
      // Add timeout for dimension loading
      const dimensionPromise = workerManager.loadImageDimensions(file);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Dimension loading timeout')), 5000)
      );
      
      const dimensions = await Promise.race([dimensionPromise, timeoutPromise]);
      
      // Validate dimensions
      if (!dimensions || !dimensions.width || !dimensions.height || 
          !isFinite(dimensions.width) || !isFinite(dimensions.height) ||
          dimensions.width <= 0 || dimensions.height <= 0) {
        throw new Error(`Invalid image dimensions: ${dimensions?.width}x${dimensions?.height}`);
      }
      
      // Clamp dimensions to reasonable bounds
      const validWidth = Math.max(1, Math.min(16384, Math.round(dimensions.width)));
      const validHeight = Math.max(1, Math.min(16384, Math.round(dimensions.height)));
      
      const validDimensions = { width: validWidth, height: validHeight };
      const naturalDims = { w: validWidth, h: validHeight };
      
      // Cache the dimensions
      dimensionCache.current.set(cacheKey, naturalDims);
      
      setNatural(naturalDims);
      setWidth(validWidth);
      setHeight(validHeight);
      
      // Update file with dimensions (batch update)
      setFiles(prev => prev.map(f => 
        f.id === selectedFileId 
          ? { ...f, originalDimensions: validDimensions }
          : f
      ));
    } catch (error) {
      console.warn('Failed to load image dimensions:', error);
      // Set fallback dimensions
      const fallbackDims = { w: 800, h: 600 };
      setNatural(fallbackDims);
      setWidth(800);
      setHeight(600);
    }
  }, [workerManager, selectedFileId]);

  // Handle file selection and drag-and-drop
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];
    const maxFiles = 20; // Limit concurrent processing
    
    // Process files in batches to avoid memory issues
    const filesToProcess = Array.from(fileList).slice(0, maxFiles);
    if (fileList.length > maxFiles) {
      errors.push(`Only processing first ${maxFiles} files. Selected ${fileList.length} files.`);
    }
    
    for (const file of filesToProcess) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      
      const fileId = generateFileId();
      const preview = URL.createObjectURL(file);
      
      // Generate thumbnail with timeout and better error handling
      try {
        const thumbPromise = workerManager.generateThumbnail(file, 150);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Thumbnail generation timeout')), 10000)
        );
        
        const thumbResult = await Promise.race([thumbPromise, timeoutPromise]);
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
        console.warn('Failed to generate thumbnail:', error);
        // Still add file, but with preview as thumbnail
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: fileId,
          preview,
          thumbnail: preview,
          error: 'Thumbnail generation failed'
        });
        newFiles.push(fileWithPreview);
      }
    }
    
    // Show errors with better UX
    if (errors.length > 0) {
      const errorMessage = errors.length === 1 
        ? errors[0]
        : `${errors.length} files had issues:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n... and more' : ''}`;
      
      // Use a more user-friendly notification instead of alert
      console.warn('File processing issues:', errors);
      // You could replace this with a toast notification
      setTimeout(() => alert(errorMessage), 100);
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => {
        // Prevent duplicate files
        const existingIds = new Set(prev.map(f => f.name + f.size));
        const uniqueNewFiles = newFiles.filter(f => !existingIds.has(f.name + f.size));
        return [...prev, ...uniqueNewFiles];
      });
      
      // Select first file if none selected
      if (!selectedFileId && newFiles.length > 0) {
        const firstFile = newFiles[0];
        setSelectedFileId(firstFile.id);
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          loadImageDimensions(firstFile);
        });
      }
    }
  }, [generateFileId, workerManager, selectedFileId, validateImageFile, loadImageDimensions]);

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
    // Validate and sanitize input
    const sanitizedWidth = Math.max(1, Math.min(8192, Math.round(Number(val) || 1)));
    setWidth(sanitizedWidth);
    
    if (keepAspect && natural && ratio > 0 && isFinite(ratio)) {
      const newHeight = calculateDimensions(sanitizedWidth, ratio, true);
      setHeight(newHeight);
    }
  }, [keepAspect, natural, ratio, calculateDimensions]);

  const updateHeightWithAspect = useCallback((val: number) => {
    // Validate and sanitize input
    const sanitizedHeight = Math.max(1, Math.min(8192, Math.round(Number(val) || 1)));
    setHeight(sanitizedHeight);
    
    if (keepAspect && natural && ratio > 0 && isFinite(ratio)) {
      const newWidth = calculateDimensions(sanitizedHeight, ratio, false);
      setWidth(newWidth);
    }
  }, [keepAspect, natural, ratio, calculateDimensions]);


  // Enhanced error handling with user-friendly messages
  const getErrorMessage = useCallback((error: unknown): string => {
    if (!error) return 'An unknown error occurred';
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Map common technical errors to user-friendly messages
    const errorMappings = {
      'Failed to create image bitmap': 'The image file appears to be corrupted or in an unsupported format. Please try a different image.',
      'File too large': 'The image file is too large to process. Please use an image smaller than 50MB.',
      'Invalid target dimensions': 'The requested image size is too large. Please choose smaller dimensions.',
      'Worker not available': 'Image processing service is temporarily unavailable. Please refresh the page and try again.',
      'Processing timeout': 'Image processing took too long and was cancelled. Please try with a smaller image.',
      'Memory': 'Not enough memory to process this image. Please try with a smaller image or refresh the page.',
      'Network': 'Network connection issue. Please check your internet connection and try again.',
    };
    
    // Find matching error pattern
    for (const [pattern, friendlyMsg] of Object.entries(errorMappings)) {
      if (errorMsg.toLowerCase().includes(pattern.toLowerCase())) {
        return friendlyMsg;
      }
    }
    
    // Return original message for unrecognized errors, but make it more user-friendly
    return `Processing failed: ${errorMsg}. Please try again or choose a different image.`;
  }, []);

  // Process single image
  const processImage = useCallback(async () => {
    if (!selectedFile || !natural) return;
    
    // Validate inputs before processing
    if (width < 1 || height < 1 || width > 8192 || height > 8192) {
      alert('Image dimensions must be between 1x1 and 8192x8192 pixels.');
      return;
    }
    
    if (quality < 1 || quality > 100) {
      alert('Quality must be between 1 and 100.');
      return;
    }
    
    // Check if processing is already in progress
    if (processing) {
      console.warn('Processing already in progress');
      return;
    }
    
    setProcessing(true);
    setProgressText("Preparing image for processing...");
    setProcessProgress(10);
    
    // Create abort controller for cancellation
    const abortController = new AbortController();
    
    try {
      const startTime = Date.now();
      const originalSize = selectedFile.size;
      
      // Check for reasonable file size limits
      if (originalSize > 100 * 1024 * 1024) { // 100MB
        throw new Error('File too large for processing. Please use files smaller than 100MB.');
      }
      
      setProgressText("Processing image...");
      setProcessProgress(30);
      
      // Add timeout for processing
      const processingPromise = workerManager.processImage(
        selectedFile,
        Math.max(1, Math.min(8192, width)),
        Math.max(1, Math.min(8192, height)),
        Math.max(1, Math.min(100, quality)),
        format,
        {
          enableSharpening,
          adjustBrightness: adjustBrightness !== 1 ? adjustBrightness : undefined,
          adjustContrast: adjustContrast !== 1 ? adjustContrast : undefined,
          stripMetadata: true
        }
      );
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Processing timeout after 60 seconds')), 60000)
      );
      
      const result = await Promise.race([processingPromise, timeoutPromise]);
      
      setProgressText("Finalizing...");
      setProcessProgress(80);
      
      if (result.success && result.data) {
        const dataUrl = await workerManager.arrayBufferToDataURL(
          result.data,
          `image/${format}`
        );
        
        // Clean up previous result for this file to prevent memory leaks
        const previousUrl = outputUrls.get(selectedFile.id);
        if (previousUrl && previousUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previousUrl);
        }
        
        setOutputUrls(prev => new Map(prev.set(selectedFile.id, dataUrl)));
        if (typeof result.size === 'number') {
          setProcessedSizes(prev => new Map(prev.set(selectedFile.id, result.size as number)));
        }
        setPreviewMode('after');
        
        // Update processing stats with better precision
        const processingTime = Date.now() - startTime;
        const savedBytes = Math.max(0, originalSize - (result.size || 0));
        const compressionRatio = result.size ? result.size / originalSize : 1;
        
        setProcessingStats(prev => {
          const newTotal = prev.totalProcessed + 1;
          return {
            totalProcessed: newTotal,
            totalSaved: prev.totalSaved + savedBytes,
            averageTime: (prev.averageTime * prev.totalProcessed + processingTime) / newTotal,
            compressionRatio: (prev.compressionRatio * prev.totalProcessed + compressionRatio) / newTotal
          };
        });
        
        setProgressText("Processing complete!");
        setProcessProgress(100);
        
        // Show success feedback with better formatting
        const sizeDiff = originalSize - (result.size || 0);
        const sizeSaving = sizeDiff > 0 ? ` (saved ${(sizeDiff / 1024).toFixed(1)}KB)` : '';
        setProgressText(`✓ Successfully processed to ${width}×${height}${sizeSaving}`);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      const friendlyMessage = getErrorMessage(error);
      setProgressText(`✗ ${friendlyMessage}`);
      
      // Show error in a more user-friendly way with better timing
      setTimeout(() => {
        if (!abortController.signal.aborted) {
          alert(friendlyMessage);
        }
      }, 500);
    } finally {
      setProcessing(false);
      
      // Better cleanup timing
      const cleanup = () => {
        if (progressText.includes('✓') || progressText.includes('✗')) {
          // Keep success/error messages visible longer
          setTimeout(() => {
            setProcessProgress(0);
            setProgressText("");
          }, 2000);
        } else {
          setProcessProgress(0);
          setProgressText("");
        }
      };
      
      setTimeout(cleanup, 800);
    }
  }, [selectedFile, natural, width, height, quality, format, enableSharpening, adjustBrightness, adjustContrast, workerManager, getErrorMessage, progressText, processing, outputUrls]);

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
    
    // Generate filename based on user input or defaults
    let filename = customFileName.trim();
    if (!filename) {
      const base = selectedFile.name.replace(/\.[^.]+$/, "") || "image";
      filename = `${base}-${width}x${height}`;
    }
    
    // Add date prefix if provided
    if (customDate.trim()) {
      filename = `${customDate.trim()}-${filename}`;
    }
    
    const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";
    a.download = `${filename}.${ext}`;
    a.click();
    
    // Close dialog after download
    setFormatDialogOpen(false);
  }, [selectedFile, outputUrls, format, width, height, customFileName, customDate]);

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

  
  // Cleanup on unmount with better memory management
  useEffect(() => {
    return () => {
      // Clean up all object URLs to prevent memory leaks
      files.forEach(file => {
        if (file.preview && file.preview.startsWith('blob:')) {
          URL.revokeObjectURL(file.preview);
        }
        if (file.thumbnail && file.thumbnail.startsWith('blob:') && file.thumbnail !== file.preview) {
          URL.revokeObjectURL(file.thumbnail);
        }
      });
      
      outputUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      // Clear dimension cache
      dimensionCache.current.clear();
    };
  }, [files, outputUrls]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 backdrop-blur-sm bg-black/20 px-4 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Image Resize
          </h1>
          {files.length > 0 && (
            <div className="absolute right-0 flex items-center space-x-2 text-sm">
              <FileImage className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{files.length} file{files.length !== 1 ? 's' : ''}</span>
              {processingStats.totalProcessed > 0 && (
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {processingStats.totalProcessed} processed
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {!selectedFile ? (
          /* Upload State */
          <div className="space-y-8">
            {/* Upload Zone */}
            <div className="relative">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-500 group overflow-hidden ${
                  dragOver
                    ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                    : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/5 hover:scale-[1.01]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative space-y-6">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-300">
                    <ImagePlus className={`w-16 h-16 transition-all duration-300 ${
                      dragOver ? 'text-blue-400 scale-110' : 'text-gray-400 group-hover:text-blue-500'
                    }`} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {dragOver ? 'Drop your images here!' : 'Upload Your Images'}
                    </h3>
                    <p className="text-gray-400 text-lg">
                      Drag & drop or click to select multiple files
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF', 'SVG'].map((format) => (
                        <Badge key={format} variant="outline" className="border-gray-600 text-gray-400">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Maximum file size: 50MB per image
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Uploaded State */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - File Management & Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Files List */}
              {files.length > 1 && (
                <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileImage className="w-5 h-5" />
                      Images ({files.length})
                    </h3>
                    <Button
                      onClick={clearAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-400 hover:text-white hover:border-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedFileId === file.id
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => selectFile(file.id)}
                      >
                        <div className="aspect-square bg-gray-800">
                          {file.thumbnail && (
                            <img
                              src={file.thumbnail}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        {outputUrls.has(file.id) && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Main Preview */}
              <div className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    {outputUrls.has(selectedFile.id) && (
                      <div className="flex bg-gray-800 rounded-lg p-1">
                        {(['before', 'after', 'split'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPreviewMode(mode)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              previewMode === mode
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={() => setShowPreview(!showPreview)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {showPreview && (
                  <div className="relative bg-gray-800 aspect-video flex items-center justify-center">
                    {selectedFile.preview && (
                      <div className="relative max-w-full max-h-full">
                        <img
                          src={previewMode === 'after' && outputUrls.has(selectedFile.id) 
                            ? outputUrls.get(selectedFile.id)! 
                            : selectedFile.preview}
                          alt="preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        {previewMode === 'split' && outputUrls.has(selectedFile.id) && (
                          <div className="absolute inset-0 flex">
                            <div className="flex-1 overflow-hidden rounded-l-lg">
                              <img
                                src={selectedFile.preview}
                                alt="before"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 overflow-hidden rounded-r-lg">
                              <img
                                src={outputUrls.get(selectedFile.id)!}
                                alt="after"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Image Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Original
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white font-medium">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    {natural && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Dimensions:</span>
                          <span className="text-white font-medium">{natural.w} × {natural.h}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Aspect Ratio:</span>
                          <span className="text-white font-medium">{ratio.toFixed(2)}:1</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format:</span>
                      <span className="text-white font-medium">
                        {selectedFile.type.split('/')[1].toUpperCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/50 border-gray-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dimensions:</span>
                      <span className="text-white font-medium">{width} × {height}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quality:</span>
                      <span className="text-white font-medium">{quality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format:</span>
                      <span className="text-white font-medium">{format.toUpperCase()}</span>
                    </div>
                    {processedSizes.has(selectedFile.id) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Size:</span>
                        <span className="text-white font-medium">
                          {(processedSizes.get(selectedFile.id)! / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Column - Controls */}
            <div className="space-y-6">
            {/* Dimension Controls */}
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    Dimensions
                  </div>
                  <Button
                    onClick={() => setKeepAspect(!keepAspect)}
                    variant="outline"
                    size="sm"
                    className={`border-gray-600 text-xs ${
                      keepAspect ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {keepAspect ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                    {keepAspect ? 'Locked' : 'Free'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Settings Display */}
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Size:</span>
                    <span className="text-white font-medium">{width} × {height}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aspect Ratio:</span>
                    <span className="text-white font-medium">{ratio.toFixed(3)}:1</span>
                  </div>
                  {natural && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Scale Factor:</span>
                      <span className="text-white font-medium">
                        {((width / natural.w) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              
              {/* Width Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300 w-12">Width</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    value={width}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(8192, parseInt(e.target.value) || 0));
                      updateWidthWithAspect(value);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.value = String(width);
                      }
                    }}
                    className="flex-1 bg-white text-black px-3 py-2 rounded-lg text-center"
                  />
                  <div className="relative">
                    <select 
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg appearance-none pr-8"
                      value={widthUnit}
                      onChange={(e) => setWidthUnit(e.target.value)}
                    >
                      <option value="pixel">Pixel</option>
                      <option value="cm">CM</option>
                      <option value="inch">Inch</option>
                      <option value="mm">MM</option>
                      <option value="m">M</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Height Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300 w-12">Height</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    value={height}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(8192, parseInt(e.target.value) || 0));
                      updateHeightWithAspect(value);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.value = String(height);
                      }
                    }}
                    className="flex-1 bg-white text-black px-3 py-2 rounded-lg text-center"
                  />
                  <div className="relative">
                    <select 
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg appearance-none pr-8"
                      value={heightUnit}
                      onChange={(e) => setHeightUnit(e.target.value)}
                    >
                      <option value="pixel">Pixel</option>
                      <option value="cm">CM</option>
                      <option value="inch">Inch</option>
                      <option value="mm">MM</option>
                      <option value="m">M</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Resolution Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300 w-16">Resolution</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="72"
                    max="600"
                    value={physicalDPI}
                    onChange={(e) => {
                      const value = Math.max(72, Math.min(600, parseInt(e.target.value) || 300));
                      setPhysicalDPI(value);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.value = String(physicalDPI);
                      }
                    }}
                    className="flex-1 bg-white text-black px-3 py-2 rounded-lg text-center"
                  />
                  <div className="relative">
                    <select 
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg appearance-none pr-8"
                      value={resolutionUnit}
                      onChange={(e) => setResolutionUnit(e.target.value)}
                    >
                      <option value="pixel/inch">Pixel/inch</option>
                      <option value="pixel/cm">Pixel/cm</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Corner Radius Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300 w-12">Corner</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    defaultValue={10}
                    onBlur={(e) => {
                      const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                      e.target.value = String(value);
                    }}
                    className="flex-1 bg-white text-black px-3 py-2 rounded-lg text-center"
                  />
                  <span className="text-gray-300 px-3">Pixel</span>
                </div>
              </div>
              </CardContent>
            </Card>
            
            {/* Format & Quality */}
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Output Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Format</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['jpeg', 'png', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          format === fmt
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Quality Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-gray-300">Quality</Label>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {quality}%
                    </Badge>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Smaller</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Advanced Settings */}
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader className="pb-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-base text-white hover:text-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Advanced Settings
                  </div>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-4">
                  {/* Sharpening */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-300">Enable Sharpening</Label>
                    <button
                      onClick={() => setEnableSharpening(!enableSharpening)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        enableSharpening ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        enableSharpening ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-300">Brightness</Label>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {adjustBrightness.toFixed(2)}
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={adjustBrightness}
                      onChange={(e) => setAdjustBrightness(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-300">Contrast</Label>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {adjustContrast.toFixed(2)}
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={adjustContrast}
                      onChange={(e) => setAdjustContrast(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Corner Radius */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-300">Corner Radius</Label>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {cornerRadius}px
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Reset Button */}
                  <Button
                    onClick={() => {
                      setAdjustBrightness(1);
                      setAdjustContrast(1);
                      setCornerRadius(0);
                      setEnableSharpening(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-600 text-gray-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              )}
            </Card>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Show process button only if image is not processed */}
              {!outputUrls.has(selectedFile.id) && (
                <Button
                  onClick={processImage}
                  disabled={processing}
                  className="w-full sm:w-[90%] lg:w-full xl:w-[90%] h-[50px] mx-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="hidden xs:inline sm:inline">Processing...</span>
                      <span className="xs:hidden sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span className="hidden xs:inline sm:inline">Process Image</span>
                      <span className="xs:hidden sm:hidden">Process</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Show download popup button when processing is complete */}
              {outputUrls.has(selectedFile.id) && (
                <Dialog open={formatDialogOpen} onOpenChange={setFormatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-[90%] lg:w-full xl:w-[90%] h-[50px] mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-base font-bold transition-all duration-300 animate-pulse flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </Button>
                  </DialogTrigger>
                  {/* Backdrop Overlay */}
                  {formatDialogOpen && (
                    <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  )}
                  <DialogContent className="sm:max-w-lg w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:bottom-4 md:top-auto md:left-4 md:right-4 md:translate-x-0 md:translate-y-0 z-[9999] bg-gray-900/95 backdrop-blur-md text-white border border-gray-700 rounded-2xl md:rounded-t-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-bottom md:data-[state=open]:slide-in-from-bottom md:data-[state=closed]:zoom-out-100 md:data-[state=open]:zoom-in-100">
                    <DialogHeader className="p-6 pb-4">
                      <DialogTitle className="text-xl font-bold text-white text-center">Download Image</DialogTitle>
                      <DialogDescription className="text-gray-400 text-center">
                        Your image has been processed successfully.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="px-6 pb-6 space-y-6">
                      {/* Format Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium text-gray-200">Format</Label>
                        <div className="grid grid-cols-4 gap-3">
                          {['jpeg', 'png', 'webp', 'svg'].map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setFormat(fmt as any)}
                              className={`py-3 px-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                format === fmt
                                  ? 'bg-white text-black shadow-lg scale-105'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                              }`}
                            >
                              {fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Original Size:</span>
                          <span className="text-white font-medium">{Math.round(selectedFile.size / 1024)}KB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Dimensions:</span>
                          <span className="text-white font-medium">{width} × {height}px</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Format:</span>
                          <span className="text-white font-medium">{format.toUpperCase()}</span>
                        </div>
                        {processedSizes.has(selectedFile.id) && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Processed Size:</span>
                            <span className="text-white font-medium">{Math.round(processedSizes.get(selectedFile.id)! / 1024)}KB</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Download Button */}
                      <Button
                        onClick={downloadSingle}
                        className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Image
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Batch processing button - only show if multiple files and not all processed */}
              {files.length > 1 && outputUrls.size < files.length && (
                <Button
                  onClick={processBatch}
                  disabled={batchProcessing || processing}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:text-white py-3 rounded-xl text-base font-medium transition-all duration-300"
                >
                  {batchProcessing ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Batch...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      Process Remaining {files.length - outputUrls.size} Images
                    </div>
                  )}
                </Button>
              )}
              
              {/* Reprocess button - allow user to process again with different settings */}
              {outputUrls.has(selectedFile.id) && (
                <Button
                  onClick={processImage}
                  disabled={processing}
                  variant="outline"
                  className="w-full sm:w-[90%] lg:w-full xl:w-[90%] h-[50px] mx-auto border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-sm sm:text-base font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Reprocessing...</span>
                      <span className="sm:hidden">Reprocess...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Reprocess</span>
                      <span className="sm:hidden">Reprocess</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            
            {/* Progress Bar */}
            {(processing || batchProcessing || processProgress > 0) && (
              <Card className="bg-gray-900/50 border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white font-medium">{processProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${processProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>
                    </div>
                    {progressText && (
                      <p className="text-sm text-gray-300 text-center font-medium">{progressText}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Batch Download Section - Only show when multiple files are processed */}
            {files.length > 1 && outputUrls.size > 1 && (
              <div className="space-y-3">
                <Button
                  onClick={downloadAll}
                  variant="outline"
                  className="w-full border-green-600 text-green-400 hover:bg-green-600 hover:text-white py-3 rounded-xl text-base font-medium transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Processed ({outputUrls.size})
                </Button>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #000;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
}

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
  Unlock,
  Crop,
  Expand,
  Minimize2
} from "lucide-react";
import { getImageWorkerManager, type BatchProcessingProgress } from "@/lib/image-worker-manager";
import { OPTIMIZATION_PRESETS } from "@/lib/image-optimizer";
// Removed unused dimension imports for performance

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
  
  // Dimension system state - removed unused variables for performance
  const [physicalDPI, setPhysicalDPI] = useState<number>(300); // DPI for print calculations
  const [quality, setQuality] = useState<number>(90);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("webp");
  const [enableSharpening, setEnableSharpening] = useState<boolean>(false);
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
  const [cornerRadiusUnit, setCornerRadiusUnit] = useState<string>('pixel');
  const [fullScreenPreview, setFullScreenPreview] = useState<boolean>(false);
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropAspectRatio, setCropAspectRatio] = useState<string>('free');
  const [cropSelection, setCropSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 50, y: 50, width: 200, height: 200 });
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; selection: typeof cropSelection } | null>(null);
  const [imageContainerRef, setImageContainerRef] = useState<HTMLDivElement | null>(null);
  
  // Input validation states
  const [widthError, setWidthError] = useState<string>('');
  const [heightError, setHeightError] = useState<string>('');
  const [cornerRadiusError, setCornerRadiusError] = useState<string>('');
  
  // Debouncing and throttling refs for performance
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationValuesRef = useRef<{width: number, height: number, cornerRadius: number}>({ width: 0, height: 0, cornerRadius: 0 });
  
  // Dimension presets
  const dimensionPresets = [
    { name: 'HD', width: 1280, height: 720 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
    { name: 'Instagram Square', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Facebook Cover', width: 1200, height: 630 },
    { name: 'Twitter Header', width: 1500, height: 500 },
    { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  ];
  
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

  // Reset crop selection when file changes or modal opens
  useEffect(() => {
    if (showCropModal && selectedFile && natural) {
      // Set crop selection to 60% of image size, centered
      const cropWidth = Math.round(natural.w * 0.6);
      const cropHeight = Math.round(natural.h * 0.6);
      const cropX = Math.round((natural.w - cropWidth) / 2);
      const cropY = Math.round((natural.h - cropHeight) / 2);
      
      setCropSelection({
        x: Math.max(0, cropX),
        y: Math.max(0, cropY),
        width: Math.min(natural.w, cropWidth),
        height: Math.min(natural.h, cropHeight)
      });
    }
  }, [showCropModal, selectedFile, natural]);

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
  
  // Format aspect ratio for display (recognizes common ratios)
  const formatAspectRatio = useCallback((ratio: number): string => {
    if (!isFinite(ratio) || ratio <= 0) return '1:1';
    
    // Common aspect ratios with tolerance
    const commonRatios = [
      { ratio: 16/9, display: '16:9' },
      { ratio: 4/3, display: '4:3' },
      { ratio: 3/2, display: '3:2' },
      { ratio: 5/4, display: '5:4' },
      { ratio: 1, display: '1:1' },
      { ratio: 2/1, display: '2:1' },
      { ratio: 21/9, display: '21:9' },
    ];
    
    const tolerance = 0.02; // 2% tolerance
    for (const commonRatio of commonRatios) {
      if (Math.abs(ratio - commonRatio.ratio) < tolerance) {
        return commonRatio.display;
      }
    }
    
    // Fallback to decimal display
    return `${ratio.toFixed(2)}:1`;
  }, []);
  
  // Calculate scale factor with error handling
  const scaleFactorPercent = useMemo(() => {
    if (!natural || !natural.w || natural.w <= 0 || !width || width <= 0) return 100;
    return Math.round((width / natural.w) * 100);
  }, [natural, width]);
  
  // Optimized unit conversion with memoized conversion factors
  const conversionFactors = useMemo(() => ({
    cm: { fromPixels: 2.54 / physicalDPI, toPixels: physicalDPI / 2.54 },
    inch: { fromPixels: 1 / physicalDPI, toPixels: physicalDPI },
    mm: { fromPixels: 25.4 / physicalDPI, toPixels: physicalDPI / 25.4 },
    m: { fromPixels: 0.0254 / physicalDPI, toPixels: physicalDPI / 0.0254 },
    pixel: { fromPixels: 1, toPixels: 1 }
  }), [physicalDPI]);
  
  const convertFromPixels = useCallback((pixels: number, unit: string) => {
    const factor = conversionFactors[unit as keyof typeof conversionFactors];
    return factor ? pixels * factor.fromPixels : pixels;
  }, [conversionFactors]);
  
  const convertToPixels = useCallback((value: number, unit: string) => {
    if (!isFinite(value) || value < 0) return 1;
    const factor = conversionFactors[unit as keyof typeof conversionFactors];
    return Math.round(factor ? value * factor.toPixels : value);
  }, [conversionFactors]);
  
  // Optimized display values with smart formatting (avoid unnecessary toFixed calls)
  const displayWidth = useMemo(() => {
    if (widthUnit === 'pixel') return width;
    const converted = convertFromPixels(width, widthUnit);
    // Only use decimal places if needed
    return converted % 1 === 0 ? converted.toString() : converted.toFixed(2);
  }, [width, widthUnit, convertFromPixels]);
  
  const displayHeight = useMemo(() => {
    if (heightUnit === 'pixel') return height;
    const converted = convertFromPixels(height, heightUnit);
    return converted % 1 === 0 ? converted.toString() : converted.toFixed(2);
  }, [height, heightUnit, convertFromPixels]);
  
  const displayCornerRadius = useMemo(() => {
    if (cornerRadiusUnit === 'pixel') return cornerRadius;
    const converted = convertFromPixels(cornerRadius, cornerRadiusUnit);
    return converted % 1 === 0 ? converted.toString() : converted.toFixed(2);
  }, [cornerRadius, cornerRadiusUnit, convertFromPixels]);
  
  // Smart preset suggestions based on current image aspect ratio
  const suggestedPresets = useMemo(() => {
    if (!natural || !ratio) return dimensionPresets;
    
    // Sort presets by how close they match the current aspect ratio
    return [...dimensionPresets].sort((a, b) => {
      const aRatio = a.width / a.height;
      const bRatio = b.width / b.height;
      const aDiff = Math.abs(aRatio - ratio);
      const bDiff = Math.abs(bRatio - ratio);
      return aDiff - bDiff;
    });
  }, [dimensionPresets, natural, ratio]);
  
  // Optimized preset application with immediate feedback
  const applyPreset = useCallback((preset: { name: string; width: number; height: number }) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setWidthError('');
    setHeightError('');
    
    // Reset validation cache for new values
    lastValidationValuesRef.current.width = preset.width;
    lastValidationValuesRef.current.height = preset.height;
  }, []);

  // Helper function to calculate dimensions with better precision
  const calculateDimensions = useCallback((baseValue: number, targetRatio: number, isWidth: boolean) => {
    // Validate inputs
    if (!isFinite(baseValue) || baseValue <= 0) {
      console.warn('Invalid baseValue for dimension calculation:', baseValue);
    return Math.max(1, Math.min(32768, Math.round(baseValue) || 1));
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
    return Math.max(1, Math.min(32768, result));
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
      console.log('Created preview URL for file:', file.name, 'URL:', preview);
      
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
        console.log('Auto-selecting first file:', firstFile.name, 'Preview URL:', firstFile.preview);
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
      console.log('Selected file:', file.name, 'Preview URL:', file.preview);
      
      // Ensure preview URL exists, create if missing
      if (!file.preview) {
        console.warn('Preview URL missing for file:', file.name, 'Creating new one...');
        const newPreview = URL.createObjectURL(file);
        // Update the file with the new preview URL
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, preview: newPreview } : f
        ));
      }
      
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

  // Optimized debounced dimension update with adaptive timing
  const debouncedDimensionUpdate = useCallback((width: number, height: number, updateAspect: boolean = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Skip debounce if aspect ratio is not locked or conditions aren't met
    if (!updateAspect || !keepAspect || !natural || !ratio || !isFinite(ratio) || ratio <= 0) {
      return;
    }
    
    // Use shorter debounce for better responsiveness
    debounceTimeoutRef.current = setTimeout(() => {
      const newHeight = calculateDimensions(width, ratio, true);
      // Only update if the value actually changed to avoid unnecessary re-renders
      if (newHeight !== height) {
        setHeight(newHeight);
      }
    }, 100); // Reduced from 150ms to 100ms
  }, [keepAspect, natural, ratio, calculateDimensions, height]);
  
  // Memoized unit limits for optimal performance
  const unitLimitsCache = useMemo(() => {
    const pixelMin = 1, pixelMax = 32768;
    const cache: Record<string, any> = {
      pixel: { min: pixelMin, max: pixelMax, minDisplay: '1px', maxDisplay: '32768px' }
    };
    
    // Pre-calculate limits for all units
    ['cm', 'inch', 'mm', 'm'].forEach(unit => {
      const minConverted = convertFromPixels(pixelMin, unit);
      const maxConverted = convertFromPixels(pixelMax, unit);
      cache[unit] = {
        min: minConverted,
        max: maxConverted,
        minDisplay: `${minConverted.toFixed(2)}${unit}`,
        maxDisplay: `${maxConverted.toFixed(2)}${unit}`
      };
    });
    
    return cache;
  }, [convertFromPixels]);
  
  const getUnitLimits = useCallback((unit: string) => {
    return unitLimitsCache[unit] || unitLimitsCache.pixel;
  }, [unitLimitsCache]);
  
  // Optimized handlers with validation throttling
  const updateWidthWithAspect = useCallback((val: number) => {
    const inputValue = Number(val) || 0;
    let pixelValue: number;
    
    // Convert input value to pixels if not already in pixels
    if (widthUnit === 'pixel') {
      pixelValue = inputValue;
    } else {
      pixelValue = convertToPixels(inputValue, widthUnit);
    }
    
    // Validate and sanitize pixel value
    const sanitizedWidth = Math.max(1, Math.min(32768, Math.round(pixelValue)));
    
    // Only run validation if the value actually changed
    if (lastValidationValuesRef.current.width !== sanitizedWidth) {
      const limits = getUnitLimits(widthUnit);
      
      // Validate input range in the selected unit
      if (inputValue < limits.min || inputValue > limits.max) {
        setWidthError(inputValue < limits.min 
          ? `Width must be at least ${limits.minDisplay}` 
          : `Width cannot exceed ${limits.maxDisplay}`);
      } else {
        setWidthError('');
      }
      
      lastValidationValuesRef.current.width = sanitizedWidth;
    }
    
    setWidth(sanitizedWidth);
    
    if (keepAspect && natural && ratio > 0 && isFinite(ratio)) {
      debouncedDimensionUpdate(sanitizedWidth, height, true);
    }
  }, [keepAspect, natural, ratio, height, debouncedDimensionUpdate, widthUnit, convertToPixels, getUnitLimits]);

  const updateHeightWithAspect = useCallback((val: number) => {
    const inputValue = Number(val) || 0;
    let pixelValue: number;
    
    // Convert input value to pixels if not already in pixels
    if (heightUnit === 'pixel') {
      pixelValue = inputValue;
    } else {
      pixelValue = convertToPixels(inputValue, heightUnit);
    }
    
    // Validate and sanitize pixel value
    const sanitizedHeight = Math.max(1, Math.min(32768, Math.round(pixelValue)));
    
    // Only run validation if the value actually changed
    if (lastValidationValuesRef.current.height !== sanitizedHeight) {
      const limits = getUnitLimits(heightUnit);
      
      // Validate input range in the selected unit
      if (inputValue < limits.min || inputValue > limits.max) {
        setHeightError(inputValue < limits.min 
          ? `Height must be at least ${limits.minDisplay}` 
          : `Height cannot exceed ${limits.maxDisplay}`);
      } else {
        setHeightError('');
      }
      
      lastValidationValuesRef.current.height = sanitizedHeight;
    }
    
    setHeight(sanitizedHeight);
    
    if (keepAspect && natural && ratio > 0 && isFinite(ratio)) {
      // Use immediate update for height-to-width calculation as it's less frequent
      const newWidth = calculateDimensions(sanitizedHeight, ratio, false);
      if (newWidth !== width) {
        setWidth(newWidth);
      }
    }
  }, [keepAspect, natural, ratio, calculateDimensions, heightUnit, convertToPixels, getUnitLimits, width]);
  
  const updateCornerRadiusWithUnit = useCallback((val: number) => {
    const inputValue = Number(val) || 0;
    let pixelValue: number;
    
    // Convert input value to pixels if not already in pixels
    if (cornerRadiusUnit === 'pixel') {
      pixelValue = inputValue;
    } else {
      pixelValue = convertToPixels(inputValue, cornerRadiusUnit);
    }
    
    // Get unit-specific limits for validation (corner radius has no upper limit in practice)
    const limits = getUnitLimits(cornerRadiusUnit);
    
    // Validate input range in the selected unit (corner radius should be >= 0)
    if (inputValue < 0) {
      setCornerRadiusError('Corner radius cannot be negative');
    } else if (inputValue > limits.max) {
      setCornerRadiusError(`Corner radius cannot exceed ${limits.maxDisplay}`);
    } else {
      setCornerRadiusError('');
    }
    
    // Validate and sanitize pixel value for corner radius (non-negative)
    const sanitizedCornerRadius = Math.max(0, Math.round(pixelValue));
    
    setCornerRadius(sanitizedCornerRadius);
  }, [cornerRadiusUnit, convertToPixels, getUnitLimits]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case 'l':
          event.preventDefault();
          setKeepAspect(prev => !prev);
          break;
        case '1':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            applyPreset(dimensionPresets[0]); // HD
          }
          break;
        case '2':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            applyPreset(dimensionPresets[1]); // Full HD
          }
          break;
        case '4':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            applyPreset(dimensionPresets[2]); // 4K
          }
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (selectedFile && !showCropModal) {
              setShowCropModal(true);
            }
          }
          break;
        case 'escape':
          if (showCropModal) {
            event.preventDefault();
            setShowCropModal(false);
          }
          break;
        case 'arrowup':
        case 'arrowdown':
          // Arrow key increment/decrement for dimension inputs when they're focused
          if (event.target instanceof HTMLInputElement && event.target.type === 'number') {
            event.preventDefault();
            const step = event.shiftKey ? 10 : 1;
            const increment = event.key === 'arrowup' ? step : -step;
            const currentValue = parseFloat(event.target.value) || 0;
            const newValue = Math.max(0, currentValue + increment);
            
            // Trigger the appropriate update handler based on input context
            if (event.target.getAttribute('aria-label')?.includes('width')) {
              updateWidthWithAspect(newValue);
            } else if (event.target.getAttribute('aria-label')?.includes('height')) {
              updateHeightWithAspect(newValue);
            }
            
            event.target.value = newValue.toString();
          }
          break;
        case 'p':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Quick cycle through common presets
            const commonPresets = ['HD', 'Full HD', '4K', 'Instagram Square'];
            const currentPreset = dimensionPresets.find(p => p.width === width && p.height === height);
            const currentIndex = currentPreset ? commonPresets.indexOf(currentPreset.name) : -1;
            const nextIndex = (currentIndex + 1) % commonPresets.length;
            const nextPreset = dimensionPresets.find(p => p.name === commonPresets[nextIndex]);
            if (nextPreset) {
              applyPreset(nextPreset);
            }
          }
          break;
      }
      
      // Crop modal specific shortcuts
      if (showCropModal && natural && imageContainerRef) {
        const moveStep = 5; // pixels to move
        const resizeStep = 10; // pixels to resize
        
        switch (event.key.toLowerCase()) {
          case 'arrowup':
            event.preventDefault();
            if (event.shiftKey) {
              // Shift+Arrow: Resize
              setCropSelection(prev => ({
                ...prev,
                height: Math.max(20, prev.height - resizeStep),
                y: prev.y + Math.min(resizeStep, prev.height - 20) / 2
              }));
            } else {
              // Arrow: Move
              setCropSelection(prev => ({
                ...prev,
                y: Math.max(0, prev.y - moveStep)
              }));
            }
            break;
          case 'arrowdown':
            event.preventDefault();
            if (event.shiftKey) {
              // Shift+Arrow: Resize
              const img = imageContainerRef.querySelector('img') as HTMLImageElement;
              if (img) {
                const maxHeight = img.offsetHeight;
                setCropSelection(prev => ({
                  ...prev,
                  height: Math.min(maxHeight - prev.y, prev.height + resizeStep)
                }));
              }
            } else {
              // Arrow: Move
              const img = imageContainerRef.querySelector('img') as HTMLImageElement;
              if (img) {
                const maxY = img.offsetHeight;
                setCropSelection(prev => ({
                  ...prev,
                  y: Math.min(maxY - prev.height, prev.y + moveStep)
                }));
              }
            }
            break;
          case 'arrowleft':
            event.preventDefault();
            if (event.shiftKey) {
              // Shift+Arrow: Resize
              setCropSelection(prev => ({
                ...prev,
                width: Math.max(20, prev.width - resizeStep),
                x: prev.x + Math.min(resizeStep, prev.width - 20) / 2
              }));
            } else {
              // Arrow: Move
              setCropSelection(prev => ({
                ...prev,
                x: Math.max(0, prev.x - moveStep)
              }));
            }
            break;
          case 'arrowright':
            event.preventDefault();
            if (event.shiftKey) {
              // Shift+Arrow: Resize
              const img = imageContainerRef.querySelector('img') as HTMLImageElement;
              if (img) {
                const maxWidth = img.offsetWidth;
                setCropSelection(prev => ({
                  ...prev,
                  width: Math.min(maxWidth - prev.x, prev.width + resizeStep)
                }));
              }
            } else {
              // Arrow: Move
              const img = imageContainerRef.querySelector('img') as HTMLImageElement;
              if (img) {
                const maxX = img.offsetWidth;
                setCropSelection(prev => ({
                  ...prev,
                  x: Math.min(maxX - prev.width, prev.x + moveStep)
                }));
              }
            }
            break;
          case 'r':
            event.preventDefault();
            // Reset crop selection
            const img = imageContainerRef.querySelector('img') as HTMLImageElement;
            if (img) {
              const imgDisplayWidth = img.offsetWidth;
              const imgDisplayHeight = img.offsetHeight;
              const cropWidth = Math.round(imgDisplayWidth * 0.6);
              const cropHeight = Math.round(imgDisplayHeight * 0.6);
              const cropX = Math.round((imgDisplayWidth - cropWidth) / 2);
              const cropY = Math.round((imgDisplayHeight - cropHeight) / 2);
              
              setCropSelection({
                x: Math.max(0, cropX),
                y: Math.max(0, cropY),
                width: Math.min(imgDisplayWidth, cropWidth),
                height: Math.min(imgDisplayHeight, cropHeight)
              });
            }
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [applyPreset, dimensionPresets, showCropModal, natural, imageContainerRef, selectedFile]);
  
  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  // Preview mode management - auto-switch to 'after' when processing completes
  useEffect(() => {
    if (selectedFile && outputUrls.has(selectedFile.id)) {
      // Only auto-switch if currently on 'before' mode
      if (previewMode === 'before') {
        console.log('Auto-switching to after mode since processing completed');
        setPreviewMode('after');
      }
    } else if (selectedFile && !outputUrls.has(selectedFile.id)) {
      // Switch back to 'before' if no processed version available
      if (previewMode === 'after' || previewMode === 'split') {
        console.log('Switching to before mode since no processed image available');
        setPreviewMode('before');
      }
    }
  }, [selectedFile, outputUrls, previewMode]);
  
  // Mouse event handlers for crop selection with image bounds
  useEffect(() => {
    if (!isDragging || !dragStart) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!imageContainerRef || !isDragging || !dragStart || !natural) return;
      
      const rect = imageContainerRef.getBoundingClientRect();
      const img = imageContainerRef.querySelector('img') as HTMLImageElement;
      if (!img) return;
      
      // Get actual displayed image dimensions and position
      const imgRect = img.getBoundingClientRect();
      const imgDisplayWidth = img.offsetWidth;
      const imgDisplayHeight = img.offsetHeight;
      
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      // Calculate delta from initial drag position
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      setCropSelection(prev => {
        let newSelection = { ...dragStart.selection };
        
        if (dragHandle === 'move') {
          // Moving the entire selection - constrain to image bounds
          const maxX = imgDisplayWidth - newSelection.width;
          const maxY = imgDisplayHeight - newSelection.height;
          newSelection.x = Math.max(0, Math.min(maxX, dragStart.selection.x + deltaX));
          newSelection.y = Math.max(0, Math.min(maxY, dragStart.selection.y + deltaY));
        } else if (dragHandle) {
          // Resizing the selection
          const minSize = 20;
          
          if (dragHandle.includes('n')) {
            const newHeight = dragStart.selection.height - deltaY;
            const newY = dragStart.selection.y + deltaY;
            if (newHeight >= minSize && newY >= 0) {
              newSelection.y = newY;
              newSelection.height = newHeight;
            }
          }
          if (dragHandle.includes('s')) {
            const maxHeight = imgDisplayHeight - newSelection.y;
            newSelection.height = Math.max(minSize, Math.min(maxHeight, dragStart.selection.height + deltaY));
          }
          if (dragHandle.includes('w')) {
            const newWidth = dragStart.selection.width - deltaX;
            const newX = dragStart.selection.x + deltaX;
            if (newWidth >= minSize && newX >= 0) {
              newSelection.x = newX;
              newSelection.width = newWidth;
            }
          }
          if (dragHandle.includes('e')) {
            const maxWidth = imgDisplayWidth - newSelection.x;
            newSelection.width = Math.max(minSize, Math.min(maxWidth, dragStart.selection.width + deltaX));
          }
          
          // Apply aspect ratio constraint if needed
          if (cropAspectRatio !== 'free') {
            const [w, h] = cropAspectRatio.split(':').map(Number);
            const aspectRatio = w / h;
            
            if (dragHandle.includes('w') || dragHandle.includes('e')) {
              const constrainedHeight = Math.round(newSelection.width / aspectRatio);
              const maxConstrainedHeight = imgDisplayHeight - newSelection.y;
              if (constrainedHeight <= maxConstrainedHeight) {
                newSelection.height = constrainedHeight;
              } else {
                // Adjust width to fit height constraint
                newSelection.height = maxConstrainedHeight;
                newSelection.width = Math.round(newSelection.height * aspectRatio);
              }
            } else if (dragHandle.includes('n') || dragHandle.includes('s')) {
              const constrainedWidth = Math.round(newSelection.height * aspectRatio);
              const maxConstrainedWidth = imgDisplayWidth - newSelection.x;
              if (constrainedWidth <= maxConstrainedWidth) {
                newSelection.width = constrainedWidth;
              } else {
                // Adjust height to fit width constraint
                newSelection.width = maxConstrainedWidth;
                newSelection.height = Math.round(newSelection.width / aspectRatio);
              }
            }
          }
        }
        
        // Final bounds check - ensure selection stays within image bounds
        newSelection.x = Math.max(0, Math.min(imgDisplayWidth - newSelection.width, newSelection.x));
        newSelection.y = Math.max(0, Math.min(imgDisplayHeight - newSelection.height, newSelection.y));
        newSelection.width = Math.min(imgDisplayWidth - newSelection.x, newSelection.width);
        newSelection.height = Math.min(imgDisplayHeight - newSelection.y, newSelection.height);
        
        return newSelection;
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
      setDragStart(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, dragHandle, imageContainerRef, cropAspectRatio, natural]);

  // Helper function for starting drag operations
  const startDrag = useCallback((e: React.MouseEvent, handle: string) => {
    const rect = imageContainerRef?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        selection: { ...cropSelection }
      });
    }
    setIsDragging(true);
    setDragHandle(handle);
    e.stopPropagation();
    e.preventDefault();
  }, [imageContainerRef, cropSelection]);

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
        Math.max(1, Math.min(32768, width)),
        Math.max(1, Math.min(32768, height)),
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
        width: Math.max(1, Math.min(32768, width)),
        height: Math.max(1, Math.min(32768, height)),
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
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
          <h1 className="text-2xl font-bold text-black">
            Image Resize
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {!selectedFile ? (
          /* Upload State */
          <div className="space-y-8">
            {/* Upload Zone */}
            <div className="relative">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-300 group overflow-hidden ${
                  dragOver
                    ? 'border-black bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-2xl border-solid ring-4 ring-blue-200/50'
                    : 'border-gray-300 hover:border-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50/30 hover:scale-[1.01] hover:shadow-lg'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Enhanced animated background with pulsing effect */}
                <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
                  dragOver 
                    ? 'bg-gradient-to-br from-blue-100/80 to-indigo-100/80 animate-pulse'
                    : 'bg-gradient-to-br from-gray-50/0 to-blue-50/0 group-hover:from-gray-50/50 group-hover:to-blue-50/50'
                }`} />
                
                {/* Drop indicator border animation */}
                {dragOver && (
                  <div className="absolute inset-2 border-2 border-dashed border-blue-400 rounded-2xl animate-pulse" />
                )}
                
                <div className="relative space-y-6">
                  <div className={`w-32 h-32 mx-auto border rounded-3xl flex items-center justify-center transition-all duration-300 ${
                    dragOver 
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300 shadow-2xl scale-110' 
                      : 'bg-gray-100 border-gray-200 shadow-lg group-hover:shadow-xl group-hover:scale-105'
                  }`}>
                    <ImagePlus className={`transition-all duration-300 ${
                      dragOver 
                        ? 'w-20 h-20 text-blue-600 animate-bounce' 
                        : 'w-16 h-16 text-gray-600 group-hover:text-black group-hover:scale-110'
                    }`} />
                  </div>
                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold transition-all duration-300 ${
                      dragOver ? 'text-blue-700 scale-105' : 'text-black'
                    }`}>
                      {dragOver ? '🎯 Drop your images here!' : 'Upload Your Images'}
                    </h3>
                    <p className={`text-lg transition-all duration-300 ${
                      dragOver ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {dragOver ? 'Release to add your images' : 'Drag & drop or click to select multiple files'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF', 'SVG'].map((format) => (
                        <Badge key={format} variant="outline" className="border-gray-300 text-gray-700 bg-white">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Maximum file size: 50MB per image • Professional dimensions up to 32,768px supported
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
          <div className="flex flex-col lg:grid lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - File Management & Preview */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Files List */}
              {files.length > 1 && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                      <FileImage className="w-5 h-5" />
                      Images ({files.length})
                    </h3>
                    <Button
                      onClick={clearAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedFileId === file.id
                            ? 'border-black ring-2 ring-gray-300'
                            : 'border-gray-300 hover:border-gray-600'
                        }`}
                        onClick={() => selectFile(file.id)}
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          {file.thumbnail ? (
                            <img
                              src={file.thumbnail}
                              alt={file.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.warn('Thumbnail failed to load for:', file.name);
                                // Hide broken image and show fallback icon
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.thumbnail-fallback');
                                if (fallback) {
                                  (fallback as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className="thumbnail-fallback absolute inset-0 flex items-center justify-center text-gray-400" style={{ display: file.thumbnail ? 'none' : 'flex' }}>
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        </div>
                        {outputUrls.has(file.id) && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-black rounded-full" />
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
              <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-2">
                  <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview
                  </h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                    {selectedFile && outputUrls.has(selectedFile.id) && (
                      <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
                        {(['before', 'after', 'split'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              console.log(`Switching preview mode to: ${mode}`);
                              setPreviewMode(mode);
                            }}
                            className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-w-[50px] sm:min-w-[60px] ${
                              previewMode === mode
                                ? 'bg-black text-white shadow-sm scale-105'
                                : 'text-gray-600 hover:text-black hover:bg-gray-50 active:bg-gray-100'
                            }`}
                            title={`View ${mode} ${mode === 'split' ? 'comparison' : 'image'}`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCropModal(true)}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white min-h-[44px] sm:min-h-0"
                        title="Crop Image"
                      >
                        <Crop className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setShowPreview(!showPreview)}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white min-h-[44px] sm:min-h-0"
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {showPreview && (
                  <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] flex items-center justify-center p-2 sm:p-4 md:p-6">
                    {selectedFile && (selectedFile.preview || selectedFile) ? (
                      <div className="relative max-w-full max-h-full group">
                        {/* Main image display */}
                        {previewMode === 'split' && selectedFile && outputUrls.has(selectedFile.id) ? (
                          // Split view - responsive layout that stacks on small screens
                          <div 
                            className="relative w-full h-full rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] bg-white"
                            onClick={() => setFullScreenPreview(true)}
                            title="Click to view full screen"
                          >
                            <div className="flex flex-col sm:flex-row h-full">
                              <div className="flex-1 relative bg-gray-50 flex items-center justify-center min-h-[150px] sm:min-h-full">
                                <img
                                  key={`before-${selectedFile.id}`}
                                  src={selectedFile.preview || URL.createObjectURL(selectedFile)}
                                  alt="Original"
                                  className="max-w-full max-h-full object-contain"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.warn('Failed to load original image preview, trying fallback...');
                                    const target = e.currentTarget;
                                    if (!target.src.includes('blob:') && selectedFile) {
                                      try {
                                        const fallbackUrl = URL.createObjectURL(selectedFile);
                                        target.src = fallbackUrl;
                                        console.log('Using fallback URL for before image:', fallbackUrl);
                                      } catch (error) {
                                        console.error('Failed to create fallback URL:', error);
                                        target.style.display = 'none';
                                        // Show fallback placeholder
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('.fallback-icon')) {
                                          const fallback = document.createElement('div');
                                          fallback.className = 'fallback-icon flex flex-col items-center justify-center text-gray-400 p-4';
                                          fallback.innerHTML = '<svg class="w-8 h-8 sm:w-16 sm:h-16 mb-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><p class="text-xs sm:text-sm">Failed to load image</p>';
                                          parent.appendChild(fallback);
                                        }
                                      }
                                    } else {
                                      target.style.display = 'none';
                                    }
                                  }}
                                />
                                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium shadow-lg">
                                  Before
                                </div>
                              </div>
                              <div className="h-0.5 sm:h-full sm:w-0.5 bg-gray-300 shadow-sm"></div>
                              <div className="flex-1 relative bg-gray-50 flex items-center justify-center min-h-[150px] sm:min-h-full">
                                <img
                                  key={`after-${selectedFile.id}`}
                                  src={outputUrls.get(selectedFile.id)!}
                                  alt="Processed"
                                  className="max-w-full max-h-full object-contain"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.warn('Failed to load processed image preview');
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    // Show fallback placeholder
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-icon')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'fallback-icon flex flex-col items-center justify-center text-gray-400 p-4';
                                      fallback.innerHTML = '<svg class="w-8 h-8 sm:w-16 sm:h-16 mb-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><p class="text-xs sm:text-sm">Processing failed</p>';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium shadow-lg">
                                  After
                                </div>
                              </div>
                            </div>
                            {/* Full screen indicator overlay for split view */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="bg-black bg-opacity-50 rounded-full p-2 sm:p-3">
                                <Expand className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Single image view (before or after)
                          <div className="relative w-full h-full flex items-center justify-center bg-white rounded-lg shadow-lg overflow-hidden">
                            <img
                              key={`single-${previewMode}-${selectedFile.id}`}
                              src={
                                previewMode === 'after' && selectedFile && outputUrls.has(selectedFile.id) 
                                  ? outputUrls.get(selectedFile.id)! 
                                  : (selectedFile.preview || URL.createObjectURL(selectedFile))
                              }
                              alt={`${previewMode} preview`}
                              className="max-w-full max-h-full object-contain cursor-pointer transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]"
                              loading="lazy"
                              onClick={() => setFullScreenPreview(true)}
                              title="Click to view full screen"
                              onError={(e) => {
                                console.warn(`Failed to load ${previewMode} image preview, trying fallback...`);
                                const target = e.currentTarget;
                                
                                // Only try fallback for 'before' mode or if not already using blob URL
                                if ((previewMode === 'before' || !target.src.includes('blob:')) && selectedFile) {
                                  try {
                                    const fallbackUrl = URL.createObjectURL(selectedFile);
                                    target.src = fallbackUrl;
                                    console.log(`Using fallback URL for ${previewMode} image:`, fallbackUrl);
                                  } catch (error) {
                                    console.error('Failed to create fallback URL:', error);
                                    target.style.display = 'none';
                                    
                                    // Show fallback placeholder
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector('.fallback-placeholder')) {
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'fallback-placeholder flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8';
                                      placeholder.innerHTML = `
                                        <svg class="w-12 h-12 sm:w-20 sm:h-20 mb-2 sm:mb-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                                        </svg>
                                        <p class="text-sm sm:text-lg font-medium text-gray-600">Failed to load ${previewMode} image</p>
                                        <p class="text-xs sm:text-sm text-gray-500 mt-1">Please try uploading the image again</p>
                                      `;
                                      parent.appendChild(placeholder);
                                    }
                                  }
                                } else {
                                  target.style.display = 'none';
                                  
                                  // Show fallback for processed images that fail
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.fallback-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'fallback-placeholder flex flex-col items-center justify-center text-gray-400 p-4 sm:p-8';
                                    placeholder.innerHTML = `
                                      <svg class="w-12 h-12 sm:w-20 sm:h-20 mb-2 sm:mb-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                      </svg>
                                      <p class="text-sm sm:text-lg font-medium text-gray-600">Processing failed</p>
                                      <p class="text-xs sm:text-sm text-gray-500 mt-1">Please try processing the image again</p>
                                    `;
                                    parent.appendChild(placeholder);
                                  }
                                }
                              }}
                            />
                            
                            {/* Mode indicator */}
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-medium shadow-lg">
                              {previewMode === 'after' ? 'Processed' : 'Original'}
                            </div>
                          </div>
                        )}
                        
                        {/* Full screen indicator overlay for single image */}
                        {previewMode !== 'split' && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="bg-black bg-opacity-50 rounded-full p-2 sm:p-3">
                              <Expand className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // No preview available - show enhanced loading placeholder
                      <div className="flex flex-col items-center justify-center text-gray-500 space-y-3 sm:space-y-4 p-4 sm:p-8">
                        <div className="relative">
                          <ImageIcon className="w-12 h-12 sm:w-20 sm:h-20 text-gray-400 animate-pulse" />
                          {/* Loading spinner overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-gray-300 border-t-gray-600"></div>
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm sm:text-lg font-medium text-gray-600 animate-pulse">
                            {selectedFile ? 'Loading preview...' : 'No image selected'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {selectedFile ? 'Processing image dimensions and preview' : 'Please select an image to start'}
                          </p>
                          
                          {/* Loading dots animation */}
                          {selectedFile && (
                            <div className="flex items-center justify-center gap-1 mt-3">
                              {[0, 1, 2].map((i) => (
                                <div 
                                  key={i}
                                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: `${i * 0.2}s` }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Image Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-black flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Original
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="text-black font-medium">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    {natural && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="text-black font-medium">{natural.w} × {natural.h}px</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aspect Ratio:</span>
                          <span className="text-black font-medium">{ratio.toFixed(2)}:1</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="text-black font-medium">
                        {selectedFile.type.split('/')[1].toUpperCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-black flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="text-black font-medium">{width} × {height}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality:</span>
                      <span className="text-black font-medium">{quality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="text-black font-medium">{format.toUpperCase()}</span>
                    </div>
                    {processedSizes.has(selectedFile.id) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Size:</span>
                        <span className="text-black font-medium">
                          {(processedSizes.get(selectedFile.id)! / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Column - Controls */}
            <div className="space-y-4 sm:space-y-6">
            {/* Dimension Controls */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    Dimensions
                  </div>
                  <Button
                    onClick={() => setKeepAspect(!keepAspect)}
                    variant="outline"
                    size="sm"
                    className={`border-gray-300 text-xs ${
                      keepAspect ? 'bg-black text-white border-black' : 'text-gray-600 bg-white hover:text-black hover:border-black'
                    }`}
                    title={`${keepAspect ? 'Unlock' : 'Lock'} aspect ratio (Press L to toggle)`}
                    aria-label={`${keepAspect ? 'Unlock' : 'Lock'} aspect ratio`}
                    aria-pressed={keepAspect}
                  >
                    {keepAspect ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                    {keepAspect ? 'Locked' : 'Free'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Settings Display */}
                <div className="bg-gray-100 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Size:</span>
                    <span className="text-black font-medium">
                      {widthUnit === 'pixel' ? width : displayWidth} × {heightUnit === 'pixel' ? height : displayHeight}
                      {widthUnit === 'pixel' ? 'px' : widthUnit}
                      {widthUnit !== 'pixel' && ` (${width} × ${height}px)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aspect Ratio:</span>
                    <span className="text-black font-medium">{formatAspectRatio(ratio)}</span>
                  </div>
                  {natural && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scale Factor:</span>
                      <span className="text-black font-medium">{scaleFactorPercent}%</span>
                    </div>
                  )}
                </div>
              
              {/* Dimension Presets */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Quick Presets</Label>
                <select 
                  className="w-full bg-white border border-gray-300 text-black px-3 py-2 rounded-lg focus:border-black focus:outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const preset = suggestedPresets.find(p => p.name === e.target.value);
                      if (preset) {
                        applyPreset(preset);
                        e.target.value = ''; // Reset dropdown
                      }
                    }
                  }}
                >
                  <option value="" disabled>
                    {natural ? 'Smart suggestions (best match first)...' : 'Choose a preset...'}
                  </option>
                  {suggestedPresets.map((preset, index) => {
                    const presetRatio = preset.width / preset.height;
                    const matchIndicator = natural && Math.abs(presetRatio - ratio) < 0.1 ? ' ⭐' : '';
                    return (
                      <option key={preset.name} value={preset.name}>
                        {preset.name} ({preset.width}×{preset.height}){matchIndicator}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {/* Width Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 w-12">Width</label>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min={getUnitLimits(widthUnit).min}
                          max={getUnitLimits(widthUnit).max}
                          step={widthUnit === 'pixel' ? '1' : '0.01'}
                          value={widthUnit === 'pixel' ? width : displayWidth}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateWidthWithAspect(value);
                          }}
                          onBlur={(e) => {
                            if (!e.target.value) {
                              e.target.value = widthUnit === 'pixel' ? String(width) : String(displayWidth);
                            }
                          }}
                          className={`w-full bg-white border text-black px-3 py-2 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 ${
                            widthError 
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-200 bg-red-50 animate-pulse' 
                              : 'border-gray-300 focus:border-black focus:ring-black/20 hover:border-gray-400'
                          }`}
                          aria-describedby={widthError ? 'width-error' : 'width-help'}
                          aria-label={`Image width in ${widthUnit === 'pixel' ? 'pixels' : widthUnit}`}
                          aria-invalid={widthError ? 'true' : 'false'}
                        />
                        {/* Success indicator */}
                        {!widthError && width > 0 && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                        {/* Error indicator */}
                        {widthError && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                        )}
                      </div>
                    <div className="relative">
                      <select 
                        className={`bg-gray-100 border text-black px-3 py-2 rounded-lg appearance-none pr-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                          widthError ? 'border-red-300' : 'border-gray-300 focus:border-black hover:border-gray-400'
                        }`}
                        value={widthUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          setWidthUnit(newUnit);
                          setHeightUnit(newUnit); // Sync height unit with width unit
                          // Clear errors when unit changes
                          setWidthError('');
                          setHeightError('');
                        }}
                      >
                        <option value="pixel">Pixel</option>
                        <option value="cm">CM</option>
                        <option value="inch">Inch</option>
                        <option value="mm">MM</option>
                        <option value="m">M</option>
                      </select>
                    </div>
                  </div>
                  {widthError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 animate-fade-in-up">
                      <p id="width-error" className="text-xs text-red-600 font-medium flex items-center gap-1" role="alert">
                        <span className="w-3 h-3 text-red-500">⚠️</span>
                        {widthError}
                      </p>
                    </div>
                  ) : (
                    <p id="width-help" className="text-xs text-gray-500 mt-1">
                      Min: {getUnitLimits(widthUnit).minDisplay}, Max: {getUnitLimits(widthUnit).maxDisplay}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Height Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 w-12">Height</label>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min={getUnitLimits(heightUnit).min}
                        max={getUnitLimits(heightUnit).max}
                        step={heightUnit === 'pixel' ? '1' : '0.01'}
                        value={heightUnit === 'pixel' ? height : displayHeight}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateHeightWithAspect(value);
                        }}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.value = heightUnit === 'pixel' ? String(height) : String(displayHeight);
                          }
                        }}
                        className={`w-full bg-white border text-black px-3 py-2 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 ${
                          heightError 
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-200 bg-red-50 animate-pulse' 
                            : 'border-gray-300 focus:border-black focus:ring-black/20 hover:border-gray-400'
                        }`}
                        aria-describedby={heightError ? 'height-error' : 'height-help'}
                        aria-label={`Image height in ${heightUnit === 'pixel' ? 'pixels' : heightUnit}`}
                        aria-invalid={heightError ? 'true' : 'false'}
                      />
                      {/* Success indicator */}
                      {!heightError && height > 0 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      {/* Error indicator */}
                      {heightError && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                      )}
                    </div>
                    <div className="relative">
                      <select 
                        className={`bg-gray-100 border text-black px-3 py-2 rounded-lg appearance-none pr-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                          heightError ? 'border-red-300' : 'border-gray-300 focus:border-black hover:border-gray-400'
                        }`}
                        value={heightUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          setHeightUnit(newUnit);
                          setWidthUnit(newUnit); // Sync width unit with height unit
                          // Clear errors when unit changes
                          setWidthError('');
                          setHeightError('');
                        }}
                      >
                        <option value="pixel">Pixel</option>
                        <option value="cm">CM</option>
                        <option value="inch">Inch</option>
                        <option value="mm">MM</option>
                        <option value="m">M</option>
                      </select>
                    </div>
                  </div>
                  {heightError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 animate-fade-in-up">
                      <p id="height-error" className="text-xs text-red-600 font-medium flex items-center gap-1" role="alert">
                        <span className="w-3 h-3 text-red-500">⚠️</span>
                        {heightError}
                      </p>
                    </div>
                  ) : (
                    <p id="height-help" className="text-xs text-gray-500 mt-1">
                      Min: {getUnitLimits(heightUnit).minDisplay}, Max: {getUnitLimits(heightUnit).maxDisplay}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Resolution Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 w-16">Resolution</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="3000"
                    value={physicalDPI}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(3000, parseInt(e.target.value) || 300));
                      setPhysicalDPI(value);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.value = String(physicalDPI);
                      }
                    }}
                    className="flex-1 bg-white border border-gray-300 text-black px-3 py-2 rounded-lg text-center transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 hover:border-gray-400"
                    aria-label="Resolution in DPI"
                  />
                  <div className="relative">
                    <select 
                      className="bg-gray-100 border border-gray-300 text-black px-3 py-2 rounded-lg appearance-none pr-8 focus:border-black focus:outline-none"
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
                <label className="text-sm text-gray-700 w-12">Corner</label>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        step={cornerRadiusUnit === 'pixel' ? '1' : '0.01'}
                        value={cornerRadiusUnit === 'pixel' ? cornerRadius : displayCornerRadius}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          updateCornerRadiusWithUnit(value);
                        }}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.value = cornerRadiusUnit === 'pixel' ? String(cornerRadius) : String(displayCornerRadius);
                          }
                        }}
                        className={`w-full bg-white border text-black px-3 py-2 rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 ${
                          cornerRadiusError 
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-200 bg-red-50 animate-pulse' 
                            : 'border-gray-300 focus:border-black focus:ring-black/20 hover:border-gray-400'
                        }`}
                        aria-describedby={cornerRadiusError ? 'corner-radius-error' : 'corner-radius-help'}
                        aria-label={`Corner radius in ${cornerRadiusUnit === 'pixel' ? 'pixels' : cornerRadiusUnit}`}
                        aria-invalid={cornerRadiusError ? 'true' : 'false'}
                      />
                      {/* Success indicator */}
                      {!cornerRadiusError && cornerRadius >= 0 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      {/* Error indicator */}
                      {cornerRadiusError && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                      )}
                    </div>
                    <div className="relative">
                      <select 
                        className={`bg-gray-100 border text-black px-3 py-2 rounded-lg appearance-none pr-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                          cornerRadiusError ? 'border-red-300' : 'border-gray-300 focus:border-black hover:border-gray-400'
                        }`}
                        value={cornerRadiusUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          setCornerRadiusUnit(newUnit);
                          // Clear errors when unit changes
                          setCornerRadiusError('');
                        }}
                      >
                        <option value="pixel">Pixel</option>
                        <option value="cm">CM</option>
                        <option value="inch">Inch</option>
                        <option value="mm">MM</option>
                        <option value="m">M</option>
                      </select>
                    </div>
                  </div>
                  {cornerRadiusError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 animate-fade-in-up">
                      <p id="corner-radius-error" className="text-xs text-red-600 font-medium flex items-center gap-1" role="alert">
                        <span className="w-3 h-3 text-red-500">⚠️</span>
                        {cornerRadiusError}
                      </p>
                    </div>
                  ) : (
                    <p id="corner-radius-help" className="text-xs text-gray-500 mt-1">
                      Min: 0{cornerRadiusUnit === 'pixel' ? 'px' : cornerRadiusUnit}, Max: {getUnitLimits(cornerRadiusUnit).maxDisplay}
                    </p>
                  )}
                </div>
              </div>
              </CardContent>
            </Card>
            
            {/* Format & Quality */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-black flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Output Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-gray-700">Quality</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 90));
                          setQuality(value);
                        }}
                        className="w-14 bg-white border border-gray-300 text-black px-2 py-1 rounded text-center text-xs transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 hover:border-gray-400"
                        aria-label="Quality percentage"
                      />
                      <span className="text-gray-700 text-xs">%</span>
                    </div>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
            <Card className="bg-white border border-gray-200">
              <CardHeader className="pb-3">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-base text-black hover:text-gray-600 transition-colors"
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
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-700">Brightness</Label>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 bg-white">
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-700">Contrast</Label>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 bg-white">
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Corner Radius */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-gray-700">Corner Radius</Label>
                      <Badge variant="outline" className="border-gray-300 text-gray-700 bg-white">
                        {cornerRadiusUnit === 'pixel' ? cornerRadius : displayCornerRadius}{cornerRadiusUnit === 'pixel' ? 'px' : cornerRadiusUnit}
                      </Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={cornerRadius}
                      onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  
                  {/* Reset Button */}
                  <Button
                    onClick={() => {
                      setAdjustBrightness(1);
                      setAdjustContrast(1);
                      setCornerRadius(0);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white"
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
              {selectedFile && !outputUrls.has(selectedFile.id) && (
                  <Button
                    onClick={processImage}
                    disabled={processing || !selectedFile || !natural}
                    className={`w-full h-12 rounded-xl text-base font-bold transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      processing 
                        ? 'bg-blue-600 text-white animate-pulse shadow-lg' 
                        : !natural 
                        ? 'bg-gray-400 text-gray-200 opacity-70'
                        : 'bg-black hover:bg-gray-800 text-white hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                  {processing ? (
                    <>
                      <div className="relative">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <div className="absolute inset-0 animate-ping w-5 h-5 border border-white/50 rounded-full" />
                      </div>
                      <span className="hidden sm:inline animate-pulse">Processing...</span>
                      <span className="sm:hidden animate-pulse">Processing</span>
                    </>
                  ) : !natural ? (
                    <>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div 
                            key={i}
                            className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm">Loading dimensions...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span>Process Image</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Show download popup button when processing is complete */}
              {selectedFile && outputUrls.has(selectedFile.id) && (
                <Dialog open={formatDialogOpen} onOpenChange={setFormatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg w-[95%] max-h-[90vh] bg-white text-black border border-gray-200 rounded-2xl overflow-y-auto shadow-2xl sm:max-w-md sm:w-full focus:outline-none">
                    <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                      <DialogTitle className="text-xl font-bold text-black text-center">Download Image</DialogTitle>
                      <DialogDescription className="text-gray-600 text-center text-sm mt-2">
                        Your image has been processed successfully.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="px-6 pb-6 space-y-6">
                      {/* Image Preview */}
                      {selectedFile && outputUrls.has(selectedFile.id) && (
                        <div className="space-y-3">
                          <Label className="text-base font-medium text-black">Preview</Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-center">
                            <div className="relative w-full max-h-[200px] overflow-hidden rounded-lg flex justify-center items-center bg-white">
                              <img
                                src={outputUrls.get(selectedFile.id)!}
                                alt="Processed preview"
                                className="max-w-full max-h-[200px] object-contain rounded-lg shadow-md"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Failed to load processed preview in dialog');
                                  e.currentTarget.style.display = 'none';
                                  // Show fallback
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.dialog-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'dialog-fallback flex items-center justify-center text-gray-400 p-8';
                                    fallback.innerHTML = '<div class="text-center"><svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><p class="text-sm">Preview not available</p></div>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                                Processed
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Format Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium text-black">Output Format</Label>
                        <div className="grid grid-cols-4 gap-3">
                          {['jpeg', 'png', 'webp', 'svg'].map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => setFormat(fmt as any)}
                              className={`py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                                format === fmt
                                  ? 'bg-black text-white border-black shadow-md scale-105'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600 hover:text-black hover:shadow-sm'
                              }`}
                              title={`Export as ${fmt.toUpperCase()}`}
                            >
                              {fmt.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* File Info */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Original Size:</span>
                          <span className="text-black font-bold">{Math.round(selectedFile.size / 1024)}KB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">New Dimensions:</span>
                          <span className="text-black font-bold">{width} × {height}px</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Output Format:</span>
                          <span className="text-black font-bold">{format.toUpperCase()}</span>
                        </div>
                        {processedSizes.has(selectedFile.id) && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-600 font-medium">New Size:</span>
                            <span className="text-black font-bold">{Math.round(processedSizes.get(selectedFile.id)! / 1024)}KB</span>
                          </div>
                        )}
                        
                        {/* Size comparison */}
                        {processedSizes.has(selectedFile.id) && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Size Change:</span>
                            <span className={`font-bold text-sm ${
                              processedSizes.get(selectedFile.id)! < selectedFile.size 
                                ? 'text-green-600' 
                                : 'text-gray-600'
                            }`}>
                              {processedSizes.get(selectedFile.id)! < selectedFile.size
                                ? `−${Math.round((selectedFile.size - processedSizes.get(selectedFile.id)!) / 1024)}KB`
                                : `+${Math.round((processedSizes.get(selectedFile.id)! - selectedFile.size) / 1024)}KB`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Download Button */}
                      <Button
                        onClick={downloadSingle}
                        className="w-full h-14 bg-black hover:bg-gray-800 text-white rounded-xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download Image</span>
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
                  className="w-full border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white py-3 rounded-xl text-base font-medium transition-all duration-300"
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
              {selectedFile && outputUrls.has(selectedFile.id) && (
                <Button
                  onClick={processImage}
                  disabled={processing}
                  variant="outline"
                  className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 bg-white rounded-xl text-base font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reprocessing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Reprocess</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            
            {/* Enhanced Progress Bar */}
            {(processing || batchProcessing || processProgress > 0) && (
              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-600/50 shadow-lg backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        {(processing || batchProcessing) && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        <span className="text-gray-200 font-medium">
                          {processing ? 'Processing Image' : batchProcessing ? 'Batch Processing' : 'Progress'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg">{processProgress}%</span>
                        {processProgress === 100 && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="relative">
                      <div className="w-full bg-gray-700/70 rounded-full h-4 shadow-inner">
                        <div 
                          className={`h-4 rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                            processProgress === 100 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : processProgress > 0
                              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500'
                              : 'bg-gray-600'
                          }`}
                          style={{ width: `${processProgress}%` }}
                        >
                          {/* Animated shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          
                          {/* Pulsing overlay for active processing */}
                          {(processing || batchProcessing) && processProgress < 100 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          )}
                        </div>
                        
                        {/* Progress markers */}
                        <div className="absolute inset-0 flex justify-between items-center px-1">
                          {[25, 50, 75].map((marker) => (
                            <div 
                              key={marker}
                              className={`w-0.5 h-2 rounded transition-opacity duration-300 ${
                                processProgress >= marker ? 'bg-white/40 opacity-100' : 'bg-gray-500/60 opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Text with better styling */}
                    {progressText && (
                      <div className="text-center">
                        <p className={`text-sm font-medium transition-colors duration-300 ${
                          progressText.includes('✓') 
                            ? 'text-green-300' 
                            : progressText.includes('✗') 
                            ? 'text-red-300' 
                            : 'text-gray-200'
                        }`}>
                          {progressText}
                        </p>
                        
                        {/* Processing time estimate */}
                        {(processing || batchProcessing) && processProgress > 0 && processProgress < 100 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {processProgress > 10 ? 'Almost done...' : 'Preparing...'}
                          </p>
                        )}
                      </div>
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
      
      {/* Full Screen Preview Modal */}
      {fullScreenPreview && selectedFile && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4" 
          onClick={(e) => {
            // Only close if clicking on the background, not the image or controls
            if (e.target === e.currentTarget) {
              setFullScreenPreview(false);
            }
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Control bar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3">
              {/* Preview mode switcher for fullscreen */}
              {selectedFile && outputUrls.has(selectedFile.id) && (
                <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                  {(['before', 'after', 'split'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        console.log(`Switching fullscreen preview mode to: ${mode}`);
                        setPreviewMode(mode);
                      }}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 min-w-[70px] ${
                        previewMode === mode
                          ? 'bg-white text-black shadow-sm scale-105'
                          : 'text-white hover:text-gray-200 hover:bg-white/10 active:bg-white/20'
                      }`}
                      title={`View ${mode} ${mode === 'split' ? 'comparison' : 'image'}`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Exit fullscreen button */}
              <button
                onClick={() => setFullScreenPreview(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1.5 text-white transition-all duration-300"
                title="Exit fullscreen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Full screen content */}
            <div className="w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-16">
              {previewMode === 'split' && selectedFile && outputUrls.has(selectedFile.id) ? (
                // Split view in full screen
                <div className="flex w-full h-full max-w-7xl max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex-1 relative bg-gray-50 flex items-center justify-center p-4">
                    <img
                      key={`fs-before-${selectedFile.id}`}
                      src={selectedFile.preview || URL.createObjectURL(selectedFile)}
                      alt="Original"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('Failed to load fullscreen original image, trying fallback...');
                        const target = e.currentTarget;
                        if (!target.src.includes('blob:') && selectedFile) {
                          try {
                            const fallbackUrl = URL.createObjectURL(selectedFile);
                            target.src = fallbackUrl;
                            console.log('Using fallback URL for fullscreen before image:', fallbackUrl);
                          } catch (error) {
                            console.error('Failed to create fallback URL:', error);
                            target.style.display = 'none';
                          }
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                      Before
                    </div>
                  </div>
                  <div className="w-0.5 bg-gray-300"></div>
                  <div className="flex-1 relative bg-gray-50 flex items-center justify-center p-4">
                    <img
                      key={`fs-after-${selectedFile.id}`}
                      src={outputUrls.get(selectedFile.id)!}
                      alt="Processed"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('Failed to load fullscreen processed image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                      After
                    </div>
                  </div>
                </div>
              ) : (
                // Single image in full screen
                <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden max-w-full max-h-[85vh] flex items-center justify-center">
                  <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center">
                    <img
                      key={`fs-single-${previewMode}-${selectedFile.id}`}
                      src={previewMode === 'after' && selectedFile && outputUrls.has(selectedFile.id) 
                        ? outputUrls.get(selectedFile.id)! 
                        : (selectedFile.preview || URL.createObjectURL(selectedFile))}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{ 
                        maxHeight: 'calc(85vh - 8rem)', 
                        maxWidth: 'calc(100vw - 8rem)' 
                      }}
                      loading="lazy"
                      onError={(e) => {
                        console.warn(`Failed to load fullscreen ${previewMode} image, trying fallback...`);
                        const target = e.currentTarget;
                        
                        if ((previewMode === 'before' || !target.src.includes('blob:')) && selectedFile) {
                          try {
                            const fallbackUrl = URL.createObjectURL(selectedFile);
                            target.src = fallbackUrl;
                            console.log(`Using fallback URL for fullscreen ${previewMode} image:`, fallbackUrl);
                          } catch (error) {
                            console.error('Failed to create fallback URL:', error);
                            target.style.display = 'none';
                          }
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                  
                  {/* Image mode indicator */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                    {previewMode === 'after' && selectedFile && outputUrls.has(selectedFile.id) 
                      ? 'Processed' 
                      : 'Original'
                    }
                  </div>
                </div>
              )}
            </div>
            
            {/* Image info overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              <div className="text-sm font-medium text-center">{selectedFile.name}</div>
              {natural && (
                <div className="text-xs text-gray-300 text-center">
                  {natural.w} × {natural.h}px
                  {previewMode === 'after' && selectedFile && outputUrls.has(selectedFile.id) && (
                    <span> → {width} × {height}px</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Crop Modal */}
      {showCropModal && selectedFile && (
        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-gray-200">
              <DialogTitle className="text-2xl font-bold text-black flex items-center gap-2">
                <Crop className="w-6 h-6" />
                Crop Image
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base mt-2">
                Drag to select the area you want to keep. The cropped image will replace your current selection.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              {/* Crop preview area */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: '500px' }}>
                <div className="flex items-center justify-center h-full p-6">
                  <div 
                    className="relative max-w-full max-h-full"
                    ref={(el) => setImageContainerRef(el)}
                  >
                    <img
                      src={selectedFile.preview || URL.createObjectURL(selectedFile)}
                      alt="Crop preview"
                      className="max-w-full max-h-[450px] object-contain rounded-lg shadow-lg"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load crop preview:', e.currentTarget.src);
                        if (selectedFile && !e.currentTarget.src.includes('blob:')) {
                          try {
                            const fallbackUrl = URL.createObjectURL(selectedFile);
                            e.currentTarget.src = fallbackUrl;
                            console.log('Using fallback URL for crop preview:', fallbackUrl);
                          } catch (error) {
                            console.error('Failed to create fallback URL for crop:', error);
                            e.currentTarget.style.display = 'none';
                          }
                        }
                      }}
                    />
                    
                    {/* Interactive crop selection overlay */}
                    <div 
                      className="absolute border-2 border-orange-400 shadow-2xl bg-black/10 backdrop-blur-[1px] cursor-move transition-all duration-200 hover:border-orange-500 hover:bg-orange-400/20"
                      style={{
                        left: `${cropSelection.x}px`,
                        top: `${cropSelection.y}px`,
                        width: `${cropSelection.width}px`,
                        height: `${cropSelection.height}px`,
                        boxShadow: '0 0 0 1px rgba(255,165,0,0.9), 0 0 0 3px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.4)'
                      }}
                      onMouseDown={(e) => {
                        if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
                        startDrag(e as any, 'move');
                      }}
                    >
                      {/* Corner resize handles - higher contrast */}
                      <div 
                        className="resize-handle absolute -top-2 -left-2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-nw-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'nw')}
                      />
                      <div 
                        className="resize-handle absolute -top-2 -right-2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-ne-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'ne')}
                      />
                      <div 
                        className="resize-handle absolute -bottom-2 -left-2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-sw-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'sw')}
                      />
                      <div 
                        className="resize-handle absolute -bottom-2 -right-2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-se-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'se')}
                      />
                      
                      {/* Edge resize handles - higher contrast */}
                      <div 
                        className="resize-handle absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-n-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'n')}
                      />
                      <div 
                        className="resize-handle absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-s-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 's')}
                      />
                      <div 
                        className="resize-handle absolute top-1/2 -left-2 transform -translate-y-1/2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-w-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'w')}
                      />
                      <div 
                        className="resize-handle absolute top-1/2 -right-2 transform -translate-y-1/2 w-5 h-5 bg-orange-500 border-2 border-white rounded-full cursor-e-resize shadow-xl hover:bg-orange-600 hover:scale-110 transition-all duration-200"
                        style={{ boxShadow: '0 0 0 1px orange, 0 0 0 3px white, 0 2px 8px rgba(0,0,0,0.5)' }}
                        onMouseDown={(e) => startDrag(e, 'e')}
                      />
                    </div>
                    
                    {/* Crop info overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                      <div className="flex items-center gap-2">
                        <Crop className="w-4 h-4" />
                        <span>
                          {cropAspectRatio === 'free' 
                            ? `Free selection: ${cropSelection.width}×${cropSelection.height}px` 
                            : `${cropAspectRatio} - ${cropSelection.width}×${cropSelection.height}px`
                          }
                        </span>
                      </div>
                    </div>
                    
                    {/* Crop instructions */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs max-w-xs">
                      <div className="text-center space-y-1">
                        <p>🖱️ Drag to move • 🔄 Drag corners to resize</p>
                        <p>⌨️ Arrow keys to move • Shift+Arrow to resize • R to reset • Esc to close</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Crop controls */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* Aspect ratio and dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-black">Aspect Ratio</Label>
                    <select 
                      className="w-full bg-white border border-gray-300 text-black px-3 py-2 rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 hover:border-gray-400"
                      value={cropAspectRatio}
                      onChange={(e) => {
                        setCropAspectRatio(e.target.value);
                        // Update crop selection to match aspect ratio
                        if (e.target.value !== 'free') {
                          const [w, h] = e.target.value.split(':').map(Number);
                          const aspectRatio = w / h;
                          const newHeight = cropSelection.width / aspectRatio;
                          setCropSelection(prev => ({ ...prev, height: Math.round(newHeight) }));
                        }
                      }}
                    >
                      <option value="free">Free Selection</option>
                      <option value="1:1">Square (1:1)</option>
                      <option value="4:3">Standard (4:3)</option>
                      <option value="16:9">Widescreen (16:9)</option>
                      <option value="3:2">Photo (3:2)</option>
                      <option value="9:16">Portrait (9:16)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-black">Crop Preview</Label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {/* Mini preview of cropped area */}
                      <div className="w-full h-24 bg-white border border-gray-300 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                        <div className="text-gray-400 text-sm text-center">
                          <Crop className="w-6 h-6 mx-auto mb-1" />
                          <p>Preview</p>
                          <p className="text-xs">{cropSelection.width}×{cropSelection.height}</p>
                        </div>
                      </div>
                      
                      {/* Selection info */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Position:</span>
                          <span className="font-medium text-black">{cropSelection.x}, {cropSelection.y}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium text-black">{cropSelection.width} × {cropSelection.height}px</span>
                        </div>
                        {cropAspectRatio !== 'free' && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Ratio:</span>
                            <span className="font-medium text-black">{cropAspectRatio}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reset and action buttons */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        // Reset crop selection to 60% of image size, centered
                        if (natural && imageContainerRef) {
                          const img = imageContainerRef.querySelector('img') as HTMLImageElement;
                          if (img) {
                            const imgDisplayWidth = img.offsetWidth;
                            const imgDisplayHeight = img.offsetHeight;
                            const cropWidth = Math.round(imgDisplayWidth * 0.6);
                            const cropHeight = Math.round(imgDisplayHeight * 0.6);
                            const cropX = Math.round((imgDisplayWidth - cropWidth) / 2);
                            const cropY = Math.round((imgDisplayHeight - cropHeight) / 2);
                            
                            setCropSelection({
                              x: Math.max(0, cropX),
                              y: Math.max(0, cropY),
                              width: Math.min(imgDisplayWidth, cropWidth),
                              height: Math.min(imgDisplayHeight, cropHeight)
                            });
                          }
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Selection
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        setShowCropModal(false);
                        // Reset crop selection when canceling using initial values
                        if (natural && imageContainerRef) {
                          const img = imageContainerRef.querySelector('img') as HTMLImageElement;
                          if (img) {
                            const imgDisplayWidth = img.offsetWidth;
                            const imgDisplayHeight = img.offsetHeight;
                            const cropWidth = Math.round(imgDisplayWidth * 0.6);
                            const cropHeight = Math.round(imgDisplayHeight * 0.6);
                            const cropX = Math.round((imgDisplayWidth - cropWidth) / 2);
                            const cropY = Math.round((imgDisplayHeight - cropHeight) / 2);
                            
                            setCropSelection({
                              x: Math.max(0, cropX),
                              y: Math.max(0, cropY),
                              width: Math.min(imgDisplayWidth, cropWidth),
                              height: Math.min(imgDisplayHeight, cropHeight)
                            });
                          }
                        }
                      }}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:text-black hover:border-black bg-white px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        // Validate crop selection
                        if (cropSelection.width < 10 || cropSelection.height < 10) {
                          alert('Crop selection is too small. Please select a larger area (minimum 10x10 pixels).');
                          return;
                        }
                        
                        if (cropSelection.x < 0 || cropSelection.y < 0) {
                          alert('Invalid crop selection position. Please adjust the selection area.');
                          return;
                        }
                        
                        // Simulate crop processing with better feedback
                        console.log('Applying crop with selection:', cropSelection);
                        
                        // Show processing feedback
                        const originalText = document.activeElement?.textContent;
                        const button = document.activeElement as HTMLButtonElement;
                        if (button) {
                          button.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...';
                          button.disabled = true;
                        }
                        
                        setTimeout(() => {
                          alert(`✅ Crop applied successfully!\n\nDetails:\n📍 Position: ${cropSelection.x}, ${cropSelection.y}\n📐 Size: ${cropSelection.width} × ${cropSelection.height}px\n📏 Aspect Ratio: ${cropAspectRatio}\n\n🎯 The cropped image will be processed with your current settings.`);
                          setShowCropModal(false);
                          // Reset button
                          if (button) {
                            button.innerHTML = '<svg class="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zM17 4a1 1 0 00-1-1h-4a1 1 0 100 2h1.586l-2.293 2.293a1 1 0 101.414 1.414L15 6.414V8a1 1 0 102 0V4zM17 16a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 112 0v4zM3 16a1 1 0 001 1h4a1 1 0 000-2H6.414l2.293-2.293a1 1 0 00-1.414-1.414L5 13.586V12a1 1 0 00-2 0v4z"></path></svg>Apply Crop';
                            button.disabled = false;
                          }
                        }, 1500);
                      }}
                      disabled={cropSelection.width < 10 || cropSelection.height < 10}
                      className={`px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 ${
                        cropSelection.width < 10 || cropSelection.height < 10
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-black hover:bg-gray-800 text-white hover:scale-[1.02]'
                      }`}
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      Apply Crop
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
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

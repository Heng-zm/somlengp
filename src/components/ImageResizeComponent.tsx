"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Image as ImageIcon, 
  RefreshCw, 
  Upload,
  FileImage,
  Trash2,
  X,
  Lock,
  Unlock,
  Eye,
  Settings,
  Zap,
  Palette,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { getImageWorkerManager } from "@/lib/image-worker-manager";
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


interface FileWithPreview extends File {
  id: string;
  preview?: string;
  thumbnail?: string;
  processedUrl?: string;
  originalDimensions?: { width: number; height: number };
  processing?: boolean;
  error?: string;
}

export default function ImageResizeComponent() {
  // File management
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  
  // Current file state
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(90);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("webp");
  const [unit, setUnit] = useState<'px' | 'cm' | 'mm' | 'in'>('px');
  
  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>("");
  
  // Preview and results
  const [outputUrls, setOutputUrls] = useState<Map<string, Map<string, string>>>(new Map());
  
  // Enhanced UI state
  const [previewMode, setPreviewMode] = useState<'original' | 'resized' | 'split'>('original');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerManager = getImageWorkerManager();

  // Preset dimensions for common use cases
  const presetDimensions = useMemo(() => ({
    'custom': { name: 'Custom', width: 0, height: 0, icon: Settings },
    'hd': { name: 'HD (1280×720)', width: 1280, height: 720, icon: Monitor },
    'fhd': { name: 'Full HD (1920×1080)', width: 1920, height: 1080, icon: Monitor },
    '4k': { name: '4K UHD (3840×2160)', width: 3840, height: 2160, icon: Monitor },
    'instagram-square': { name: 'Instagram Square (1080×1080)', width: 1080, height: 1080, icon: Smartphone },
    'instagram-portrait': { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920, icon: Smartphone },
    'facebook-cover': { name: 'Facebook Cover (1200×630)', width: 1200, height: 630, icon: Tablet },
    'youtube-thumbnail': { name: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720, icon: Tablet },
    'web-banner': { name: 'Web Banner (1920×500)', width: 1920, height: 500, icon: Monitor },
    'mobile-wallpaper': { name: 'Mobile Wallpaper (1440×2560)', width: 1440, height: 2560, icon: Smartphone }
  }), []);

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId);
  }, [files, selectedFileId]);

  const ratio = useMemo(() => {
    if (!natural || !natural.w || !natural.h) return 1;
    return natural.w / natural.h;
  }, [natural]);

  // Unit conversion utilities (assuming 96 DPI for screen display)
  const convertPixelsToUnit = useCallback((pixels: number, toUnit: 'px' | 'cm' | 'mm' | 'in'): number => {
    const dpi = 96; // Default screen DPI
    switch (toUnit) {
      case 'px': return pixels;
      case 'in': return pixels / dpi;
      case 'cm': return (pixels / dpi) * 2.54;
      case 'mm': return (pixels / dpi) * 25.4;
      default: return pixels;
    }
  }, []);

  const convertUnitToPixels = useCallback((value: number, fromUnit: 'px' | 'cm' | 'mm' | 'in'): number => {
    const dpi = 96; // Default screen DPI
    switch (fromUnit) {
      case 'px': return value;
      case 'in': return value * dpi;
      case 'cm': return (value / 2.54) * dpi;
      case 'mm': return (value / 25.4) * dpi;
      default: return value;
    }
  }, []);

  // Get display values in current unit
  const displayWidth = useMemo(() => {
    return convertPixelsToUnit(width, unit);
  }, [width, unit, convertPixelsToUnit]);

  const displayHeight = useMemo(() => {
    return convertPixelsToUnit(height, unit);
  }, [height, unit, convertPixelsToUnit]);

  // Generate unique file ID
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Load image dimensions
  const loadImageDimensions = useCallback(async (file: FileWithPreview) => {
    if (!file) return;
    
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const dimensions = { w: img.naturalWidth, h: img.naturalHeight };
        setNatural(dimensions);
        setWidth(dimensions.w);
        setHeight(dimensions.h);
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setNatural({ w: 800, h: 600 });
        setWidth(800);
        setHeight(600);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Failed to load image dimensions:', error);
      setNatural({ w: 800, h: 600 });
      setWidth(800);
      setHeight(600);
    }
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      
      const fileId = generateFileId();
      const preview = URL.createObjectURL(file);
      
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: fileId,
        preview,
        thumbnail: preview
      });
      
      newFiles.push(fileWithPreview);
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      
      if (!selectedFileId && newFiles.length > 0) {
        const firstFile = newFiles[0];
        setSelectedFileId(firstFile.id);
        await loadImageDimensions(firstFile);
      }
    }
  }, [generateFileId, selectedFileId, loadImageDimensions]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files?.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

  // Dimension update handlers with aspect ratio and unit conversion
  const updateWidthWithAspect = useCallback((val: number) => {
    const pixelValue = convertUnitToPixels(val, unit);
    const newWidth = Math.max(1, Math.min(32768, Math.round(pixelValue)));
    setWidth(newWidth);
    
    if (keepAspect && natural && ratio > 0) {
      const newHeight = Math.round(newWidth / ratio);
      setHeight(Math.max(1, Math.min(32768, newHeight)));
    }
  }, [keepAspect, natural, ratio, unit, convertUnitToPixels]);

  const updateHeightWithAspect = useCallback((val: number) => {
    const pixelValue = convertUnitToPixels(val, unit);
    const newHeight = Math.max(1, Math.min(32768, Math.round(pixelValue)));
    setHeight(newHeight);
    
    if (keepAspect && natural && ratio > 0) {
      const newWidth = Math.round(newHeight * ratio);
      setWidth(Math.max(1, Math.min(32768, newWidth)));
    }
  }, [keepAspect, natural, ratio, unit, convertUnitToPixels]);

  // Apply preset dimensions
  const applyPreset = useCallback((presetKey: string) => {
    const preset = presetDimensions[presetKey as keyof typeof presetDimensions];
    if (preset && preset.width > 0 && preset.height > 0) {
      setSelectedPreset(presetKey);
      setWidth(preset.width);
      setHeight(preset.height);
      // Temporarily disable aspect ratio for preset application
      setKeepAspect(false);
    } else {
      setSelectedPreset('custom');
    }
  }, [presetDimensions]);


  // Process image
  const processImage = useCallback(async () => {
    if (!selectedFile || !natural || processing) return;
    
    setProcessing(true);
    setProgressText("Processing image...");
    setProcessProgress(10);
    
    try {
      const formats: ('jpeg' | 'png' | 'webp')[] = ['jpeg', 'png', 'webp'];
      const formatResults = new Map<string, string>();
      
      for (let i = 0; i < formats.length; i++) {
        const currentFormat = formats[i];
        setProgressText(`Processing ${currentFormat.toUpperCase()}...`);
        setProcessProgress(20 + (i * 20));
        
        const result = await workerManager.processImage(
          selectedFile,
          width,
          height,
          quality,
          currentFormat
        );
        
        if (result.success && result.data) {
          const dataUrl = await workerManager.arrayBufferToDataURL(
            result.data,
            `image/${currentFormat}`
          );
          formatResults.set(currentFormat, dataUrl);
        }
      }
      
      setProgressText("Finalizing...");
      setProcessProgress(90);
      
      if (formatResults.size > 0) {
        setOutputUrls(prev => new Map(prev.set(selectedFile.id, formatResults)));
        setProgressText("Processing complete!");
        setProcessProgress(100);
        
        setTimeout(() => {
          setProgressText("");
          setProcessProgress(0);
        }, 2000);
      } else {
        throw new Error('Failed to process any format');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      setProgressText("Processing failed");
      setTimeout(() => {
        setProgressText("");
        setProcessProgress(0);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  }, [selectedFile, natural, width, height, quality, workerManager, processing]);

  // Select file
  const selectFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setSelectedFileId(fileId);
      loadImageDimensions(file);
    }
  }, [files, loadImageDimensions]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    
    const formatUrls = outputUrls.get(fileId);
    if (formatUrls) {
      formatUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setOutputUrls(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      if (remainingFiles.length > 0) {
        const nextFile = remainingFiles[0];
        setSelectedFileId(nextFile.id);
        loadImageDimensions(nextFile);
      } else {
        setSelectedFileId(null);
        setNatural(null);
      }
    }
  }, [files, outputUrls, selectedFileId, loadImageDimensions]);

  // Download processed image in specific format
  const downloadImage = useCallback((fileId: string, downloadFormat: 'jpeg' | 'png' | 'webp') => {
    const formatUrls = outputUrls.get(fileId);
    const file = files.find(f => f.id === fileId);
    
    if (formatUrls && file) {
      const outputUrl = formatUrls.get(downloadFormat);
      if (outputUrl) {
        const link = document.createElement('a');
        link.href = outputUrl;
        link.download = file.name.replace(/\.[^/.]+$/, `_${width}x${height}.${downloadFormat}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, [outputUrls, files, width, height]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      }, []);
      outputUrls.forEach(formatUrls => {
        formatUrls.forEach(url => {
          URL.revokeObjectURL(url);
        });
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Monochromatic Upload Area */}
        {files.length === 0 && (
          <div className="relative mb-8">
            <div
              className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 transform ${
                dragOver 
                  ? 'border-gray-600 bg-gradient-to-br from-gray-100 to-gray-200 scale-[1.02] shadow-xl' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className={`p-6 rounded-full transition-all duration-300 ${
                    dragOver 
                      ? 'bg-gradient-to-r from-black to-gray-700 transform scale-110' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-900'
                  }`}>
                    <Upload className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {dragOver ? 'Drop your images here!' : 'Upload Your Images'}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Drag & drop your images or browse from your device
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    size="lg"
                  >
                    <FileImage className="w-5 h-5 mr-2" />
                    Browse Files
                  </Button>
                  <div className="text-gray-400 font-medium">or</div>
                  <div className="text-gray-500">Drag & Drop</div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
                    JPG
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
                    PNG
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-200 text-gray-800 border border-gray-400">
                    WebP
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
                    GIF
                  </Badge>
                  <span className="text-gray-400">• Max 32MB each</span>
                </div>
              </div>
              {dragOver && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/10 to-gray-900/10 rounded-3xl animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* File List and Controls */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Images ({files.length})</span>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {files.map(file => (
                      <div
                        key={file.id}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedFileId === file.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectFile(file.id)}
                      >
                        {file.thumbnail && (
                          <img
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Output Format Selection */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Palette className="w-5 h-5" />
                    Output Format
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={format} onValueChange={(value) => setFormat(value as 'jpeg' | 'png' | 'webp')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-900 text-white">WebP</Badge>
                          <span>Best compression</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="jpeg">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-700 text-white">JPEG</Badge>
                          <span>Wide compatibility</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="png">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-800 text-white">PNG</Badge>
                          <span>Lossless quality</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Quick Presets */}
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Zap className="w-5 h-5" />
                    Quick Presets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedPreset} onValueChange={applyPreset}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a preset size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          <span>Custom Size</span>
                        </div>
                      </SelectItem>
                      {Object.entries(presetDimensions)
                        .filter(([key]) => key !== 'custom')
                        .map(([key, preset]) => {
                          const IconComponent = preset.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{preset.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Precise Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Precise Controls
                    </div>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      variant="ghost"
                      size="sm"
                    >
                      {showAdvanced ? 'Simple' : 'Advanced'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Aspect Ratio Lock */}
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      {keepAspect ? <Lock className="w-4 h-4 text-gray-800" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                      Lock Aspect Ratio
                    </Label>
                    <Button
                      onClick={() => setKeepAspect(!keepAspect)}
                      size="sm"
                      variant={keepAspect ? "default" : "outline"}
                      className={keepAspect ? "bg-gray-900 hover:bg-black text-white" : "hover:bg-gray-100"}
                    >
                      {keepAspect ? 'Locked' : 'Unlocked'}
                    </Button>
                  </div>

                  {/* Unit Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unit</Label>
                    <Select value={unit} onValueChange={(value) => setUnit(value as 'px' | 'cm' | 'mm' | 'in')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="px">
                          <div className="flex items-center gap-2">
                            <span>Pixels (px)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cm">
                          <div className="flex items-center gap-2">
                            <span>Centimeters (cm)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="mm">
                          <div className="flex items-center gap-2">
                            <span>Millimeters (mm)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="in">
                          <div className="flex items-center gap-2">
                            <span>Inches (in)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="width" className="text-sm font-medium">Width ({unit})</Label>
                      <Input
                        id="width"
                        type="number"
                        value={displayWidth.toFixed(unit === 'px' ? 0 : 2)}
                        onChange={(e) => updateWidthWithAspect(Number(e.target.value))}
                        min={unit === 'px' ? "1" : "0.01"}
                        step={unit === 'px' ? "1" : "0.01"}
                        className="text-center font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-medium">Height ({unit})</Label>
                      <Input
                        id="height"
                        type="number"
                        value={displayHeight.toFixed(unit === 'px' ? 0 : 2)}
                        onChange={(e) => updateHeightWithAspect(Number(e.target.value))}
                        min={unit === 'px' ? "1" : "0.01"}
                        step={unit === 'px' ? "1" : "0.01"}
                        className="text-center font-mono"
                      />
                    </div>
                  </div>

                  {showAdvanced && (
                    <>
                      {/* Quality Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quality" className="text-sm font-medium">Quality</Label>
                          <Badge variant="secondary" className="text-xs">
                            {quality}%
                          </Badge>
                        </div>
                        <Input
                          id="quality"
                          type="range"
                          min="1"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                    </>
                  )}

                  {/* Dimensions Info */}
                  {natural && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">Original</div>
                            <div className="font-mono text-gray-900">{natural.w} × {natural.h}px</div>
                            <div className="text-xs text-gray-500">
                              {((natural.w * natural.h) / 1000000).toFixed(1)}MP
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-700">New Size</div>
                            <div className="font-mono text-gray-900">{width} × {height}px</div>
                            <div className="text-xs text-gray-600">
                              {((width * height) / 1000000).toFixed(1)}MP
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Scale Factor</span>
                            <Badge 
                              className={`font-mono ${
                                Math.round((width / natural.w) * 100) > 100 
                                  ? 'bg-gray-800 text-white' 
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {Math.round((width / natural.w) * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={processImage}
                      disabled={!selectedFile || processing}
                      className="w-full h-12 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          <span>Resize Image</span>
                        </>
                      )}
                    </Button>

                    {/* Enhanced Progress */}
                    {processing && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm text-gray-500">{processProgress}%</span>
                        </div>
                        <Progress value={processProgress} className="mb-3 h-2" />
                        <p className="text-center text-sm text-gray-600 font-medium">{progressText}</p>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Preview */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedFile ? (
                    <div className="space-y-0">
                      {/* Preview Mode Toggle */}
                      {outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.has(format) && (
                        <div className="p-4 bg-gray-50 border-b">
                          <div className="flex rounded-xl bg-white p-1 shadow-sm border">
                            <Button
                              onClick={() => setPreviewMode('original')}
                              size="sm"
                              variant={previewMode === 'original' ? "default" : "ghost"}
                              className={`flex-1 text-sm ${previewMode === 'original' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Original
                            </Button>
                            <Button
                              onClick={() => setPreviewMode('resized')}
                              size="sm"
                              variant={previewMode === 'resized' ? "default" : "ghost"}
                              className={`flex-1 text-sm ${previewMode === 'resized' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Resized
                            </Button>
                            <Button
                              onClick={() => setPreviewMode('split')}
                              size="sm"
                              variant={previewMode === 'split' ? "default" : "ghost"}
                              className={`flex-1 text-sm ${previewMode === 'split' ? 'bg-gray-700 text-white' : 'text-gray-600'}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Split
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Image Preview Area */}
                      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 min-h-[400px] flex items-center justify-center">
                        {previewMode === 'split' && outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.has(format) ? (
                          /* Split View */
                          <div className="w-full h-full grid grid-cols-2 gap-0">
                            <div className="relative flex items-center justify-center bg-gray-50 border-r">
                              <div className="text-center p-4">
                                <Badge className="mb-2 bg-gray-700 text-white">Original</Badge>
                                <img
                                  src={selectedFile.preview}
                                  alt="Original"
                                  className="max-w-full max-h-80 object-contain rounded-lg shadow-sm"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                            <div className="relative flex items-center justify-center bg-gray-100">
                              <div className="text-center p-4">
                                <Badge className="mb-2 bg-gray-900 text-white">Resized</Badge>
                                <img
                                  src={outputUrls.get(selectedFile.id)?.get(format)}
                                  alt="Resized"
                                  className="max-w-full max-h-80 object-contain rounded-lg shadow-sm"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Single Image View */
                          <div className="p-6 flex items-center justify-center">
                            <div className="relative">
                              <img
                                src={
                                  previewMode === 'resized' && outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.has(format)
                                    ? outputUrls.get(selectedFile.id)?.get(format)
                                    : selectedFile.preview
                                }
                                alt={selectedFile.name}
                                className="max-w-full max-h-96 object-contain rounded-xl shadow-lg border border-white"
                                loading="lazy"
                              />
                              {/* Badge indicating current view */}
                              <div className="absolute top-2 left-2">
                                <Badge 
                                  className={
                                    previewMode === 'resized' && outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.has(format)
                                      ? 'bg-gray-900 text-white'
                                      : 'bg-gray-700 text-white'
                                  }
                                >
                                  {previewMode === 'resized' && outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.has(format) ? 'Resized' : 'Original'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Processing Overlay */}
                        {processing && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                              <div className="p-4 bg-white rounded-2xl shadow-lg border">
                                <RefreshCw className="w-8 h-8 animate-spin text-gray-800 mx-auto mb-3" />
                                <p className="font-medium text-gray-900">Processing Image</p>
                                <p className="text-sm text-gray-600 mt-1">{progressText}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Download Buttons Section */}
                      {outputUrls.has(selectedFile.id) && outputUrls.get(selectedFile.id)?.size && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 text-center">Download in Format</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {Array.from(outputUrls.get(selectedFile.id) || new Map()).map(([formatKey]) => {
                                const formatInfo: Record<string, { name: string; color: string; icon: string }> = {
                                  'webp': { name: 'WebP', color: 'bg-gray-900 hover:bg-black', icon: '🗜️' },
                                  'jpeg': { name: 'JPEG', color: 'bg-gray-700 hover:bg-gray-800', icon: '📷' },
                                  'png': { name: 'PNG', color: 'bg-gray-800 hover:bg-gray-900', icon: '🖼️' }
                                };
                                const format = formatInfo[formatKey] || { name: formatKey.toUpperCase(), color: 'bg-gray-600 hover:bg-gray-700', icon: '📎' };
                                
                                return (
                                  <Button
                                    key={formatKey}
                                    onClick={() => downloadImage(selectedFile.id, formatKey as 'jpeg' | 'png' | 'webp')}
                                    className={`h-16 ${format.color} text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex flex-col items-center justify-center`}
                                  >
                                    <Download className="w-4 h-4 mb-1" />
                                    <span className="text-xs">{format.name}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enhanced File Info */}
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">File Information</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedFile.type.split('/')[1].toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">File Name</div>
                              <div className="font-mono text-gray-900 truncate" title={selectedFile.name}>
                                {selectedFile.name}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">File Size</div>
                              <div className="font-mono text-gray-900">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                            {natural && (
                              <>
                                <div>
                                  <div className="text-gray-500">Dimensions</div>
                                  <div className="font-mono text-gray-900">
                                    {natural.w} × {natural.h}px
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Aspect Ratio</div>
                                  <div className="font-mono text-gray-900">
                                    {(natural.w / natural.h).toFixed(2)}:1
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-16 text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No image selected</p>
                      <p className="text-sm">Choose an image to see the preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
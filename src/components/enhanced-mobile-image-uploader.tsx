'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, X, Plus, Grid, List, Eye, Download, Share2, RotateCw, Trash2, FileImage, AlertCircle, CheckCircle, Info, Maximize2, Minimize2 } from 'lucide-react' // TODO: Consider importing icons individually for better tree shaking;
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// Memory leak prevention: Event listeners need cleanup, Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


interface ImageFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  processed: boolean;
  error?: string;
  metadata: {
    originalSize: number;
    processedSize?: number;
    dimensions: { width: number; height: number };
    format: string;
    quality?: number;
  };
  settings: {
    width: number;
    height: number;
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
    maintainAspectRatio: boolean;
  };
}

interface EnhancedMobileImageUploaderProps {
  onImagesProcessed: (images: ImageFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  defaultQuality?: number;
  className?: string;
}

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const TOUCH_THRESHOLD = 10; // pixels for touch gesture recognition

export default function EnhancedMobileImageUploader({
  onImagesProcessed,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE_MB,
  acceptedFormats = SUPPORTED_FORMATS,
  defaultQuality = 85,
  className = ''
}: EnhancedMobileImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcements, setAnnouncements] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const currentIndex = selectedImage ? images.findIndex(img => img.id === selectedImage) : -1;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (images.length > 0) {
            const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            setSelectedImage(images[nextIndex]?.id || null);
            announce(`Selected image ${nextIndex + 1} of ${images.length}`);
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (images.length > 0) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            setSelectedImage(images[prevIndex]?.id || null);
            announce(`Selected image ${prevIndex + 1} of ${images.length}`);
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedImage) {
            // Toggle preview or open settings
            const image = images.find(img => img.id === selectedImage);
            if (image) {
              announce(`Opened settings for ${image.file.name}`);
            }
          }
          break;

        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedImage) {
            removeImage(selectedImage);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedImage(null);
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, selectedImage]);

  // Screen reader announcements
  const announce = useCallback((message: string) => {
    setAnnouncements(message);
    setTimeout(() => setAnnouncements(''), 1000);
  }, []);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use ${acceptedFormats.join(', ')}.`;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds limit of ${maxFileSize}MB.`;
    }

    if (images.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed.`;
    }

    return null;
  }, [acceptedFormats, maxFileSize, maxFiles, images.length]);

  // Create image preview and metadata
  const createImageFile = useCallback(async (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();

      reader.onload = (e) => {
        const preview = e.target?.result as string;
        img.onload = () => {
          const imageFile: ImageFile = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview,
            progress: 0,
            processed: false,
            metadata: {
              originalSize: file.size,
              dimensions: { width: img.width, height: img.height },
              format: file.type
            },
            settings: {
              width: img.width,
              height: img.height,
              quality: defaultQuality,
              format: file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpeg',
              maintainAspectRatio: true
            }
          };
          resolve(imageFile);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = preview;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [defaultQuality]);

  // Handle file selection
  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      announce(`${errors.length} files rejected. ${validFiles.length} files accepted.`);
    } else {
      announce(`${validFiles.length} files selected for upload.`);
    }

    try {
      const imageFiles = await Promise.all(validFiles.map(createImageFile));
      setImages(prev => [...prev, ...imageFiles]);
    } catch (error) {
      console.error('Error creating image files:', error);
      announce('Error processing some files.');
    }
  }, [validateFile, createImageFile, announce]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCountRef.current = 0;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, imageId: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setSelectedImage(imageId);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, imageId: string) => {
    if (!touchStartPos || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);

    // If movement is minimal, treat as tap
    if (deltaX < TOUCH_THRESHOLD && deltaY < TOUCH_THRESHOLD) {
      const image = images.find(img => img.id === imageId);
      if (image) {
        announce(`Selected ${image.file.name}`);
      }
    }

    setTouchStartPos(null);
  }, [touchStartPos, images, announce]);

  // Image operations
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== imageId);
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        announce(`Removed ${removedImage.file.name}`);
        URL.revokeObjectURL(removedImage.preview);
      }
      return newImages;
    });
    
    if (selectedImage === imageId) {
      setSelectedImage(null);
    }
  }, [selectedImage, announce]);

  const updateImageSettings = useCallback((imageId: string, settings: Partial<ImageFile['settings']>) => {
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, settings: { ...img.settings, ...settings } }
        : img
    ));
  }, []);

  // Process images
  const processImages = useCallback(async () => {
    if (processing || images.length === 0) return;

    setProcessing(true);
    announce('Starting image processing...');

    try {
      // Simulate processing with progress updates
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Update progress
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, progress: 0 }
            : img
        ));

        // Simulate processing time
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, progress }
              : img
          ));
        }

        // Mark as processed
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, processed: true, progress: 100 }
            : img
        ));
      }

      announce(`Successfully processed ${images.length} images.`);
      onImagesProcessed(images);
    } catch (error) {
      console.error('Processing error:', error);
      announce('Error occurred during processing.');
    } finally {
      setProcessing(false);
    }
  }, [processing, images, onImagesProcessed, announce]);

  // Statistics
  const stats = useMemo(() => {
    const totalSize = images.reduce((sum, img) => sum + img.metadata.originalSize, 0);
    const processedCount = images.filter(img => img.processed).length;
    const errorCount = images.filter(img => img.error).length;

    return {
      totalImages: images.length,
      totalSize: (totalSize / (1024 * 1024)).toFixed(2),
      processedCount,
      errorCount,
      processingRate: images.length > 0 ? Math.round((processedCount / images.length) * 100) : 0
    };
  }, [images]);

  // Render image card
  const renderImageCard = useCallback((image: ImageFile, index: number) => {
    const isSelected = selectedImage === image.id;
    const cardClass = `
      relative group cursor-pointer transition-all duration-300 
      ${isSelected ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:shadow-lg hover:scale-102'} 
      ${isMobile ? 'touch-manipulation' : ''}
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
      backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90
    `;

    return (
      <Card 
        key={image.id}
        className={cardClass}
        onTouchStart={isMobile ? (e) => handleTouchStart(e, image.id) : undefined}
        onTouchEnd={isMobile ? (e) => handleTouchEnd(e, image.id) : undefined}
        onClick={() => setSelectedImage(image.id)}
        tabIndex={0}
        role="button"
        aria-label={`Image ${index + 1}: ${image.file.name}, ${(image.metadata.originalSize / (1024 * 1024)).toFixed(2)}MB, ${image.metadata.dimensions.width}x${image.metadata.dimensions.height} pixels`}
        aria-selected={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedImage(image.id);
          }
        }}
      >
        <CardContent className="p-0 overflow-hidden">
          <div className="relative overflow-hidden">
            <img
              src={image.preview}
              alt={`Preview of ${image.file.name}`}
              className="w-full h-48 object-cover rounded-t-lg transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Animated overlay for better visual feedback */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Status overlay with animations */}
            <div className="absolute top-3 right-3 flex gap-2">
              {image.processed && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 shadow-lg animate-bounce">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Done</span>
                </Badge>
              )}
              {image.error && (
                <Badge variant="destructive" className="shadow-lg animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Error</span>
                </Badge>
              )}
              {image.progress > 0 && image.progress < 100 && (
                <Badge variant="secondary" className="bg-blue-500 text-white shadow-lg animate-pulse">
                  <span className="text-xs font-medium">{image.progress}%</span>
                </Badge>
              )}
            </div>

            {/* Enhanced remove button with ripple effect */}
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 transform scale-90 hover:scale-100 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm border border-red-400/50"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(image.id);
              }}
              aria-label={`Remove ${image.file.name}`}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Enhanced progress bar */}
            {image.progress > 0 && image.progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-sm p-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="font-medium">Processing...</span>
                    <span className="font-bold">{image.progress}%</span>
                  </div>
                  <Progress value={image.progress} className="h-2 bg-gray-300/30">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full transition-all duration-300 animate-pulse" style={{ width: `${image.progress}%` }} />
                  </Progress>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced image info */}
          <div className="p-4 bg-gradient-to-b from-white/95 via-white/90 to-white/95 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-800/95 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate" title={image.file.name}>
                {image.file.name}
              </h3>
              {isSelected && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white">{(image.metadata.originalSize / (1024 * 1024)).toFixed(1)}</span>
                <span className="text-xs opacity-75">MB</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white">{image.metadata.dimensions.width}×{image.metadata.dimensions.height}</span>
                <span className="text-xs opacity-75">pixels</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white capitalize">{image.settings.format}</span>
                <span className="text-xs opacity-75">{image.settings.quality}% quality</span>
              </div>
            </div>

            {/* Enhanced quick settings for mobile */}
            {isMobile && isSelected && (
              <div className="mt-4 p-3 bg-blue-50/80 dark:bg-blue-900/30 rounded-lg backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-blue-900 dark:text-blue-100">Quality</Label>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">{image.settings.quality}%</span>
                  </div>
                  <Slider
                    value={[image.settings.quality]}
                    onValueChange={([quality]) => updateImageSettings(image.id, { quality })}
                    min={10}
                    max={100}
                    step={5}
                    className="h-6 touch-manipulation"
                    aria-label={`Quality for ${image.file.name}`}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-blue-900 dark:text-blue-100">Format</Label>
                  <Select 
                    value={image.settings.format} 
                    onValueChange={(format: 'jpeg' | 'png' | 'webp') => 
                      updateImageSettings(image.id, { format })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-20 bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedImage, isMobile, handleTouchStart, handleTouchEnd, removeImage, updateImageSettings]);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcements}
      </div>

      {/* Enhanced Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-white/80 via-gray-50/60 to-white/80 dark:from-gray-800/80 dark:via-gray-700/60 dark:to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
              Image Uploader
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalImages}</span>
              <span className="text-gray-600 dark:text-gray-400">images</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalSize}</span>
              <span className="text-gray-600 dark:text-gray-400">MB total</span>
            </div>
            {stats.processedCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.processedCount}</span>
                <span className="text-gray-600 dark:text-gray-400">processed</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border p-1" role="tablist" aria-label="View mode">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              role="tab"
            >
              <Grid className="w-4 h-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              role="tab"
            >
              <List className="w-4 h-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>

          {/* Fullscreen toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Enhanced Upload area with glassmorphism */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-300 backdrop-blur-sm
          ${dragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-purple-50/80 dark:from-blue-950/80 dark:via-blue-900/60 dark:to-purple-950/80 shadow-xl scale-102 animate-pulse' 
            : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-white/80 via-gray-50/60 to-white/80 dark:from-gray-800/80 dark:via-gray-700/60 dark:to-gray-800/80 hover:border-blue-300 hover:shadow-lg'
          }
          ${images.length === 0 ? 'p-12' : 'p-8'}
          group cursor-pointer
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="sr-only"
          id="image-upload"
        />

        <div className="text-center space-y-6">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            dragActive 
              ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 text-white shadow-xl scale-110 animate-bounce' 
              : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300 group-hover:scale-105 group-hover:shadow-lg'
          }`}>
            <Upload className={`transition-all duration-300 ${
              dragActive ? 'w-8 h-8 animate-pulse' : 'w-6 h-6 group-hover:w-7 group-hover:h-7'
            }`} />
          </div>
          
          <div className="space-y-2">
            <Label 
              htmlFor="image-upload"
              className={`cursor-pointer text-lg font-bold transition-all duration-300 block ${
                dragActive 
                  ? 'text-blue-600 dark:text-blue-400 scale-105' 
                  : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 group-hover:scale-105'
              }`}
            >
              {dragActive ? '✨ Drop images here!' : '📸 Choose images to upload'}
            </Label>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Drag and drop or click to select • Max {maxFiles} files • {maxFileSize}MB each
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {acceptedFormats.map((format, index) => (
                <span key={index} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full font-medium">
                  {format.split('/')[1].toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 transition-all duration-300 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 ${
              dragActive ? 'animate-pulse' : ''
            }`}
            aria-describedby="upload-help"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Select Images
          </Button>
        </div>
      </div>

      {/* Images grid/list */}
      {images.length > 0 && (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'space-y-4'
          }
        `}>
          {images.map((image, index) => renderImageCard(image, index))}
        </div>
      )}

      {/* Processing controls */}
      {images.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{stats.totalImages} images ready</span>
            {stats.processedCount > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {stats.processedCount} processed
              </span>
            )}
            {stats.errorCount > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {stats.errorCount} errors
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={processing}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all images?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {images.length} images from the uploader. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      images.forEach(img => URL.revokeObjectURL(img.preview));
                      setImages([]);
                      setSelectedImage(null);
                      announce('All images cleared.');
                    }}
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              onClick={processImages}
              disabled={processing || images.length === 0}
              className="min-w-32"
            >
              {processing ? (
                <>
                  <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4 mr-2" />
                  Process Images
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile sheet for detailed settings */}
      {isMobile && selectedImage && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Selected Image
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>
                {images.find(img => img.id === selectedImage)?.file.name}
              </SheetTitle>
              <SheetDescription>
                Adjust settings for this image
              </SheetDescription>
            </SheetHeader>
            
            {selectedImage && (
              <div className="p-4 space-y-6 overflow-y-auto">
                {/* Image preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={images.find(img => img.id === selectedImage)?.preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Settings */}
                <Tabs defaultValue="resize" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="resize">Resize</TabsTrigger>
                    <TabsTrigger value="format">Format</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="resize" className="space-y-4">
                    {/* Dimension controls would go here */}
                    <div className="text-sm text-muted-foreground">
                      Resize controls coming soon...
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="format" className="space-y-4">
                    {/* Format controls would go here */}
                    <div className="text-sm text-muted-foreground">
                      Format controls coming soon...
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            <SheetFooter>
              <Button variant="outline">Close</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Accessibility help */}
      <div id="upload-help" className="sr-only">
        Use keyboard navigation: Arrow keys to navigate images, Enter to select, Delete to remove, Escape to deselect.
      </div>
    </div>
  );
}

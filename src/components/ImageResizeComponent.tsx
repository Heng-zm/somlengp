"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Image as ImageIcon, 
  RefreshCw, 
  Upload,
  FileImage,
  Trash2,
  X,
  Lock,
  Unlock
} from "lucide-react";
import { getImageWorkerManager } from "@/lib/image-worker-manager";

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
  
  // Processing state
  const [processing, setProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>("");
  
  // Preview and results
  const [outputUrls, setOutputUrls] = useState<Map<string, string>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerManager = getImageWorkerManager();

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId);
  }, [files, selectedFileId]);

  const ratio = useMemo(() => {
    if (!natural || !natural.w || !natural.h) return 1;
    return natural.w / natural.h;
  }, [natural]);

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

  // Dimension update handlers with aspect ratio
  const updateWidthWithAspect = useCallback((val: number) => {
    const newWidth = Math.max(1, Math.min(32768, Math.round(val)));
    setWidth(newWidth);
    
    if (keepAspect && natural && ratio > 0) {
      const newHeight = Math.round(newWidth / ratio);
      setHeight(Math.max(1, Math.min(32768, newHeight)));
    }
  }, [keepAspect, natural, ratio]);

  const updateHeightWithAspect = useCallback((val: number) => {
    const newHeight = Math.max(1, Math.min(32768, Math.round(val)));
    setHeight(newHeight);
    
    if (keepAspect && natural && ratio > 0) {
      const newWidth = Math.round(newHeight * ratio);
      setWidth(Math.max(1, Math.min(32768, newWidth)));
    }
  }, [keepAspect, natural, ratio]);

  // Process image
  const processImage = useCallback(async () => {
    if (!selectedFile || !natural || processing) return;
    
    setProcessing(true);
    setProgressText("Processing image...");
    setProcessProgress(10);
    
    try {
      const result = await workerManager.processImage(
        selectedFile,
        width,
        height,
        quality,
        format
      );
      
      setProgressText("Finalizing...");
      setProcessProgress(80);
      
      if (result.success && result.data) {
        const dataUrl = await workerManager.arrayBufferToDataURL(
          result.data,
          `image/${format}`
        );
        
        setOutputUrls(prev => new Map(prev.set(selectedFile.id, dataUrl)));
        setProgressText("Processing complete!");
        setProcessProgress(100);
        
        setTimeout(() => {
          setProgressText("");
          setProcessProgress(0);
        }, 2000);
      } else {
        throw new Error(result.error || 'Processing failed');
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
  }, [selectedFile, natural, width, height, quality, format, workerManager, processing]);

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
    
    const outputUrl = outputUrls.get(fileId);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
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

  // Download processed image
  const downloadImage = useCallback((fileId: string) => {
    const outputUrl = outputUrls.get(fileId);
    const file = files.find(f => f.id === fileId);
    
    if (outputUrl && file) {
      const link = document.createElement('a');
      link.href = outputUrl;
      link.download = file.name.replace(/\.[^/.]+$/, `_${width}x${height}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [outputUrls, files, width, height, format]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      outputUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Resize Tool</h1>
          <p className="text-gray-600">Resize your images quickly and efficiently</p>
        </div>

        {/* Upload Area */}
        {files.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your images here
            </h3>
            <p className="text-gray-600 mb-4">
              or click to select files
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
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

            {/* Controls */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Resize Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dimensions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Maintain Aspect Ratio</Label>
                      <Button
                        onClick={() => setKeepAspect(!keepAspect)}
                        size="sm"
                        variant="ghost"
                        className={keepAspect ? "text-blue-600" : "text-gray-400"}
                      >
                        {keepAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          value={width}
                          onChange={(e) => updateWidthWithAspect(Number(e.target.value))}
                          min="1"
                          max="32768"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          value={height}
                          onChange={(e) => updateHeightWithAspect(Number(e.target.value))}
                          min="1"
                          max="32768"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quality */}
                  <div>
                    <Label htmlFor="quality">Quality: {quality}%</Label>
                    <Input
                      id="quality"
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Format */}
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <select
                      id="format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as "jpeg" | "png" | "webp")}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="webp">WebP</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                    </select>
                  </div>

                  {/* Original Dimensions */}
                  {natural && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Original: {natural.w} × {natural.h}px
                      </p>
                      <p className="text-sm text-gray-600">
                        New: {width} × {height}px
                      </p>
                      {natural.w && natural.h && (
                        <p className="text-sm text-gray-600">
                          Scale: {Math.round((width / natural.w) * 100)}%
                        </p>
                      )}
                    </div>
                  )}

                  {/* Process Button */}
                  <Button
                    onClick={processImage}
                    disabled={!selectedFile || processing}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileImage className="w-4 h-4 mr-2" />
                        Resize Image
                      </>
                    )}
                  </Button>

                  {/* Progress */}
                  {processing && (
                    <div>
                      <Progress value={processProgress} className="mb-2" />
                      <p className="text-sm text-gray-600 text-center">{progressText}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  {selectedFile && outputUrls.has(selectedFile.id) && (
                    <Button
                      onClick={() => downloadImage(selectedFile.id)}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resized Image
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFile && (
                    <div className="space-y-4">
                      {/* Before/After Toggle */}
                      {outputUrls.has(selectedFile.id) && (
                        <div className="flex rounded-lg bg-gray-100 p-1">
                          <Button
                            onClick={() => {/* Toggle to before */}}
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-sm"
                          >
                            Original
                          </Button>
                          <Button
                            onClick={() => {/* Toggle to after */}}
                            size="sm"
                            variant="ghost"
                            className="flex-1 text-sm bg-white shadow-sm"
                          >
                            Resized
                          </Button>
                        </div>
                      )}

                      {/* Image Preview */}
                      <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={
                            outputUrls.has(selectedFile.id)
                              ? outputUrls.get(selectedFile.id)
                              : selectedFile.preview
                          }
                          alt={selectedFile.name}
                          className="w-full h-auto max-h-96 object-contain"
                          loading="lazy"
                        />
                        {processing && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Name: {selectedFile.name}</p>
                        <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        {natural && (
                          <p>Dimensions: {natural.w} × {natural.h}px</p>
                        )}
                      </div>
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
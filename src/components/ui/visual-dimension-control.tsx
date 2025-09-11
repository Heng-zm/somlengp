"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ruler, 
  ArrowLeftRight, 
  Link2, 
  Unlink,
  RotateCcw,
  Square,
  Monitor,
  Smartphone,
  Tablet,
  Info,
  HelpCircle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VisualDimensionControlProps {
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  keepAspectRatio: boolean;
  onKeepAspectRatioChange: (value: boolean) => void;
  min?: number;
  max?: number;
  className?: string;
}

const COMMON_RATIOS = [
  { name: "16:9", value: 16/9, icon: <Monitor className="w-3 h-3" /> },
  { name: "4:3", value: 4/3, icon: <Tablet className="w-3 h-3" /> },
  { name: "1:1", value: 1, icon: <Square className="w-3 h-3" /> },
  { name: "9:16", value: 9/16, icon: <Smartphone className="w-3 h-3" /> },
  { name: "3:2", value: 3/2, icon: <Monitor className="w-3 h-3" /> },
];

export function VisualDimensionControl({
  width,
  height,
  originalWidth,
  originalHeight,
  onWidthChange,
  onHeightChange,
  keepAspectRatio,
  onKeepAspectRatioChange,
  min = 1,
  max = 8192,
  className = ""
}: VisualDimensionControlProps) {
  const [inputWidth, setInputWidth] = useState(width.toString());
  const [inputHeight, setInputHeight] = useState(height.toString());
  const [showValidation, setShowValidation] = useState(false);

  // Update inputs when props change
  useEffect(() => {
    setInputWidth(width.toString());
  }, [width]);

  useEffect(() => {
    setInputHeight(height.toString());
  }, [height]);

  // Calculate current aspect ratio
  const aspectRatio = useMemo(() => {
    return width / height;
  }, [width, height]);

  // Calculate scale factor for visualization
  const maxDisplaySize = 120;
  const scale = useMemo(() => {
    const maxDim = Math.max(width, height);
    return maxDisplaySize / maxDim;
  }, [width, height]);

  const visualWidth = Math.max(20, width * scale);
  const visualHeight = Math.max(20, height * scale);

  // Handle input changes
  const handleWidthInput = useCallback((value: string) => {
    setInputWidth(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onWidthChange(numValue);
      setShowValidation(false);
    } else {
      setShowValidation(true);
    }
  }, [min, max, onWidthChange]);

  const handleHeightInput = useCallback((value: string) => {
    setInputHeight(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onHeightChange(numValue);
      setShowValidation(false);
    } else {
      setShowValidation(true);
    }
  }, [min, max, onHeightChange]);

  // Apply common aspect ratio
  const applyAspectRatio = useCallback((ratio: number) => {
    // Determine which dimension should be the base
    // For landscape ratios (>1), prioritize width
    // For portrait ratios (<1), prioritize height
    // For square (=1), use the larger dimension as base
    
    if (ratio >= 1) {
      // Landscape or square - calculate height from width
      onHeightChange(Math.round(width / ratio));
    } else {
      // Portrait - calculate width from height
      onWidthChange(Math.round(height * ratio));
    }
  }, [width, height, onWidthChange, onHeightChange]);

  // Reset to original dimensions
  const resetToOriginal = useCallback(() => {
    if (originalWidth && originalHeight) {
      onWidthChange(originalWidth);
      onHeightChange(originalHeight);
    }
  }, [originalWidth, originalHeight, onWidthChange, onHeightChange]);

  // Calculate percentage change
  const percentageChange = useMemo(() => {
    if (!originalWidth || !originalHeight) return null;
    const originalArea = originalWidth * originalHeight;
    const currentArea = width * height;
    return ((currentArea - originalArea) / originalArea) * 100;
  }, [width, height, originalWidth, originalHeight]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Preview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs font-medium">Preview</Label>
            <div className="flex items-center gap-2">
              {originalWidth && originalHeight && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={resetToOriginal}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Original
                </Button>
              )}
              <Badge variant="outline" className="text-xs">
                {aspectRatio === 1 ? '1:1' : `${Math.round(aspectRatio * 100) / 100}:1`}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[140px] bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="relative">
              {/* Visual representation */}
              <div
                className="bg-blue-500/20 border-2 border-blue-500 rounded flex items-center justify-center"
                style={{ 
                  width: `${visualWidth}px`, 
                  height: `${visualHeight}px`,
                  minWidth: '20px',
                  minHeight: '20px'
                }}
              >
                <div className="text-xs text-blue-700 dark:text-blue-300 font-mono text-center">
                  {width}×{height}
                </div>
              </div>

              {/* Original dimensions overlay */}
              {originalWidth && originalHeight && (
                <div
                  className="absolute top-0 left-0 bg-gray-400/20 border border-gray-400 rounded opacity-50"
                  style={{ 
                    width: `${Math.max(20, originalWidth * scale)}px`, 
                    height: `${Math.max(20, originalHeight * scale)}px`
                  }}
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="text-center">
              <div className="text-gray-500">Area</div>
              <div className="font-medium">{(width * height / 1000000).toFixed(1)}MP</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Ratio</div>
              <div className="font-medium">{aspectRatio === 1 ? '1:1' : aspectRatio.toFixed(2)}</div>
            </div>
            {percentageChange !== null && (
              <div className="text-center">
                <div className="text-gray-500">Change</div>
                <div className={`font-medium ${percentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentageChange > 0 ? '+' : ''}{Math.round(percentageChange)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dimension Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs flex items-center gap-1 mb-1">
            <ArrowLeftRight className="w-3 h-3" />
            Width
          </Label>
          <Input
            type="number"
            value={inputWidth}
            min={min}
            max={max}
            onChange={(e) => handleWidthInput(e.target.value)}
            className={`h-8 text-sm ${showValidation && (parseInt(inputWidth) < min || parseInt(inputWidth) > max) ? 'border-red-500' : ''}`}
          />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1 mb-1">
            <ArrowLeftRight className="w-3 h-3 rotate-90" />
            Height
          </Label>
          <Input
            type="number"
            value={inputHeight}
            min={min}
            max={max}
            onChange={(e) => handleHeightInput(e.target.value)}
            className={`h-8 text-sm ${showValidation && (parseInt(inputHeight) < min || parseInt(inputHeight) > max) ? 'border-red-500' : ''}`}
          />
        </div>
      </div>

      {/* Aspect Ratio Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={keepAspectRatio ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onKeepAspectRatioChange(!keepAspectRatio)}
            >
              {keepAspectRatio ? <Link2 className="w-3 h-3 mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
              Lock Ratio
            </Button>
            
            {/* Aspect Ratio Overview */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  aria-label="Aspect ratio overview"
                >
                  <HelpCircle className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <h4 className="font-semibold text-sm">Aspect Ratio Guide</h4>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Monitor className="w-4 h-4 mt-0.5 text-blue-500" />
                        <div>
                          <div className="font-medium">16:9 (Widescreen)</div>
                          <div className="text-gray-600 dark:text-gray-400">Perfect for monitors, TVs, YouTube videos, presentations</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Tablet className="w-4 h-4 mt-0.5 text-green-500" />
                        <div>
                          <div className="font-medium">4:3 (Traditional)</div>
                          <div className="text-gray-600 dark:text-gray-400">Classic TV format, older monitors, presentations</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Square className="w-4 h-4 mt-0.5 text-purple-500" />
                        <div>
                          <div className="font-medium">1:1 (Square)</div>
                          <div className="text-gray-600 dark:text-gray-400">Instagram posts, profile pictures, avatars</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Smartphone className="w-4 h-4 mt-0.5 text-orange-500" />
                        <div>
                          <div className="font-medium">9:16 (Portrait)</div>
                          <div className="text-gray-600 dark:text-gray-400">Mobile screens, Instagram stories, TikTok videos</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <Monitor className="w-4 h-4 mt-0.5 text-teal-500" />
                        <div>
                          <div className="font-medium">3:2 (Photography)</div>
                          <div className="text-gray-600 dark:text-gray-400">DSLR cameras, photo prints, professional photography</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="font-medium">Tips:</div>
                      <ul className="space-y-0.5 ml-2">
                        <li>• Use Lock Ratio to maintain proportions while resizing</li>
                        <li>• Choose aspect ratios based on your target platform</li>
                        <li>• Preview shows your current dimensions in real-time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {COMMON_RATIOS.map((ratio) => (
            <Button
              key={ratio.name}
              variant={Math.abs(aspectRatio - ratio.value) < 0.01 ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => applyAspectRatio(ratio.value)}
              title={`Apply ${ratio.name} aspect ratio`}
            >
              {ratio.icon}
              <span className="ml-1">{ratio.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && (
        <div className="text-xs text-red-500 text-center">
          Dimensions must be between {min} and {max} pixels
        </div>
      )}
    </div>
  );
}

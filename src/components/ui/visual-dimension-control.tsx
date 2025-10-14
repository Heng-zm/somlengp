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
// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

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
    <div className={`space-y-6 ${className}`}>
      {/* Visual Preview */}
      <Card className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/20 dark:from-gray-800/90 dark:via-blue-900/20 dark:to-purple-900/10 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
              <Label className="text-sm font-semibold bg-gradient-to-r from-gray-800 to-blue-700 dark:from-gray-200 dark:to-blue-300 bg-clip-text text-transparent">
                Dimension Preview
              </Label>
            </div>
            <div className="flex items-center gap-2">
              {originalWidth && originalHeight && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                  onClick={resetToOriginal}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Original
                </Button>
              )}
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-200 dark:border-blue-700">
                {aspectRatio === 1 ? '1:1' : `${Math.round(aspectRatio * 100) / 100}:1`}
              </Badge>
            </div>
          </div>

          <div className="relative flex items-center justify-center min-h-[160px] bg-gradient-to-br from-gray-50/80 via-white/40 to-blue-50/30 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-blue-950/30 rounded-xl border-2 border-dashed border-blue-200/60 dark:border-blue-700/60 backdrop-blur-sm overflow-hidden group">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239ca3af' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className="relative z-10 transition-all duration-500 group-hover:scale-105">
              {/* Visual representation */}
              <div
                className="bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-blue-500/30 dark:from-blue-500/40 dark:via-purple-500/30 dark:to-blue-600/40 border-2 border-blue-400/60 dark:border-blue-500/70 rounded-lg flex items-center justify-center relative overflow-hidden backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl"
                style={{ 
                  width: `${visualWidth}px`, 
                  height: `${visualHeight}px`,
                  minWidth: '30px',
                  minHeight: '30px'
                }}
              >
                {/* Inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-blue-500/20 rounded-lg" />
                
                <div className="relative z-10 text-xs text-blue-800 dark:text-blue-200 font-bold text-center">
                  {width}×{height}
                </div>
                
                {/* Corner indicators */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500/60 rounded-full animate-pulse" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500/60 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-cyan-500/60 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-pink-500/60 rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
              </div>

              {/* Original dimensions overlay */}
              {originalWidth && originalHeight && (
                <div
                  className="absolute top-0 left-0 bg-gray-400/20 dark:bg-gray-600/30 border border-gray-400/60 dark:border-gray-500/60 rounded-lg backdrop-blur-sm transition-opacity duration-300 hover:opacity-80"
                  style={{ 
                    width: `${Math.max(30, originalWidth * scale)}px`, 
                    height: `${Math.max(30, originalHeight * scale)}px`
                  }}
                  title="Original dimensions"
                />
              )}
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Area</div>
              <div className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {(width * height / 1000000).toFixed(1)}MP
              </div>
            </div>
            <div className="text-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ratio</div>
              <div className="font-bold text-sm bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                {aspectRatio === 1 ? '1:1' : aspectRatio.toFixed(2)}
              </div>
            </div>
            {percentageChange !== null && (
              <div className="text-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change</div>
                <div className={`font-bold text-sm ${
                  percentageChange > 0 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent' 
                    : percentageChange < 0
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {percentageChange > 0 ? '+' : ''}{Math.round(percentageChange)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Dimension Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Label className="text-xs flex items-center gap-2 mb-2 font-semibold text-gray-700 dark:text-gray-300">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
            <ArrowLeftRight className="w-3 h-3" />
            Width
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={inputWidth}
              min={min}
              max={max}
              onChange={(e) => handleWidthInput(e.target.value)}
              className={`h-10 text-sm pl-4 pr-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl transition-all duration-300 focus:scale-105 ${
                showValidation && (parseInt(inputWidth) < min || parseInt(inputWidth) > max) 
                  ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 shadow-red-100 dark:shadow-red-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:border-blue-400 dark:focus:border-blue-400 shadow-sm hover:shadow-md focus:shadow-lg'
              }`}
              placeholder="Width"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              px
            </div>
          </div>
        </div>
        <div className="relative">
          <Label className="text-xs flex items-center gap-2 mb-2 font-semibold text-gray-700 dark:text-gray-300">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            <ArrowLeftRight className="w-3 h-3 rotate-90" />
            Height
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={inputHeight}
              min={min}
              max={max}
              onChange={(e) => handleHeightInput(e.target.value)}
              className={`h-10 text-sm pl-4 pr-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl transition-all duration-300 focus:scale-105 ${
                showValidation && (parseInt(inputHeight) < min || parseInt(inputHeight) > max) 
                  ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 shadow-red-100 dark:shadow-red-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 focus:border-purple-400 dark:focus:border-purple-400 shadow-sm hover:shadow-md focus:shadow-lg'
              }`}
              placeholder="Height"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              px
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Aspect Ratio Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant={keepAspectRatio ? "default" : "outline"}
              size="sm"
              className={`h-9 px-4 text-xs font-semibold transition-all duration-300 rounded-xl ${
                keepAspectRatio 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl scale-105' 
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:scale-105'
              }`}
              onClick={() => onKeepAspectRatioChange(!keepAspectRatio)}
            >
              {keepAspectRatio ? (
                <>
                  <Link2 className="w-3 h-3 mr-2" />
                  <span>Aspect Locked</span>
                </>
              ) : (
                <>
                  <Unlink className="w-3 h-3 mr-2" />
                  <span>Free Resize</span>
                </>
              )}
            </Button>
            
            {/* Aspect Ratio Overview */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-xs bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 rounded-xl"
                  aria-label="Aspect ratio overview"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  <span>Guide</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                    <Info className="w-5 h-5 text-blue-500" />
                    <h4 className="font-bold text-sm bg-gradient-to-r from-gray-800 to-blue-700 dark:from-gray-200 dark:to-blue-300 bg-clip-text text-transparent">Aspect Ratio Guide</h4>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/60 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                        <Monitor className="w-5 h-5 mt-0.5 text-blue-600" />
                        <div>
                          <div className="font-semibold text-blue-800 dark:text-blue-300">16:9 (Widescreen)</div>
                          <div className="text-blue-700/80 dark:text-blue-400/80">Perfect for monitors, TVs, YouTube videos, presentations</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50/80 to-green-100/60 dark:from-green-900/30 dark:to-green-800/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                        <Tablet className="w-5 h-5 mt-0.5 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800 dark:text-green-300">4:3 (Traditional)</div>
                          <div className="text-green-700/80 dark:text-green-400/80">Classic TV format, older monitors, presentations</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/60 dark:from-purple-900/30 dark:to-purple-800/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                        <Square className="w-5 h-5 mt-0.5 text-purple-600" />
                        <div>
                          <div className="font-semibold text-purple-800 dark:text-purple-300">1:1 (Square)</div>
                          <div className="text-purple-700/80 dark:text-purple-400/80">Instagram posts, profile pictures, avatars</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50/80 to-orange-100/60 dark:from-orange-900/30 dark:to-orange-800/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
                        <Smartphone className="w-5 h-5 mt-0.5 text-orange-600" />
                        <div>
                          <div className="font-semibold text-orange-800 dark:text-orange-300">9:16 (Portrait)</div>
                          <div className="text-orange-700/80 dark:text-orange-400/80">Mobile screens, Instagram stories, TikTok videos</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50/80 to-teal-100/60 dark:from-teal-900/30 dark:to-teal-800/20 rounded-lg border border-teal-200/50 dark:border-teal-700/50">
                        <Monitor className="w-5 h-5 mt-0.5 text-teal-600" />
                        <div>
                          <div className="font-semibold text-teal-800 dark:text-teal-300">3:2 (Photography)</div>
                          <div className="text-teal-700/80 dark:text-teal-400/80">DSLR cameras, photo prints, professional photography</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gradient-to-r from-gray-200/60 via-gray-300/40 to-gray-200/60 dark:from-gray-700/60 dark:via-gray-600/40 dark:to-gray-700/60">
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">💡 Pro Tips:</div>
                      <ul className="space-y-1 ml-4">
                        <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Use Lock Ratio to maintain proportions while resizing</li>
                        <li className="flex items-start gap-2"><span className="text-green-500">•</span> Choose aspect ratios based on your target platform</li>
                        <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Preview shows your current dimensions in real-time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Enhanced Aspect Ratio Buttons */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
            Quick Ratios
          </Label>
          <div className="flex gap-2 flex-wrap">
            {COMMON_RATIOS.map((ratio, index) => {
              const isActive = Math.abs(aspectRatio - ratio.value) < 0.01;
              const colors = [
                'from-blue-500 to-cyan-500',
                'from-green-500 to-emerald-500', 
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-teal-500 to-blue-500'
              ];
              return (
                <Button
                  key={ratio.name}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`h-9 px-3 text-xs font-semibold transition-all duration-300 rounded-xl ${
                    isActive
                      ? `bg-gradient-to-r ${colors[index]} text-white shadow-lg hover:shadow-xl scale-105 animate-pulse`
                      : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-600/60 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 hover:scale-105'
                  }`}
                  onClick={() => applyAspectRatio(ratio.value)}
                  title={`Apply ${ratio.name} aspect ratio`}
                >
                  <div className="flex items-center gap-2">
                    {ratio.icon}
                    <span>{ratio.name}</span>
                  </div>
                </Button>
              );
            })}
          </div>
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

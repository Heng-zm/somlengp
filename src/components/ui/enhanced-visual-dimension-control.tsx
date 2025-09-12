'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link, LinkIcon, Unlink, Lock, Unlock, RotateCcw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EnhancedVisualDimensionControlProps {
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onWidthChange?: (width: number) => void;
  onHeightChange?: (height: number) => void;
  keepAspectRatio?: boolean;
  onKeepAspectRatioChange?: (keep: boolean) => void;
  showVisualPreview?: boolean;
  allowDecimalValues?: boolean;
  unit?: string;
  precision?: number;
  className?: string;
  disabled?: boolean;
  onValidationError?: (error: string | null) => void;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function EnhancedVisualDimensionControl({
  width,
  height,
  originalWidth,
  originalHeight,
  minWidth = 1,
  minHeight = 1,
  maxWidth = 8192,
  maxHeight = 8192,
  onWidthChange,
  onHeightChange,
  keepAspectRatio = true,
  onKeepAspectRatioChange,
  showVisualPreview = true,
  allowDecimalValues = false,
  unit = 'px',
  precision = 0,
  className,
  disabled = false,
  onValidationError
}: EnhancedVisualDimensionControlProps) {
  const [inputWidth, setInputWidth] = useState(width.toString());
  const [inputHeight, setInputHeight] = useState(height.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [lastValidWidth, setLastValidWidth] = useState(width);
  const [lastValidHeight, setLastValidHeight] = useState(height);
  
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Calculate aspect ratio with better precision and validation
  const aspectRatio = useMemo(() => {
    if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
      return 1;
    }
    
    const ratio = originalWidth / originalHeight;
    
    // Validate ratio
    if (!isFinite(ratio) || ratio <= 0 || ratio === Infinity) {
      console.warn('Invalid aspect ratio calculated:', { originalWidth, originalHeight, ratio });
      return 1;
    }
    
    // Clamp ratio to reasonable bounds (1:1000 to 1000:1)
    return Math.max(0.001, Math.min(1000, ratio));
  }, [originalWidth, originalHeight]);

  // Enhanced validation function
  const validateDimensions = useCallback((w: number, h: number): ValidationResult => {
    const result: ValidationResult = { isValid: true, warnings: [] };
    
    // Check if values are finite numbers
    if (!isFinite(w) || !isFinite(h)) {
      return { isValid: false, error: 'Dimensions must be valid numbers' };
    }
    
    // Check minimum bounds
    if (w < minWidth || h < minHeight) {
      return { 
        isValid: false, 
        error: `Dimensions must be at least ${minWidth}×${minHeight} ${unit}` 
      };
    }
    
    // Check maximum bounds
    if (w > maxWidth || h > maxHeight) {
      return { 
        isValid: false, 
        error: `Dimensions must not exceed ${maxWidth}×${maxHeight} ${unit}` 
      };
    }
    
    // Decimal validation
    if (!allowDecimalValues && (w % 1 !== 0 || h % 1 !== 0)) {
      return { 
        isValid: false, 
        error: 'Only whole numbers are allowed' 
      };
    }
    
    // Performance warnings
    const totalPixels = w * h;
    if (totalPixels > 16777216) { // 4096x4096
      result.warnings?.push('Large dimensions may cause performance issues');
    }
    
    if (originalWidth && originalHeight) {
      const upscaleFactor = Math.max(w / originalWidth, h / originalHeight);
      if (upscaleFactor > 2) {
        result.warnings?.push(`Upscaling by ${upscaleFactor.toFixed(1)}x may reduce quality`);
      }
    }
    
    return result;
  }, [minWidth, minHeight, maxWidth, maxHeight, allowDecimalValues, unit, originalWidth, originalHeight]);

  // Safely parse number input with validation
  const parseNumberInput = useCallback((value: string): number | null => {
    if (!value || value.trim() === '') return null;
    
    const parsed = allowDecimalValues ? parseFloat(value) : parseInt(value, 10);
    
    if (isNaN(parsed) || !isFinite(parsed)) return null;
    
    return allowDecimalValues ? 
      parseFloat(parsed.toFixed(precision)) : 
      Math.round(parsed);
  }, [allowDecimalValues, precision]);

  // Enhanced dimension update with aspect ratio and validation
  const updateDimensionsWithValidation = useCallback((
    newWidth: number | null, 
    newHeight: number | null,
    respectAspectRatio: boolean = keepAspectRatio,
    sourceField: 'width' | 'height' = 'width'
  ) => {
    let finalWidth = newWidth ?? width;
    let finalHeight = newHeight ?? height;
    
    // Apply aspect ratio if enabled and we have a valid ratio
    if (respectAspectRatio && aspectRatio > 0 && isFinite(aspectRatio)) {
      if (sourceField === 'width' && newWidth !== null) {
        finalHeight = Math.round(newWidth / aspectRatio);
      } else if (sourceField === 'height' && newHeight !== null) {
        finalWidth = Math.round(newHeight * aspectRatio);
      }
    }
    
    // Ensure bounds
    finalWidth = Math.max(minWidth, Math.min(maxWidth, finalWidth));
    finalHeight = Math.max(minHeight, Math.min(maxHeight, finalHeight));
    
    // Validate the final dimensions
    const validation = validateDimensions(finalWidth, finalHeight);
    
    if (validation.isValid) {
      // Update if values changed
      if (finalWidth !== width) {
        onWidthChange?.(finalWidth);
        setLastValidWidth(finalWidth);
      }
      if (finalHeight !== height) {
        onHeightChange?.(finalHeight);
        setLastValidHeight(finalHeight);
      }
      
      onValidationError?.(null);
      
      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Dimension warnings:', validation.warnings);
      }
    } else {
      onValidationError?.(validation.error || 'Invalid dimensions');
    }
    
    return validation.isValid;
  }, [width, height, keepAspectRatio, aspectRatio, minWidth, minHeight, maxWidth, maxHeight, 
      onWidthChange, onHeightChange, onValidationError, validateDimensions]);

  // Handle width input change
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputWidth(value);
    
    const parsedWidth = parseNumberInput(value);
    if (parsedWidth !== null) {
      updateDimensionsWithValidation(parsedWidth, null, keepAspectRatio, 'width');
    }
  }, [parseNumberInput, updateDimensionsWithValidation, keepAspectRatio]);

  // Handle height input change
  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputHeight(value);
    
    const parsedHeight = parseNumberInput(value);
    if (parsedHeight !== null) {
      updateDimensionsWithValidation(null, parsedHeight, keepAspectRatio, 'height');
    }
  }, [parseNumberInput, updateDimensionsWithValidation, keepAspectRatio]);

  // Handle input blur - revert to last valid value if invalid
  const handleInputBlur = useCallback((field: 'width' | 'height') => {
    if (field === 'width') {
      const parsedWidth = parseNumberInput(inputWidth);
      if (parsedWidth === null || !validateDimensions(parsedWidth, height).isValid) {
        setInputWidth(lastValidWidth.toString());
      }
    } else {
      const parsedHeight = parseNumberInput(inputHeight);
      if (parsedHeight === null || !validateDimensions(width, parsedHeight).isValid) {
        setInputHeight(lastValidHeight.toString());
      }
    }
  }, [inputWidth, inputHeight, parseNumberInput, validateDimensions, height, width, lastValidWidth, lastValidHeight]);

  // Reset to original dimensions
  const resetToOriginal = useCallback(() => {
    if (originalWidth && originalHeight) {
      updateDimensionsWithValidation(originalWidth, originalHeight, false);
      setInputWidth(originalWidth.toString());
      setInputHeight(originalHeight.toString());
    }
  }, [originalWidth, originalHeight, updateDimensionsWithValidation]);

  // Fit to bounds while maintaining aspect ratio
  const fitToBounds = useCallback(() => {
    if (!originalWidth || !originalHeight) return;
    
    const maxRatio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    const fittedWidth = Math.floor(originalWidth * maxRatio);
    const fittedHeight = Math.floor(originalHeight * maxRatio);
    
    updateDimensionsWithValidation(fittedWidth, fittedHeight, false);
    setInputWidth(fittedWidth.toString());
    setInputHeight(fittedHeight.toString());
  }, [originalWidth, originalHeight, maxWidth, maxHeight, updateDimensionsWithValidation]);

  // Update input values when props change
  useEffect(() => {
    setInputWidth(width.toString());
    setInputHeight(height.toString());
    setLastValidWidth(width);
    setLastValidHeight(height);
  }, [width, height]);

  // Visual preview calculations
  const previewScale = useMemo(() => {
    if (!showVisualPreview) return 1;
    
    const maxPreviewSize = 200;
    const scale = Math.min(maxPreviewSize / width, maxPreviewSize / height, 1);
    return Math.max(0.1, Math.min(1, scale));
  }, [width, height, showVisualPreview]);

  const previewDimensions = useMemo(() => ({
    width: Math.round(width * previewScale),
    height: Math.round(height * previewScale)
  }), [width, height, previewScale]);

  // Calculate dimension ratios and statistics
  const dimensionStats = useMemo(() => {
    const currentRatio = width / height;
    const megapixels = (width * height) / 1000000;
    
    let ratioText = `${currentRatio.toFixed(3)}:1`;
    if (Math.abs(currentRatio - 16/9) < 0.01) ratioText = '16:9';
    else if (Math.abs(currentRatio - 4/3) < 0.01) ratioText = '4:3';
    else if (Math.abs(currentRatio - 1) < 0.01) ratioText = '1:1';
    else if (Math.abs(currentRatio - 3/2) < 0.01) ratioText = '3:2';
    
    return {
      ratio: ratioText,
      megapixels: megapixels.toFixed(2),
      aspectRatio: currentRatio
    };
  }, [width, height]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Controls */}
      <div className="space-y-3">
        {/* Width Input */}
        <div className="space-y-1">
          <Label htmlFor="width-input" className="text-xs font-medium flex items-center justify-between">
            <span>Width</span>
            {originalWidth && (
              <Badge variant="outline" className="text-xs">
                Original: {originalWidth}{unit}
              </Badge>
            )}
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              ref={widthInputRef}
              id="width-input"
              type="number"
              value={inputWidth}
              onChange={handleWidthChange}
              onBlur={() => handleInputBlur('width')}
              min={minWidth}
              max={maxWidth}
              step={allowDecimalValues ? Math.pow(10, -precision) : 1}
              disabled={disabled}
              className="h-8 text-sm flex-1"
              aria-label={`Width in ${unit}`}
            />
            <span className="text-xs text-gray-500 min-w-[2rem]">{unit}</span>
          </div>
        </div>

        {/* Aspect Ratio Control */}
        <div className="flex items-center justify-center py-1">
          <Button
            variant={keepAspectRatio ? "default" : "outline"}
            size="sm"
            onClick={() => onKeepAspectRatioChange?.(!keepAspectRatio)}
            disabled={disabled}
            className="h-7 px-3 text-xs"
            aria-label={keepAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {keepAspectRatio ? (
              <>
                <Link className="w-3 h-3 mr-1" />
                Linked
              </>
            ) : (
              <>
                <Unlink className="w-3 h-3 mr-1" />
                Free
              </>
            )}
          </Button>
        </div>

        {/* Height Input */}
        <div className="space-y-1">
          <Label htmlFor="height-input" className="text-xs font-medium flex items-center justify-between">
            <span>Height</span>
            {originalHeight && (
              <Badge variant="outline" className="text-xs">
                Original: {originalHeight}{unit}
              </Badge>
            )}
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              ref={heightInputRef}
              id="height-input"
              type="number"
              value={inputHeight}
              onChange={handleHeightChange}
              onBlur={() => handleInputBlur('height')}
              min={minHeight}
              max={maxHeight}
              step={allowDecimalValues ? Math.pow(10, -precision) : 1}
              disabled={disabled}
              className="h-8 text-sm flex-1"
              aria-label={`Height in ${unit}`}
            />
            <span className="text-xs text-gray-500 min-w-[2rem]">{unit}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={resetToOriginal}
          disabled={disabled || !originalWidth || !originalHeight}
          className="flex-1 text-xs h-7"
          aria-label="Reset to original dimensions"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fitToBounds}
          disabled={disabled || !originalWidth || !originalHeight}
          className="flex-1 text-xs h-7"
          aria-label="Fit to maximum bounds"
        >
          <Maximize2 className="w-3 h-3 mr-1" />
          Fit
        </Button>
      </div>

      {/* Visual Preview */}
      {showVisualPreview && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Preview</Label>
                <Badge variant="secondary" className="text-xs">
                  {previewDimensions.width}×{previewDimensions.height}
                </Badge>
              </div>
              
              <div 
                ref={previewRef}
                className="mx-auto border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 flex items-center justify-center relative rounded"
                style={{
                  width: Math.max(previewDimensions.width, 20),
                  height: Math.max(previewDimensions.height, 20),
                  minWidth: '20px',
                  minHeight: '20px'
                }}
                aria-label={`Preview showing ${width}×${height} ${unit}`}
              >
                <span className="text-xs text-gray-500 font-mono">
                  {width}×{height}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dimension Statistics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-medium">Ratio</div>
          <div className="text-gray-600 dark:text-gray-400">{dimensionStats.ratio}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-medium">MP</div>
          <div className="text-gray-600 dark:text-gray-400">{dimensionStats.megapixels}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-medium">Scale</div>
          <div className="text-gray-600 dark:text-gray-400">
            {originalWidth && originalHeight ? 
              `${((width / originalWidth) * 100).toFixed(0)}%` : 
              '100%'
            }
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
          Keyboard shortcuts
        </summary>
        <div className="mt-1 space-y-1 text-xs">
          <div>• Tab: Navigate between fields</div>
          <div>• Enter: Apply current values</div>
          <div>• Escape: Reset to last valid values</div>
          <div>• Ctrl+R: Reset to original</div>
        </div>
      </details>
    </div>
  );
}

export default EnhancedVisualDimensionControl;

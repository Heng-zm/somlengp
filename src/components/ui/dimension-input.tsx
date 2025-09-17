"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Dimension, DimensionUnit, DimensionPair } from '@/lib/types';
import { 
  convertDimension, 
  formatDimension, 
  getUnitSymbol, 
  getUnitName, 
  getAllUnits,
  createDimension,
  parseDimension
} from '@/lib/dimension-utils';
import { Ruler, ArrowLeftRight, Link2 } from 'lucide-react';
// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


interface DimensionInputProps {
  label?: string;
  value: Dimension;
  onChange: (dimension: Dimension) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUnitSelector?: boolean;
  allowedUnits?: DimensionUnit[];
  min?: number;
  max?: number;
}

export function DimensionInput({
  label,
  value,
  onChange,
  placeholder = "Enter value",
  className = "",
  disabled = false,
  showUnitSelector = true,
  allowedUnits = getAllUnits(),
  min = 0.001,
  max = 999999
}: DimensionInputProps) {
  const [inputValue, setInputValue] = useState(value.value.toString());
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value.value.toString());
  }, [value]);

  const handleValueChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      setIsValid(true);
      try {
        const newDimension = createDimension(numValue, value.unit);
        onChange(newDimension);
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(false);
    }
  }, [value.unit, onChange, min, max]);

  const handleUnitChange = useCallback((newUnit: string) => {
    const unit = newUnit as DimensionUnit;
    const converted = convertDimension(value, unit);
    onChange(converted);
  }, [value, onChange]);

  const handleParsedInput = useCallback((input: string) => {
    const parsed = parseDimension(input);
    if (parsed && allowedUnits.includes(parsed.unit)) {
      onChange(parsed);
      setIsValid(true);
    }
  }, [onChange, allowedUnits]);

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          {label}
        </Label>
      )}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              // Try to parse as dimension string if it doesn't parse as number
              if (isNaN(parseFloat(e.target.value))) {
                handleParsedInput(e.target.value);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step="any"
            className={`h-11 pl-4 pr-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl transition-all duration-300 focus:scale-105 ${
              !isValid 
                ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 shadow-red-100 dark:shadow-red-900/20 shadow-lg animate-shake' 
                : isFocused
                ? 'border-indigo-400 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20 shadow-indigo-100 dark:shadow-indigo-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 shadow-sm hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {/* Value indicator */}
          {isValid && inputValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        {showUnitSelector && (
          <div className="relative">
            <Select value={value.unit} onValueChange={handleUnitChange} disabled={disabled}>
              <SelectTrigger className={`w-24 h-11 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl transition-all duration-300 ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-600' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md focus:border-indigo-400 dark:focus:border-indigo-400 focus:shadow-lg'
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl">
                {allowedUnits.map(unit => (
                  <SelectItem 
                    key={unit} 
                    value={unit}
                    className="hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getUnitSymbol(unit)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{getUnitName(unit)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Enhanced validation message */}
      {!isValid && (
        <div className="flex items-center gap-2 p-2 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            Please enter a valid value between {min} and {max}
          </p>
        </div>
      )}
      
      {/* Success indicator */}
      {isValid && inputValue && parseFloat(inputValue) > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="font-medium">Valid {getUnitName(value.unit)} value</span>
        </div>
      )}
    </div>
  );
}

interface DimensionPairInputProps {
  label?: string;
  value: DimensionPair;
  onChange: (pair: DimensionPair) => void;
  className?: string;
  disabled?: boolean;
  showUnitSelector?: boolean;
  allowedUnits?: DimensionUnit[];
  lockAspectRatio?: boolean;
  onAspectRatioToggle?: (locked: boolean) => void;
  min?: number;
  max?: number;
}

export function DimensionPairInput({
  label,
  value,
  onChange,
  className = "",
  disabled = false,
  showUnitSelector = true,
  allowedUnits = getAllUnits(),
  lockAspectRatio = false,
  onAspectRatioToggle,
  min = 0.001,
  max = 999999
}: DimensionPairInputProps) {
  const [aspectRatio, setAspectRatio] = useState(1);

  // Calculate aspect ratio when dimensions change
  useEffect(() => {
    const widthInMM = convertDimension(value.width, DimensionUnit.MILLIMETER);
    const heightInMM = convertDimension(value.height, DimensionUnit.MILLIMETER);
    setAspectRatio(widthInMM.value / heightInMM.value);
  }, [value]);

  const handleWidthChange = useCallback((width: Dimension) => {
    if (lockAspectRatio) {
      // Convert to common unit for calculation
      const widthInMM = convertDimension(width, DimensionUnit.MILLIMETER);
      const newHeightInMM = widthInMM.value / aspectRatio;
      const newHeight = convertDimension(
        createDimension(newHeightInMM, DimensionUnit.MILLIMETER),
        value.height.unit
      );
      onChange({ width, height: newHeight });
    } else {
      onChange({ ...value, width });
    }
  }, [value, onChange, lockAspectRatio, aspectRatio]);

  const handleHeightChange = useCallback((height: Dimension) => {
    if (lockAspectRatio) {
      // Convert to common unit for calculation
      const heightInMM = convertDimension(height, DimensionUnit.MILLIMETER);
      const newWidthInMM = heightInMM.value * aspectRatio;
      const newWidth = convertDimension(
        createDimension(newWidthInMM, DimensionUnit.MILLIMETER),
        value.width.unit
      );
      onChange({ width: newWidth, height });
    } else {
      onChange({ ...value, height });
    }
  }, [value, onChange, lockAspectRatio, aspectRatio]);

  const syncUnits = useCallback((unit: DimensionUnit) => {
    const convertedPair = {
      width: convertDimension(value.width, unit),
      height: convertDimension(value.height, unit)
    };
    onChange(convertedPair);
  }, [value, onChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {onAspectRatioToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => onAspectRatioToggle(!lockAspectRatio)}
            >
              <Link2 className={`w-3 h-3 ${lockAspectRatio ? 'text-blue-600' : 'text-gray-400'}`} />
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <DimensionInput
          label="Width"
          value={value.width}
          onChange={handleWidthChange}
          disabled={disabled}
          showUnitSelector={showUnitSelector}
          allowedUnits={allowedUnits}
          min={min}
          max={max}
        />
        <DimensionInput
          label="Height"
          value={value.height}
          onChange={handleHeightChange}
          disabled={disabled}
          showUnitSelector={showUnitSelector}
          allowedUnits={allowedUnits}
          min={min}
          max={max}
        />
      </div>

      {showUnitSelector && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Quick unit sync:</span>
          {allowedUnits.slice(0, 4).map(unit => (
            <Button
              key={unit}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => syncUnits(unit)}
            >
              {getUnitSymbol(unit)}
            </Button>
          ))}
        </div>
      )}

      {lockAspectRatio && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Ratio: {aspectRatio === 1 ? '1:1' : `${Math.round(aspectRatio * 100) / 100}:1`}
          </Badge>
        </div>
      )}
    </div>
  );
}

interface DimensionDisplayProps {
  dimension?: Dimension;
  pair?: DimensionPair;
  precision?: number;
  showUnit?: boolean;
  className?: string;
  convertTo?: DimensionUnit;
}

export function DimensionDisplay({
  dimension,
  pair,
  precision = 2,
  showUnit = true,
  className = "",
  convertTo
}: DimensionDisplayProps) {
  const formatValue = useCallback((dim: Dimension) => {
    const targetDim = convertTo ? convertDimension(dim, convertTo) : dim;
    return showUnit ? formatDimension(targetDim, precision) : targetDim.value.toFixed(precision);
  }, [convertTo, showUnit, precision]);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Ruler className="w-3 h-3 text-gray-500" />
      {dimension && <span className="text-sm">{formatValue(dimension)}</span>}
      {pair && (
        <span className="text-sm">
          {formatValue(pair.width)} × {formatValue(pair.height)}
        </span>
      )}
    </div>
  );
}

interface DimensionConverterProps {
  dimension: Dimension;
  targetUnits?: DimensionUnit[];
  className?: string;
}

export function DimensionConverter({
  dimension,
  targetUnits = getAllUnits(),
  className = ""
}: DimensionConverterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <ArrowLeftRight className="w-3 h-3 mr-1" />
          Convert
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Convert to:</Label>
          <div className="space-y-1">
            {targetUnits
              .filter(unit => unit !== dimension.unit)
              .map(unit => {
                const converted = convertDimension(dimension, unit);
                return (
                  <div key={unit} className="flex justify-between text-sm">
                    <span className="text-gray-600">{getUnitName(unit)}:</span>
                    <span className="font-mono">{formatDimension(converted)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

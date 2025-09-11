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
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={(e) => {
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
          className={`flex-1 ${!isValid ? 'border-red-500' : ''}`}
        />
        {showUnitSelector && (
          <Select value={value.unit} onValueChange={handleUnitChange} disabled={disabled}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedUnits.map(unit => (
                <SelectItem key={unit} value={unit}>
                  {getUnitSymbol(unit)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {!isValid && (
        <p className="text-xs text-red-500">
          Invalid dimension value
        </p>
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

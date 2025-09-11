"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Printer, Settings } from 'lucide-react';
import { DPIPreset, DPI_PRESETS, getDPIPresetsByCategory } from '@/lib/physical-to-pixel-converter';

interface DPIInputProps {
  value: number;
  onChange: (dpi: number) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  showPresets?: boolean;
  allowCustom?: boolean;
  min?: number;
  max?: number;
}

export function DPIInput({
  value,
  onChange,
  label = "DPI/PPI",
  className = "",
  disabled = false,
  showPresets = true,
  allowCustom = true,
  min = 72,
  max = 2400
}: DPIInputProps) {
  const [customDPI, setCustomDPI] = useState(value.toString());
  const [selectedCategory, setSelectedCategory] = useState<string>('screen');

  // Get presets by category
  const screenPresets = useMemo(() => getDPIPresetsByCategory('screen'), []);
  const mobilePresets = useMemo(() => getDPIPresetsByCategory('mobile'), []);
  const printPresets = useMemo(() => getDPIPresetsByCategory('print'), []);

  const handlePresetClick = useCallback((preset: DPIPreset) => {
    onChange(preset.dpi);
    setCustomDPI(preset.dpi.toString());
  }, [onChange]);

  const handleCustomChange = useCallback((newValue: string) => {
    setCustomDPI(newValue);
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  }, [onChange, min, max]);

  const isCustomValue = useMemo(() => {
    return !DPI_PRESETS.some(preset => preset.dpi === value);
  }, [value]);

  const getCurrentPreset = useMemo(() => {
    return DPI_PRESETS.find(preset => preset.dpi === value);
  }, [value]);

  const PresetGrid = ({ presets, icon: Icon }: { presets: DPIPreset[], icon: React.ComponentType<any> }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{presets[0]?.category.charAt(0).toUpperCase() + presets[0]?.category.slice(1)} DPI</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.name}
            variant={value === preset.dpi ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
            className="justify-start text-left h-auto p-3"
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{preset.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {preset.dpi} DPI
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {preset.description}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}

      {/* Current Selection Display */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {getCurrentPreset?.name || 'Custom DPI'}
              </div>
              <div className="text-sm text-muted-foreground">
                {getCurrentPreset?.description || `${value} DPI custom setting`}
              </div>
            </div>
            <Badge variant="outline" className="font-mono">
              {value} DPI
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Custom Input */}
      {allowCustom && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Custom DPI Value
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={customDPI}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Enter DPI"
              disabled={disabled}
              min={min}
              max={max}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCustomChange(customDPI)}
              disabled={disabled || parseFloat(customDPI) === value}
            >
              Apply
            </Button>
          </div>
          {isCustomValue && (
            <p className="text-xs text-muted-foreground">
              Using custom DPI value
            </p>
          )}
        </div>
      )}

      {/* Preset Tabs */}
      {showPresets && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="screen" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Screen
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screen" className="mt-4">
            <PresetGrid presets={screenPresets} icon={Monitor} />
          </TabsContent>

          <TabsContent value="mobile" className="mt-4">
            <PresetGrid presets={mobilePresets} icon={Smartphone} />
          </TabsContent>

          <TabsContent value="print" className="mt-4">
            <PresetGrid presets={printPresets} icon={Printer} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

interface DPISelectProps {
  value: number;
  onChange: (dpi: number) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function DPISelect({
  value,
  onChange,
  className = "",
  disabled = false,
  placeholder = "Select DPI"
}: DPISelectProps) {
  const handleValueChange = useCallback((stringValue: string) => {
    const numValue = parseFloat(stringValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  }, [onChange]);

  const getCurrentPreset = useMemo(() => {
    return DPI_PRESETS.find(preset => preset.dpi === value);
  }, [value]);

  return (
    <Select 
      value={value.toString()} 
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder={placeholder}>
          {getCurrentPreset ? (
            <div className="flex items-center justify-between w-full">
              <span>{getCurrentPreset.name}</span>
              <Badge variant="secondary" className="ml-2">
                {getCurrentPreset.dpi} DPI
              </Badge>
            </div>
          ) : (
            <span>{value} DPI</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Group by category */}
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Monitor className="h-3 w-3" />
            Screen DPI
          </div>
          {getDPIPresetsByCategory('screen').map(preset => (
            <SelectItem key={`screen-${preset.name}`} value={preset.dpi.toString()}>
              <div className="flex items-center justify-between w-full">
                <span>{preset.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {preset.dpi}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </div>

        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Smartphone className="h-3 w-3" />
            Mobile DPI
          </div>
          {getDPIPresetsByCategory('mobile').map(preset => (
            <SelectItem key={`mobile-${preset.name}`} value={preset.dpi.toString()}>
              <div className="flex items-center justify-between w-full">
                <span>{preset.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {preset.dpi}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </div>

        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Printer className="h-3 w-3" />
            Print DPI
          </div>
          {getDPIPresetsByCategory('print').map(preset => (
            <SelectItem key={`print-${preset.name}`} value={preset.dpi.toString()}>
              <div className="flex items-center justify-between w-full">
                <span>{preset.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {preset.dpi}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}

interface DPICompactInputProps {
  value: number;
  onChange: (dpi: number) => void;
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

export function DPICompactInput({
  value,
  onChange,
  className = "",
  disabled = false,
  showLabel = true
}: DPICompactInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= 72 && numValue <= 2400) {
      onChange(numValue);
    }
  }, [onChange]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Label className="text-sm font-medium whitespace-nowrap">
          DPI:
        </Label>
      )}
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        min={72}
        max={2400}
        className="w-20"
        placeholder="96"
      />
    </div>
  );
}

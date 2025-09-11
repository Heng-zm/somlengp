"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dimension, DimensionUnit, DimensionPair } from '@/lib/types';
import { 
  createDimension, 
  convertDimensionPair, 
  formatDimensionPair,
  getCommonPresets 
} from '@/lib/dimension-utils';
import { 
  Monitor, 
  Smartphone, 
  Instagram, 
  Twitter, 
  FileImage, 
  Printer,
  CreditCard,
  Frame,
  Tv,
  Tablet
} from 'lucide-react';

interface DimensionPreset {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'print' | 'social' | 'photo' | 'device';
  dimensions: DimensionPair;
  icon: React.ReactNode;
  popular?: boolean;
}

// Define comprehensive presets
const DIMENSION_PRESETS: DimensionPreset[] = [
  // Web Presets
  {
    id: 'web-fhd',
    name: 'Full HD',
    description: 'Standard desktop resolution',
    category: 'web',
    dimensions: {
      width: createDimension(1920, DimensionUnit.PIXEL),
      height: createDimension(1080, DimensionUnit.PIXEL)
    },
    icon: <Monitor className="w-4 h-4" />,
    popular: true
  },
  {
    id: 'web-4k',
    name: '4K UHD',
    description: 'Ultra high definition',
    category: 'web',
    dimensions: {
      width: createDimension(3840, DimensionUnit.PIXEL),
      height: createDimension(2160, DimensionUnit.PIXEL)
    },
    icon: <Tv className="w-4 h-4" />
  },
  {
    id: 'web-tablet',
    name: 'Tablet',
    description: 'Tablet screen size',
    category: 'device',
    dimensions: {
      width: createDimension(1024, DimensionUnit.PIXEL),
      height: createDimension(768, DimensionUnit.PIXEL)
    },
    icon: <Tablet className="w-4 h-4" />
  },
  {
    id: 'web-mobile',
    name: 'Mobile',
    description: 'Mobile screen size',
    category: 'device',
    dimensions: {
      width: createDimension(375, DimensionUnit.PIXEL),
      height: createDimension(667, DimensionUnit.PIXEL)
    },
    icon: <Smartphone className="w-4 h-4" />
  },

  // Social Media Presets
  {
    id: 'social-instagram-square',
    name: 'Instagram Square',
    description: 'Square Instagram post',
    category: 'social',
    dimensions: {
      width: createDimension(1080, DimensionUnit.PIXEL),
      height: createDimension(1080, DimensionUnit.PIXEL)
    },
    icon: <Instagram className="w-4 h-4" />,
    popular: true
  },
  {
    id: 'social-instagram-portrait',
    name: 'Instagram Portrait',
    description: 'Portrait Instagram post',
    category: 'social',
    dimensions: {
      width: createDimension(1080, DimensionUnit.PIXEL),
      height: createDimension(1350, DimensionUnit.PIXEL)
    },
    icon: <Instagram className="w-4 h-4" />
  },
  {
    id: 'social-twitter-header',
    name: 'Twitter Header',
    description: 'Twitter cover photo',
    category: 'social',
    dimensions: {
      width: createDimension(1500, DimensionUnit.PIXEL),
      height: createDimension(500, DimensionUnit.PIXEL)
    },
    icon: <Twitter className="w-4 h-4" />
  },
  {
    id: 'social-facebook-cover',
    name: 'Facebook Cover',
    description: 'Facebook cover photo',
    category: 'social',
    dimensions: {
      width: createDimension(851, DimensionUnit.PIXEL),
      height: createDimension(315, DimensionUnit.PIXEL)
    },
    icon: <FileImage className="w-4 h-4" />
  },

  // Print Presets
  {
    id: 'print-a4',
    name: 'A4 Paper',
    description: 'Standard A4 document size',
    category: 'print',
    dimensions: {
      width: createDimension(210, DimensionUnit.MILLIMETER),
      height: createDimension(297, DimensionUnit.MILLIMETER)
    },
    icon: <Printer className="w-4 h-4" />,
    popular: true
  },
  {
    id: 'print-a3',
    name: 'A3 Paper',
    description: 'Large format A3 size',
    category: 'print',
    dimensions: {
      width: createDimension(297, DimensionUnit.MILLIMETER),
      height: createDimension(420, DimensionUnit.MILLIMETER)
    },
    icon: <Printer className="w-4 h-4" />
  },
  {
    id: 'print-letter',
    name: 'US Letter',
    description: 'US standard letter size',
    category: 'print',
    dimensions: {
      width: createDimension(8.5, DimensionUnit.INCH),
      height: createDimension(11, DimensionUnit.INCH)
    },
    icon: <Printer className="w-4 h-4" />
  },
  {
    id: 'print-business-card',
    name: 'Business Card',
    description: 'Standard business card',
    category: 'print',
    dimensions: {
      width: createDimension(85, DimensionUnit.MILLIMETER),
      height: createDimension(55, DimensionUnit.MILLIMETER)
    },
    icon: <CreditCard className="w-4 h-4" />
  },

  // Photo Presets
  {
    id: 'photo-4x6',
    name: 'Photo 4×6"',
    description: 'Standard photo print',
    category: 'photo',
    dimensions: {
      width: createDimension(4, DimensionUnit.INCH),
      height: createDimension(6, DimensionUnit.INCH)
    },
    icon: <Frame className="w-4 h-4" />,
    popular: true
  },
  {
    id: 'photo-5x7',
    name: 'Photo 5×7"',
    description: 'Medium photo print',
    category: 'photo',
    dimensions: {
      width: createDimension(5, DimensionUnit.INCH),
      height: createDimension(7, DimensionUnit.INCH)
    },
    icon: <Frame className="w-4 h-4" />
  },
  {
    id: 'photo-8x10',
    name: 'Photo 8×10"',
    description: 'Large photo print',
    category: 'photo',
    dimensions: {
      width: createDimension(8, DimensionUnit.INCH),
      height: createDimension(10, DimensionUnit.INCH)
    },
    icon: <Frame className="w-4 h-4" />
  },
  {
    id: 'photo-11x14',
    name: 'Photo 11×14"',
    description: 'Extra large photo print',
    category: 'photo',
    dimensions: {
      width: createDimension(11, DimensionUnit.INCH),
      height: createDimension(14, DimensionUnit.INCH)
    },
    icon: <Frame className="w-4 h-4" />
  }
];

const CATEGORY_LABELS = {
  web: 'Web & Screen',
  print: 'Print & Paper',
  social: 'Social Media',
  photo: 'Photography',
  device: 'Device Screens'
};

interface DimensionPresetsProps {
  onSelect: (dimensions: DimensionPair) => void;
  currentUnit?: DimensionUnit;
  selectedCategories?: Array<'web' | 'print' | 'social' | 'photo' | 'device'>;
  showPopular?: boolean;
  className?: string;
}

export function DimensionPresets({
  onSelect,
  currentUnit = DimensionUnit.PIXEL,
  selectedCategories = ['web', 'print', 'social', 'photo', 'device'],
  showPopular = false,
  className = ""
}: DimensionPresetsProps) {
  const filteredPresets = DIMENSION_PRESETS.filter(preset => {
    if (showPopular && !preset.popular) return false;
    return selectedCategories.includes(preset.category);
  });

  const handlePresetSelect = useCallback((preset: DimensionPreset) => {
    const convertedDimensions = convertDimensionPair(preset.dimensions, currentUnit);
    onSelect(convertedDimensions);
  }, [onSelect, currentUnit]);

  // Group presets by category
  const groupedPresets = selectedCategories.reduce((acc, category) => {
    const presetsInCategory = filteredPresets.filter(p => p.category === category);
    if (presetsInCategory.length > 0) {
      acc[category] = presetsInCategory;
    }
    return acc;
  }, {} as Record<string, DimensionPreset[]>);

  if (showPopular) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
        {filteredPresets.map((preset) => {
          const convertedDimensions = convertDimensionPair(preset.dimensions, currentUnit);
          return (
            <Button
              key={preset.id}
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.icon}
              <div className="text-center">
                <div className="text-xs font-medium">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDimensionPair(convertedDimensions, 1)}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(groupedPresets).map(([category, presets]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              <Badge variant="secondary" className="text-xs">
                {presets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {presets.map((preset) => {
                const convertedDimensions = convertDimensionPair(preset.dimensions, currentUnit);
                return (
                  <Button
                    key={preset.id}
                    variant="ghost"
                    className="h-auto p-2 flex flex-col items-start gap-1 text-left"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {preset.icon}
                      <span className="text-xs font-medium flex-1">{preset.name}</span>
                      {preset.popular && (
                        <Badge variant="default" className="text-xs px-1">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDimensionPair(convertedDimensions, 1)}
                    </div>
                    <div className="text-xs text-gray-400 text-left">
                      {preset.description}
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface QuickDimensionPresetsProps {
  onSelect: (dimensions: DimensionPair) => void;
  currentUnit?: DimensionUnit;
  className?: string;
}

export function QuickDimensionPresets({
  onSelect,
  currentUnit = DimensionUnit.PIXEL,
  className = ""
}: QuickDimensionPresetsProps) {
  return (
    <DimensionPresets
      onSelect={onSelect}
      currentUnit={currentUnit}
      showPopular={true}
      className={className}
    />
  );
}

interface CategoryFilterProps {
  selectedCategories: Array<'web' | 'print' | 'social' | 'photo' | 'device'>;
  onCategoryChange: (categories: Array<'web' | 'print' | 'social' | 'photo' | 'device'>) => void;
  className?: string;
}

export function CategoryFilter({
  selectedCategories,
  onCategoryChange,
  className = ""
}: CategoryFilterProps) {
  const toggleCategory = useCallback((category: 'web' | 'print' | 'social' | 'photo' | 'device') => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newCategories);
  }, [selectedCategories, onCategoryChange]);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const category = key as 'web' | 'print' | 'social' | 'photo' | 'device';
        const isSelected = selectedCategories.includes(category);
        
        return (
          <Button
            key={category}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => toggleCategory(category)}
          >
            {label}
            {isSelected && (
              <Badge variant="secondary" className="ml-1 text-xs px-1">
                {DIMENSION_PRESETS.filter(p => p.category === category).length}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

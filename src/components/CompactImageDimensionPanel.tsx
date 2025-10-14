'use client';

import React, { useState, useEffect } from 'react';
// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface CompactImageDimensionPanelProps {
  imageFile?: File | null;
  onDimensionsChange?: (dimensions: ImageDimensions) => void;
  className?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  resolution: number;
  unit: 'Centimeters' | 'Inches' | 'Pixels';
  fitTo: 'Original Size' | 'Custom Size' | 'Fit Width' | 'Fit Height';
  resampleMethod: 'Automatic' | 'Bicubic' | 'Bilinear' | 'Nearest Neighbor';
  resample: boolean;
}

const CompactImageDimensionPanel: React.FC<CompactImageDimensionPanelProps> = ({
  imageFile,
  onDimensionsChange,
  className = ''
}) => {
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    width: 150,
    height: 79.99,
    resolution: 150,
    unit: 'Centimeters',
    fitTo: 'Original Size',
    resampleMethod: 'Automatic',
    resample: true
  });

  const [originalDimensions, setOriginalDimensions] = useState({
    width: 8858,
    height: 4724,
    size: 159.6
  });

  const [isLinked, setIsLinked] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);

  // Load image dimensions when file changes
  useEffect(() => {
    if (imageFile) {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;
        
        setOriginalDimensions({
          width,
          height,
          size: Math.round((imageFile.size / (1024 * 1024)) * 10) / 10
        });
        
        setAspectRatio(ratio);
        
        const widthInCm = (width / dimensions.resolution) * 2.54;
        const heightInCm = (height / dimensions.resolution) * 2.54;
        
        setDimensions(prev => ({
          ...prev,
          width: Math.round(widthInCm * 100) / 100,
          height: Math.round(heightInCm * 100) / 100
        }));
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }
  }, [imageFile]);

  const handleDimensionChange = (field: keyof ImageDimensions, value: any) => {
    setDimensions(prev => {
      const newDimensions = { ...prev, [field]: value };
      
      if (isLinked && (field === 'width' || field === 'height')) {
        if (field === 'width') {
          newDimensions.height = Math.round((value / aspectRatio) * 100) / 100;
        } else if (field === 'height') {
          newDimensions.width = Math.round((value * aspectRatio) * 100) / 100;
        }
      }
      
      if (field === 'resolution' || field === 'unit') {
        const pxWidth = originalDimensions.width;
        const pxHeight = originalDimensions.height;
        
        if (newDimensions.unit === 'Centimeters') {
          newDimensions.width = Math.round((pxWidth / newDimensions.resolution) * 2.54 * 100) / 100;
          newDimensions.height = Math.round((pxHeight / newDimensions.resolution) * 2.54 * 100) / 100;
        } else if (newDimensions.unit === 'Inches') {
          newDimensions.width = Math.round((pxWidth / newDimensions.resolution) * 100) / 100;
          newDimensions.height = Math.round((pxHeight / newDimensions.resolution) * 100) / 100;
        } else {
          newDimensions.width = pxWidth;
          newDimensions.height = pxHeight;
        }
      }
      
      onDimensionsChange?.(newDimensions);
      return newDimensions;
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-3 ${className}`} style={{ minWidth: '280px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Image Dimensions</h4>
      </div>
      
      {/* File Size Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-300">File Size:</span>
          <span className="font-semibold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">{originalDimensions.size}MB</span>
        </div>
      </div>

      {/* Original Dimensions */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Original Size:</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 dark:text-gray-300">{originalDimensions.width} × {originalDimensions.height} px</span>
            <button 
              className={`p-1 rounded text-xs transition-colors ${
                isLinked 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setIsLinked(!isLinked)}
              title={isLinked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
            >
              {isLinked ? '🔗' : '🔓'}
            </button>
          </div>
        </div>
      </div>

      {/* Fit To */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Resize Mode:</label>
        <select 
          value={dimensions.fitTo}
          onChange={(e) => handleDimensionChange('fitTo', e.target.value)}
          className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Original Size">Original Size</option>
          <option value="Custom Size">Custom Size</option>
          <option value="Fit Width">Fit Width</option>
          <option value="Fit Height">Fit Height</option>
        </select>
      </div>

      {/* Width & Height in a grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Width:</label>
          <input
            type="number"
            value={dimensions.width}
            onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            step="0.01"
            placeholder="Width"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Height:</label>
          <input
            type="number"
            value={dimensions.height}
            onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            step="0.01"
            placeholder="Height"
          />
        </div>
      </div>
      
      {/* Unit Selection */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Unit:</label>
        <select
          value={dimensions.unit}
          onChange={(e) => handleDimensionChange('unit', e.target.value)}
          className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Centimeters">Centimeters</option>
          <option value="Inches">Inches</option>
          <option value="Pixels">Pixels</option>
        </select>
      </div>

      {/* Resolution */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Resolution (DPI):</label>
        <div className="flex gap-1">
          <input
            type="number"
            value={dimensions.resolution}
            onChange={(e) => handleDimensionChange('resolution', parseInt(e.target.value) || 72)}
            className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            min="72"
            max="600"
            placeholder="DPI"
          />
          <span className="flex items-center px-2 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded border border-gray-300 dark:border-gray-600">
            pixels/inch
          </span>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="compact-resample-checkbox"
                checked={dimensions.resample}
                onChange={(e) => handleDimensionChange('resample', e.target.checked)}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="compact-resample-checkbox" className="text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                Enable Resampling
              </label>
            </div>
          </div>
          
          {dimensions.resample && (
            <div className="space-y-1 ml-4">
              <label className="text-xs text-gray-600 dark:text-gray-400">Method:</label>
              <select
                value={dimensions.resampleMethod}
                onChange={(e) => handleDimensionChange('resampleMethod', e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Automatic">Automatic</option>
                <option value="Bicubic">Bicubic</option>
                <option value="Bilinear">Bilinear</option>
                <option value="Nearest Neighbor">Nearest Neighbor</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default CompactImageDimensionPanel;

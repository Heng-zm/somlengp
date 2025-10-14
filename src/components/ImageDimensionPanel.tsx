'use client';

import React, { useState, useEffect } from 'react';
// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface ImageDimensionPanelProps {
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

const ImageDimensionPanel: React.FC<ImageDimensionPanelProps> = ({
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
    size: 159.6 // MB
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
        
        // Calculate dimensions based on resolution
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

  // Handle dimension changes
  const handleDimensionChange = (field: keyof ImageDimensions, value: any) => {
    setDimensions(prev => {
      const newDimensions = { ...prev, [field]: value };
      
      // Handle linked dimensions (aspect ratio lock)
      if (isLinked && (field === 'width' || field === 'height')) {
        if (field === 'width') {
          newDimensions.height = Math.round((value / aspectRatio) * 100) / 100;
        } else if (field === 'height') {
          newDimensions.width = Math.round((value * aspectRatio) * 100) / 100;
        }
      }
      
      // Recalculate based on unit changes
      if (field === 'resolution' || field === 'unit') {
        // Recalculate dimensions based on new resolution/unit
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

  const unitOptions = ['Centimeters', 'Inches', 'Pixels'];
  const fitToOptions = ['Original Size', 'Custom Size', 'Fit Width', 'Fit Height'];
  const resampleOptions = ['Automatic', 'Bicubic', 'Bilinear', 'Nearest Neighbor'];

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 space-y-4 ${className}`} style={{ minWidth: '320px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Image Dimensions</h3>
      </div>
      
      {/* Image Size Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">File Size:</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{originalDimensions.size}MB</span>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Original Size:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{originalDimensions.width} × {originalDimensions.height} px</span>
              <button 
                className={`p-1 rounded transition-colors ${
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Resize Mode:</label>
          <select 
            value={dimensions.fitTo}
            onChange={(e) => handleDimensionChange('fitTo', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fitToOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Width & Height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Width:</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              placeholder="Width"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Height:</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              placeholder="Height"
            />
          </div>
        </div>
        
        {/* Unit Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Unit:</label>
          <select
            value={dimensions.unit}
            onChange={(e) => handleDimensionChange('unit', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {unitOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Resolution (DPI):</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={dimensions.resolution}
              onChange={(e) => handleDimensionChange('resolution', parseInt(e.target.value) || 72)}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="72"
              max="600"
              placeholder="DPI"
            />
            <span className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-md border border-gray-300 dark:border-gray-600">
              pixels/inch
            </span>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resample-checkbox"
                  checked={dimensions.resample}
                  onChange={(e) => handleDimensionChange('resample', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="resample-checkbox" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                  Enable Resampling
                </label>
              </div>
            </div>
            
            {dimensions.resample && (
              <div className="space-y-2 ml-6">
                <label className="text-xs text-gray-600 dark:text-gray-400">Resampling Method:</label>
                <select
                  value={dimensions.resampleMethod}
                  onChange={(e) => handleDimensionChange('resampleMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {resampleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDimensionPanel;

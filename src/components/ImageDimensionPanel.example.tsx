// Example usage of ImageDimensionPanel components
// This file shows different ways to use the components

import React, { useState } from 'react';
import ImageDimensionPanel from './ImageDimensionPanel';
import CompactImageDimensionPanel from './CompactImageDimensionPanel';

// Basic usage example
export const BasicExample: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const handleDimensionsChange = (dimensions: any) => {
    
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Basic Usage</h2>
      
      {/* File input */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Regular panel */}
      <ImageDimensionPanel 
        imageFile={imageFile}
        onDimensionsChange={handleDimensionsChange}
      />
    </div>
  );
};

// Compact version example
export const CompactExample: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Compact Version (Photoshop Style)</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <CompactImageDimensionPanel 
        imageFile={imageFile}
        onDimensionsChange={(dims) => }
      />
    </div>
  );
};

// Side-by-side comparison
export const ComparisonExample: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Comparison: Regular vs Compact</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <div className="flex gap-6 flex-wrap">
        <div className="flex flex-col items-center space-y-2">
          <h3 className="font-medium">Regular Panel</h3>
          <ImageDimensionPanel imageFile={imageFile} />
        </div>
        
        <div className="flex flex-col items-center space-y-2">
          <h3 className="font-medium">Compact Panel</h3>
          <CompactImageDimensionPanel imageFile={imageFile} />
        </div>
      </div>
    </div>
  );
};

// Custom styled example
export const CustomStyledExample: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Custom Styling</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Custom dark style */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <h3 className="text-white mb-3">Custom Dark Theme</h3>
        <CompactImageDimensionPanel 
          imageFile={imageFile}
          className="bg-gray-800 border border-gray-600"
        />
      </div>

      {/* Custom light style */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-gray-800 mb-3">Custom Light Theme</h3>
        <CompactImageDimensionPanel 
          imageFile={imageFile}
          className="bg-white border border-gray-300 text-gray-800"
        />
      </div>
    </div>
  );
};

/*
COMPONENT PROPS DOCUMENTATION:

ImageDimensionPanel & CompactImageDimensionPanel Props:
- imageFile?: File | null
    The image file to analyze and display dimensions for
    
- onDimensionsChange?: (dimensions: ImageDimensions) => void
    Callback fired when any dimension value changes
    
- className?: string
    Additional CSS classes for custom styling

ImageDimensions Interface:
{
  width: number;           // Width in selected units
  height: number;          // Height in selected units  
  resolution: number;      // DPI/PPI resolution
  unit: 'Centimeters' | 'Inches' | 'Pixels';
  fitTo: 'Original Size' | 'Custom Size' | 'Fit Width' | 'Fit Height';
  resampleMethod: 'Automatic' | 'Bicubic' | 'Bilinear' | 'Nearest Neighbor';
  resample: boolean;       // Whether resampling is enabled
}

FEATURES:
- ✅ Real-time dimension calculation
- ✅ Aspect ratio lock/unlock
- ✅ Multiple unit support (cm, inches, pixels)
- ✅ Resolution (DPI) control
- ✅ Resampling method selection
- ✅ Professional Photoshop-like interface
- ✅ TypeScript support
- ✅ Responsive design
- ✅ Custom theming support
- ✅ Automatic image analysis

USAGE EXAMPLES:

1. Basic Usage:
<ImageDimensionPanel 
  imageFile={selectedFile} 
  onDimensionsChange={handleChange} 
/>

2. Compact Version:
<CompactImageDimensionPanel 
  imageFile={selectedFile}
  className="custom-styles"
/>

3. With Custom Handler:
<ImageDimensionPanel 
  imageFile={file}
  onDimensionsChange={(dims) => {

  }}
/>
*/

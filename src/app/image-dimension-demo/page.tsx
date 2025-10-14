'use client';
import { memo } from 'react';
import React, { useState, useRef } from 'react';
import ImageDimensionPanel from '@/components/ImageDimensionPanel';
import CompactImageDimensionPanel from '@/components/CompactImageDimensionPanel';
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

const ImageDimensionDemoComponent = function ImageDimensionDemo() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDimensionsChange = (dimensions: any) => {
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Image Dimension Panel Demo</h1>
          <p className="text-gray-400 mt-2">
            Professional image dimension control interface similar to Photoshop
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Upload & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
                  role="button" 
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                      <p className="text-gray-400">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-300">Upload an image</p>
                        <p className="text-gray-500">Click here or drag and drop</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Choose Image File
                </button>
              </div>
            </div>
            {/* Image Info */}
            {selectedImage && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Image Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Name:</span>
                    <span className="text-white">{selectedImage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Size:</span>
                    <span className="text-white">{(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">File Type:</span>
                    <span className="text-white">{selectedImage.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Modified:</span>
                    <span className="text-white">{new Date(selectedImage.lastModified).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Dimension Panel */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Image Dimensions</h2>
              <ImageDimensionPanel 
                imageFile={selectedImage}
                onDimensionsChange={handleDimensionsChange}
                className="bg-gray-700"
              />
            </div>
            {/* Additional Controls */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Export Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Format
                  </label>
                  <select className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="bmp">BMP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quality ({85}%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    defaultValue="85"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button 
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedImage}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Compact Version Showcase */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Compact Version (Photoshop Style)</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Default Style</h3>
              <CompactImageDimensionPanel 
                imageFile={selectedImage}
                onDimensionsChange={handleDimensionsChange}
              />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Dark Style</h3>
              <CompactImageDimensionPanel 
                imageFile={selectedImage}
                onDimensionsChange={handleDimensionsChange}
                className="bg-gray-900 border border-gray-600"
              />
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              This compact version closely matches the original Photoshop interface you provided.
              It features smaller fonts, tighter spacing, and a more professional look.
            </p>
          </div>
        </div>
        {/* Features List */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Real-time Dimension Calculation</h4>
                <p className="text-sm text-gray-400">Automatically calculates dimensions based on resolution and units</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Aspect Ratio Lock</h4>
                <p className="text-sm text-gray-400">Maintains proportions when enabled</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Multiple Units</h4>
                <p className="text-sm text-gray-400">Support for centimeters, inches, and pixels</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Resampling Options</h4>
                <p className="text-sm text-gray-400">Various interpolation methods available</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Professional Interface</h4>
                <p className="text-sm text-gray-400">Photoshop-like design and functionality</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-white">Responsive Design</h4>
                <p className="text-sm text-gray-400">Works on desktop and mobile devices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ImageDimensionDemoComponent);
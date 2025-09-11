'use client';

import { Dimension, DimensionUnit, DimensionPair } from './types';
import { convertDimension, createDimension } from './dimension-utils';

export interface DPIPreset {
  name: string;
  dpi: number;
  description: string;
  category: 'screen' | 'print' | 'mobile' | 'custom';
}

// Common DPI/PPI presets for different scenarios
export const DPI_PRESETS: DPIPreset[] = [
  // Screen DPIs
  { name: 'Standard Screen', dpi: 96, description: 'Default web/Windows display', category: 'screen' },
  { name: 'Mac Retina', dpi: 144, description: 'MacBook Pro/iMac Retina', category: 'screen' },
  { name: 'High-DPI Monitor', dpi: 192, description: '4K/High resolution displays', category: 'screen' },
  { name: 'Ultra High-DPI', dpi: 240, description: 'Premium 4K/8K displays', category: 'screen' },
  
  // Mobile DPIs
  { name: 'iPhone Standard', dpi: 163, description: 'iPhone 3G/3GS', category: 'mobile' },
  { name: 'iPhone Retina', dpi: 326, description: 'iPhone 4/5/6/7/8', category: 'mobile' },
  { name: 'iPhone Plus', dpi: 401, description: 'iPhone 6+/7+/8+', category: 'mobile' },
  { name: 'iPhone Pro', dpi: 460, description: 'iPhone 12/13/14/15 Pro', category: 'mobile' },
  { name: 'Android HDPI', dpi: 240, description: 'High density Android', category: 'mobile' },
  { name: 'Android XHDPI', dpi: 320, description: 'Extra high density Android', category: 'mobile' },
  { name: 'Android XXHDPI', dpi: 480, description: 'Ultra high density Android', category: 'mobile' },
  
  // Print DPIs
  { name: 'Draft Print', dpi: 150, description: 'Basic inkjet/laser printing', category: 'print' },
  { name: 'Standard Print', dpi: 300, description: 'Professional printing standard', category: 'print' },
  { name: 'High Quality Print', dpi: 600, description: 'Professional photo/design', category: 'print' },
  { name: 'Ultra High Print', dpi: 1200, description: 'Professional publishing', category: 'print' },
  { name: 'Photo Print', dpi: 600, description: 'Photo lab quality', category: 'print' },
  { name: 'Large Format', dpi: 150, description: 'Posters and banners', category: 'print' }
];

export interface ConversionContext {
  dpi: number;
  sourceUnit: DimensionUnit;
  targetUnit: DimensionUnit;
}

/**
 * Convert physical dimensions to pixels with specific DPI
 */
export function physicalToPixels(dimension: Dimension, dpi: number): Dimension {
  if (dimension.unit === DimensionUnit.PIXEL) {
    return { ...dimension };
  }

  // Validate inputs
  if (!isFinite(dimension.value) || dimension.value <= 0) {
    throw new Error('Invalid dimension value for conversion');
  }
  
  if (!isFinite(dpi) || dpi <= 0) {
    throw new Error('Invalid DPI value for conversion');
  }

  // Convert to inches first using high precision constants
  let inches: number;
  
  switch (dimension.unit) {
    case DimensionUnit.INCH:
      inches = dimension.value;
      break;
    case DimensionUnit.CENTIMETER:
      inches = dimension.value / 2.54; // Exact conversion
      break;
    case DimensionUnit.MILLIMETER:
      inches = dimension.value / 25.4; // Exact conversion
      break;
    case DimensionUnit.METER:
      inches = dimension.value / 0.0254; // More precise than * 39.3701
      break;
    default:
      throw new Error(`Unsupported unit for conversion: ${dimension.unit}`);
  }

  const pixels = inches * dpi;
  
  // Ensure result is finite and within reasonable bounds
  if (!isFinite(pixels) || pixels < 0) {
    throw new Error('Invalid pixel calculation result');
  }
  
  // Round to nearest integer, ensuring at least 1 pixel
  const roundedPixels = Math.max(1, Math.round(pixels));
  return createDimension(roundedPixels, DimensionUnit.PIXEL);
}

/**
 * Convert pixels to physical dimensions with specific DPI
 */
export function pixelsToPhysical(dimension: Dimension, dpi: number, targetUnit: DimensionUnit): Dimension {
  if (dimension.unit !== DimensionUnit.PIXEL) {
    throw new Error('Input must be in pixels');
  }

  const inches = dimension.value / dpi;
  
  let result: number;
  
  switch (targetUnit) {
    case DimensionUnit.INCH:
      result = inches;
      break;
    case DimensionUnit.CENTIMETER:
      result = inches * 2.54;
      break;
    case DimensionUnit.MILLIMETER:
      result = inches * 25.4;
      break;
    case DimensionUnit.METER:
      result = inches / 39.3701;
      break;
    case DimensionUnit.PIXEL:
      return { ...dimension };
    default:
      throw new Error(`Unsupported target unit: ${targetUnit}`);
  }

  return createDimension(parseFloat(result.toFixed(6)), targetUnit);
}

/**
 * Convert dimension pair to pixels
 */
export function dimensionPairToPixels(pair: DimensionPair, dpi: number): DimensionPair {
  return {
    width: physicalToPixels(pair.width, dpi),
    height: physicalToPixels(pair.height, dpi)
  };
}

/**
 * Convert pixel pair to physical dimensions
 */
export function pixelPairToPhysical(pair: DimensionPair, dpi: number, targetUnit: DimensionUnit): DimensionPair {
  return {
    width: pixelsToPhysical(pair.width, dpi, targetUnit),
    height: pixelsToPhysical(pair.height, dpi, targetUnit)
  };
}

/**
 * Get DPI preset by name
 */
export function getDPIPreset(name: string): DPIPreset | undefined {
  return DPI_PRESETS.find(preset => preset.name === name);
}

/**
 * Get DPI presets by category
 */
export function getDPIPresetsByCategory(category: string): DPIPreset[] {
  return DPI_PRESETS.filter(preset => preset.category === category);
}

/**
 * Calculate file size for image at given dimensions and DPI
 */
export function calculateImageSize(
  dimensions: DimensionPair, 
  dpi: number, 
  colorDepth: 24 | 32 | 8 = 24,
  compression: number = 1
): {
  pixels: DimensionPair;
  totalPixels: number;
  fileSizeMB: number;
  fileSizeKB: number;
} {
  const pixelDimensions = dimensionPairToPixels(dimensions, dpi);
  const totalPixels = pixelDimensions.width.value * pixelDimensions.height.value;
  
  // Calculate uncompressed size in bytes
  const bytesPerPixel = colorDepth / 8;
  const uncompressedBytes = totalPixels * bytesPerPixel;
  
  // Apply compression (1 = no compression, 0.1 = 90% compression)
  const compressedBytes = uncompressedBytes * compression;
  
  return {
    pixels: pixelDimensions,
    totalPixels: Math.round(totalPixels),
    fileSizeMB: parseFloat((compressedBytes / (1024 * 1024)).toFixed(2)),
    fileSizeKB: parseFloat((compressedBytes / 1024).toFixed(1))
  };
}

/**
 * Get print dimensions for given pixel dimensions at specific DPI
 */
export function getPrintDimensions(pixelDimensions: DimensionPair, printDPI: number) {
  const inches = {
    width: createDimension(pixelDimensions.width.value / printDPI, DimensionUnit.INCH),
    height: createDimension(pixelDimensions.height.value / printDPI, DimensionUnit.INCH)
  };
  
  const centimeters = {
    width: createDimension(inches.width.value * 2.54, DimensionUnit.CENTIMETER),
    height: createDimension(inches.height.value * 2.54, DimensionUnit.CENTIMETER)
  };

  const millimeters = {
    width: createDimension(inches.width.value * 25.4, DimensionUnit.MILLIMETER),
    height: createDimension(inches.height.value * 25.4, DimensionUnit.MILLIMETER)
  };

  return { inches, centimeters, millimeters };
}

/**
 * Convert between any units with DPI context
 */
export function convertWithDPI(
  dimension: Dimension,
  targetUnit: DimensionUnit,
  dpi: number = 96
): Dimension {
  // If converting to/from pixels, use DPI-aware conversion
  if (dimension.unit === DimensionUnit.PIXEL && targetUnit !== DimensionUnit.PIXEL) {
    return pixelsToPhysical(dimension, dpi, targetUnit);
  }
  
  if (dimension.unit !== DimensionUnit.PIXEL && targetUnit === DimensionUnit.PIXEL) {
    return physicalToPixels(dimension, dpi);
  }
  
  // For non-pixel conversions, use existing utility
  return convertDimension(dimension, targetUnit);
}

/**
 * Common paper sizes in various units
 */
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, unit: DimensionUnit.MILLIMETER },
  A3: { width: 297, height: 420, unit: DimensionUnit.MILLIMETER },
  A5: { width: 148, height: 210, unit: DimensionUnit.MILLIMETER },
  Letter: { width: 8.5, height: 11, unit: DimensionUnit.INCH },
  Legal: { width: 8.5, height: 14, unit: DimensionUnit.INCH },
  Tabloid: { width: 11, height: 17, unit: DimensionUnit.INCH },
  BusinessCard: { width: 85, height: 55, unit: DimensionUnit.MILLIMETER },
  Photo4x6: { width: 4, height: 6, unit: DimensionUnit.INCH },
  Photo5x7: { width: 5, height: 7, unit: DimensionUnit.INCH },
  Photo8x10: { width: 8, height: 10, unit: DimensionUnit.INCH }
} as const;

/**
 * Get paper size as dimension pair
 */
export function getPaperSize(sizeName: keyof typeof PAPER_SIZES): DimensionPair {
  const size = PAPER_SIZES[sizeName];
  return {
    width: createDimension(size.width, size.unit),
    height: createDimension(size.height, size.unit)
  };
}

/**
 * Get common screen resolutions in pixels
 */
export const SCREEN_RESOLUTIONS = {
  HD: { width: 1366, height: 768 },
  FHD: { width: 1920, height: 1080 },
  QHD: { width: 2560, height: 1440 },
  UHD: { width: 3840, height: 2160 },
  iPhone: { width: 375, height: 667 },
  iPhonePlus: { width: 414, height: 736 },
  iPhoneX: { width: 375, height: 812 },
  iPadMini: { width: 768, height: 1024 },
  iPad: { width: 820, height: 1180 },
  iPadPro: { width: 1024, height: 1366 }
} as const;

/**
 * Get screen resolution as pixel dimension pair
 */
export function getScreenResolution(resolutionName: keyof typeof SCREEN_RESOLUTIONS): DimensionPair {
  const resolution = SCREEN_RESOLUTIONS[resolutionName];
  return {
    width: createDimension(resolution.width, DimensionUnit.PIXEL),
    height: createDimension(resolution.height, DimensionUnit.PIXEL)
  };
}

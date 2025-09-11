import { Dimension, DimensionUnit, DimensionPair, DimensionSchema } from './types';
import { physicalToPixels, pixelsToPhysical, convertWithDPI } from './physical-to-pixel-converter';

// Physical dimension conversion rates (all to millimeters)
// Using high precision constants to avoid floating point errors
const CONVERSION_TO_MM = {
  [DimensionUnit.METER]: 1000.0,
  [DimensionUnit.CENTIMETER]: 10.0,
  [DimensionUnit.MILLIMETER]: 1.0,
  [DimensionUnit.INCH]: 25.4,
  [DimensionUnit.PIXEL]: 25.4 / 96.0 // Exactly 25.4mm / 96 DPI
} as const;

// Conversion from millimeters to other units
// Using reciprocals with high precision
const CONVERSION_FROM_MM = {
  [DimensionUnit.METER]: 0.001,
  [DimensionUnit.CENTIMETER]: 0.1,
  [DimensionUnit.MILLIMETER]: 1.0,
  [DimensionUnit.INCH]: 1.0 / 25.4,
  [DimensionUnit.PIXEL]: 96.0 / 25.4 // Exactly 96 DPI / 25.4mm
} as const;

/**
 * Convert a dimension from one unit to another
 */
export function convertDimension(dimension: Dimension, targetUnit: DimensionUnit): Dimension {
  if (dimension.unit === targetUnit) {
    return { ...dimension };
  }

  // Convert to millimeters first, then to target unit
  const mmValue = dimension.value * CONVERSION_TO_MM[dimension.unit];
  const targetValue = mmValue * CONVERSION_FROM_MM[targetUnit];

  return {
    value: parseFloat(targetValue.toFixed(6)), // Round to 6 decimal places
    unit: targetUnit
  };
}

/**
 * Convert a dimension from one unit to another with DPI context for pixel conversions
 */
export function convertDimensionWithDPI(dimension: Dimension, targetUnit: DimensionUnit, dpi: number = 96): Dimension {
  return convertWithDPI(dimension, targetUnit, dpi);
}

/**
 * Convert a dimension pair to a target unit
 */
export function convertDimensionPair(pair: DimensionPair, targetUnit: DimensionUnit): DimensionPair {
  return {
    width: convertDimension(pair.width, targetUnit),
    height: convertDimension(pair.height, targetUnit)
  };
}

/**
 * Format a dimension value for display
 */
export function formatDimension(dimension: Dimension, precision: number = 2): string {
  // Remove unnecessary trailing zeros for better display
  let value = parseFloat(dimension.value.toFixed(precision));
  // For very small values or whole numbers, adjust display
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(precision).replace(/\.?0+$/, '');
  return `${formatted} ${getUnitSymbol(dimension.unit)}`;
}

/**
 * Format a dimension pair for display
 */
export function formatDimensionPair(pair: DimensionPair, precision: number = 2): string {
  const width = formatDimension(pair.width, precision);
  const height = formatDimension(pair.height, precision);
  return `${width} × ${height}`;
}

/**
 * Get the symbol for a dimension unit
 */
export function getUnitSymbol(unit: DimensionUnit): string {
  switch (unit) {
    case DimensionUnit.METER:
      return 'm';
    case DimensionUnit.CENTIMETER:
      return 'cm';
    case DimensionUnit.MILLIMETER:
      return 'mm';
    case DimensionUnit.INCH:
      return 'in';
    case DimensionUnit.PIXEL:
      return 'px';
    default:
      return unit;
  }
}

/**
 * Get the full name for a dimension unit
 */
export function getUnitName(unit: DimensionUnit): string {
  switch (unit) {
    case DimensionUnit.METER:
      return 'Meter';
    case DimensionUnit.CENTIMETER:
      return 'Centimeter';
    case DimensionUnit.MILLIMETER:
      return 'Millimeter';
    case DimensionUnit.INCH:
      return 'Inch';
    case DimensionUnit.PIXEL:
      return 'Pixel';
    default:
      return unit;
  }
}

/**
 * Create a dimension object with validation
 */
export function createDimension(value: number, unit: DimensionUnit): Dimension {
  const dimension = { value, unit };
  const result = DimensionSchema.safeParse(dimension);
  
  if (!result.success) {
    throw new Error(`Invalid dimension: ${result.error.message}`);
  }
  
  return dimension;
}

/**
 * Parse a dimension string (e.g., "10 cm", "5.5 in")
 */
export function parseDimension(input: string): Dimension | null {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length !== 2) {
    return null;
  }
  
  const value = parseFloat(parts[0]);
  const unitStr = parts[1].toLowerCase();
  
  if (isNaN(value)) {
    return null;
  }
  
  // Map unit strings to enum values
  const unitMap: Record<string, DimensionUnit> = {
    'm': DimensionUnit.METER,
    'meter': DimensionUnit.METER,
    'meters': DimensionUnit.METER,
    'cm': DimensionUnit.CENTIMETER,
    'centimeter': DimensionUnit.CENTIMETER,
    'centimeters': DimensionUnit.CENTIMETER,
    'mm': DimensionUnit.MILLIMETER,
    'millimeter': DimensionUnit.MILLIMETER,
    'millimeters': DimensionUnit.MILLIMETER,
    'in': DimensionUnit.INCH,
    'inch': DimensionUnit.INCH,
    'inches': DimensionUnit.INCH,
    'px': DimensionUnit.PIXEL,
    'pixel': DimensionUnit.PIXEL,
    'pixels': DimensionUnit.PIXEL
  };
  
  const unit = unitMap[unitStr];
  if (!unit) {
    return null;
  }
  
  try {
    return createDimension(value, unit);
  } catch {
    return null;
  }
}

/**
 * Get all available dimension units
 */
export function getAllUnits(): DimensionUnit[] {
  return Object.values(DimensionUnit);
}

/**
 * Check if two dimensions are equal (after conversion)
 */
export function areDimensionsEqual(dim1: Dimension, dim2: Dimension, tolerance: number = 0.001): boolean {
  const converted = convertDimension(dim2, dim1.unit);
  return Math.abs(dim1.value - converted.value) <= tolerance;
}

/**
 * Get common presets for different units
 */
export function getCommonPresets(unit: DimensionUnit): Array<{ name: string; dimensions: DimensionPair }> {
  const presets = [
    {
      name: 'A4 Paper',
      width: createDimension(210, DimensionUnit.MILLIMETER),
      height: createDimension(297, DimensionUnit.MILLIMETER)
    },
    {
      name: 'Letter Paper',
      width: createDimension(8.5, DimensionUnit.INCH),
      height: createDimension(11, DimensionUnit.INCH)
    },
    {
      name: 'Business Card',
      width: createDimension(85, DimensionUnit.MILLIMETER),
      height: createDimension(55, DimensionUnit.MILLIMETER)
    },
    {
      name: 'Photo 4x6',
      width: createDimension(4, DimensionUnit.INCH),
      height: createDimension(6, DimensionUnit.INCH)
    },
    {
      name: 'Square Instagram',
      width: createDimension(1080, DimensionUnit.PIXEL),
      height: createDimension(1080, DimensionUnit.PIXEL)
    }
  ];

  return presets.map(preset => ({
    name: preset.name,
    dimensions: convertDimensionPair({
      width: preset.width,
      height: preset.height
    }, unit)
  }));
}

/**
 * Calculate aspect ratio from dimensions
 */
export function getAspectRatio(pair: DimensionPair): number {
  const width = convertDimension(pair.width, DimensionUnit.MILLIMETER);
  const height = convertDimension(pair.height, DimensionUnit.MILLIMETER);
  return width.value / height.value;
}

/**
 * Scale dimensions while maintaining aspect ratio
 */
export function scaleDimensions(
  pair: DimensionPair, 
  scaleFactor: number, 
  targetUnit?: DimensionUnit
): DimensionPair {
  const result = {
    width: createDimension(pair.width.value * scaleFactor, pair.width.unit),
    height: createDimension(pair.height.value * scaleFactor, pair.height.unit)
  };

  return targetUnit ? convertDimensionPair(result, targetUnit) : result;
}

/**
 * Fit dimensions to a maximum size while maintaining aspect ratio
 */
export function fitDimensions(
  pair: DimensionPair,
  maxDimension: Dimension,
  targetUnit?: DimensionUnit
): DimensionPair {
  const converted = convertDimensionPair(pair, maxDimension.unit);
  const aspectRatio = getAspectRatio(converted);
  
  let newWidth: number;
  let newHeight: number;
  
  if (converted.width.value > converted.height.value) {
    // Width is larger, scale by width
    newWidth = Math.min(converted.width.value, maxDimension.value);
    newHeight = newWidth / aspectRatio;
  } else {
    // Height is larger, scale by height
    newHeight = Math.min(converted.height.value, maxDimension.value);
    newWidth = newHeight * aspectRatio;
  }
  
  const result = {
    width: createDimension(newWidth, maxDimension.unit),
    height: createDimension(newHeight, maxDimension.unit)
  };
  
  return targetUnit ? convertDimensionPair(result, targetUnit) : result;
}

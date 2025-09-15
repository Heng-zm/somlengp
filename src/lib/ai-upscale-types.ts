/**
 * AI Image Upscaling Types and Interfaces
 * Defines the structure for AI-powered image enhancement and upscaling
 */

export interface UpscaleOptions {
  /** Scale factor (2x, 4x, 8x) */
  scaleFactor: 2 | 4 | 8;
  /** AI model to use for upscaling */
  model: 'real-esrgan' | 'waifu2x' | 'esrgan' | 'fast-upscale' | 'gemini';
  /** Whether to enhance faces specifically */
  enhanceFaces?: boolean;
  /** Noise reduction level (0-3) */
  noiseReduction?: 0 | 1 | 2 | 3;
  /** Output quality (1-100) */
  quality?: number;
  /** Whether to preserve transparency for PNG images */
  preserveTransparency?: boolean;
  /** Gemini-specific options */
  geminiOptions?: {
    /** Gemini model variant */
    modelVariant?: 'gemini-pro-vision' | 'gemini-1.5-pro-vision';
    /** Custom prompt for upscaling guidance */
    customPrompt?: string;
    /** Temperature for AI creativity (0.0-1.0) */
    temperature?: number;
    /** Use advanced vision analysis */
    advancedVision?: boolean;
  };
}

export interface UpscaleRequest {
  /** Input image as base64 string or File object */
  image: string | File;
  /** Upscaling options */
  options: UpscaleOptions;
  /** Optional callback for progress updates */
  onProgress?: (progress: UpscaleProgress) => void;
}

export interface UpscaleResult {
  /** Success status */
  success: boolean;
  /** Upscaled image as base64 string */
  image?: string;
  /** Original dimensions */
  originalDimensions: {
    width: number;
    height: number;
  };
  /** New dimensions after upscaling */
  newDimensions: {
    width: number;
    height: number;
  };
  /** Processing time in milliseconds */
  processingTime: number;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    modelUsed: string;
    actualScaleFactor: number;
    fileSize: {
      original: number;
      upscaled: number;
    };
  };
}

export interface UpscaleProgress {
  /** Current progress (0-100) */
  progress: number;
  /** Current step description */
  step: string;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

export interface UpscaleModel {
  /** Model identifier */
  id: string;
  /** Display name */
  name: string;
  /** Model description */
  description: string;
  /** Supported scale factors */
  supportedScales: (2 | 4 | 8)[];
  /** Whether model supports face enhancement */
  supportsFaceEnhancement: boolean;
  /** Typical processing time per megapixel (in seconds) */
  processingTimePerMP: number;
  /** Model quality rating (1-5) */
  qualityRating: number;
  /** Model speed rating (1-5, 5 being fastest) */
  speedRating: number;
}

export interface UpscalePreset {
  /** Preset identifier */
  id: string;
  /** Display name */
  name: string;
  /** Preset description */
  description: string;
  /** Pre-configured options */
  options: UpscaleOptions;
  /** Recommended use cases */
  useCases: string[];
}

// Predefined AI upscale models
export const AI_UPSCALE_MODELS: UpscaleModel[] = [
  {
    id: 'real-esrgan',
    name: 'Real-ESRGAN',
    description: 'High-quality upscaling for photos and artwork with excellent detail preservation',
    supportedScales: [2, 4, 8],
    supportsFaceEnhancement: true,
    processingTimePerMP: 2.5,
    qualityRating: 5,
    speedRating: 3
  },
  {
    id: 'waifu2x',
    name: 'Waifu2x',
    description: 'Specialized for anime and artwork with noise reduction capabilities',
    supportedScales: [2, 4],
    supportsFaceEnhancement: false,
    processingTimePerMP: 1.8,
    qualityRating: 4,
    speedRating: 4
  },
  {
    id: 'esrgan',
    name: 'ESRGAN',
    description: 'Enhanced Super-Resolution GAN for natural images and textures',
    supportedScales: [2, 4],
    supportsFaceEnhancement: true,
    processingTimePerMP: 3.2,
    qualityRating: 4,
    speedRating: 2
  },
  {
    id: 'fast-upscale',
    name: 'Fast Upscale',
    description: 'Quick upscaling with good quality for time-sensitive tasks',
    supportedScales: [2, 4],
    supportsFaceEnhancement: false,
    processingTimePerMP: 0.8,
    qualityRating: 3,
    speedRating: 5
  },
  {
    id: 'gemini',
    name: 'Gemini AI Vision',
    description: 'Advanced AI upscaling using Google Gemini with intelligent content analysis',
    supportedScales: [2, 4, 8],
    supportsFaceEnhancement: true,
    processingTimePerMP: 2.0,
    qualityRating: 5,
    speedRating: 3
  }
];

// Predefined upscale presets
export const UPSCALE_PRESETS: UpscalePreset[] = [
  {
    id: 'photo-enhance',
    name: 'Photo Enhancement',
    description: 'Optimal settings for enhancing photographs',
    options: {
      scaleFactor: 4,
      model: 'real-esrgan',
      enhanceFaces: true,
      noiseReduction: 2,
      quality: 95,
      preserveTransparency: false
    },
    useCases: ['Portrait photos', 'Landscape photography', 'General photography']
  },
  {
    id: 'artwork-upscale',
    name: 'Artwork & Illustrations',
    description: 'Perfect for digital art, anime, and illustrations',
    options: {
      scaleFactor: 4,
      model: 'waifu2x',
      enhanceFaces: false,
      noiseReduction: 3,
      quality: 100,
      preserveTransparency: true
    },
    useCases: ['Digital artwork', 'Anime images', 'Illustrations', 'Game assets']
  },
  {
    id: 'print-ready',
    name: 'Print Ready',
    description: 'High-resolution output suitable for printing',
    options: {
      scaleFactor: 8,
      model: 'real-esrgan',
      enhanceFaces: true,
      noiseReduction: 1,
      quality: 100,
      preserveTransparency: false
    },
    useCases: ['Print materials', 'Large format printing', 'Professional photography']
  },
  {
    id: 'quick-upscale',
    name: 'Quick Enhancement',
    description: 'Fast processing with good results',
    options: {
      scaleFactor: 2,
      model: 'fast-upscale',
      enhanceFaces: false,
      noiseReduction: 1,
      quality: 85,
      preserveTransparency: true
    },
    useCases: ['Quick previews', 'Social media', 'Web use', 'Batch processing']
  },
  {
    id: 'gemini-intelligent',
    name: 'Gemini Intelligent Enhancement',
    description: 'AI-powered upscaling with content-aware optimization',
    options: {
      scaleFactor: 4,
      model: 'gemini',
      enhanceFaces: true,
      noiseReduction: 2,
      quality: 95,
      preserveTransparency: true,
      geminiOptions: {
        modelVariant: 'gemini-1.5-pro-vision',
        temperature: 0.3,
        advancedVision: true,
        customPrompt: 'Enhance this image while preserving natural details and textures'
      }
    },
    useCases: ['Professional photography', 'Complex scenes', 'Mixed content', 'AI-guided enhancement']
  },
  {
    id: 'gemini-creative',
    name: 'Gemini Creative Upscale',
    description: 'Creative AI enhancement with artistic interpretation',
    options: {
      scaleFactor: 4,
      model: 'gemini',
      enhanceFaces: true,
      noiseReduction: 1,
      quality: 100,
      preserveTransparency: true,
      geminiOptions: {
        modelVariant: 'gemini-pro-vision',
        temperature: 0.7,
        advancedVision: true,
        customPrompt: 'Creatively enhance this image with improved details and artistic quality'
      }
    },
    useCases: ['Artistic photos', 'Creative projects', 'Digital art enhancement', 'Stylized upscaling']
  }
];

export type UpscaleStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface UpscaleState {
  status: UpscaleStatus;
  progress: UpscaleProgress | null;
  result: UpscaleResult | null;
  error: string | null;
}
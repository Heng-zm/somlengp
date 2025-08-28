'use client';

import { errorHandler, ValidationError } from '@/lib/error-utils';

/**
 * Advanced QR Code Detection Utility
 * Provides enhanced QR code detection with image preprocessing and multiple detection strategies
 */

export interface QRDetectionResult {
  data: string;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
  confidence?: number;
  processingTime: number;
  strategy: string;
}

export interface QRDetectionOptions {
  enablePreprocessing?: boolean;
  enableRotationCorrection?: boolean;
  enableContrastEnhancement?: boolean;
  enableBlurReduction?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
  minQuality?: number;
}

class AdvancedQRDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private preprocessingCanvas: HTMLCanvasElement;
  private preprocessingCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.preprocessingCanvas = document.createElement('canvas');
    this.preprocessingCtx = this.preprocessingCanvas.getContext('2d')!;
  }

  /**
   * Detect QR code with advanced preprocessing and multiple strategies
   */
  async detectQRCode(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
    options: QRDetectionOptions = {}
  ): Promise<QRDetectionResult | null> {
    const startTime = performance.now();
    
    const {
      enablePreprocessing = true,
      enableRotationCorrection = true,
      enableContrastEnhancement = true,
      enableBlurReduction = true,
      maxRetries = 3,
      timeoutMs = 5000,
      minQuality = 0.3
    } = options;

    try {
      // Ensure jsQR is available
      if (!window.jsQR) {
        throw new Error('jsQR library not loaded');
      }

      const strategies = [
        // Strategy 1: Direct detection
        () => this.directDetection(imageSource),
        
        // Strategy 2: With preprocessing
        ...(enablePreprocessing ? [
          () => this.detectionWithPreprocessing(imageSource, {
            enableContrastEnhancement,
            enableBlurReduction
          })
        ] : []),
        
        // Strategy 3: With rotation correction
        ...(enableRotationCorrection ? [
          () => this.detectionWithRotation(imageSource, enablePreprocessing)
        ] : []),
        
        // Strategy 4: Multi-scale detection
        () => this.multiScaleDetection(imageSource),
        
        // Strategy 5: Region-based detection
        () => this.regionBasedDetection(imageSource)
      ];

      // Try each strategy with timeout
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        for (let i = 0; i < strategies.length; i++) {
          try {
            const strategy = strategies[i];
            const result = await Promise.race([
              strategy(),
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Detection timeout')), timeoutMs / strategies.length)
              )
            ]);

            if (result && this.isValidQRResult(result, minQuality)) {
              const processingTime = performance.now() - startTime;
              return {
                ...result,
                processingTime,
                strategy: this.getStrategyName(i)
              };
            }
          } catch (error) {
            console.warn(`Strategy ${i + 1} failed:`, error);
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      errorHandler.handle(error, { method: 'detectQRCode', options });
      return null;
    }
  }

  private async directDetection(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData
  ): Promise<Omit<QRDetectionResult, 'processingTime' | 'strategy'> | null> {
    try {
      const imageData = this.getImageData(imageSource);
      const result = window.jsQR(imageData.data, imageData.width, imageData.height) as any;
      
      if (result) {
        return {
          data: result.data,
          location: result.location ? {
            topLeftCorner: result.location.topLeftCorner,
            topRightCorner: result.location.topRightCorner,
            bottomLeftCorner: result.location.bottomLeftCorner,
            bottomRightCorner: result.location.bottomRightCorner
          } : undefined,
          confidence: this.calculateConfidence(result)
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Direct detection failed:', error);
      return null;
    }
  }

  private async detectionWithPreprocessing(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
    options: { enableContrastEnhancement: boolean; enableBlurReduction: boolean }
  ): Promise<Omit<QRDetectionResult, 'processingTime' | 'strategy'> | null> {
    try {
      let imageData = this.getImageData(imageSource);
      
      // Apply preprocessing steps
      if (options.enableContrastEnhancement) {
        imageData = this.enhanceContrast(imageData);
      }
      
      if (options.enableBlurReduction) {
        imageData = this.reduceBlur(imageData);
      }
      
      // Convert to grayscale for better detection
      imageData = this.toGrayscale(imageData);
      
      // Apply adaptive thresholding
      imageData = this.adaptiveThreshold(imageData);
      
      const result = window.jsQR(imageData.data, imageData.width, imageData.height) as any;
      
      if (result) {
        return {
          data: result.data,
          location: result.location ? {
            topLeftCorner: result.location.topLeftCorner,
            topRightCorner: result.location.topRightCorner,
            bottomLeftCorner: result.location.bottomLeftCorner,
            bottomRightCorner: result.location.bottomRightCorner
          } : undefined,
          confidence: this.calculateConfidence(result)
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Preprocessing detection failed:', error);
      return null;
    }
  }

  private async detectionWithRotation(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
    enablePreprocessing: boolean = true
  ): Promise<Omit<QRDetectionResult, 'processingTime' | 'strategy'> | null> {
    try {
      const rotationAngles = [0, 90, 180, 270, 45, 135, 225, 315];
      
      for (const angle of rotationAngles) {
        let imageData = this.rotateImageData(this.getImageData(imageSource), angle);
        
        if (enablePreprocessing) {
          imageData = this.enhanceContrast(imageData);
          imageData = this.toGrayscale(imageData);
          imageData = this.adaptiveThreshold(imageData);
        }
        
        const result = window.jsQR(imageData.data, imageData.width, imageData.height) as any;
        
        if (result) {
          return {
            data: result.data,
            location: result.location ? {
              topLeftCorner: result.location.topLeftCorner,
              topRightCorner: result.location.topRightCorner,
              bottomLeftCorner: result.location.bottomLeftCorner,
              bottomRightCorner: result.location.bottomRightCorner
            } : undefined,
            confidence: this.calculateConfidence(result)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Rotation detection failed:', error);
      return null;
    }
  }

  private async multiScaleDetection(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData
  ): Promise<Omit<QRDetectionResult, 'processingTime' | 'strategy'> | null> {
    try {
      const scales = [1.0, 1.5, 2.0, 0.75, 0.5];
      
      for (const scale of scales) {
        let imageData = this.getImageData(imageSource);
        
        if (scale !== 1.0) {
          imageData = this.scaleImageData(imageData, scale);
        }
        
        // Apply basic preprocessing
        imageData = this.enhanceContrast(imageData);
        imageData = this.toGrayscale(imageData);
        
        const result = window.jsQR(imageData.data, imageData.width, imageData.height) as any;
        
        if (result) {
          return {
            data: result.data,
            location: result.location ? {
              topLeftCorner: result.location.topLeftCorner,
              topRightCorner: result.location.topRightCorner,
              bottomLeftCorner: result.location.bottomLeftCorner,
              bottomRightCorner: result.location.bottomRightCorner
            } : undefined,
            confidence: this.calculateConfidence(result)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Multi-scale detection failed:', error);
      return null;
    }
  }

  private async regionBasedDetection(
    imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData
  ): Promise<Omit<QRDetectionResult, 'processingTime' | 'strategy'> | null> {
    try {
      const fullImageData = this.getImageData(imageSource);
      const { width, height } = fullImageData;
      
      // Define regions to scan (center, quarters, etc.)
      const regions = [
        // Center region
        { x: width * 0.25, y: height * 0.25, w: width * 0.5, h: height * 0.5 },
        // Top regions
        { x: width * 0.1, y: height * 0.1, w: width * 0.4, h: height * 0.4 },
        { x: width * 0.5, y: height * 0.1, w: width * 0.4, h: height * 0.4 },
        // Bottom regions
        { x: width * 0.1, y: height * 0.5, w: width * 0.4, h: height * 0.4 },
        { x: width * 0.5, y: height * 0.5, w: width * 0.4, h: height * 0.4 },
        // Full image as fallback
        { x: 0, y: 0, w: width, h: height }
      ];
      
      for (const region of regions) {
        try {
          const regionImageData = this.extractRegion(fullImageData, region);
          const processedImageData = this.toGrayscale(this.enhanceContrast(regionImageData));
          
          const result = window.jsQR(processedImageData.data, processedImageData.width, processedImageData.height) as any;
          
          if (result) {
            return {
              data: result.data,
              location: result.location ? {
                topLeftCorner: { 
                  x: result.location.topLeftCorner.x + region.x, 
                  y: result.location.topLeftCorner.y + region.y 
                },
                topRightCorner: { 
                  x: result.location.topRightCorner.x + region.x, 
                  y: result.location.topRightCorner.y + region.y 
                },
                bottomLeftCorner: { 
                  x: result.location.bottomLeftCorner.x + region.x, 
                  y: result.location.bottomLeftCorner.y + region.y 
                },
                bottomRightCorner: { 
                  x: result.location.bottomRightCorner.x + region.x, 
                  y: result.location.bottomRightCorner.y + region.y 
                }
              } : undefined,
              confidence: this.calculateConfidence(result)
            };
          }
        } catch (error) {
          console.warn('Region detection failed for region:', region, error);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Region-based detection failed:', error);
      return null;
    }
  }

  // Image processing utilities
  private getImageData(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData): ImageData {
    if (source instanceof ImageData) {
      return source;
    }
    
    if (source instanceof HTMLCanvasElement) {
      return source.getContext('2d')!.getImageData(0, 0, source.width, source.height);
    }
    
    // For video and image elements
    this.canvas.width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth || source.width;
    this.canvas.height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight || source.height;
    
    this.ctx.drawImage(source, 0, 0);
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  private enhanceContrast(imageData: ImageData, factor: number = 1.5): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      for (let j = 0; j < 3; j++) {
        const value = data[i + j];
        const enhanced = ((value - 128) * factor) + 128;
        data[i + j] = Math.max(0, Math.min(255, enhanced));
      }
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  private reduceBlur(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const { width, height } = imageData;
    
    // Simple sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += imageData.data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    return new ImageData(data, width, height);
  }

  private toGrayscale(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // Alpha remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }

  private adaptiveThreshold(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const { width, height } = imageData;
    const blockSize = 15;
    const C = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        // Calculate mean in neighborhood
        for (let dy = -blockSize; dy <= blockSize; dy++) {
          for (let dx = -blockSize; dx <= blockSize; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += imageData.data[(ny * width + nx) * 4];
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const idx = (y * width + x) * 4;
        const value = imageData.data[idx];
        const threshold = value > mean - C ? 255 : 0;
        
        data[idx] = threshold;
        data[idx + 1] = threshold;
        data[idx + 2] = threshold;
      }
    }
    
    return new ImageData(data, width, height);
  }

  private rotateImageData(imageData: ImageData, angle: number): ImageData {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const { width, height } = imageData;
    
    // Calculate new dimensions
    const newWidth = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin));
    const newHeight = Math.ceil(Math.abs(width * sin) + Math.abs(height * cos));
    
    this.preprocessingCanvas.width = newWidth;
    this.preprocessingCanvas.height = newHeight;
    
    // Create temporary canvas with original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Clear and rotate
    this.preprocessingCtx.clearRect(0, 0, newWidth, newHeight);
    this.preprocessingCtx.save();
    this.preprocessingCtx.translate(newWidth / 2, newHeight / 2);
    this.preprocessingCtx.rotate(radians);
    this.preprocessingCtx.drawImage(tempCanvas, -width / 2, -height / 2);
    this.preprocessingCtx.restore();
    
    return this.preprocessingCtx.getImageData(0, 0, newWidth, newHeight);
  }

  private scaleImageData(imageData: ImageData, scale: number): ImageData {
    const { width, height } = imageData;
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    this.preprocessingCanvas.width = newWidth;
    this.preprocessingCanvas.height = newHeight;
    
    // Create temporary canvas with original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Scale
    this.preprocessingCtx.clearRect(0, 0, newWidth, newHeight);
    this.preprocessingCtx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);
    
    return this.preprocessingCtx.getImageData(0, 0, newWidth, newHeight);
  }

  private extractRegion(imageData: ImageData, region: { x: number; y: number; w: number; h: number }): ImageData {
    const { x, y, w, h } = region;
    const { width } = imageData;
    
    // Ensure region is within bounds
    const actualX = Math.max(0, Math.min(width - 1, Math.round(x)));
    const actualY = Math.max(0, Math.min(imageData.height - 1, Math.round(y)));
    const actualW = Math.max(1, Math.min(width - actualX, Math.round(w)));
    const actualH = Math.max(1, Math.min(imageData.height - actualY, Math.round(h)));
    
    const regionData = new Uint8ClampedArray(actualW * actualH * 4);
    
    for (let row = 0; row < actualH; row++) {
      const sourceRow = actualY + row;
      const sourceStart = (sourceRow * width + actualX) * 4;
      const targetStart = row * actualW * 4;
      const copyLength = actualW * 4;
      
      regionData.set(
        imageData.data.subarray(sourceStart, sourceStart + copyLength),
        targetStart
      );
    }
    
    return new ImageData(regionData, actualW, actualH);
  }

  private calculateConfidence(result: any): number {
    // Basic confidence calculation based on QR code properties
    if (!result.location) return 0.5;
    
    // Calculate area and aspect ratio of QR code
    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = result.location;
    
    const width1 = Math.sqrt(Math.pow(topRightCorner.x - topLeftCorner.x, 2) + Math.pow(topRightCorner.y - topLeftCorner.y, 2));
    const width2 = Math.sqrt(Math.pow(bottomRightCorner.x - bottomLeftCorner.x, 2) + Math.pow(bottomRightCorner.y - bottomLeftCorner.y, 2));
    const height1 = Math.sqrt(Math.pow(bottomLeftCorner.x - topLeftCorner.x, 2) + Math.pow(bottomLeftCorner.y - topLeftCorner.y, 2));
    const height2 = Math.sqrt(Math.pow(bottomRightCorner.x - topRightCorner.x, 2) + Math.pow(bottomRightCorner.y - topRightCorner.y, 2));
    
    const avgWidth = (width1 + width2) / 2;
    const avgHeight = (height1 + height2) / 2;
    const aspectRatio = avgWidth / avgHeight;
    
    // QR codes should be roughly square
    const aspectRatioScore = Math.max(0, 1 - Math.abs(aspectRatio - 1));
    
    // Larger QR codes generally have higher confidence
    const sizeScore = Math.min(1, Math.sqrt(avgWidth * avgHeight) / 200);
    
    // Data length can indicate quality
    const dataLengthScore = Math.min(1, result.data.length / 100);
    
    return (aspectRatioScore * 0.4 + sizeScore * 0.4 + dataLengthScore * 0.2);
  }

  private isValidQRResult(result: any, minQuality: number): boolean {
    if (!result || !result.data) return false;
    if (result.data.length < 3) return false; // Very short data might be noise
    if (result.confidence && result.confidence < minQuality) return false;
    
    return true;
  }

  private getStrategyName(index: number): string {
    const strategies = [
      'direct',
      'preprocessed',
      'rotation-corrected',
      'multi-scale',
      'region-based'
    ];
    return strategies[Math.min(index, strategies.length - 1)] || 'unknown';
  }
}

// Export singleton instance
export const advancedQRDetector = new AdvancedQRDetector();

// Export convenience function
export async function detectQRCodeAdvanced(
  imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData,
  options?: QRDetectionOptions
): Promise<QRDetectionResult | null> {
  return advancedQRDetector.detectQRCode(imageSource, options);
}

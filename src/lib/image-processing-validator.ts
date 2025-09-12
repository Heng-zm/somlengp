'use client';

// Enhanced validation and error handling system for image processing

export interface ValidationConfig {
  maxFileSize: number;
  minFileSize: number;
  maxDimensions: { width: number; height: number };
  minDimensions: { width: number; height: number };
  supportedFormats: string[];
  maxConcurrentFiles: number;
  qualityRange: { min: number; max: number };
  allowUpscaling: boolean;
  maxUpscaleRatio: number;
  memoryThreshold: number; // in bytes
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
}

export interface ValidationError {
  type: 'file' | 'dimension' | 'format' | 'memory' | 'performance' | 'security';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  value?: any;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'quality' | 'compatibility' | 'user_experience';
  message: string;
  suggestion?: string;
}

export interface Recommendation {
  type: 'optimization' | 'quality' | 'performance' | 'compatibility';
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  minFileSize: 100, // 100 bytes
  maxDimensions: { width: 8192, height: 8192 },
  minDimensions: { width: 1, height: 1 },
  supportedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'],
  maxConcurrentFiles: 10,
  qualityRange: { min: 1, max: 100 },
  allowUpscaling: true,
  maxUpscaleRatio: 4.0,
  memoryThreshold: 100 * 1024 * 1024 // 100MB
};

// Enhanced error messages with user-friendly explanations
const ERROR_MESSAGES = {
  // File errors
  'file.too_large': (size: number, max: number) => ({
    message: `File size (${Math.round(size / 1024 / 1024)}MB) exceeds the maximum allowed size of ${Math.round(max / 1024 / 1024)}MB.`,
    suggestion: `Try compressing the image or reducing its dimensions before uploading.`
  }),
  
  'file.too_small': (size: number, min: number) => ({
    message: `File size (${size} bytes) is too small. Minimum size is ${min} bytes.`,
    suggestion: `The file might be corrupted or empty. Please select a valid image file.`
  }),
  
  'file.corrupted': () => ({
    message: `The file appears to be corrupted or is not a valid image.`,
    suggestion: `Try opening the file in an image editor to verify it's valid, or use a different image.`
  }),
  
  'file.unsupported_format': (format: string, supported: string[]) => ({
    message: `Format '${format}' is not supported. Supported formats: ${supported.join(', ')}.`,
    suggestion: `Convert your image to one of the supported formats using an image editor.`
  }),
  
  // Dimension errors
  'dimension.too_large': (width: number, height: number, maxW: number, maxH: number) => ({
    message: `Dimensions ${width}×${height} exceed maximum allowed size of ${maxW}×${maxH}.`,
    suggestion: `Reduce the target dimensions or use the "Fit to bounds" option.`
  }),
  
  'dimension.too_small': (width: number, height: number, minW: number, minH: number) => ({
    message: `Dimensions ${width}×${height} are below minimum size of ${minW}×${minH}.`,
    suggestion: `Increase the dimensions to at least ${minW}×${minH} pixels.`
  }),
  
  'dimension.invalid_ratio': (ratio: number) => ({
    message: `Aspect ratio ${ratio.toFixed(3)} is extreme and may cause processing issues.`,
    suggestion: `Consider using more balanced dimensions for better results.`
  }),
  
  'dimension.excessive_upscaling': (factor: number, max: number) => ({
    message: `Upscaling by ${factor.toFixed(1)}× exceeds the recommended maximum of ${max}×.`,
    suggestion: `Large upscaling factors can significantly reduce image quality. Consider using the original size or a smaller scale factor.`
  }),
  
  // Quality errors
  'quality.invalid_range': (quality: number, min: number, max: number) => ({
    message: `Quality value ${quality} must be between ${min} and ${max}.`,
    suggestion: `Adjust the quality setting to a value between ${min} and ${max}.`
  }),
  
  // Memory errors
  'memory.insufficient': (required: number, available: number) => ({
    message: `Processing requires approximately ${Math.round(required / 1024 / 1024)}MB of memory, but only ${Math.round(available / 1024 / 1024)}MB is available.`,
    suggestion: `Try reducing image dimensions, closing other applications, or processing fewer images at once.`
  }),
  
  'memory.high_pressure': (usage: number) => ({
    message: `System memory usage is high (${Math.round(usage)}%). Processing may be slower or fail.`,
    suggestion: `Close other applications or wait for memory usage to decrease before processing large images.`
  }),
  
  // Performance errors
  'performance.too_many_files': (count: number, max: number) => ({
    message: `Cannot process ${count} files simultaneously. Maximum is ${max} files.`,
    suggestion: `Process files in smaller batches for better performance and reliability.`
  }),
  
  'performance.large_batch': (totalSize: number) => ({
    message: `Batch processing ${Math.round(totalSize / 1024 / 1024)}MB of images may be slow.`,
    suggestion: `Consider processing in smaller batches or reducing image dimensions.`
  })
} as const;

class ImageProcessingValidator {
  private config: ValidationConfig;
  private memoryApi: any;

  constructor(config: ValidationConfig = DEFAULT_VALIDATION_CONFIG) {
    this.config = config;
    this.memoryApi = (performance as any).memory;
  }

  // Validate a single file
  validateFile(file: File, targetDimensions?: { width: number; height: number }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Basic file validation
    this.validateFileSize(file, result);
    this.validateFileFormat(file, result);
    this.validateFileIntegrity(file, result);

    // Dimension validation if provided
    if (targetDimensions) {
      this.validateDimensions(targetDimensions.width, targetDimensions.height, result);
      this.validateMemoryRequirements(file, targetDimensions, result);
    }

    // Generate recommendations
    this.generateRecommendations(file, targetDimensions, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validate batch processing
  validateBatch(files: File[], targetDimensions?: { width: number; height: number }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Check file count
    if (files.length > this.config.maxConcurrentFiles) {
      result.errors.push({
        type: 'performance',
        code: 'performance.too_many_files',
        message: ERROR_MESSAGES['performance.too_many_files'](files.length, this.config.maxConcurrentFiles).message,
        severity: 'high',
        suggestion: ERROR_MESSAGES['performance.too_many_files'](files.length, this.config.maxConcurrentFiles).suggestion
      });
    }

    // Validate total batch size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 200 * 1024 * 1024) { // 200MB threshold
      result.warnings.push({
        type: 'performance',
        message: ERROR_MESSAGES['performance.large_batch'](totalSize).message,
        suggestion: ERROR_MESSAGES['performance.large_batch'](totalSize).suggestion
      });
    }

    // Validate each file
    files.forEach((file, index) => {
      const fileResult = this.validateFile(file, targetDimensions);
      
      // Merge errors with file index
      fileResult.errors.forEach(error => {
        result.errors.push({
          ...error,
          field: `file[${index}]`,
          message: `File "${file.name}": ${error.message}`
        });
      });

      result.warnings.push(...fileResult.warnings);
    });

    // Check memory for batch processing
    this.validateBatchMemory(files, targetDimensions, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validate processing parameters
  validateProcessingParams(params: {
    width: number;
    height: number;
    quality: number;
    format: string;
    originalDimensions?: { width: number; height: number };
  }): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Validate dimensions
    this.validateDimensions(params.width, params.height, result);

    // Validate quality
    this.validateQuality(params.quality, result);

    // Validate format
    if (!this.isFormatSupported(params.format)) {
      result.errors.push({
        type: 'format',
        code: 'format.unsupported',
        message: `Output format '${params.format}' is not supported.`,
        severity: 'high',
        field: 'format',
        value: params.format,
        suggestion: `Use one of the supported formats: ${this.config.supportedFormats.join(', ')}`
      });
    }

    // Check for excessive upscaling
    if (params.originalDimensions) {
      const upscaleFactor = Math.max(
        params.width / params.originalDimensions.width,
        params.height / params.originalDimensions.height
      );

      if (upscaleFactor > this.config.maxUpscaleRatio) {
        result.errors.push({
          type: 'dimension',
          code: 'dimension.excessive_upscaling',
          message: ERROR_MESSAGES['dimension.excessive_upscaling'](upscaleFactor, this.config.maxUpscaleRatio).message,
          severity: 'medium',
          suggestion: ERROR_MESSAGES['dimension.excessive_upscaling'](upscaleFactor, this.config.maxUpscaleRatio).suggestion
        });
      } else if (upscaleFactor > 2) {
        result.warnings.push({
          type: 'quality',
          message: `Upscaling by ${upscaleFactor.toFixed(1)}× may reduce image quality.`,
          suggestion: 'Consider using smaller dimensions for better quality results.'
        });
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Private validation methods
  private validateFileSize(file: File, result: ValidationResult): void {
    if (file.size > this.config.maxFileSize) {
      result.errors.push({
        type: 'file',
        code: 'file.too_large',
        message: ERROR_MESSAGES['file.too_large'](file.size, this.config.maxFileSize).message,
        severity: 'high',
        field: 'size',
        value: file.size,
        suggestion: ERROR_MESSAGES['file.too_large'](file.size, this.config.maxFileSize).suggestion
      });
    }

    if (file.size < this.config.minFileSize) {
      result.errors.push({
        type: 'file',
        code: 'file.too_small',
        message: ERROR_MESSAGES['file.too_small'](file.size, this.config.minFileSize).message,
        severity: 'high',
        field: 'size',
        value: file.size,
        suggestion: ERROR_MESSAGES['file.too_small'](file.size, this.config.minFileSize).suggestion
      });
    }
  }

  private validateFileFormat(file: File, result: ValidationResult): void {
    if (!file.type || !this.isFormatSupported(file.type)) {
      result.errors.push({
        type: 'format',
        code: 'file.unsupported_format',
        message: ERROR_MESSAGES['file.unsupported_format'](file.type || 'unknown', this.config.supportedFormats).message,
        severity: 'high',
        field: 'type',
        value: file.type,
        suggestion: ERROR_MESSAGES['file.unsupported_format'](file.type || 'unknown', this.config.supportedFormats).suggestion
      });
    }
  }

  private validateFileIntegrity(file: File, result: ValidationResult): void {
    // Basic integrity checks
    if (file.name.length === 0) {
      result.warnings.push({
        type: 'user_experience',
        message: 'File has no name. It may be difficult to identify after processing.',
        suggestion: 'Consider renaming the file before processing.'
      });
    }

    // Check for suspicious file extensions vs MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const expectedMimeTypes = {
      'jpg': ['image/jpeg', 'image/jpg'],
      'jpeg': ['image/jpeg', 'image/jpg'],
      'png': ['image/png'],
      'webp': ['image/webp'],
      'gif': ['image/gif'],
      'bmp': ['image/bmp'],
      'tiff': ['image/tiff'],
      'tif': ['image/tiff']
    };

    if (extension && expectedMimeTypes[extension as keyof typeof expectedMimeTypes]) {
      const expectedTypes = expectedMimeTypes[extension as keyof typeof expectedMimeTypes];
      if (!expectedTypes.includes(file.type)) {
        result.warnings.push({
          type: 'compatibility',
          message: `File extension '.${extension}' doesn't match MIME type '${file.type}'.`,
          suggestion: 'The file may have been renamed incorrectly or could be corrupted.'
        });
      }
    }
  }

  private validateDimensions(width: number, height: number, result: ValidationResult): void {
    // Check if dimensions are valid numbers
    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      result.errors.push({
        type: 'dimension',
        code: 'dimension.invalid',
        message: 'Width and height must be positive numbers.',
        severity: 'high',
        field: 'dimensions',
        value: { width, height }
      });
      return;
    }

    // Check maximum dimensions
    if (width > this.config.maxDimensions.width || height > this.config.maxDimensions.height) {
      result.errors.push({
        type: 'dimension',
        code: 'dimension.too_large',
        message: ERROR_MESSAGES['dimension.too_large'](width, height, this.config.maxDimensions.width, this.config.maxDimensions.height).message,
        severity: 'high',
        field: 'dimensions',
        value: { width, height },
        suggestion: ERROR_MESSAGES['dimension.too_large'](width, height, this.config.maxDimensions.width, this.config.maxDimensions.height).suggestion
      });
    }

    // Check minimum dimensions
    if (width < this.config.minDimensions.width || height < this.config.minDimensions.height) {
      result.errors.push({
        type: 'dimension',
        code: 'dimension.too_small',
        message: ERROR_MESSAGES['dimension.too_small'](width, height, this.config.minDimensions.width, this.config.minDimensions.height).message,
        severity: 'medium',
        field: 'dimensions',
        value: { width, height },
        suggestion: ERROR_MESSAGES['dimension.too_small'](width, height, this.config.minDimensions.width, this.config.minDimensions.height).suggestion
      });
    }

    // Check aspect ratio
    const aspectRatio = width / height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      result.warnings.push({
        type: 'quality',
        message: ERROR_MESSAGES['dimension.invalid_ratio'](aspectRatio).message,
        suggestion: ERROR_MESSAGES['dimension.invalid_ratio'](aspectRatio).suggestion
      });
    }

    // Performance warning for large dimensions
    const totalPixels = width * height;
    if (totalPixels > 16777216) { // 4096x4096
      result.warnings.push({
        type: 'performance',
        message: `Large dimensions (${Math.round(totalPixels / 1000000)}MP) may cause slow processing.`,
        suggestion: 'Consider reducing dimensions for faster processing, especially when batch processing.'
      });
    }
  }

  private validateQuality(quality: number, result: ValidationResult): void {
    if (quality < this.config.qualityRange.min || quality > this.config.qualityRange.max) {
      result.errors.push({
        type: 'format',
        code: 'quality.invalid_range',
        message: ERROR_MESSAGES['quality.invalid_range'](quality, this.config.qualityRange.min, this.config.qualityRange.max).message,
        severity: 'medium',
        field: 'quality',
        value: quality,
        suggestion: ERROR_MESSAGES['quality.invalid_range'](quality, this.config.qualityRange.min, this.config.qualityRange.max).suggestion
      });
    }
  }

  private validateMemoryRequirements(file: File, dimensions: { width: number; height: number }, result: ValidationResult): void {
    if (!this.memoryApi) return;

    // Rough memory estimation: original + processed + overhead
    const estimatedMemory = file.size * 3 + (dimensions.width * dimensions.height * 4 * 2);
    const availableMemory = this.memoryApi.jsHeapSizeLimit - this.memoryApi.usedJSHeapSize;

    if (estimatedMemory > availableMemory) {
      result.errors.push({
        type: 'memory',
        code: 'memory.insufficient',
        message: ERROR_MESSAGES['memory.insufficient'](estimatedMemory, availableMemory).message,
        severity: 'high',
        suggestion: ERROR_MESSAGES['memory.insufficient'](estimatedMemory, availableMemory).suggestion
      });
    }

    // Check memory pressure
    const memoryUsagePercentage = (this.memoryApi.usedJSHeapSize / this.memoryApi.jsHeapSizeLimit) * 100;
    if (memoryUsagePercentage > 70) {
      result.warnings.push({
        type: 'performance',
        message: ERROR_MESSAGES['memory.high_pressure'](memoryUsagePercentage).message,
        suggestion: ERROR_MESSAGES['memory.high_pressure'](memoryUsagePercentage).suggestion
      });
    }
  }

  private validateBatchMemory(files: File[], dimensions: { width: number; height: number } | undefined, result: ValidationResult): void {
    if (!this.memoryApi || !dimensions) return;

    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
    const estimatedBatchMemory = totalFileSize * 2 + (dimensions.width * dimensions.height * 4 * files.length);

    if (estimatedBatchMemory > this.config.memoryThreshold) {
      result.warnings.push({
        type: 'performance',
        message: `Batch processing may require up to ${Math.round(estimatedBatchMemory / 1024 / 1024)}MB of memory.`,
        suggestion: 'Consider processing in smaller batches or reducing target dimensions.'
      });
    }
  }

  private generateRecommendations(file: File, dimensions: { width: number; height: number } | undefined, result: ValidationResult): void {
    // Format optimization recommendations
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'png' && file.size > 2 * 1024 * 1024) {
      result.recommendations.push({
        type: 'optimization',
        message: 'Large PNG file detected. Consider using WebP or JPEG format for better compression.',
        action: 'change_format',
        priority: 'medium'
      });
    }

    if (fileExtension === 'bmp') {
      result.recommendations.push({
        type: 'optimization',
        message: 'BMP format is uncompressed. Consider using PNG or WebP for smaller file sizes.',
        action: 'change_format',
        priority: 'high'
      });
    }

    // Quality recommendations based on use case
    if (dimensions) {
      const totalPixels = dimensions.width * dimensions.height;
      if (totalPixels < 100000) { // < 0.1MP - thumbnail size
        result.recommendations.push({
          type: 'quality',
          message: 'For thumbnail-sized images, quality of 75-85% is usually sufficient.',
          priority: 'low'
        });
      }
    }
  }

  private isFormatSupported(format: string): boolean {
    return this.config.supportedFormats.includes(format.toLowerCase());
  }

  // Public utility methods
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // Get user-friendly error summary
  getErrorSummary(result: ValidationResult): string {
    if (result.isValid) {
      return 'All validations passed successfully.';
    }

    const criticalErrors = result.errors.filter(e => e.severity === 'critical');
    const highErrors = result.errors.filter(e => e.severity === 'high');
    const mediumErrors = result.errors.filter(e => e.severity === 'medium');

    if (criticalErrors.length > 0) {
      return `Critical issues found: ${criticalErrors[0].message}`;
    } else if (highErrors.length > 0) {
      return `${highErrors.length} high priority issue(s) found. ${highErrors[0].message}`;
    } else if (mediumErrors.length > 0) {
      return `${mediumErrors.length} issue(s) found. Please review and correct.`;
    }

    return 'Validation failed with unknown issues.';
  }
}

// Singleton instance
let validator: ImageProcessingValidator | null = null;

export function getImageProcessingValidator(config?: ValidationConfig): ImageProcessingValidator {
  if (!validator) {
    validator = new ImageProcessingValidator(config);
  }
  return validator;
}

// Utility functions for common validation scenarios
export function validateImageFile(file: File, config?: ValidationConfig): ValidationResult {
  return getImageProcessingValidator(config).validateFile(file);
}

export function validateImageBatch(files: File[], targetDimensions?: { width: number; height: number }, config?: ValidationConfig): ValidationResult {
  return getImageProcessingValidator(config).validateBatch(files, targetDimensions);
}

export function validateProcessingParameters(params: {
  width: number;
  height: number;
  quality: number;
  format: string;
  originalDimensions?: { width: number; height: number };
}, config?: ValidationConfig): ValidationResult {
  return getImageProcessingValidator(config).validateProcessingParams(params);
}

export { ImageProcessingValidator };

'use client';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    type: string;
    size: number;
    dimensions?: { width: number; height: number };
    hasEXIF?: boolean;
    colorProfile?: string;
  };
}

export interface ImageValidationOptions {
  maxFileSize?: number; // in bytes
  maxDimensions?: { width: number; height: number };
  allowedTypes?: string[];
  requireDimensions?: boolean;
  checkForMaliciousContent?: boolean;
}

export class ImageValidator {
  private static readonly DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxDimensions: { width: 32768, height: 32768 },
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'],
    requireDimensions: true,
    checkForMaliciousContent: true
  };

  // Validate a single file
  static async validateImage(file: File, options?: Partial<ImageValidationOptions>): Promise<ImageValidationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const result: ImageValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        type: file.type,
        size: file.size
      }
    };

    try {
      // Basic file validation
      this.validateBasicProperties(file, opts, result);
      
      // File signature validation
      await this.validateFileSignature(file, result);
      
      // Load and validate image dimensions
      if (opts.requireDimensions) {
        const dimensions = await this.loadImageDimensions(file);
        result.metadata.dimensions = dimensions;
        this.validateDimensions(dimensions, opts, result);
      }
      
      // Security checks
      if (opts.checkForMaliciousContent) {
        await this.performSecurityChecks(file, result);
      }
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Validate multiple files
  static async validateImages(files: File[], options?: Partial<ImageValidationOptions>): Promise<ImageValidationResult[]> {
    const validationPromises = files.map(file => this.validateImage(file, options));
    return Promise.all(validationPromises);
  }

  // Basic file properties validation
  private static validateBasicProperties(
    file: File, 
    options: Required<ImageValidationOptions>, 
    result: ImageValidationResult
  ): void {
    // Check file size
    if (file.size === 0) {
      result.errors.push('File is empty (0 bytes)');
      return;
    }

    if (file.size > options.maxFileSize) {
      result.errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${(options.maxFileSize / 1024 / 1024).toFixed(2)}MB limit`);
    }

    // Check file type
    if (!file.type) {
      result.errors.push('File type is unknown');
      return;
    }

    const normalizedType = file.type.toLowerCase();
    if (!options.allowedTypes.some(type => normalizedType === type.toLowerCase())) {
      result.errors.push(`File type not allowed: ${file.type}. Allowed types: ${options.allowedTypes.join(', ')}`);
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.(php|js|html|htm|asp|aspx|jsp|exe|bat|cmd|sh)$/i,
      /[<>:"|?*]/,
      /^\./
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name)) || file.name.includes('\0')) {
      result.errors.push('File name contains suspicious characters or extensions');
    }
  }

  // Validate file signature (magic bytes)
  private static async validateFileSignature(file: File, result: ImageValidationResult): Promise<void> {
    try {
      const buffer = await this.readFileBytes(file, 0, 12); // Read first 12 bytes
      const signature = Array.from(new Uint8Array(buffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

      const validSignatures = {
        'jpeg': ['ffd8ff'],
        'png': ['89504e47'],
        'gif': ['474946'],
        'webp': ['52494646'], // Actually checks for RIFF, WebP has WEBP after bytes 8-11
        'bmp': ['424d'],
        'tiff': ['49492a00', '4d4d002a']
      };

      const detectedType = this.detectTypeFromSignature(signature, buffer);
      
      if (!detectedType) {
        result.errors.push('Invalid or unrecognized file signature');
        return;
      }

      // Check if detected type matches declared type
      let declaredType = file.type.toLowerCase().replace('image/', '');
      if (declaredType === 'jpg') declaredType = 'jpeg'; // Normalize

      if (detectedType !== declaredType && !(declaredType === 'jpeg' && detectedType === 'jpg')) {
        result.warnings.push(`File signature indicates ${detectedType} but declared type is ${file.type}`);
      }

    } catch (error) {
      result.errors.push(`Failed to validate file signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Detect file type from signature
  private static detectTypeFromSignature(signature: string, buffer: ArrayBuffer): string | null {
    const sig = signature.toLowerCase();
    
    if (sig.startsWith('ffd8ff')) return 'jpeg';
    if (sig.startsWith('89504e47')) return 'png';
    if (sig.startsWith('474946')) return 'gif';
    if (sig.startsWith('424d')) return 'bmp';
    if (sig.startsWith('49492a00') || sig.startsWith('4d4d002a')) return 'tiff';
    
    // Special case for WebP - check for RIFF + WEBP
    if (sig.startsWith('52494646')) {
      const bytes = new Uint8Array(buffer);
      if (bytes.length >= 12) {
        const webpSignature = Array.from(bytes.slice(8, 12))
          .map(byte => String.fromCharCode(byte))
          .join('');
        if (webpSignature === 'WEBP') return 'webp';
      }
    }
    
    return null;
  }

  // Validate image dimensions
  private static validateDimensions(
    dimensions: { width: number; height: number },
    options: Required<ImageValidationOptions>,
    result: ImageValidationResult
  ): void {
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      result.errors.push('Invalid image dimensions');
      return;
    }

    if (dimensions.width > options.maxDimensions.width || dimensions.height > options.maxDimensions.height) {
      result.errors.push(
        `Image too large: ${dimensions.width}×${dimensions.height}px exceeds ${options.maxDimensions.width}×${options.maxDimensions.height}px limit`
      );
    }

    // Check for suspicious aspect ratios
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio > 50 || aspectRatio < 0.02) {
      result.warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)}`);
    }

    // Warn about very large images that might cause memory issues
    const megapixels = (dimensions.width * dimensions.height) / 1000000;
    if (megapixels > 100) {
      result.warnings.push(`Very large image: ${megapixels.toFixed(1)}MP may cause performance issues`);
    }
  }

  // Security checks for malicious content
  private static async performSecurityChecks(file: File, result: ImageValidationResult): Promise<void> {
    try {
      // Check for embedded scripts or suspicious content in metadata
      const buffer = await this.readFileBytes(file, 0, Math.min(file.size, 1024)); // First 1KB
      const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(content))) {
        result.errors.push('File contains suspicious content that may be malicious');
      }

      // Check file size vs content ratio (detect potential zip bombs)
      if (file.size > 1024 * 1024) { // Only for files > 1MB
        const compressionRatio = file.size / buffer.byteLength;
        if (compressionRatio < 0.1) {
          result.warnings.push('File has unusual compression characteristics');
        }
      }

    } catch (error) {
      result.warnings.push(`Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load image dimensions
  private static loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      };
      
      const onLoad = () => {
        cleanup();
        if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
          reject(new Error('Invalid image dimensions'));
          return;
        }
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      const onError = () => {
        cleanup();
        reject(new Error('Failed to load image for dimension detection'));
      };
      
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        cleanup();
        reject(new Error('Image loading timed out'));
      }, 10000);
      
      img.src = url;
    });
  }

  // Read specific bytes from file
  private static readFileBytes(file: File, start: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const slice = file.slice(start, start + length);
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file bytes'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsArrayBuffer(slice);
    });
  }

  // Quick validation for file type and size only
  static quickValidate(file: File, maxSize?: number): { isValid: boolean; error?: string } {
    const maxFileSize = maxSize || this.DEFAULT_OPTIONS.maxFileSize;
    
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    if (file.size > maxFileSize) {
      return { 
        isValid: false, 
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${(maxFileSize / 1024 / 1024).toFixed(2)}MB limit` 
      };
    }
    
    if (!file.type || !file.type.startsWith('image/')) {
      return { isValid: false, error: 'Invalid file type - must be an image' };
    }
    
    return { isValid: true };
  }
}

// Export utility functions
export const validateImage = ImageValidator.validateImage.bind(ImageValidator);
export const validateImages = ImageValidator.validateImages.bind(ImageValidator);
export const quickValidateImage = ImageValidator.quickValidate.bind(ImageValidator);
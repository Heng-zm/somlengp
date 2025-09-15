// Enhanced file validation utility with comprehensive error handling
'use client';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  fileInfo?: {
    size: number;
    type: string;
    name: string;
    isCorrupted?: boolean;
    hasMetadata?: boolean;
    estimatedDimensions?: { width: number; height: number };
  };
}

export interface ValidationOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  checkCorruption?: boolean;
  extractMetadata?: boolean;
  strictMode?: boolean;
  customValidators?: Array<(file: File) => Promise<{ valid: boolean; error?: string; warning?: string }>>;
}

export class EnhancedFileValidator {
  private static readonly SUPPORTED_FORMATS = {
    'image/jpeg': { extension: 'jpg', maxSize: 50 * 1024 * 1024, signatures: [0xFF, 0xD8, 0xFF] },
    'image/jpg': { extension: 'jpg', maxSize: 50 * 1024 * 1024, signatures: [0xFF, 0xD8, 0xFF] },
    'image/png': { extension: 'png', maxSize: 50 * 1024 * 1024, signatures: [0x89, 0x50, 0x4E, 0x47] },
    'image/webp': { extension: 'webp', maxSize: 50 * 1024 * 1024, signatures: [0x52, 0x49, 0x46, 0x46] },
    'image/gif': { extension: 'gif', maxSize: 20 * 1024 * 1024, signatures: [0x47, 0x49, 0x46] },
    'image/bmp': { extension: 'bmp', maxSize: 20 * 1024 * 1024, signatures: [0x42, 0x4D] },
    'image/tiff': { extension: 'tiff', maxSize: 30 * 1024 * 1024, signatures: [0x49, 0x49, 0x2A, 0x00] },
    'image/svg+xml': { extension: 'svg', maxSize: 5 * 1024 * 1024, signatures: [] }, // SVG doesn't have binary signature
  };

  // Validate file with comprehensive checks
  public static async validateFile(file: File, options: ValidationOptions = {}): Promise<ValidationResult> {
    const {
      maxFileSize,
      allowedTypes = Object.keys(this.SUPPORTED_FORMATS),
      checkCorruption = true,
      extractMetadata = true,
      strictMode = false,
      customValidators = []
    } = options;

    const warnings: string[] = [];
    const result: ValidationResult = {
      valid: true,
      warnings,
      fileInfo: {
        size: file.size,
        type: file.type,
        name: file.name
      }
    };

    try {
      // 1. Basic file existence and type check
      if (!file || !file.name) {
        return { valid: false, error: 'Invalid file: File is missing or has no name' };
      }

      // 2. File size validation
      if (file.size === 0) {
        return { valid: false, error: 'File is empty (0 bytes)' };
      }

      if (file.size < 100) {
        return { valid: false, error: 'File is too small to be a valid image (minimum 100 bytes)' };
      }

      // 3. MIME type validation
      if (!file.type || !file.type.startsWith('image/')) {
        return { valid: false, error: 'File is not an image or has missing MIME type' };
      }

      // 4. Check if format is supported
      const formatInfo = this.SUPPORTED_FORMATS[file.type as keyof typeof this.SUPPORTED_FORMATS];
      if (!formatInfo) {
        const supportedTypes = allowedTypes
          .map(type => type.split('/')[1].toUpperCase())
          .join(', ');
        return { 
          valid: false, 
          error: `Unsupported image format: ${file.type}. Supported formats: ${supportedTypes}` 
        };
      }

      // 5. File size limits
      const sizeLimit = maxFileSize || formatInfo.maxSize;
      if (file.size > sizeLimit) {
        const maxSizeMB = Math.round(sizeLimit / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        return { 
          valid: false, 
          error: `File too large (${fileSizeMB}MB). Maximum allowed size: ${maxSizeMB}MB` 
        };
      }

      // 6. File extension validation
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const expectedExtensions = [formatInfo.extension];
      
      // Add common alternative extensions
      if (formatInfo.extension === 'jpg') {
        expectedExtensions.push('jpeg');
      }
      
      if (!expectedExtensions.includes(fileExtension)) {
        const message = `File extension '.${fileExtension}' doesn't match MIME type '${file.type}'. Expected: .${expectedExtensions.join(' or .')}`;
        if (strictMode) {
          return { valid: false, error: message };
        } else {
          warnings.push(message);
        }
      }

      // 7. File signature validation (magic numbers)
      if (checkCorruption && formatInfo.signatures.length > 0) {
        const isValidSignature = await this.validateFileSignature(file, formatInfo.signatures);
        if (!isValidSignature.valid) {
          result.fileInfo!.isCorrupted = true;
          if (strictMode) {
            return { valid: false, error: isValidSignature.error || 'File appears to be corrupted or invalid' };
          } else {
            warnings.push(isValidSignature.error || 'File may be corrupted');
          }
        }
      }

      // 8. Extract metadata if requested
      if (extractMetadata) {
        try {
          const metadata = await this.extractImageMetadata(file);
          result.fileInfo = { 
            ...result.fileInfo!,
            ...metadata,
            // Ensure required properties are not overridden
            size: result.fileInfo!.size,
            type: result.fileInfo!.type,
            name: result.fileInfo!.name
          };
        } catch (error) {
          const message = `Failed to extract metadata: ${error instanceof Error ? error.message : 'Unknown error'}`;
          if (strictMode) {
            return { valid: false, error: message };
          } else {
            warnings.push(message);
          }
        }
      }

      // 9. Run custom validators
      for (const validator of customValidators) {
        try {
          const customResult = await validator(file);
          if (!customResult.valid) {
            if (strictMode) {
              return { valid: false, error: customResult.error || 'Custom validation failed' };
            } else {
              warnings.push(customResult.error || 'Custom validation warning');
            }
          }
          if (customResult.warning) {
            warnings.push(customResult.warning);
          }
        } catch (error) {
          const message = `Custom validator error: ${error instanceof Error ? error.message : 'Unknown error'}`;
          if (strictMode) {
            return { valid: false, error: message };
          } else {
            warnings.push(message);
          }
        }
      }

      // 10. Additional checks for specific file types
      if (file.type === 'image/svg+xml') {
        const svgValidation = await this.validateSVG(file);
        if (!svgValidation.valid) {
          if (strictMode) {
            return svgValidation;
          } else {
            warnings.push(svgValidation.error || 'SVG validation warning');
          }
        }
      }

      return result;

    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Enhanced file signature validation with retry logic
  private static async validateFileSignature(
    file: File, 
    expectedSignature: number[],
    retries = 2
  ): Promise<{ valid: boolean; error?: string }> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create a timeout promise to handle stuck operations
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('File signature check timeout')), 5000);
        });
        
        const signaturePromise = this.readFileSignature(file, expectedSignature.length);
        
        const fileBytes = await Promise.race([signaturePromise, timeoutPromise]);
        
        // Validate signature
        for (let i = 0; i < expectedSignature.length; i++) {
          if (i >= fileBytes.length || fileBytes[i] !== expectedSignature[i]) {
            return {
              valid: false,
              error: `Invalid file signature. Expected ${expectedSignature.map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}, got ${fileBytes.slice(0, expectedSignature.length).map(b => '0x' + b.toString(16).toUpperCase()).join(' ')}`
            };
          }
        }
        
        return { valid: true };
        
      } catch (error) {
        if (attempt === retries) {
          return {
            valid: false,
            error: `File signature validation failed after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    
    return { valid: false, error: 'File signature validation failed unexpectedly' };
  }
  
  // Helper method to read file signature bytes
  private static async readFileSignature(file: File, length: number): Promise<number[]> {
    const buffer = await this.readFileBytes(file, length);
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes);
  }

  // Read first N bytes of a file with validation
  private static readFileBytes(file: File, numBytes: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // Validate input parameters
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file: must be a File object'));
        return;
      }
      
      if (!Number.isInteger(numBytes) || numBytes <= 0) {
        reject(new Error('Invalid numBytes: must be a positive integer'));
        return;
      }
      
      if (file.size === 0) {
        reject(new Error('Invalid file: file is empty (0 bytes)'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('FileReader failed to produce ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file bytes'));
      
      try {
        const blob = file.slice(0, numBytes);
        if (!(blob instanceof Blob)) {
          reject(new Error('Failed to slice file: invalid blob result'));
          return;
        }
        reader.readAsArrayBuffer(blob);
      } catch (error) {
        reject(new Error(`Failed to start file reading: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  // Extract image metadata
  private static async extractImageMetadata(file: File): Promise<{
    hasMetadata?: boolean;
    estimatedDimensions?: { width: number; height: number };
    isCorrupted?: boolean;
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(url);
        img.onload = null;
        img.onerror = null;
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve({ 
          hasMetadata: false, 
          isCorrupted: true 
        });
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        cleanup();
        resolve({
          hasMetadata: true,
          estimatedDimensions: {
            width: img.naturalWidth,
            height: img.naturalHeight
          },
          isCorrupted: false
        });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve({ 
          hasMetadata: false, 
          isCorrupted: true 
        });
      };

      img.src = url;
    });
  }

  // Validate SVG files
  private static async validateSVG(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const text = await this.readFileAsText(file);
      
      // Basic SVG validation
      if (!text.trim().startsWith('<svg') && !text.includes('<svg')) {
        return { valid: false, error: 'Invalid SVG: File does not contain SVG elements' };
      }

      // Check for potentially malicious content
      const dangerousPatterns = [
        /<script[\s>]/i,
        /javascript:/i,
        /onload\s*=/i,
        /onerror\s*=/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
          return { 
            valid: false, 
            error: 'Invalid SVG: File contains potentially unsafe content (script tags or event handlers)' 
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `SVG validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Read file as text with validation
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate input parameters
      if (!file || !(file instanceof File)) {
        reject(new Error('Invalid file: must be a File object'));
        return;
      }
      
      if (file.size === 0) {
        reject(new Error('Invalid file: file is empty (0 bytes)'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('FileReader failed to produce string'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file as text'));
      
      try {
        reader.readAsText(file);
      } catch (error) {
        reject(new Error(`Failed to start file reading: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  // Get user-friendly error messages
  public static getUserFriendlyError(error: string): string {
    const errorMappings: Record<string, string> = {
      'File is empty (0 bytes)': 'The selected file is empty. Please choose a valid image file.',
      'File is too small to be a valid image': 'The file is too small to be a valid image. Please select a proper image file.',
      'File is not an image or has missing MIME type': 'The selected file is not a valid image. Please choose a JPEG, PNG, WebP, or other supported image format.',
      'Unsupported image format': 'This image format is not supported. Please use JPEG, PNG, WebP, GIF, BMP, TIFF, or SVG files.',
      'File too large': 'The image file is too large. Please choose a smaller image or compress it first.',
      'Invalid file signature': 'The file appears to be corrupted or not a valid image. Please try a different file.',
      'File extension doesn\'t match': 'The file extension doesn\'t match the image type. Please check that you selected the correct file.',
      'Invalid SVG': 'The SVG file is invalid or contains unsafe content. Please use a clean SVG file.'
    };

    // Find matching error pattern
    for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
      if (error.includes(pattern)) {
        return friendlyMessage;
      }
    }

    // Return original error if no mapping found
    return error;
  }

  // Batch validate multiple files
  public static async validateFiles(
    files: File[], 
    options: ValidationOptions = {}
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    // Process files in parallel but limit concurrency to avoid overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (file) => {
        const result = await this.validateFile(file, options);
        results.set(file.name, result);
      });
      
      await Promise.all(batchPromises);
    }

    return results;
  }
}

// Export commonly used validation functions
export const validateImageFile = (file: File, options?: ValidationOptions) => 
  EnhancedFileValidator.validateFile(file, options);

export const getUserFriendlyError = (error: string) => 
  EnhancedFileValidator.getUserFriendlyError(error);

export const validateImageFiles = (files: File[], options?: ValidationOptions) => 
  EnhancedFileValidator.validateFiles(files, options);
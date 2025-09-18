// Image processing WebWorker
// Handles image resize, optimization, and format conversion in a separate thread

class ImageProcessor {
  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d');
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  async processImage(data) {
    const {
      imageData,
      width,
      height,
      quality,
      format,
      options = {}
    } = data;

    let imageBitmap = null;
    let blob = null;
    try {
      // Validate input data
      if (!imageData || imageData.byteLength === 0) {
        throw new Error('Invalid or empty image data');
      }

      // Check file size to prevent memory issues (50MB limit)
      const maxFileSize = 50 * 1024 * 1024;
      if (imageData.byteLength > maxFileSize) {
        throw new Error(`File too large: ${Math.round(imageData.byteLength / 1024 / 1024)}MB exceeds 50MB limit`);
      }

      // Create ImageBitmap from the array buffer with error handling
      blob = new Blob([imageData], { type: 'image/*' });
      
      try {
        imageBitmap = await createImageBitmap(blob);
      } catch (bitmapError) {
        throw new Error(`Failed to create image bitmap: ${bitmapError.message}`);
      }

      // Validate image dimensions
      if (!imageBitmap.width || !imageBitmap.height) {
        throw new Error('Invalid image dimensions');
      }

      // Validate target dimensions to prevent memory issues
      const maxDimension = 8192;
      const minDimension = 1;
      
      if (width < minDimension || height < minDimension || width > maxDimension || height > maxDimension) {
        throw new Error(`Invalid target dimensions: ${width}x${height}. Must be between ${minDimension}x${minDimension} and ${maxDimension}x${maxDimension}`);
      }

      const targetWidth = Math.max(minDimension, Math.min(maxDimension, Math.round(width)));
      const targetHeight = Math.max(minDimension, Math.min(maxDimension, Math.round(height)));

      // Check target memory usage (estimate)
      const estimatedMemoryMB = (targetWidth * targetHeight * 4) / (1024 * 1024);
      if (estimatedMemoryMB > 200) {
        throw new Error(`Target image too large: ${Math.round(estimatedMemoryMB)}MB would exceed memory limits`);
      }

      // Set canvas dimensions
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;

      // Clear canvas and set image smoothing
      this.ctx.clearRect(0, 0, targetWidth, targetHeight);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';

      // Reset filter before drawing
      this.ctx.filter = 'none';

      // Apply advanced filtering if requested
      if (options.enableSharpening) {
        this.ctx.filter = 'contrast(1.1) brightness(1.02)';
      }

      // Draw resized image
      this.ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      // Reset filter after drawing
      this.ctx.filter = 'none';

      // Apply post-processing effects
      if (options.enableSharpening) {
        await this.applySharpeningFilter(targetWidth, targetHeight);
      }

      if (options.adjustBrightness && options.adjustBrightness !== 1) {
        await this.adjustImageBrightness(targetWidth, targetHeight, options.adjustBrightness);
      }

      if (options.adjustContrast && options.adjustContrast !== 1) {
        await this.adjustImageContrast(targetWidth, targetHeight, options.adjustContrast);
      }

      // Convert to desired format
      const mimeType = this.formatToMimeType(format);
      const outputBlob = await this.canvas.convertToBlob({
        type: mimeType,
        quality: Math.max(0.01, Math.min(1.0, quality / 100))
      });

      // Convert blob to array buffer for transfer
      const arrayBuffer = await outputBlob.arrayBuffer();

      return {
        success: true,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
        format,
        dimensions: { width: targetWidth, height: targetHeight }
      };

    } catch (error) {
      console.error('Image processing error:', error);
      return {
        success: false,
        error: error.message || 'Unknown processing error',
        details: {
          originalSize: imageData?.byteLength || 0,
          targetDimensions: { width: width || 0, height: height || 0 },
          format: format || 'unknown'
        }
      };
    } finally {
      // Enhanced cleanup to prevent memory leaks
      if (imageBitmap) {
        try {
          imageBitmap.close();
        } catch (closeError) {
          console.warn('Failed to close ImageBitmap:', closeError);
        }
        imageBitmap = null;
      }
      
      // Force cleanup of blob reference
      if (blob) {
        blob = null;
      }
      
      // Clear canvas context to release GPU memory
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Reset canvas size to minimal to release memory
        this.canvas.width = 1;
        this.canvas.height = 1;
        // Clear any filters or transformations
        this.ctx.filter = 'none';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      // Suggest garbage collection if available (development only)
      if (typeof gc === 'function') {
        try {
          gc();
        } catch (e) {
          // Ignore gc errors
        }
      }
      
      // Request idle callback to ensure cleanup happens
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => {
          // Additional cleanup during idle time
          if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }
        }, { timeout: 1000 });
      }
    }
  }

  async applySharpeningFilter(width, height) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Optimized sharpening with reduced memory allocation
    const dataLength = data.length;
    const outputData = new Uint8ClampedArray(dataLength);
    
    // Copy original data for alpha channel and edge handling
    outputData.set(data);
    
    // Adaptive sharpening kernel based on image analysis
    const sharpnessLevel = this.analyzeImageSharpness(data, width, height);
    const kernelStrength = Math.max(0.5, Math.min(1.5, 1.0 - sharpnessLevel));
    
    // More efficient kernel application with strength adjustment
    const centerWeight = 4 + kernelStrength;
    const edgeWeight = -kernelStrength / 4;
    
    // Process only interior pixels to avoid boundary checks in tight loop
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width * 4;
      const prevRowOffset = (y - 1) * width * 4;
      const nextRowOffset = (y + 1) * width * 4;
      
      for (let x = 1; x < width - 1; x++) {
        const pixelOffset = rowOffset + x * 4;
        
        // Process RGB channels (skip alpha)
        for (let c = 0; c < 3; c++) {
          const center = data[pixelOffset + c];
          const top = data[prevRowOffset + x * 4 + c];
          const bottom = data[nextRowOffset + x * 4 + c];
          const left = data[rowOffset + (x - 1) * 4 + c];
          const right = data[rowOffset + (x + 1) * 4 + c];
          
          // Apply sharpening kernel
          const sharpened = center * centerWeight + (top + bottom + left + right) * edgeWeight;
          
          // Clamp and store result
          outputData[pixelOffset + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
        }
      }
    }
    
    // Apply the processed data back to canvas
    const outputImageData = new ImageData(outputData, width, height);
    this.ctx.putImageData(outputImageData, 0, 0);
  }
  
  // Analyze image sharpness to determine optimal sharpening level
  analyzeImageSharpness(data, width, height) {
    let gradientSum = 0;
    let sampleCount = 0;
    const step = Math.max(1, Math.floor(Math.min(width, height) / 50)); // Sample every Nth pixel
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const pixelIdx = (y * width + x) * 4;
        
        // Calculate luminance
        const lum = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
        
        // Calculate gradients
        const rightIdx = (y * width + x + step) * 4;
        const bottomIdx = ((y + step) * width + x) * 4;
        
        const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
        const bottomLum = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];
        
        const gradX = Math.abs(rightLum - lum);
        const gradY = Math.abs(bottomLum - lum);
        
        gradientSum += Math.sqrt(gradX * gradX + gradY * gradY);
        sampleCount++;
      }
    }
    
    // Return normalized sharpness (0 = very blurry, 1 = very sharp)
    const averageGradient = sampleCount > 0 ? gradientSum / sampleCount : 0;
    return Math.min(1, averageGradient / 30); // Normalize to 0-1 range
  }

  async adjustImageBrightness(width, height, factor) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor);     // Red
      data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
      data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
      // Alpha channel (i + 3) remains unchanged
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  async adjustImageContrast(width, height, factor) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128)); // Blue
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  formatToMimeType(format) {
    const mimeTypes = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif'
    };
    return mimeTypes[format] || 'image/jpeg';
  }

  // Batch processing for multiple images
  async processBatch(images) {
    const results = [];
    const totalImages = images.length;
    let lastProgressUpdate = 0;
    const progressThrottleMs = 100; // Minimum time between progress updates
    
    for (let i = 0; i < totalImages; i++) {
      const result = await this.processImage(images[i]);
      results.push({
        ...result,
        index: i,
        originalName: images[i].originalName
      });

      const currentTime = Date.now();
      const progress = ((i + 1) / totalImages) * 100;
      
      // Throttle progress updates to prevent overwhelming the main thread
      // Always send update for first, last, or when enough time has passed
      const shouldSendUpdate = 
        i === 0 || // First image
        i === totalImages - 1 || // Last image
        currentTime - lastProgressUpdate >= progressThrottleMs || // Throttle time elapsed
        Math.floor(progress / 5) > Math.floor(((i) / totalImages) * 100 / 5); // Every 5% milestone

      if (shouldSendUpdate) {
        self.postMessage({
          type: 'progress',
          progress,
          completed: i + 1,
          total: totalImages
        });
        lastProgressUpdate = currentTime;
      }

      // Yield control occasionally to prevent blocking the worker thread
      if (i % 5 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return results;
  }

  // Generate image thumbnail quickly
  async generateThumbnail(data) {
    const { imageData, maxSize = 200 } = data;

    let imageBitmap = null;
    let blob = null;
    try {
      // Validate input
      if (!imageData || imageData.byteLength === 0) {
        throw new Error('Invalid or empty image data for thumbnail');
      }

      // Validate maxSize parameter
      const validMaxSize = Math.max(50, Math.min(500, maxSize)); // Clamp between 50-500px
      
      blob = new Blob([imageData], { type: 'image/*' });
      
      try {
        imageBitmap = await createImageBitmap(blob);
      } catch (bitmapError) {
        throw new Error(`Failed to create thumbnail bitmap: ${bitmapError.message}`);
      }

      if (!imageBitmap.width || !imageBitmap.height) {
        throw new Error('Invalid image dimensions for thumbnail');
      }

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;

      // Calculate thumbnail dimensions maintaining aspect ratio with better precision
      const aspectRatio = originalWidth / originalHeight;
      let thumbWidth, thumbHeight;
      
      // Handle edge cases for aspect ratio
      if (!isFinite(aspectRatio) || aspectRatio <= 0) {
        throw new Error('Invalid aspect ratio for thumbnail');
      }
      
      if (aspectRatio > 1) {
        thumbWidth = validMaxSize;
        thumbHeight = Math.round(validMaxSize / aspectRatio);
      } else {
        thumbHeight = validMaxSize;
        thumbWidth = Math.round(validMaxSize * aspectRatio);
      }

      // Ensure minimum dimensions
      thumbWidth = Math.max(1, thumbWidth);
      thumbHeight = Math.max(1, thumbHeight);

      this.canvas.width = thumbWidth;
      this.canvas.height = thumbHeight;

      this.ctx.clearRect(0, 0, thumbWidth, thumbHeight);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'medium'; // Faster for thumbnails
      this.ctx.filter = 'none';

      this.ctx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);

      const thumbnailBlob = await this.canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.7 // Lower quality for thumbnails
      });

      const arrayBuffer = await thumbnailBlob.arrayBuffer();

      return {
        success: true,
        data: arrayBuffer,
        dimensions: { width: thumbWidth, height: thumbHeight }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      // Clean up resources to prevent memory leaks
      if (imageBitmap) {
        try {
          imageBitmap.close();
        } catch (closeError) {
          console.warn('Failed to close thumbnail ImageBitmap:', closeError);
        }
      }
      blob = null;
    }
  }
}

// Initialize processor
const processor = new ImageProcessor();

// Message handler
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    if (type === 'test') {
      // Lightweight test response for health checks
      self.postMessage({ type: 'test-response', timestamp: Date.now() });
      return;
    }
    
    if (type === 'ping') {
      // Ping response for worker health monitoring
      self.postMessage({ type: 'ping-response', timestamp: Date.now() });
      return;
    }

    await processor.initialize();

    let result;
    switch (type) {
      case 'process':
        result = await processor.processImage(data);
        break;
      case 'batch':
        result = await processor.processBatch(data);
        break;
      case 'thumbnail':
        result = await processor.generateThumbnail(data);
        break;
      default:
        result = { success: false, error: 'Unknown operation type' };
    }

    self.postMessage({
      type: 'result',
      id,
      result
    });

  } catch (error) {
    // Enhanced error reporting with more context
    const errorInfo = {
      message: error.message || 'Unknown worker error',
      type: error.name || 'Error',
      stack: error.stack,
      timestamp: Date.now(),
      workerOperation: type,
      dataSize: data ? (data.imageData ? data.imageData.byteLength : 'N/A') : 'N/A'
    };
    
    console.error('Worker error details:', errorInfo);
    
    self.postMessage({
      type: 'error',
      id,
      error: errorInfo.message,
      errorDetails: errorInfo
    });
  }
});

// Handle worker startup
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

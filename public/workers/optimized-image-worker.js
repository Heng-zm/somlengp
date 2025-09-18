// Optimized Image Processing WebWorker with Enhanced Memory Management
// Handles image resize, optimization, and format conversion with improved performance

class OptimizedImageProcessor {
  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d');
    this.isInitialized = false;
    
    // Memory management
    this.memoryPool = new Map(); // Reuse ImageBitmap and ImageData objects
    this.maxPoolSize = 5;
    this.processingQueue = [];
    this.isProcessing = false;
    
    // Performance monitoring
    this.stats = {
      processedCount: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
      cacheHits: 0
    };
    
    // Memory pressure monitoring
    this.memoryThreshold = 200; // MB
    this.gcRequestCount = 0;
    
    // Enhanced error tracking
    this.errorLog = [];
    this.maxErrorLog = 10;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Test basic functionality
      await this.testCapabilities();
      this.isInitialized = true;
      this.log('Worker initialized successfully');
    } catch (error) {
      this.logError('Initialization failed', error);
      throw error;
    }
  }

  async testCapabilities() {
    // Test OffscreenCanvas support
    if (!this.canvas || !this.ctx) {
      throw new Error('OffscreenCanvas not supported');
    }
    
    // Test createImageBitmap support
    const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    try {
      const blob = new Blob([testData], { type: 'image/png' });
      await createImageBitmap(blob);
    } catch (error) {
      // This is expected for invalid PNG, but tests the API availability
    }
    
    this.log('Capabilities test completed');
  }

  // Enhanced memory management
  checkMemoryPressure() {
    // Use performance.memory if available (Chrome)
    if (typeof performance !== 'undefined' && performance.memory) {
      const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
      
      this.stats.memoryUsage = usedMB;
      
      // High memory usage detected
      if (usedMB > this.memoryThreshold || (usedMB / limitMB) > 0.8) {
        this.log(`High memory usage: ${Math.round(usedMB)}MB / ${Math.round(limitMB)}MB`);
        return {
          isHigh: true,
          usage: usedMB,
          limit: limitMB,
          percentage: (usedMB / limitMB) * 100
        };
      }
    }
    
    return {
      isHigh: false,
      usage: this.stats.memoryUsage,
      limit: 0,
      percentage: 0
    };
  }

  requestGarbageCollection() {
    this.gcRequestCount++;
    
    // Force cleanup of memory pool
    this.cleanupMemoryPool();
    
    // Reset canvas to minimum size
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.ctx.clearRect(0, 0, 1, 1);
    
    // Request GC if available (development)
    if (typeof gc === 'function') {
      try {
        gc();
        this.log(`Garbage collection requested (${this.gcRequestCount})`);
      } catch (error) {
        this.log('GC request failed:', error.message);
      }
    }
  }

  cleanupMemoryPool() {
    // Close all ImageBitmap objects in pool
    for (const [key, item] of this.memoryPool.entries()) {
      if (item.bitmap && typeof item.bitmap.close === 'function') {
        try {
          item.bitmap.close();
        } catch (error) {
          this.log(`Failed to close ImageBitmap for ${key}:`, error.message);
        }
      }
    }
    this.memoryPool.clear();
    this.log('Memory pool cleaned');
  }

  // Enhanced image processing with memory optimization
  async processImage(data) {
    const {
      imageData,
      width,
      height,
      quality,
      format,
      options = {},
      priority = 'normal'
    } = data;

    // Add to processing queue if worker is busy
    if (this.isProcessing && priority !== 'high') {
      return new Promise((resolve) => {
        this.processingQueue.push({ data, resolve });
        this.log(`Task queued (${this.processingQueue.length} in queue)`);
      });
    }

    this.isProcessing = true;
    const startTime = performance.now();
    
    let imageBitmap = null;
    let blob = null;
    let cacheKey = null;
    
    try {
      // Validate input data
      if (!imageData || imageData.byteLength === 0) {
        throw new Error('Invalid or empty image data');
      }

      // Enhanced file size validation
      const maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB default
      if (imageData.byteLength > maxFileSize) {
        throw new Error(`File too large: ${Math.round(imageData.byteLength / 1024 / 1024)}MB exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
      }

      // Check memory pressure before processing
      const memoryStatus = this.checkMemoryPressure();
      if (memoryStatus.isHigh) {
        this.requestGarbageCollection();
        
        // Wait a bit for GC to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Re-check memory after cleanup
        const newMemoryStatus = this.checkMemoryPressure();
        if (newMemoryStatus.isHigh && newMemoryStatus.percentage > 90) {
          throw new Error('Insufficient memory for processing. Please try with a smaller image.');
        }
      }

      // Create cache key for potential reuse
      cacheKey = `${width}x${height}_${quality}_${format}_${imageData.byteLength}`;
      
      // Check memory pool for cached bitmap
      const cached = this.memoryPool.get(cacheKey);
      if (cached && cached.timestamp > Date.now() - 300000) { // 5 minute cache
        imageBitmap = cached.bitmap;
        this.stats.cacheHits++;
        this.log(`Cache hit for ${cacheKey}`);
      } else {
        // Create ImageBitmap from array buffer
        blob = new Blob([imageData], { type: 'image/*' });
        
        try {
          imageBitmap = await createImageBitmap(blob);
        } catch (bitmapError) {
          throw new Error(`Failed to create image bitmap: ${bitmapError.message}`);
        }

        // Cache the bitmap if memory allows
        if (this.memoryPool.size < this.maxPoolSize && !memoryStatus.isHigh) {
          this.memoryPool.set(cacheKey, {
            bitmap: imageBitmap,
            timestamp: Date.now()
          });
        }
      }

      // Enhanced dimension validation
      if (!imageBitmap || !imageBitmap.width || !imageBitmap.height) {
        throw new Error('Invalid image dimensions');
      }

      // Adaptive dimension limits based on available memory
      let maxDimension = 8192;
      if (memoryStatus.isHigh) {
        maxDimension = 4096; // Reduce max size under memory pressure
      }
      
      const minDimension = 1;
      
      if (width < minDimension || height < minDimension || width > maxDimension || height > maxDimension) {
        throw new Error(`Invalid target dimensions: ${width}x${height}. Must be between ${minDimension}x${minDimension} and ${maxDimension}x${maxDimension}`);
      }

      const targetWidth = Math.max(minDimension, Math.min(maxDimension, Math.round(width)));
      const targetHeight = Math.max(minDimension, Math.min(maxDimension, Math.round(height)));

      // Enhanced memory estimation
      const estimatedMemoryMB = (targetWidth * targetHeight * 4) / (1024 * 1024);
      const memoryLimit = memoryStatus.isHigh ? 100 : 200; // Reduce limit under pressure
      
      if (estimatedMemoryMB > memoryLimit) {
        throw new Error(`Target image too large: ${Math.round(estimatedMemoryMB)}MB would exceed memory limits (${memoryLimit}MB)`);
      }

      // Set canvas dimensions
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;

      // Enhanced canvas setup
      this.ctx.clearRect(0, 0, targetWidth, targetHeight);
      this.ctx.imageSmoothingEnabled = true;
      
      // Adaptive smoothing quality based on scale factor
      const scaleRatio = Math.min(targetWidth / imageBitmap.width, targetHeight / imageBitmap.height);
      if (scaleRatio < 0.5) {
        this.ctx.imageSmoothingQuality = 'high';
      } else if (scaleRatio > 2) {
        this.ctx.imageSmoothingQuality = 'low'; // Faster for upscaling
      } else {
        this.ctx.imageSmoothingQuality = 'medium';
      }

      // Reset filters
      this.ctx.filter = 'none';

      // Apply pre-processing filters
      if (options.enableSharpening && scaleRatio < 1) {
        this.ctx.filter = 'contrast(1.05) brightness(1.01)';
      }

      // Draw resized image
      this.ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      // Reset filter after drawing
      this.ctx.filter = 'none';

      // Apply post-processing effects if requested
      if (options.enableSharpening) {
        await this.applySharpeningFilter(targetWidth, targetHeight, scaleRatio);
      }

      if (options.adjustBrightness && options.adjustBrightness !== 1) {
        await this.adjustImageBrightness(targetWidth, targetHeight, options.adjustBrightness);
      }

      if (options.adjustContrast && options.adjustContrast !== 1) {
        await this.adjustImageContrast(targetWidth, targetHeight, options.adjustContrast);
      }

      // Convert to desired format with enhanced quality handling
      const mimeType = this.formatToMimeType(format);
      let outputQuality = Math.max(0.01, Math.min(1.0, quality / 100));
      
      // Adaptive quality for WebP
      if (format === 'webp' && outputQuality > 0.95) {
        outputQuality = 0.92; // WebP optimal quality
      }

      const outputBlob = await this.canvas.convertToBlob({
        type: mimeType,
        quality: outputQuality
      });

      // Convert blob to array buffer for transfer
      const arrayBuffer = await outputBlob.arrayBuffer();

      // Update statistics
      const processingTime = performance.now() - startTime;
      this.stats.processedCount++;
      this.stats.totalProcessingTime += processingTime;

      this.log(`Processed ${targetWidth}x${targetHeight} ${format} in ${Math.round(processingTime)}ms`);

      return {
        success: true,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
        format,
        dimensions: { width: targetWidth, height: targetHeight },
        processingTime: Math.round(processingTime),
        memoryUsage: this.stats.memoryUsage,
        compressionRatio: imageData.byteLength / arrayBuffer.byteLength
      };

    } catch (error) {
      this.logError('Image processing error', error);
      
      return {
        success: false,
        error: error.message || 'Unknown processing error',
        details: {
          originalSize: imageData?.byteLength || 0,
          targetDimensions: { width: width || 0, height: height || 0 },
          format: format || 'unknown',
          memoryUsage: this.stats.memoryUsage,
          processingTime: Math.round(performance.now() - startTime)
        }
      };
    } finally {
      this.isProcessing = false;
      
      // Enhanced cleanup
      if (imageBitmap && !this.memoryPool.has(cacheKey)) {
        try {
          imageBitmap.close();
        } catch (closeError) {
          this.log('Failed to close ImageBitmap:', closeError.message);
        }
      }
      
      // Clear blob reference
      blob = null;
      
      // Process next item in queue
      if (this.processingQueue.length > 0) {
        const nextTask = this.processingQueue.shift();
        setImmediate(() => {
          this.processImage(nextTask.data).then(nextTask.resolve);
        });
      }

      // Periodic memory cleanup
      if (this.stats.processedCount % 10 === 0) {
        const memoryStatus = this.checkMemoryPressure();
        if (memoryStatus.isHigh) {
          this.requestGarbageCollection();
        }
      }
    }
  }

  // Optimized sharpening filter with adaptive strength
  async applySharpeningFilter(width, height, scaleRatio) {
    // Skip sharpening for very small images or large upscales
    if (width * height < 10000 || scaleRatio > 1.5) {
      return;
    }

    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const dataLength = data.length;
    
    // Use a more memory-efficient approach for large images
    const useOptimizedPath = width * height > 1000000; // 1MP+
    
    if (useOptimizedPath) {
      await this.applyOptimizedSharpening(data, width, height, scaleRatio);
    } else {
      await this.applyStandardSharpening(data, width, height, scaleRatio);
    }
    
    const outputImageData = new ImageData(data, width, height);
    this.ctx.putImageData(outputImageData, 0, 0);
  }

  async applyOptimizedSharpening(data, width, height, scaleRatio) {
    // Process in chunks to avoid blocking
    const chunkSize = 10000; // Process 10k pixels at a time
    const totalPixels = width * height;
    
    // Adaptive sharpening strength
    const baseStrength = Math.min(1.2, 0.8 + (1 - scaleRatio) * 0.8);
    const kernelStrength = baseStrength * 0.25;
    
    for (let startPixel = 0; startPixel < totalPixels; startPixel += chunkSize) {
      const endPixel = Math.min(startPixel + chunkSize, totalPixels);
      
      for (let pixel = startPixel; pixel < endPixel; pixel++) {
        const y = Math.floor(pixel / width);
        const x = pixel % width;
        
        // Skip edge pixels
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) continue;
        
        const pixelOffset = pixel * 4;
        
        // Apply sharpening kernel to RGB channels
        for (let c = 0; c < 3; c++) {
          const center = data[pixelOffset + c];
          const top = data[((y - 1) * width + x) * 4 + c];
          const bottom = data[((y + 1) * width + x) * 4 + c];
          const left = data[(y * width + (x - 1)) * 4 + c];
          const right = data[(y * width + (x + 1)) * 4 + c];
          
          const sharpened = center * (1 + 4 * kernelStrength) - kernelStrength * (top + bottom + left + right);
          data[pixelOffset + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
        }
      }
      
      // Yield control periodically
      if (startPixel % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  async applyStandardSharpening(data, width, height, scaleRatio) {
    const outputData = new Uint8ClampedArray(data);
    
    // Adaptive sharpening based on scale ratio
    const sharpnessLevel = this.analyzeImageSharpness(data, width, height);
    const adaptiveStrength = Math.max(0.3, Math.min(1.5, 1.0 - sharpnessLevel + (1 - scaleRatio) * 0.5));
    
    const centerWeight = 4 + adaptiveStrength;
    const edgeWeight = -adaptiveStrength / 4;
    
    // Process interior pixels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelOffset = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          const center = data[pixelOffset + c];
          const top = data[((y - 1) * width + x) * 4 + c];
          const bottom = data[((y + 1) * width + x) * 4 + c];
          const left = data[(y * width + (x - 1)) * 4 + c];
          const right = data[(y * width + (x + 1)) * 4 + c];
          
          const sharpened = center * centerWeight + (top + bottom + left + right) * edgeWeight;
          outputData[pixelOffset + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
        }
      }
    }
    
    // Copy result back
    data.set(outputData);
  }

  // Optimized image analysis
  analyzeImageSharpness(data, width, height) {
    let gradientSum = 0;
    let sampleCount = 0;
    
    // Adaptive sampling based on image size
    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 10000))); // Sample ~10k pixels
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const pixelIdx = (y * width + x) * 4;
        
        // Calculate luminance using optimized coefficients
        const lum = data[pixelIdx] * 0.299 + data[pixelIdx + 1] * 0.587 + data[pixelIdx + 2] * 0.114;
        
        // Calculate gradients
        const rightIdx = (y * width + x + step) * 4;
        const bottomIdx = ((y + step) * width + x) * 4;
        
        const rightLum = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
        const bottomLum = data[bottomIdx] * 0.299 + data[bottomIdx + 1] * 0.587 + data[bottomIdx + 2] * 0.114;
        
        const gradX = rightLum - lum;
        const gradY = bottomLum - lum;
        
        gradientSum += Math.sqrt(gradX * gradX + gradY * gradY);
        sampleCount++;
      }
    }
    
    const averageGradient = sampleCount > 0 ? gradientSum / sampleCount : 0;
    return Math.min(1, averageGradient / 30);
  }

  // Enhanced brightness adjustment with gamma correction
  async adjustImageBrightness(width, height, factor) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Use gamma correction for more natural brightness adjustment
    const gamma = factor > 1 ? 1.0 / 1.2 : 1.2;
    const gammaCorrection = 1.0 / gamma;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const normalized = data[i + c] / 255;
        const adjusted = Math.pow(normalized, gammaCorrection) * factor;
        data[i + c] = Math.min(255, Math.max(0, Math.round(adjusted * 255)));
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // Enhanced contrast adjustment with S-curve
  async adjustImageContrast(width, height, factor) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // S-curve contrast adjustment for more natural results
    const midpoint = 128;
    const range = 127;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const value = data[i + c];
        const normalized = (value - midpoint) / range;
        
        // S-curve function
        const adjusted = Math.tanh(normalized * factor) * range + midpoint;
        data[i + c] = Math.min(255, Math.max(0, Math.round(adjusted)));
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // Enhanced format to MIME type conversion
  formatToMimeType(format) {
    const mimeTypes = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif',
      'bmp': 'image/bmp'
    };
    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
  }

  // Enhanced batch processing with memory management
  async processBatch(images) {
    const results = [];
    const totalImages = images.length;
    let processedCount = 0;
    
    // Adaptive batch size based on memory pressure
    let batchSize = 3; // Conservative default
    const memoryStatus = this.checkMemoryPressure();
    
    if (!memoryStatus.isHigh) {
      batchSize = 5; // Larger batches when memory allows
    }

    this.log(`Processing batch of ${totalImages} images (batch size: ${batchSize})`);
    
    for (let i = 0; i < totalImages; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchPromises = batch.map(async (imageConfig, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        try {
          const result = await this.processImage({
            ...imageConfig,
            priority: 'batch'
          });
          
          return {
            ...result,
            index: globalIndex,
            originalName: imageConfig.originalName || `image_${globalIndex}`
          };
        } catch (error) {
          this.logError(`Batch item ${globalIndex} failed`, error);
          return {
            success: false,
            error: error.message,
            index: globalIndex,
            originalName: imageConfig.originalName || `image_${globalIndex}`
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      processedCount += batchResults.length;
      
      // Report progress
      const progress = (processedCount / totalImages) * 100;
      self.postMessage({
        type: 'progress',
        progress: Math.round(progress),
        completed: processedCount,
        total: totalImages
      });
      
      // Memory pressure check between batches
      const currentMemoryStatus = this.checkMemoryPressure();
      if (currentMemoryStatus.isHigh) {
        this.log(`Memory pressure detected at batch ${Math.floor(i / batchSize) + 1}, requesting cleanup`);
        this.requestGarbageCollection();
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reduce batch size for remaining items
        batchSize = Math.max(1, Math.floor(batchSize / 2));
      }
      
      // Yield control between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.log(`Batch processing completed: ${results.length} items processed`);
    return results;
  }

  // Enhanced thumbnail generation with smart sizing
  async generateThumbnail(data) {
    const { imageData, maxSize = 200, quality = 0.8 } = data;
    
    let imageBitmap = null;
    let blob = null;
    
    try {
      if (!imageData || imageData.byteLength === 0) {
        throw new Error('Invalid image data for thumbnail');
      }

      const validMaxSize = Math.max(50, Math.min(500, maxSize));
      
      blob = new Blob([imageData], { type: 'image/*' });
      imageBitmap = await createImageBitmap(blob);

      if (!imageBitmap.width || !imageBitmap.height) {
        throw new Error('Invalid image dimensions for thumbnail');
      }

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;
      const aspectRatio = originalWidth / originalHeight;

      // Smart thumbnail sizing with minimum dimensions
      let thumbWidth, thumbHeight;
      
      if (aspectRatio > 1) {
        thumbWidth = validMaxSize;
        thumbHeight = Math.max(50, Math.round(validMaxSize / aspectRatio));
      } else {
        thumbHeight = validMaxSize;
        thumbWidth = Math.max(50, Math.round(validMaxSize * aspectRatio));
      }

      // Set canvas for thumbnail
      this.canvas.width = thumbWidth;
      this.canvas.height = thumbHeight;

      this.ctx.clearRect(0, 0, thumbWidth, thumbHeight);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high'; // Better quality for thumbnails
      this.ctx.filter = 'none';

      this.ctx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);

      const thumbnailBlob = await this.canvas.convertToBlob({
        type: 'image/jpeg',
        quality: quality
      });

      const arrayBuffer = await thumbnailBlob.arrayBuffer();

      return {
        success: true,
        data: arrayBuffer,
        dimensions: { width: thumbWidth, height: thumbHeight },
        originalDimensions: { width: originalWidth, height: originalHeight },
        compressionRatio: imageData.byteLength / arrayBuffer.byteLength
      };

    } catch (error) {
      this.logError('Thumbnail generation failed', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      // Cleanup
      if (imageBitmap) {
        try {
          imageBitmap.close();
        } catch (error) {
          this.log('Failed to close thumbnail bitmap:', error.message);
        }
      }
      blob = null;
    }
  }

  // Enhanced logging with error tracking
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  logError(message, error) {
    const errorInfo = {
      message,
      error: error.message || error,
      stack: error.stack,
      timestamp: Date.now(),
      stats: { ...this.stats }
    };
    
    this.errorLog.push(errorInfo);
    
    // Keep error log size manageable
    if (this.errorLog.length > this.maxErrorLog) {
      this.errorLog.shift();
    }
    
    console.error(`[ERROR] ${message}:`, error);
  }

  // Get processor statistics
  getStats() {
    const memoryStatus = this.checkMemoryPressure();
    
    return {
      ...this.stats,
      memoryStatus,
      cacheSize: this.memoryPool.size,
      queueLength: this.processingQueue.length,
      averageProcessingTime: this.stats.processedCount > 0 
        ? Math.round(this.stats.totalProcessingTime / this.stats.processedCount)
        : 0,
      gcRequestCount: this.gcRequestCount,
      errorCount: this.errorLog.length
    };
  }

  // Cleanup method
  cleanup() {
    this.cleanupMemoryPool();
    this.processingQueue.length = 0;
    this.errorLog.length = 0;
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.log('Processor cleanup completed');
  }
}

// Initialize processor
const processor = new OptimizedImageProcessor();

// Enhanced message handler with better error handling
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    // Health check
    if (type === 'ping') {
      self.postMessage({ 
        type: 'ping-response', 
        timestamp: Date.now(),
        stats: processor.getStats()
      });
      return;
    }

    if (type === 'test') {
      self.postMessage({ 
        type: 'test-response', 
        timestamp: Date.now(),
        capabilities: {
          offscreenCanvas: !!processor.canvas,
          imageBitmapSupport: typeof createImageBitmap === 'function'
        }
      });
      return;
    }

    // Initialize if needed
    if (!processor.isInitialized) {
      await processor.initialize();
    }

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
        
      case 'stats':
        result = processor.getStats();
        break;
        
      case 'cleanup':
        processor.cleanup();
        result = { success: true, message: 'Cleanup completed' };
        break;
        
      default:
        result = { 
          success: false, 
          error: `Unknown operation type: ${type}` 
        };
    }

    self.postMessage({
      type: 'result',
      id,
      result
    });

  } catch (error) {
    processor.logError(`Message handler error for ${type}`, error);
    
    self.postMessage({
      type: 'error',
      id,
      error: error.message || 'Unknown worker error',
      details: {
        type,
        timestamp: Date.now(),
        stats: processor.getStats()
      }
    });
  }
});

// Worker lifecycle events
self.addEventListener('install', () => {
  processor.log('Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  processor.log('Worker activated');
  self.clients.claim();
});

// Global error handler
self.addEventListener('error', (event) => {
  processor.logError('Unhandled worker error', event.error || event);
});

// Unhandled promise rejection handler
self.addEventListener('unhandledrejection', (event) => {
  processor.logError('Unhandled promise rejection', event.reason);
  event.preventDefault();
});
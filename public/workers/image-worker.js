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

    try {
      // Create ImageBitmap from the array buffer
      const blob = new Blob([imageData], { type: 'image/*' });
      const imageBitmap = await createImageBitmap(blob);

      // Set canvas dimensions
      this.canvas.width = width;
      this.canvas.height = height;

      // Clear canvas and set image smoothing
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';

      // Apply advanced filtering if requested
      if (options.enableSharpening) {
        this.ctx.filter = 'contrast(1.1) brightness(1.02)';
      }

      // Draw resized image
      this.ctx.drawImage(imageBitmap, 0, 0, width, height);

      // Apply post-processing effects
      if (options.enableSharpening) {
        await this.applySharpeningFilter(width, height);
      }

      if (options.adjustBrightness && options.adjustBrightness !== 1) {
        await this.adjustImageBrightness(width, height, options.adjustBrightness);
      }

      if (options.adjustContrast && options.adjustContrast !== 1) {
        await this.adjustImageContrast(width, height, options.adjustContrast);
      }

      // Convert to desired format
      const mimeType = this.formatToMimeType(format);
      const outputBlob = await this.canvas.convertToBlob({
        type: mimeType,
        quality: quality / 100
      });

      // Convert blob to array buffer for transfer
      const arrayBuffer = await outputBlob.arrayBuffer();

      return {
        success: true,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
        format,
        dimensions: { width, height }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async applySharpeningFilter(width, height) {
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    // Unsharp mask kernel for better sharpening
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelValue = kernel[(ky + 1) * 3 + (kx + 1)];
              sum += tempData[pixel] * kernelValue;
            }
          }
          const index = (y * width + x) * 4 + c;
          data[index] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
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
    
    for (let i = 0; i < images.length; i++) {
      const result = await this.processImage(images[i]);
      results.push({
        ...result,
        index: i,
        originalName: images[i].originalName
      });

      // Send progress update
      self.postMessage({
        type: 'progress',
        progress: ((i + 1) / images.length) * 100,
        completed: i + 1,
        total: images.length
      });
    }

    return results;
  }

  // Generate image thumbnail quickly
  async generateThumbnail(data) {
    const { imageData, maxSize = 200 } = data;

    try {
      const blob = new Blob([imageData], { type: 'image/*' });
      const imageBitmap = await createImageBitmap(blob);

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;

      // Calculate thumbnail dimensions maintaining aspect ratio
      let thumbWidth, thumbHeight;
      if (originalWidth > originalHeight) {
        thumbWidth = maxSize;
        thumbHeight = (originalHeight * maxSize) / originalWidth;
      } else {
        thumbHeight = maxSize;
        thumbWidth = (originalWidth * maxSize) / originalHeight;
      }

      this.canvas.width = thumbWidth;
      this.canvas.height = thumbHeight;

      this.ctx.clearRect(0, 0, thumbWidth, thumbHeight);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'medium'; // Faster for thumbnails

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
    }
  }
}

// Initialize processor
const processor = new ImageProcessor();

// Message handler
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
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
    self.postMessage({
      type: 'error',
      id,
      error: error.message
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

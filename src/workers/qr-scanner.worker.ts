/**
 * QR Code Scanner Web Worker
 * Handles QR code detection in background thread to prevent UI blocking
 */

// Import jsQR library (this may need to be loaded differently depending on your build setup)
// For production, you might need to use importScripts or a different import method
import jsQR from 'jsqr';

interface QRWorkerMessage {
  type: 'scan' | 'init' | 'destroy';
  data?: {
    imageData?: ImageData;
    options?: {
      inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
      locateOptions?: {
        skipUntilFound?: boolean;
        assumeSquare?: boolean;
        centerROI?: boolean;
        maxFinderPatternStdDev?: number;
      };
    };
  };
  id?: string;
}

interface QRWorkerResponse {
  type: 'result' | 'error' | 'ready';
  data?: {
    qrCode?: {
      data: string;
      location: {
        topLeft: { x: number; y: number };
        topRight: { x: number; y: number };
        bottomLeft: { x: number; y: number };
        bottomRight: { x: number; y: number };
      };
      binaryData: number[];
    } | null;
    error?: string;
    processingTime?: number;
  };
  id?: string;
}

// Performance monitoring
let scanCount = 0;
let totalProcessingTime = 0;
let lastFrameTime = 0;

// Enhanced image processing for better QR detection
function preprocessImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const length = data.length;
  
  // Create a copy to avoid modifying the original
  const processedData = new Uint8ClampedArray(data);
  
  // Convert to grayscale and enhance contrast
  for (let i = 0; i < length; i += 4) {
    // Calculate luminance using standard weights
    const grayscale = Math.round(
      0.299 * processedData[i] +     // Red
      0.587 * processedData[i + 1] + // Green
      0.114 * processedData[i + 2]   // Blue
    );
    
    // Apply contrast enhancement
    const enhanced = Math.max(0, Math.min(255, (grayscale - 128) * 1.5 + 128));
    
    // Set RGB to enhanced grayscale value
    processedData[i] = enhanced;     // Red
    processedData[i + 1] = enhanced; // Green
    processedData[i + 2] = enhanced; // Blue
    // Keep alpha unchanged
  }
  
  return new ImageData(processedData, imageData.width, imageData.height);
}

// Apply noise reduction using simple blur
function reduceNoise(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const processedData = new Uint8ClampedArray(data);
  
  // Simple 3x3 box blur for noise reduction
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;
        let count = 0;
        
        // 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4 + c;
            sum += data[idx];
            count++;
          }
        }
        
        const idx = (y * width + x) * 4 + c;
        processedData[idx] = Math.round(sum / count);
      }
    }
  }
  
  return new ImageData(processedData, width, height);
}

// Adaptive region of interest detection
function getOptimalROI(imageData: ImageData): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { width, height } = imageData;
  
  // For QR codes, focus on center 80% of the image for better performance
  const roiWidth = Math.floor(width * 0.8);
  const roiHeight = Math.floor(height * 0.8);
  const roiX = Math.floor((width - roiWidth) / 2);
  const roiY = Math.floor((height - roiHeight) / 2);
  
  return {
    x: roiX,
    y: roiY,
    width: roiWidth,
    height: roiHeight
  };
}

// Extract ROI from image data
function extractROI(imageData: ImageData, roi: { x: number; y: number; width: number; height: number }): ImageData {
  const { data, width } = imageData;
  const { x: roiX, y: roiY, width: roiWidth, height: roiHeight } = roi;
  
  const roiData = new Uint8ClampedArray(roiWidth * roiHeight * 4);
  
  for (let y = 0; y < roiHeight; y++) {
    for (let x = 0; x < roiWidth; x++) {
      const sourceIdx = ((roiY + y) * width + (roiX + x)) * 4;
      const targetIdx = (y * roiWidth + x) * 4;
      
      roiData[targetIdx] = data[sourceIdx];         // R
      roiData[targetIdx + 1] = data[sourceIdx + 1]; // G
      roiData[targetIdx + 2] = data[sourceIdx + 2]; // B
      roiData[targetIdx + 3] = data[sourceIdx + 3]; // A
    }
  }
  
  return new ImageData(roiData, roiWidth, roiHeight);
}

// Enhanced QR scanning with multiple techniques
function scanQRCodeEnhanced(imageData: ImageData, options: QRWorkerMessage['data']['options'] = {}): QRWorkerResponse['data'] {
  const startTime = performance.now();
  
  try {
    // Try scanning original image first
    let result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: options.inversionAttempts || 'dontInvert'
    });
    
    // If no result, try with image preprocessing
    if (!result) {
      const preprocessedImage = preprocessImage(imageData);
      result = jsQR(preprocessedImage.data, preprocessedImage.width, preprocessedImage.height, {
        inversionAttempts: options.inversionAttempts || 'attemptBoth'
      });
    }
    
    // If still no result, try with noise reduction
    if (!result) {
      const denoisedImage = reduceNoise(imageData);
      result = jsQR(denoisedImage.data, denoisedImage.width, denoisedImage.height, {
        inversionAttempts: options.inversionAttempts || 'attemptBoth'
      });
    }
    
    // If still no result, try ROI-based scanning for performance
    if (!result && imageData.width > 640 && imageData.height > 480) {
      const roi = getOptimalROI(imageData);
      const roiImage = extractROI(imageData, roi);
      const roiResult = jsQR(roiImage.data, roiImage.width, roiImage.height, {
        inversionAttempts: options.inversionAttempts || 'attemptBoth'
      });
      
      // Adjust coordinates back to full image space
      if (roiResult) {
        result = {
          ...roiResult,
          location: {
            topLeft: {
              x: roiResult.location.topLeft.x + roi.x,
              y: roiResult.location.topLeft.y + roi.y
            },
            topRight: {
              x: roiResult.location.topRight.x + roi.x,
              y: roiResult.location.topRight.y + roi.y
            },
            bottomLeft: {
              x: roiResult.location.bottomLeft.x + roi.x,
              y: roiResult.location.bottomLeft.y + roi.y
            },
            bottomRight: {
              x: roiResult.location.bottomRight.x + roi.x,
              y: roiResult.location.bottomRight.y + roi.y
            }
          }
        };
      }
    }
    
    const processingTime = performance.now() - startTime;
    scanCount++;
    totalProcessingTime += processingTime;
    
    // Log performance metrics periodically
    if (scanCount % 30 === 0) {
      const averageTime = totalProcessingTime / scanCount;
      console.log(`🔍 QR Worker Performance - Scans: ${scanCount}, Avg: ${averageTime.toFixed(2)}ms`);
    }
    
    return {
      qrCode: result ? {
        data: result.data,
        location: result.location,
        binaryData: result.binaryData
      } : null,
      processingTime
    };
  } catch (error) {
    const processingTime = performance.now() - startTime;
    return {
      error: error instanceof Error ? error.message : 'Unknown scanning error',
      processingTime
    };
  }
}

// Handle incoming messages
self.onmessage = function(event: MessageEvent<QRWorkerMessage>) {
  const { type, data, id } = event.data;
  
  switch (type) {
    case 'init':
      // Worker initialization
      scanCount = 0;
      totalProcessingTime = 0;
      lastFrameTime = 0;
      
      self.postMessage({
        type: 'ready',
        id
      } as QRWorkerResponse);
      break;
      
    case 'scan':
      if (!data?.imageData) {
        self.postMessage({
          type: 'error',
          data: { error: 'No image data provided' },
          id
        } as QRWorkerResponse);
        return;
      }
      
      // Throttle scanning to prevent overwhelming
      const now = performance.now();
      if (lastFrameTime && (now - lastFrameTime) < 100) { // Max 10 FPS
        return;
      }
      lastFrameTime = now;
      
      const result = scanQRCodeEnhanced(data.imageData, data.options);
      
      self.postMessage({
        type: 'result',
        data: result,
        id
      } as QRWorkerResponse);
      break;
      
    case 'destroy':
      // Cleanup
      scanCount = 0;
      totalProcessingTime = 0;
      lastFrameTime = 0;
      
      self.postMessage({
        type: 'ready',
        data: { message: 'Worker cleaned up' },
        id
      } as QRWorkerResponse);
      break;
      
    default:
      self.postMessage({
        type: 'error',
        data: { error: `Unknown message type: ${type}` },
        id
      } as QRWorkerResponse);
  }
};

// Handle worker errors
self.onerror = function(error) {
  console.error('QR Worker error:', error);
  self.postMessage({
    type: 'error',
    data: { error: error.message }
  } as QRWorkerResponse);
};

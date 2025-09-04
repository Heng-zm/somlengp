'use client';

import { detectQRCodeAdvanced } from './advanced-qr-detection';

/**
 * Debug utility for QR code detection issues
 */
export async function debugQRDetection(imageFile: File): Promise<{
  success: boolean;
  result?: any;
  debug: {
    fileInfo: {
      name: string;
      size: number;
      type: string;
    };
    imageInfo?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    attempts: Array<{
      strategy: string;
      success: boolean;
      error?: string;
      result?: any;
    }>;
    suggestions: string[];
  };
}> {
  const debug = {
    fileInfo: {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    },
    attempts: [] as any[],
    suggestions: [] as string[]
  };

  try {
    // Load the image
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
    
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = imageData;
    });

    debug.imageInfo = {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height
    };

    // Add suggestions based on image analysis
    if (imageFile.size > 5 * 1024 * 1024) { // > 5MB
      debug.suggestions.push('Image file is very large. Consider compressing it.');
    }

    if (img.width < 200 || img.height < 200) {
      debug.suggestions.push('Image is quite small. QR codes work better with higher resolution images.');
    }

    if (img.width > 4000 || img.height > 4000) {
      debug.suggestions.push('Image is very high resolution. Consider resizing to improve processing speed.');
    }

    // Strategy 1: Direct detection with minimal preprocessing
    try {
      const result1 = await detectQRCodeAdvanced(img, {
        enablePreprocessing: false,
        enableRotationCorrection: false,
        enableContrastEnhancement: false,
        enableBlurReduction: false,
        minQuality: 0.1,
        maxRetries: 1,
        timeoutMs: 3000
      });

      debug.attempts.push({
        strategy: 'Direct (no preprocessing)',
        success: !!result1,
        result: result1
      });

      if (result1) {
        return { success: true, result: result1, debug };
      }
    } catch (error) {
      debug.attempts.push({
        strategy: 'Direct (no preprocessing)',
        success: false,
        error: String(error)
      });
    }

    // Strategy 2: Enhanced preprocessing
    try {
      const result2 = await detectQRCodeAdvanced(img, {
        enablePreprocessing: true,
        enableRotationCorrection: true,
        enableContrastEnhancement: true,
        enableBlurReduction: true,
        minQuality: 0.05,
        maxRetries: 3,
        timeoutMs: 8000
      });

      debug.attempts.push({
        strategy: 'Enhanced preprocessing',
        success: !!result2,
        result: result2
      });

      if (result2) {
        return { success: true, result: result2, debug };
      }
    } catch (error) {
      debug.attempts.push({
        strategy: 'Enhanced preprocessing',
        success: false,
        error: String(error)
      });
    }

    // Strategy 3: Extreme settings for difficult images
    try {
      const result3 = await detectQRCodeAdvanced(img, {
        enablePreprocessing: true,
        enableRotationCorrection: true,
        enableContrastEnhancement: true,
        enableBlurReduction: true,
        minQuality: 0.01,
        maxRetries: 5,
        timeoutMs: 15000
      });

      debug.attempts.push({
        strategy: 'Extreme settings',
        success: !!result3,
        result: result3
      });

      if (result3) {
        return { success: true, result: result3, debug };
      }
    } catch (error) {
      debug.attempts.push({
        strategy: 'Extreme settings',
        success: false,
        error: String(error)
      });
    }

    // Add more specific suggestions based on failed attempts
    if (!debug.attempts.some(a => a.success)) {
      debug.suggestions.push('No QR code detected. Ensure the image contains a clear, well-lit QR code.');
      debug.suggestions.push('Try taking a new photo with better lighting and focus.');
      debug.suggestions.push('Make sure the QR code takes up a significant portion of the image.');
      debug.suggestions.push('Avoid images with excessive blur, glare, or distortion.');
    }

    return { success: false, debug };

  } catch (error) {
    debug.attempts.push({
      strategy: 'File processing',
      success: false,
      error: String(error)
    });

    debug.suggestions.push('Failed to process the image file. Please try a different image format (JPG, PNG, WebP).');

    return { success: false, debug };
  }
}

/**
 * Generate a comprehensive QR detection report
 */
export function generateQRDetectionReport(debugResult: Awaited<ReturnType<typeof debugQRDetection>>): string {
  const { success, result, debug } = debugResult;
  
  let report = '=== QR Code Detection Report ===\n\n';
  
  // File information
  report += `File Information:\n`;
  report += `  Name: ${debug.fileInfo.name}\n`;
  report += `  Size: ${(debug.fileInfo.size / 1024).toFixed(1)} KB\n`;
  report += `  Type: ${debug.fileInfo.type}\n\n`;
  
  // Image information
  if (debug.imageInfo) {
    report += `Image Information:\n`;
    report += `  Dimensions: ${debug.imageInfo.width} × ${debug.imageInfo.height}\n`;
    report += `  Aspect Ratio: ${debug.imageInfo.aspectRatio.toFixed(2)}\n\n`;
  }
  
  // Detection attempts
  report += `Detection Attempts:\n`;
  debug.attempts.forEach((attempt, index) => {
    report += `  ${index + 1}. ${attempt.strategy}: ${attempt.success ? '✓ SUCCESS' : '✗ FAILED'}\n`;
    if (attempt.error) {
      report += `     Error: ${attempt.error}\n`;
    }
    if (attempt.result) {
      report += `     Data: ${attempt.result.data.substring(0, 50)}${attempt.result.data.length > 50 ? '...' : ''}\n`;
      report += `     Strategy: ${attempt.result.strategy}\n`;
      report += `     Processing Time: ${attempt.result.processingTime.toFixed(0)}ms\n`;
    }
  });
  report += '\n';
  
  // Final result
  report += `Final Result: ${success ? '✓ QR CODE DETECTED' : '✗ NO QR CODE FOUND'}\n\n`;
  
  // Suggestions
  if (debug.suggestions.length > 0) {
    report += `Suggestions:\n`;
    debug.suggestions.forEach((suggestion, index) => {
      report += `  ${index + 1}. ${suggestion}\n`;
    });
  }
  
  return report;
}

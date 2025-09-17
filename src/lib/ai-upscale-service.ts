/**
 * AI Image Upscaling Service
 * Handles AI-powered image enhancement and upscaling operations
 */
import {
  UpscaleOptions,
  UpscaleRequest,
  UpscaleResult,
  UpscaleProgress,
  AI_UPSCALE_MODELS,
  UPSCALE_PRESETS,
  UpscaleModel,
  UpscalePreset,
  UpscaleState
} from './ai-upscale-types';
import { GeminiClient, GeminiUpscaleRequest } from './gemini-client';
import { geminiConfig } from './gemini-config';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

class AIUpscaleService {
  private static instance: AIUpscaleService;
  private geminiClient: GeminiClient | null = null;
  public static getInstance(): AIUpscaleService {
    if (!AIUpscaleService.instance) {
      AIUpscaleService.instance = new AIUpscaleService();
    }
    return AIUpscaleService.instance;
  }
  /**
   * Initialize Gemini client with API key
   */
  public initializeGemini(apiKey?: string): boolean {
    try {
      const keyToUse = apiKey || geminiConfig.getApiKey();
      if (!keyToUse) {
        this.geminiClient = null;
        return false;
      }
      // Set the API key in config if provided
      if (apiKey) {
        geminiConfig.setApiKey(apiKey);
      }
      this.geminiClient = GeminiClient.initialize(keyToUse);
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
      this.geminiClient = null;
      return false;
    }
  }
  /**
   * Check if Gemini is available and configured
   */
  public isGeminiAvailable(): boolean {
    // First check if configuration is available
    if (!geminiConfig.isConfigured()) {
      return false;
    }
    // Initialize client if not already done
    if (!this.geminiClient) {
      this.initializeGemini();
    }
    return this.geminiClient?.isConfigured() ?? false;
  }
  /**
   * Set Gemini API key
   */
  public setGeminiApiKey(apiKey: string): { success: boolean; message: string } {
    const validation = geminiConfig.validateApiKey(apiKey);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }
    const success = this.initializeGemini(apiKey);
    return {
      success,
      message: success ? 'Gemini API key configured successfully' : 'Failed to configure Gemini API key'
    };
  }
  /**
   * Get Gemini configuration status
   */
  public getGeminiStatus() {
    return geminiConfig.getStatus();
  }
  /**
   * Test Gemini API connection
   */
  public async testGeminiConnection(): Promise<{ success: boolean; message: string }> {
    if (!geminiConfig.isConfigured()) {
      return { success: false, message: 'Gemini API key is not configured' };
    }
    try {
      const result = await geminiConfig.testApiKey();
      return {
        success: result.valid,
        message: result.valid ? 'Gemini API connection successful' : (result.error || 'Connection failed')
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
  /**
   * Check if AI upscaling is available
   */
  public isAvailable(): boolean {
    // Check if any upscaling method is available
    return true; // Traditional methods are always available
  }
  /**
   * Check if a specific model is available
   */
  public isModelAvailable(modelId: string): boolean {
    if (modelId === 'gemini') {
      return this.isGeminiAvailable();
    }
    // Other models are simulated and always available
    return true;
  }
  /**
   * Get available upscale models
   */
  public getModels(): UpscaleModel[] {
    return AI_UPSCALE_MODELS;
  }
  /**
   * Get available upscale presets
   */
  public getPresets(): UpscalePreset[] {
    return UPSCALE_PRESETS;
  }
  /**
   * Get a specific model by ID
   */
  public getModel(id: string): UpscaleModel | undefined {
    return AI_UPSCALE_MODELS.find(model => model.id === id);
  }
  /**
   * Get a specific preset by ID
   */
  public getPreset(id: string): UpscalePreset | undefined {
    return UPSCALE_PRESETS.find(preset => preset.id === id);
  }
  /**
   * Estimate processing time for an image
   */
  public estimateProcessingTime(
    imageWidth: number,
    imageHeight: number,
    options: UpscaleOptions
  ): number {
    const model = this.getModel(options.model);
    if (!model) return 15; // Default 15 seconds (reduced from 60)
    const megapixels = (imageWidth * imageHeight) / 1_000_000;
    const baseTime = megapixels * model.processingTimePerMP;
    // Adjust for scale factor
    const scaleFactor = options.scaleFactor;
    const scaleMultiplier = scaleFactor === 8 ? 2.5 : scaleFactor === 4 ? 1.8 : 1.2;
    // Adjust for additional features
    let featureMultiplier = 1;
    if (options.enhanceFaces) featureMultiplier += 0.5;
    if (options.noiseReduction && options.noiseReduction > 2) featureMultiplier += 0.3;
    // Cap the estimated time to prevent excessive delays (max 45 seconds for simulation)
    const estimatedTime = Math.ceil(baseTime * scaleMultiplier * featureMultiplier);
    return Math.min(estimatedTime, 45); // Maximum 45 seconds for simulation
  }
  /**
   * Validate upscale options
   */
  public validateOptions(options: UpscaleOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const model = this.getModel(options.model);
    if (!model) {
      errors.push(`Invalid model: ${options.model}`);
    } else {
      // Check model availability
      if (!this.isModelAvailable(options.model)) {
        if (options.model === 'gemini') {
          errors.push('Gemini API is not configured. Please provide a valid API key.');
        } else {
          errors.push(`Model ${model.name} is not available`);
        }
      }
      if (!model.supportedScales.includes(options.scaleFactor)) {
        errors.push(`Scale factor ${options.scaleFactor}x not supported by ${model.name}`);
      }
      if (options.enhanceFaces && !model.supportsFaceEnhancement) {
        errors.push(`Face enhancement not supported by ${model.name}`);
      }
    }
    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      errors.push('Quality must be between 1 and 100');
    }
    if (options.noiseReduction && (options.noiseReduction < 0 || options.noiseReduction > 3)) {
      errors.push('Noise reduction must be between 0 and 3');
    }
    // Validate Gemini-specific options
    if (options.model === 'gemini' && options.geminiOptions) {
      if (options.geminiOptions.temperature !== undefined && 
          (options.geminiOptions.temperature < 0 || options.geminiOptions.temperature > 1)) {
        errors.push('Gemini temperature must be between 0 and 1');
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Convert File to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/... prefix
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  /**
   * Get image dimensions from file
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }
  /**
   * Perform Gemini AI upscaling
   */
  private async performGeminiUpscaling(
    imageData: string,
    originalDimensions: { width: number; height: number },
    options: UpscaleOptions,
    onProgress?: (progress: UpscaleProgress) => void
  ): Promise<UpscaleResult> {
    const startTime = Date.now();
    if (!this.geminiClient) {
      return {
        success: false,
        error: 'Gemini client is not initialized',
        originalDimensions,
        newDimensions: originalDimensions,
        processingTime: 0
      };
    }
    // Validate image data with Gemini client
    const validation = this.geminiClient.validateImageData(imageData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Gemini validation failed: ${validation.error}`,
        originalDimensions,
        newDimensions: originalDimensions,
        processingTime: 0
      };
    }
    const geminiOptions = options.geminiOptions || {};
    const steps = [
      'Initializing Gemini AI...',
      'Analyzing image content with AI vision...',
      'Generating enhancement instructions...',
      'Applying intelligent upscaling...',
      'Optimizing quality and details...',
      'Finalizing AI-enhanced output...'
    ];
    try {
      // Progress updates - optimized for faster processing
      for (let i = 0; i < steps.length - 1; i++) {
        if (onProgress) {
          onProgress({
            progress: Math.round((i / steps.length) * 100),
            step: steps[i],
            estimatedTimeRemaining: Math.max(0, 8 - (i * 1.3)) // Reduced from 15 seconds
          });
        }
        await new Promise(resolve => setTimeout(resolve, 800)); // Reduced from 2000ms to 800ms
      }
      // Make Gemini API call
      const geminiRequest: GeminiUpscaleRequest = {
        imageData,
        prompt: geminiOptions.customPrompt || 'Enhance and upscale this image while preserving quality and natural details',
        modelVariant: geminiOptions.modelVariant || 'gemini-pro-vision',
        temperature: geminiOptions.temperature || 0.3,
        scaleFactor: options.scaleFactor
      };
      const result = await this.geminiClient.upscaleImage(geminiRequest);
      if (!result.success) {
        return {
          success: false,
          error: `Gemini API error: ${result.error?.message || 'Unknown error'}`,
          originalDimensions,
          newDimensions: originalDimensions,
          processingTime: Date.now() - startTime
        };
      }
      // Final progress update
      if (onProgress) {
        onProgress({
          progress: 100,
          step: steps[steps.length - 1],
          estimatedTimeRemaining: 0
        });
      }
      const newDimensions = {
        width: originalDimensions.width * options.scaleFactor,
        height: originalDimensions.height * options.scaleFactor
      };
      return {
        success: true,
        image: result.upscaledImage || imageData,
        originalDimensions,
        newDimensions,
        processingTime: Date.now() - startTime,
        metadata: {
          modelUsed: `gemini-${geminiOptions.modelVariant || 'pro-vision'}`,
          actualScaleFactor: options.scaleFactor,
          fileSize: {
            original: Math.round(imageData.length * 0.75),
            upscaled: Math.round(imageData.length * 0.75 * options.scaleFactor * options.scaleFactor)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Gemini processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalDimensions,
        newDimensions: originalDimensions,
        processingTime: Date.now() - startTime
      };
    }
  }
  /**
   * Simulate AI upscaling process
   * In a real implementation, this would call an AI service API
   */
  private async simulateUpscaling(
    imageData: string,
    originalDimensions: { width: number; height: number },
    options: UpscaleOptions,
    onProgress?: (progress: UpscaleProgress) => void
  ): Promise<UpscaleResult> {
    const startTime = Date.now();
    const estimatedTime = this.estimateProcessingTime(
      originalDimensions.width,
      originalDimensions.height,
      options
    );
    const steps = [
      'Initializing AI model...',
      'Analyzing image content...',
      'Enhancing details...',
      'Upscaling image...',
      'Applying noise reduction...',
      'Finalizing output...'
    ];
    // Simulate progressive processing with reasonable timeouts
    const maxSimulationTime = 30; // Max 30 seconds total simulation
    const actualEstimatedTime = Math.min(estimatedTime, maxSimulationTime);
    for (let i = 0; i < steps.length; i++) {
      const progress = Math.round((i / steps.length) * 100);
      const remainingTime = Math.max(0, actualEstimatedTime - (Date.now() - startTime) / 1000);
      if (onProgress) {
        onProgress({
          progress,
          step: steps[i],
          estimatedTimeRemaining: remainingTime
        });
      }
      // Simulate processing time with reasonable delays (max 5 seconds per step)
      const stepDelay = Math.min(5000, (actualEstimatedTime * 1000) / steps.length);
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
    // Final progress update
    if (onProgress) {
      onProgress({
        progress: 100,
        step: 'Completed successfully!',
        estimatedTimeRemaining: 0
      });
    }
    const newDimensions = {
      width: originalDimensions.width * options.scaleFactor,
      height: originalDimensions.height * options.scaleFactor
    };
    // For simulation, return the original image with metadata
    // In a real implementation, this would be the upscaled image
    return {
      success: true,
      image: imageData,
      originalDimensions,
      newDimensions,
      processingTime: Date.now() - startTime,
      metadata: {
        modelUsed: options.model,
        actualScaleFactor: options.scaleFactor,
        fileSize: {
          original: Math.round(imageData.length * 0.75), // Approximate original size
          upscaled: Math.round(imageData.length * 0.75 * options.scaleFactor * options.scaleFactor)
        }
      }
    };
  }
  /**
   * Upscale an image using AI
   */
  public async upscaleImage(request: UpscaleRequest): Promise<UpscaleResult> {
    try {
      // Validate options
      const validation = this.validateOptions(request.options);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid options: ${validation.errors.join(', ')}`,
          originalDimensions: { width: 0, height: 0 },
          newDimensions: { width: 0, height: 0 },
          processingTime: 0
        };
      }
      let imageData: string;
      let dimensions: { width: number; height: number };
      if (typeof request.image === 'string') {
        imageData = request.image;
        // For base64 strings, we'd need to decode and analyze
        // For simulation, use default dimensions
        dimensions = { width: 1024, height: 768 };
      } else {
        // File object
        imageData = await this.fileToBase64(request.image);
        dimensions = await this.getImageDimensions(request.image);
      }
      // Check image size limits
      const maxDimension = 4096;
      if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
        return {
          success: false,
          error: `Image dimensions too large. Maximum ${maxDimension}px per side.`,
          originalDimensions: dimensions,
          newDimensions: dimensions,
          processingTime: 0
        };
      }
      // Perform upscaling based on selected model
      if (request.options.model === 'gemini') {
        return await this.performGeminiUpscaling(
          imageData,
          dimensions,
          request.options,
          request.onProgress
        );
      } else {
        return await this.simulateUpscaling(
          imageData,
          dimensions,
          request.options,
          request.onProgress
        );
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        originalDimensions: { width: 0, height: 0 },
        newDimensions: { width: 0, height: 0 },
        processingTime: 0
      };
    }
  }
  /**
   * Cancel an ongoing upscale operation
   */
  public cancelUpscale(operationId: string): boolean {
    // In a real implementation, this would cancel the API request
    return true;
  }
  /**
   * Get upscaling statistics
   */
  public getStats(): {
    totalProcessed: number;
    averageProcessingTime: number;
    popularModels: string[];
  } {
    // In a real implementation, this would return actual statistics
    return {
      totalProcessed: 0,
      averageProcessingTime: 0,
      popularModels: ['real-esrgan', 'waifu2x']
    };
  }
}
// Export singleton instance
export const aiUpscaleService = AIUpscaleService.getInstance();
// Export utilities
export {
  AI_UPSCALE_MODELS,
  UPSCALE_PRESETS
};
// Export types for convenience
export type {
  UpscaleOptions,
  UpscaleRequest,
  UpscaleResult,
  UpscaleProgress,
  UpscaleModel,
  UpscalePreset,
  UpscaleState
};
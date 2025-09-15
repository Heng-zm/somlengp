/**
 * Gemini API Client for Image Upscaling
 * Handles communication with Google's Gemini Vision API
 */

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface GeminiUpscaleRequest {
  imageData: string;
  prompt: string;
  modelVariant: string;
  temperature?: number;
  scaleFactor: number;
  maxOutputTokens?: number;
}

export interface GeminiUpscaleResponse {
  success: boolean;
  upscaledImage?: string;
  metadata?: {
    modelUsed: string;
    tokensUsed: number;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class GeminiClient {
  private config: GeminiConfig;
  private static instance: GeminiClient;

  constructor(config: GeminiConfig) {
    this.config = {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 60000,
      maxRetries: 3,
      ...config
    };
  }

  public static getInstance(config?: GeminiConfig): GeminiClient {
    if (!GeminiClient.instance && config) {
      GeminiClient.instance = new GeminiClient(config);
    } else if (!GeminiClient.instance) {
      throw new Error('GeminiClient must be initialized with config first');
    }
    return GeminiClient.instance;
  }

  /**
   * Initialize Gemini client with API key
   */
  public static initialize(apiKey: string, options?: Partial<GeminiConfig>): GeminiClient {
    const config: GeminiConfig = {
      apiKey,
      ...options
    };
    return new GeminiClient(config);
  }

  /**
   * Check if API key is configured
   */
  public isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.trim().length > 0;
  }

  /**
   * Construct the upscaling prompt
   */
  private constructUpscalingPrompt(customPrompt: string, scaleFactor: number): string {
    const basePrompt = `Please analyze this image and provide instructions for upscaling it to ${scaleFactor}x resolution while maintaining quality and detail.`;
    
    if (customPrompt) {
      return `${basePrompt} Additional requirements: ${customPrompt}`;
    }
    
    return basePrompt;
  }

  /**
   * Call Gemini Vision API for image upscaling
   */
  public async upscaleImage(request: GeminiUpscaleRequest): Promise<GeminiUpscaleResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: 'Gemini API key is not configured'
        }
      };
    }

    const startTime = Date.now();

    try {
      const url = `${this.config.baseUrl}/models/${request.modelVariant}:generateContent?key=${this.config.apiKey}`;
      
      const prompt = this.constructUpscalingPrompt(request.prompt, request.scaleFactor);

      const requestBody = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg", // Assume JPEG for now
                data: request.imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: request.temperature || 0.4,
          maxOutputTokens: request.maxOutputTokens || 2048,
        }
      };

      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.error?.message || 'API request failed',
            details: errorData
          }
        };
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // For now, Gemini Vision doesn't directly return upscaled images
      // This is a simulation - in real implementation, you'd use the response
      // to guide traditional upscaling algorithms or integrate with specialized services
      return {
        success: true,
        upscaledImage: request.imageData, // Simulated - would be actual upscaled image
        metadata: {
          modelUsed: request.modelVariant,
          tokensUsed: result.usageMetadata?.totalTokenCount || 0,
          processingTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown network error',
          details: error
        }
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      if (retryCount < this.config.maxRetries! && this.isRetriableError(error)) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retriable
   */
  private isRetriableError(error: any): boolean {
    return error.name === 'AbortError' || 
           error.code === 'NETWORK_ERROR' ||
           (error.status && error.status >= 500);
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate image data
   */
  public validateImageData(imageData: string): { valid: boolean; error?: string } {
    if (!imageData || imageData.trim().length === 0) {
      return { valid: false, error: 'Image data is empty' };
    }

    // Basic base64 validation
    try {
      const decoded = atob(imageData);
      if (decoded.length === 0) {
        return { valid: false, error: 'Invalid base64 image data' };
      }
    } catch (error) {
      return { valid: false, error: 'Invalid base64 encoding' };
    }

    // Check size (Gemini has limits)
    const sizeInMB = (imageData.length * 0.75) / (1024 * 1024); // Approximate size
    if (sizeInMB > 20) { // Gemini typical limit
      return { valid: false, error: 'Image too large (max 20MB)' };
    }

    return { valid: true };
  }

  /**
   * Get API usage statistics
   */
  public async getUsageStats(): Promise<{
    quotaRemaining?: number;
    requestsToday?: number;
    rateLimit?: {
      limit: number;
      remaining: number;
      resetTime: Date;
    };
  }> {
    // In a real implementation, this would call Gemini's quota API
    // For now, return placeholder data
    return {
      quotaRemaining: 1000,
      requestsToday: 25,
      rateLimit: {
        limit: 60,
        remaining: 45,
        resetTime: new Date(Date.now() + 3600000)
      }
    };
  }
}

export { GeminiClient };
export default GeminiClient;
/**
 * Gemini API Configuration
 * Handles API key management and configuration for Gemini integration
 */

interface GeminiEnvironment {
  apiKey: string | null;
  isConfigured: boolean;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

class GeminiConfig {
  private static instance: GeminiConfig;
  private config: GeminiEnvironment;

  private constructor() {
    this.config = {
      apiKey: null,
      isConfigured: false,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 60000,
      maxRetries: 3
    };

    this.loadConfiguration();
  }

  public static getInstance(): GeminiConfig {
    if (!GeminiConfig.instance) {
      GeminiConfig.instance = new GeminiConfig();
    }
    return GeminiConfig.instance;
  }

  /**
   * Load configuration from environment variables or local storage
   */
  private loadConfiguration(): void {
    // Try to load from environment variables (server-side)
    if (typeof process !== 'undefined' && process.env) {
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (envApiKey) {
        this.config.apiKey = envApiKey;
        this.config.isConfigured = true;
        return;
      }
    }

    // Try to load from local storage (client-side)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedApiKey = localStorage.getItem('gemini_api_key');
        if (storedApiKey && storedApiKey.trim().length > 0) {
          this.config.apiKey = storedApiKey;
          this.config.isConfigured = true;
        }
      } catch (error) {
        console.warn('Failed to load Gemini API key from localStorage:', error);
      }
    }
  }

  /**
   * Set the Gemini API key
   */
  public setApiKey(apiKey: string): boolean {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        this.config.apiKey = null;
        this.config.isConfigured = false;
        
        // Remove from localStorage if it exists
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('gemini_api_key');
        }
        return false;
      }

      // Basic validation - Gemini API keys typically start with 'AIza'
      if (!apiKey.startsWith('AIza')) {
        console.warn('Gemini API key should start with "AIza". Please verify your key.');
      }

      this.config.apiKey = apiKey.trim();
      this.config.isConfigured = true;

      // Store in localStorage for persistence
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
      }

      return true;
    } catch (error) {
      console.error('Failed to set Gemini API key:', error);
      return false;
    }
  }

  /**
   * Get the current API key
   */
  public getApiKey(): string | null {
    return this.config.apiKey;
  }

  /**
   * Check if Gemini is configured
   */
  public isConfigured(): boolean {
    return this.config.isConfigured && !!this.config.apiKey;
  }

  /**
   * Get full configuration
   */
  public getConfig(): Readonly<GeminiEnvironment> {
    return { ...this.config };
  }

  /**
   * Clear the API key and configuration
   */
  public clearApiKey(): void {
    this.config.apiKey = null;
    this.config.isConfigured = false;

    // Remove from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('gemini_api_key');
      } catch (error) {
        console.warn('Failed to clear Gemini API key from localStorage:', error);
      }
    }
  }

  /**
   * Validate API key format
   */
  public validateApiKey(apiKey: string): { valid: boolean; message: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, message: 'API key is required' };
    }

    if (apiKey.length < 20) {
      return { valid: false, message: 'API key appears to be too short' };
    }

    if (!apiKey.startsWith('AIza')) {
      return { 
        valid: false, 
        message: 'Gemini API key should start with "AIza". Please verify your key.' 
      };
    }

    // Check for common mistakes
    if (apiKey.includes(' ')) {
      return { valid: false, message: 'API key should not contain spaces' };
    }

    return { valid: true, message: 'API key format looks valid' };
  }

  /**
   * Get configuration status for display
   */
  public getStatus(): {
    configured: boolean;
    hasKey: boolean;
    keyPreview: string;
    source: 'environment' | 'localStorage' | 'none';
  } {
    let source: 'environment' | 'localStorage' | 'none' = 'none';
    
    // Check if loaded from environment
    if (typeof process !== 'undefined' && process.env) {
      const envApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (envApiKey && envApiKey === this.config.apiKey) {
        source = 'environment';
      }
    }
    
    // Check if loaded from localStorage
    if (source === 'none' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedApiKey = localStorage.getItem('gemini_api_key');
        if (storedApiKey === this.config.apiKey) {
          source = 'localStorage';
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }

    const keyPreview = this.config.apiKey 
      ? `${this.config.apiKey.substring(0, 8)}...${this.config.apiKey.substring(this.config.apiKey.length - 4)}`
      : '';

    return {
      configured: this.config.isConfigured,
      hasKey: !!this.config.apiKey,
      keyPreview,
      source
    };
  }

  /**
   * Test API key by making a simple request
   */
  public async testApiKey(apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    const testKey = apiKey || this.config.apiKey;
    
    if (!testKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      // Make a simple request to test the API key
      const response = await fetch(
        `${this.config.baseUrl}/models?key=${testKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          valid: false, 
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }
}

export default GeminiConfig;

// Export singleton instance
export const geminiConfig = GeminiConfig.getInstance();

// Export types
export type { GeminiEnvironment };
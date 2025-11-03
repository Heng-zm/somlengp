// Environment configuration helper
export const ENV_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
} as const;

// Validation functions
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV_CONFIG.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY or GOOGLE_API_KEY is not set');
  }
  if (typeof window !== 'undefined' && !ENV_CONFIG.NEXT_PUBLIC_MAPBOX_TOKEN) {
    errors.push('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Log environment status (for debugging)
export const logEnvironmentStatus = () => {
  const validation = validateEnvironment();
  
  if (process.env.NODE_ENV === 'development') {
    if (!ENV_CONFIG.GEMINI_API_KEY) {
      console.error('❌ GEMINI API Key is not configured');
    }
    if (typeof window !== 'undefined' && !ENV_CONFIG.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.warn('⚠️ Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) not configured');
    }
  }
  
  return validation;
};

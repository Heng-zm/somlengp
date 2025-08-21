// Environment configuration helper
export const ENV_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
} as const;

// Validation functions
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!ENV_CONFIG.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY or GOOGLE_API_KEY is not set');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Log environment status (for debugging)
export const logEnvironmentStatus = () => {
  const validation = validateEnvironment();
  
  if (ENV_CONFIG.GEMINI_API_KEY) {
    console.log('✅ GEMINI API Key is configured (length:', ENV_CONFIG.GEMINI_API_KEY.length, ')');
  } else {
    console.error('❌ GEMINI API Key is not configured');
  }
  
  
  return validation;
};

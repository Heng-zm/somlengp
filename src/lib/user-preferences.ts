// User preferences and settings types and functions

export interface UserPreferences {
  // UI/UX Preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: 'MDY' | 'DMY' | 'YMD';
  timeFormat: '12' | '24';
  
  // Notification Preferences
  notifications: {
    email: boolean;
    push: boolean;
    aiAssistantUpdates: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
  };
  
  // Privacy Preferences
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLastSeen: boolean;
    allowDataCollection: boolean;
    allowAnalytics: boolean;
  };
  
  // AI Assistant Preferences
  aiAssistant: {
    model: 'gemini-1.5-flash' | 'gemini-2.0-flash-exp';
    temperature: number; // 0.1 - 1.0
    maxTokens: number;
    systemPrompt: string | null;
    autoSave: boolean;
    responseFormat: 'markdown' | 'plain';
  };
  
  // Security Preferences
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // minutes
    loginNotifications: boolean;
    deviceTrust: boolean;
  };
  
  // Data Management
  dataRetention: {
    chatHistory: number; // days, 0 = forever
    activityLogs: number; // days
    autoDeleteTranscripts: boolean;
  };
  
  // Accessibility
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
  
  // Metadata
  updatedAt: Date;
  version: number;
}

// Default preferences for new users
export const defaultUserPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'MDY',
  timeFormat: '12',
  
  notifications: {
    email: true,
    push: true,
    aiAssistantUpdates: true,
    systemUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  },
  
  privacy: {
    profileVisibility: 'private',
    showEmail: false,
    showLastSeen: true,
    allowDataCollection: true,
    allowAnalytics: true,
  },
  
  aiAssistant: {
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: null,
    autoSave: true,
    responseFormat: 'markdown',
  },
  
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60, // 1 hour
    loginNotifications: true,
    deviceTrust: false,
  },
  
  dataRetention: {
    chatHistory: 90, // 90 days
    activityLogs: 30, // 30 days
    autoDeleteTranscripts: false,
  },
  
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    screenReader: false,
    keyboardNavigation: false,
  },
  
  updatedAt: new Date(),
  version: 1,
};

// Preference categories for organization
export const preferenceCategories = {
  general: {
    title: 'General',
    description: 'Basic application settings',
    fields: ['theme', 'language', 'timezone', 'dateFormat', 'timeFormat'],
  },
  notifications: {
    title: 'Notifications',
    description: 'Email and push notification preferences',
    fields: ['notifications'],
  },
  privacy: {
    title: 'Privacy',
    description: 'Control your data and profile visibility',
    fields: ['privacy'],
  },
  aiAssistant: {
    title: 'AI Assistant',
    description: 'Customize your AI assistant experience',
    fields: ['aiAssistant'],
  },
  security: {
    title: 'Security',
    description: 'Account security and authentication settings',
    fields: ['security'],
  },
  dataManagement: {
    title: 'Data Management',
    description: 'Control how long your data is stored',
    fields: ['dataRetention'],
  },
  accessibility: {
    title: 'Accessibility',
    description: 'Make the app easier to use',
    fields: ['accessibility'],
  },
};

// Validation schemas for preferences
export const validationRules = {
  theme: (value: any): value is UserPreferences['theme'] => 
    ['light', 'dark', 'system'].includes(value),
  
  language: (value: any): value is string => 
    typeof value === 'string' && value.length >= 2,
  
  timezone: (value: any): value is string => 
    typeof value === 'string' && value.length > 0,
  
  aiTemperature: (value: any): value is number => 
    typeof value === 'number' && value >= 0.1 && value <= 1.0,
  
  sessionTimeout: (value: any): value is number => 
    typeof value === 'number' && value >= 5 && value <= 1440, // 5 minutes to 24 hours
  
  dataRetentionDays: (value: any): value is number => 
    typeof value === 'number' && value >= 0 && value <= 365,
};

// Helper functions
export function validatePreferences(preferences: Partial<UserPreferences>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate theme
  if (preferences.theme && !validationRules.theme(preferences.theme)) {
    errors.push('Invalid theme value');
  }
  
  // Validate AI assistant temperature
  if (preferences.aiAssistant?.temperature !== undefined && 
      !validationRules.aiTemperature(preferences.aiAssistant.temperature)) {
    errors.push('AI temperature must be between 0.1 and 1.0');
  }
  
  // Validate session timeout
  if (preferences.security?.sessionTimeout !== undefined && 
      !validationRules.sessionTimeout(preferences.security.sessionTimeout)) {
    errors.push('Session timeout must be between 5 minutes and 24 hours');
  }
  
  // Validate data retention
  if (preferences.dataRetention?.chatHistory !== undefined && 
      !validationRules.dataRetentionDays(preferences.dataRetention.chatHistory)) {
    errors.push('Chat history retention must be between 0 and 365 days');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function mergePreferences(
  current: UserPreferences, 
  updates: Partial<UserPreferences>
): UserPreferences {
  // Deep merge preferences, being careful with nested objects
  const merged = { ...current } as any;
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      const typedKey = key as keyof UserPreferences;
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        // Deep merge for nested objects
        merged[typedKey] = {
          ...((merged[typedKey] as any) || {}),
          ...value
        };
      } else {
        // Direct assignment for primitives, arrays, and dates
        merged[typedKey] = value;
      }
    }
  });
  
  // Update metadata
  merged.updatedAt = new Date();
  merged.version = current.version + 1;
  
  return merged as UserPreferences;
}

export function sanitizePreferencesForClient(preferences: UserPreferences): UserPreferences {
  // Remove or mask any sensitive data before sending to client
  // For now, all preferences are safe to send to client
  return preferences;
}

export function getPreferenceDisplayValue(key: string, value: any): string {
  switch (key) {
    case 'theme':
      return value === 'system' ? 'System Default' : 
             value === 'light' ? 'Light' : 'Dark';
    case 'dateFormat':
      return value === 'MDY' ? 'MM/DD/YYYY' :
             value === 'DMY' ? 'DD/MM/YYYY' : 'YYYY/MM/DD';
    case 'timeFormat':
      return value === '12' ? '12 Hour' : '24 Hour';
    case 'profileVisibility':
      return value === 'public' ? 'Public' :
             value === 'private' ? 'Private' : 'Friends Only';
    case 'fontSize':
      return value.charAt(0).toUpperCase() + value.slice(1);
    case 'model':
      return value.includes('2.0') ? 'Gemini 2.0 Flash' : 'Gemini 1.5 Flash';
    case 'responseFormat':
      return value === 'markdown' ? 'Markdown' : 'Plain Text';
    default:
      if (typeof value === 'boolean') {
        return value ? 'Enabled' : 'Disabled';
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      return String(value);
  }
}
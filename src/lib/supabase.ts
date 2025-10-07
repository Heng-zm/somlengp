import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate Supabase configuration
function validateSupabaseConfig() {
  const requiredFields = { supabaseUrl, supabaseAnonKey };
  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const errorMsg = `Missing required Supabase configuration: ${missingFields.join(', ')}`;
    console.error(errorMsg);
    console.error('Please check your environment variables and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    
    if (typeof window !== 'undefined') {
      console.error('Current environment:', process.env.NODE_ENV);
      console.error('Current domain:', window.location.hostname);
      
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION DEPLOYMENT ISSUE:');
        console.error('1. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment platform');
        console.error('2. Add this domain to your Supabase project settings under Authentication > URL Configuration');
      }
    }
    
    throw new Error(errorMsg);
  }
}

// Initialize Supabase client
let _supabaseInstance: SupabaseClient<Database> | null = null;

function initializeSupabase(): SupabaseClient<Database> {
  if (!_supabaseInstance) {
    try {
      validateSupabaseConfig();
      
      _supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web',
          },
        },
      });
      
      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      throw error;
    }
  }
  
  return _supabaseInstance;
}

// Create Supabase client instance
export const createSupabaseClient = (): SupabaseClient<Database> => {
  return initializeSupabase();
};

// Export the client
export const supabaseClient = createSupabaseClient();

// Export as 'supabase' for backward compatibility
export const supabase = supabaseClient;

// Utility functions
export function isSupabaseInitialized(): boolean {
  return !!_supabaseInstance;
}

export function getSupabaseStatus(): {
  initialized: boolean;
  url: string | null;
  hasAnonKey: boolean;
} {
  return {
    initialized: isSupabaseInitialized(),
    url: supabaseUrl || null,
    hasAnonKey: !!supabaseAnonKey,
  };
}



export default supabaseClient;
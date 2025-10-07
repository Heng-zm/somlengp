// Supabase connection diagnostic utility
import { supabaseClient } from './supabase';
interface DiagnosticResult {
  step: string;
  success: boolean;
  error?: string;
  details?: any;
}
export class SupabaseDiagnostic {
  private results: DiagnosticResult[] = [];
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];
    // Step 1: Check environment variables
    await this.checkEnvironmentVariables();
    // Step 2: Test Supabase client initialization
    await this.testSupabaseInitialization();
    // Step 3: Test network connectivity
    await this.testNetworkConnectivity();
    // Step 4: Test database connection
    await this.testDatabaseConnection();
    // Step 5: Test Auth connection
    await this.testAuthConnection();
    return this.results;
  }
  private async checkEnvironmentVariables(): Promise<void> {
    try {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ];
      const missing = requiredVars.filter(varName => !process.env[varName]);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }
      this.results.push({
        step: 'Environment Variables',
        success: true,
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Environment Variables',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testSupabaseInitialization(): Promise<void> {
    try {
      // Test if Supabase client is initialized properly
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }
      
      // Test basic connection by getting current session
      const { data, error } = await supabaseClient.auth.getSession();
      if (error && !error.message.includes('session_not_found')) {
        throw error;
      }
      
      this.results.push({
        step: 'Supabase Client Initialization',
        success: true,
        details: {
          hasSession: !!data.session,
          clientInitialized: true
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Supabase Client Initialization',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testNetworkConnectivity(): Promise<void> {
    try {
      // Test basic connectivity to Supabase endpoints
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      const endpoints = [
        supabaseUrl + '/rest/v1/',
        supabaseUrl + '/auth/v1/'
      ];
      
      const results = await Promise.allSettled(
        endpoints.map(endpoint => 
          fetch(endpoint, { method: 'HEAD', mode: 'no-cors' })
            .then(() => ({ endpoint, success: true }))
            .catch(error => ({ endpoint, success: false, error: error.message }))
        )
      );
      this.results.push({
        step: 'Network Connectivity',
        success: results.every(result => result.status === 'fulfilled'),
        details: results.map(result => 
          result.status === 'fulfilled' ? result.value : { error: result.reason }
        )
      });
    } catch (error) {
      this.results.push({
        step: 'Network Connectivity',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testDatabaseConnection(): Promise<void> {
    try {
      // Test basic database connection by trying to query a simple table
      const { data, error } = await supabaseClient.from('visits').select('id').limit(1);
      
      if (error && !error.message.includes('relation "visits" does not exist')) {
        throw error;
      }
      
      this.results.push({
        step: 'Database Connection',
        success: true,
        details: {
          canQuery: true,
          testResult: error ? 'Table not found (normal for new setup)' : 'Connected successfully'
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Database Connection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testAuthConnection(): Promise<void> {
    try {
      // Test auth connection by checking current session
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error && !error.message.includes('session_not_found')) {
        throw error;
      }
      
      this.results.push({
        step: 'Auth Connection',
        success: true,
        details: {
          currentUser: data.session?.user?.id || null,
          hasSession: !!data.session
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Auth Connection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  printResults(): void {
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      if (!result.success && result.error) {
      }
      if (result.details) {
      }
    });
    // Provide recommendations
    const failedSteps = this.results.filter(r => !r.success);
    if (failedSteps.length > 0) {
      failedSteps.forEach(step => {
        switch (step.step) {
          case 'Environment Variables':
            break;
          case 'Firebase App Initialization':
            break;
          case 'Network Connectivity':
            break;
          case 'Firestore Connection':
            break;
          case 'Auth Connection':
            break;
        }
      });
    } else {
    }
  }
}
// Helper function to run diagnostics
export async function runSupabaseDiagnostics(): Promise<void> {
  const diagnostic = new SupabaseDiagnostic();
  await diagnostic.runDiagnostics();
  diagnostic.printResults();
}

// For backward compatibility
export async function runFirebaseDiagnostics(): Promise<void> {
  return runSupabaseDiagnostics();
}

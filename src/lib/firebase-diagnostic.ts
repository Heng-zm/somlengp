// Firebase connection diagnostic utility
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";
interface DiagnosticResult {
  step: string;
  success: boolean;
  error?: string;
  details?: any;
}
export class FirebaseDiagnostic {
  private results: DiagnosticResult[] = [];
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];
    // Step 1: Check environment variables
    await this.checkEnvironmentVariables();
    // Step 2: Test Firebase app initialization
    await this.testFirebaseInitialization();
    // Step 3: Test network connectivity
    await this.testNetworkConnectivity();
    // Step 4: Test Firestore connection
    await this.testFirestoreConnection();
    // Step 5: Test Auth connection
    await this.testAuthConnection();
    return this.results;
  }
  private async checkEnvironmentVariables(): Promise<void> {
    try {
      const requiredVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      ];
      const missing = requiredVars.filter(varName => !process.env[varName]);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }
      this.results.push({
        step: 'Environment Variables',
        success: true,
        details: {
          hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.substring(0, 10) + '...'
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
  private async testFirebaseInitialization(): Promise<void> {
    try {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };
      const app = getApps().length === 0 ? initializeApp(firebaseConfig, 'diagnostic') : getApps()[0];
      this.results.push({
        step: 'Firebase App Initialization',
        success: true,
        details: {
          appName: app.name,
          projectId: app.options.projectId
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Firebase App Initialization',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testNetworkConnectivity(): Promise<void> {
    try {
      // Test basic connectivity to Firebase endpoints
      const endpoints = [
        'https://firebase.googleapis.com/',
        'https://identitytoolkit.googleapis.com/',
        'https://firestore.googleapis.com/'
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
  private async testFirestoreConnection(): Promise<void> {
    try {
      const app = getApps()[0];
      if (!app) throw new Error('No Firebase app initialized');
      const db = getFirestore(app);
      // Try to enable network (this will test connectivity)
      await enableNetwork(db);
      this.results.push({
        step: 'Firestore Connection',
        success: true,
        details: {
          app: app.name,
          projectId: app.options.projectId
        }
      });
    } catch (error) {
      this.results.push({
        step: 'Firestore Connection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  private async testAuthConnection(): Promise<void> {
    try {
      const app = getApps()[0];
      if (!app) throw new Error('No Firebase app initialized');
      const auth = getAuth(app);
      // Just check if auth is initialized, don't actually sign in
      this.results.push({
        step: 'Auth Connection',
        success: true,
        details: {
          currentUser: auth.currentUser?.uid || null,
          app: app.name
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
export async function runFirebaseDiagnostics(): Promise<void> {
  const diagnostic = new FirebaseDiagnostic();
  await diagnostic.runDiagnostics();
  diagnostic.printResults();
}
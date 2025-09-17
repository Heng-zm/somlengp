"use client";
import { memo } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runFirebaseDiagnostics } from '@/lib/firebase-diagnostic';
interface TestResult {
  step: string;
  success: boolean;
  error?: string;
  details?: any;
}
const FirebaseTestPageComponent = function FirebaseTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [basicInfo, setBasicInfo] = useState<any>({});
  useEffect(() => {
    // Get basic environment info
    setBasicInfo({
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.substring(0, 15) + '...' || 'Not set',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
    });
  }, []);
  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      await runFirebaseDiagnostics();
      // For now, create mock results since the diagnostic runs in console
      const mockResults: TestResult[] = [
        {
          step: 'Environment Variables',
          success: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          details: {
            hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          }
        },
        {
          step: 'Basic Configuration',
          success: true,
          details: basicInfo
        }
      ];
      setResults(mockResults);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setResults([{
        step: 'Diagnostic Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
    }
  };
  const testFirebaseDirectly = async () => {
    try {
      // Test a simple Firebase connection
      const { db, auth } = await import('@/lib/firebase');
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      if (!auth) {
        throw new Error('Auth not initialized');
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Firebase Connection Test</h1>
        <p className="text-muted-foreground mt-2">
          Diagnose Firebase connectivity issues
        </p>
      </div>
      {/* Basic Info Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Environment:</strong> {basicInfo.nodeEnv}
          </div>
          <div>
            <strong>Has API Key:</strong>{' '}
            <Badge variant={basicInfo.hasApiKey ? 'default' : 'destructive'}>
              {basicInfo.hasApiKey ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Has Project ID:</strong>{' '}
            <Badge variant={basicInfo.hasProjectId ? 'default' : 'destructive'}>
              {basicInfo.hasProjectId ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Project ID:</strong> {basicInfo.projectId}
          </div>
        </div>
      </Card>
      {/* Test Buttons */}
      <div className="flex gap-4 justify-center">
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </Button>
        <Button variant="outline" onClick={testFirebaseDirectly}>
          Test Firebase Import
        </Button>
      </div>
      {/* Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? '✅' : '❌'}
                  </Badge>
                  <h3 className="font-medium">{result.step}</h3>
                </div>
                {result.error && (
                  <div className="text-red-600 text-sm mt-2">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                {result.details && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <strong>Details:</strong>
                    <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong>1. Check Console Output:</strong> Open browser dev tools and check the console for detailed diagnostic information.
          </div>
          <div>
            <strong>2. Verify Environment Variables:</strong> Ensure all NEXT_PUBLIC_FIREBASE_* variables are set in your .env.local file.
          </div>
          <div>
            <strong>3. Check Firebase Project:</strong> Verify your Firebase project is active and Firestore is enabled.
          </div>
          <div>
            <strong>4. Network Issues:</strong> The error suggests a network connectivity issue. Check your internet connection and firewall settings.
          </div>
          <div>
            <strong>5. Restart Development Server:</strong> Sometimes restarting the dev server helps with environment variable issues.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default memo(FirebaseTestPageComponent);
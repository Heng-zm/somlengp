'use client';

import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { supabaseClient } from '@/lib/supabase';

const AuthTestPageComponent = function AuthTestPage() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingDirect, setIsTestingDirect] = useState(false);
  const [hostname, setHostname] = useState<string>('');
  const [protocol, setProtocol] = useState<string>('');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Set window-dependent values after component mounts
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
      setProtocol(window.location.protocol);
    }
  }, []);

  const testDirectPopup = async () => {
    setIsTestingDirect(true);
    addResult('Testing direct Supabase OAuth...');
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/api/auth/callback'
        }
      });
      if (error) {
        addResult(`❌ Direct OAuth failed: ${error.message}`);
      } else {
        addResult('✅ Direct OAuth initiated successfully');
      }
    } catch (error: unknown) {
      const authError = error as { message?: string };
      addResult(`❌ Direct OAuth failed: ${authError.message || 'Unknown message'}`);
    } finally {
      setIsTestingDirect(false);
    }
  };

  const testDirectRedirect = async () => {
    addResult('Testing direct Supabase redirect...');
    
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/api/auth/callback'
        }
      });
      if (error) {
        addResult(`❌ Direct redirect failed: ${error.message}`);
      } else {
        addResult('🔄 Redirect initiated...');
      }
    } catch (error: unknown) {
      const authError = error as { message?: string };
      addResult(`❌ Direct redirect failed: ${authError.message || 'Unknown message'}`);
    }
  };

  const testContextMethod = async () => {
    addResult('Testing auth context method...');
    
    try {
      await signInWithGoogle();
      addResult('✅ Context method initiated');
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      addResult(`❌ Context method failed: ${authError.code || 'Unknown error'} - ${authError.message || 'Unknown message'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Authentication Test Page</h1>
          <p className="text-muted-foreground mt-2">
            This page helps diagnose authentication issues
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <div>Loading: {loading ? '✅ true' : '❌ false'}</div>
            <div>User: {user ? `✅ ${user.email}` : '❌ not logged in'}</div>
            <div>Domain: {hostname || 'loading...'}</div>
            <div>Protocol: {protocol || 'loading...'}</div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testDirectPopup} 
              disabled={isTestingDirect || loading}
              className="w-full"
            >
              Test Direct Popup
            </Button>
            <Button 
              onClick={testDirectRedirect} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Test Direct Redirect
            </Button>
            <Button 
              onClick={testContextMethod} 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              Test Context Method
            </Button>
          </div>
        </Card>

        {user ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Logout Test</h2>
            <Button onClick={logout} variant="destructive">
              Sign Out
            </Button>
          </Card>
        ) : null}

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>
          <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No test results yet...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-yellow-50 dark:bg-yellow-950/20">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            Common Issues & Solutions
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Popup Blocked:</strong> Enable popups for this domain in your browser settings
            </div>
            <div>
              <strong>Unauthorized Domain:</strong> Add &apos;{hostname || 'your-domain'}&apos; to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
            </div>
            <div>
              <strong>Invalid OAuth Client:</strong> Check Google Cloud Console OAuth configuration and Supabase Google provider settings
            </div>
            <div>
              <strong>Development vs Production:</strong> Make sure localhost:3000/auth/callback is in redirect URLs for development
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


export default memo(AuthTestPageComponent);
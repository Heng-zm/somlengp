"use client";

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { supabaseClient } from '@/lib/supabase';

const AITestPageComponent = function AITestPage() {
  const { user } = useAuth();
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello! Can you tell me a short joke?' }],
          userId: user.id,
        }),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    try {
      const res = await fetch('/api/ai-assistant');
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testHealthCheck}>Test Health Check</Button>
            <Button onClick={testAPI} disabled={!user || loading}>
              {loading ? 'Testing...' : 'Test AI Response'}
            </Button>
          </div>
          
          {!user && (
            <p className="text-red-500">Please sign in to test AI responses</p>
          )}
          
          {response && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">{response}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default memo(AITestPageComponent);
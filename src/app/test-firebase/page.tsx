'use client';

import { useEffect, useState, memo } from 'react';
import { supabaseClient } from '@/lib/supabase';
// Performance optimization needed: Consider memoizing dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


const TestFirebasePageComponent = function TestSupabasePage() {
  const [status, setStatus] = useState({
    auth: 'checking...',
    database: 'checking...',
    user: null as any
  });

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Check auth state
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) {
          setStatus(prev => ({ ...prev, auth: `error: ${sessionError.message}` }));
        } else {
          setStatus(prev => ({ 
            ...prev, 
            auth: session ? 'connected with user' : 'connected (no user)',
            user: session?.user || null
          }));
        }

        // Test database read - try to read from a simple table or just test the connection
        try {
          const { data, error: dbError } = await supabaseClient.from('profiles').select('id').limit(1);
          if (dbError) {
            setStatus(prev => ({ ...prev, database: `error: ${dbError.message}` }));
          } else {
            setStatus(prev => ({ ...prev, database: 'connected' }));
          }
        } catch (dbError: any) {
          setStatus(prev => ({ ...prev, database: `error: ${dbError.message}` }));
        }
      } catch (error: any) {
        console.error('Supabase test error:', error);
        setStatus(prev => ({ 
          ...prev, 
          auth: `error: ${error.message}`,
          database: 'skipped'
        }));
      }
    };

    checkSupabaseConnection();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setStatus(prev => ({
          ...prev,
          auth: session ? 'connected with user' : 'connected (no user)',
          user: session?.user || null
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Supabase Auth</h2>
          <p className={`${status.auth.includes('connected') ? 'text-green-600' : 'text-orange-600'}`}>
            Status: {status.auth}
          </p>
          {status.user && (
            <p className="text-sm text-gray-600">
              User: {status.user.email || status.user.id || 'Anonymous'}
            </p>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Supabase Database</h2>
          <p className={`${status.database === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>
            Status: {status.database}
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Console Errors</h2>
          <p className="text-sm text-gray-600">
            Check browser console for any remaining network errors or Supabase connection issues
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(TestFirebasePageComponent);
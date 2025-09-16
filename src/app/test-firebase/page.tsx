'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function TestFirebasePage() {
  const [status, setStatus] = useState({
    auth: 'checking...',
    firestore: 'checking...',
    user: null as any
  });

  useEffect(() => {
    if (!auth) {
      setStatus(prev => ({ ...prev, auth: 'auth not initialized', firestore: 'skipped' }));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setStatus(prev => ({ ...prev, auth: 'connected', user }));
        
        // Test Firestore read
        if (db) {
          const testDoc = doc(db, 'test', 'connection');
          await getDoc(testDoc);
          setStatus(prev => ({ ...prev, firestore: 'connected' }));
        } else {
          setStatus(prev => ({ ...prev, firestore: 'db not initialized' }));
        }
      } catch (error: any) {
        console.error('Firebase test error:', error);
        setStatus(prev => ({ 
          ...prev, 
          firestore: `error: ${error.message}`,
          auth: user ? 'connected' : 'connected (no user)'
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Firebase Auth</h2>
          <p className={`${status.auth === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>
            Status: {status.auth}
          </p>
          {status.user && (
            <p className="text-sm text-gray-600">
              User: {status.user.email || status.user.uid || 'Anonymous'}
            </p>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Firestore</h2>
          <p className={`${status.firestore === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>
            Status: {status.firestore}
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Console Errors</h2>
          <p className="text-sm text-gray-600">
            Check browser console for any remaining CSP or network errors
          </p>
        </div>
      </div>
    </div>
  );
}
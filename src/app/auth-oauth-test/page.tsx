'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { showAuthSuccessToast, showAuthErrorToast } from '@/lib/toast-utils'

export default function OAuthTestPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const testGoogleOAuth = async () => {
    try {
      setLoading(true)
      addLog('Starting Google OAuth test...')
      
      const currentUrl = window.location.origin
      const callbackUrl = `${currentUrl}/api/auth/callback`
      
      addLog(`Current URL: ${currentUrl}`)
      addLog(`Callback URL: ${callbackUrl}`)
      
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      })
      
      if (error) {
        addLog(`OAuth Error: ${error.message}`)
        showAuthErrorToast(`OAuth failed: ${error.message}`)
        return
      }
      
      addLog('OAuth request initiated successfully')
      addLog('You should be redirected to Google for authentication...')
      
      // Note: User will be redirected, so this might not execute
      showAuthSuccessToast('OAuth initiated - redirecting to Google...')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Unexpected error: ${errorMessage}`)
      showAuthErrorToast(`Test failed: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">OAuth Flow Test</h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Before Testing:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Make sure your Supabase project has Google OAuth configured</li>
              <li>Add <code className="bg-blue-100 px-1 rounded">http://localhost:3000</code> to Site URL</li>
              <li>Add <code className="bg-blue-100 px-1 rounded">http://localhost:3000/api/auth/callback</code> to Redirect URLs</li>
              <li>Ensure Google provider is enabled in Authentication → Providers</li>
            </ol>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testGoogleOAuth}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {loading ? 'Testing...' : 'Test Google OAuth'}
            </button>
            
            <button
              onClick={clearLogs}
              className="px-6 py-2 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Test Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet. Click "Test Google OAuth" to start.</p>
          ) : (
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
          <p className="text-sm text-yellow-700">
            Visit <code className="bg-yellow-100 px-1 rounded">/api/auth/debug</code> for configuration details.
          </p>
        </div>
      </div>
    </div>
  )
}
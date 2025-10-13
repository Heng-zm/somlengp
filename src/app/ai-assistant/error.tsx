'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AIAssistantError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void; 
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
          </div>
        </div>
      </div>

      {/* Error content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The AI Assistant encountered an error and couldn't load properly.
          </p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => reset()} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
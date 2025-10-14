'use client'

import Link from 'next/link'
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

export default function MinimalNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-black text-gray-800 mb-4">
            404
          </h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto mb-8"></div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="space-x-4">
          <Link 
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

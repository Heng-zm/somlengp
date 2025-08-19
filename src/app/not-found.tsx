'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Oops! The page you&apos;re looking for doesn&apos;t exist.\n
          </p>
          <p className="text-sm text-gray-500">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-32 h-32 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-8a8 8 0 018 8v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a8 8 0 018-8z"
              />
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105">
              Go Home
            </Button>
          </Link>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-6 rounded-lg transition-all duration-200"
          >
            Go Back
          </Button>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Still can&apos;t find what you&apos;re looking for?\n
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Contact Support
            </Link>
            <Link
              href="/help"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Help Center
            </Link>
            <Link
              href="/sitemap"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Site Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

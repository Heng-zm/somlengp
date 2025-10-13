'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AIAssistantLoading() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-r from-gray-700 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-32 rounded-xl" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex justify-center mb-8">
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          
          {/* Message skeletons */}
          <div className="space-y-6">
            {/* Assistant message skeleton */}
            <div className="flex items-start gap-4 justify-start">
              <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
              <div className="max-w-[80%] flex flex-col items-start">
                <Card className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </Card>
                <Skeleton className="h-6 w-20 mt-3 rounded-full" />
              </div>
            </div>

            {/* User message skeleton */}
            <div className="flex items-start gap-4 justify-end">
              <div className="max-w-[80%] flex flex-col items-end">
                <Card className="px-4 py-3 rounded-2xl bg-gray-900">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-700" />
                    <Skeleton className="h-4 w-2/3 bg-gray-700" />
                  </div>
                </Card>
                <Skeleton className="h-6 w-16 mt-3 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="flex-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80">
        <div className="max-w-5xl mx-auto p-4 sm:p-5">
          <div className="relative">
            <Card className="overflow-hidden rounded-2xl shadow-xl">
              <div className="px-3 pt-3 pb-2">
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="relative">
                <Skeleton className="h-14 w-full rounded-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
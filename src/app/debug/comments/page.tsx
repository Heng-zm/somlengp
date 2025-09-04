'use client';

import { CommentDebug } from '@/components/comments/comment-debug';

export default function CommentDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Comment System Debug</h1>
        <CommentDebug />
      </div>
    </div>
  );
}

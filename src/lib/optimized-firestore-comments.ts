'use client';

// Optimized Firebase comments service temporarily disabled during Supabase migration  
// TODO: Implement Supabase-based optimized comments system

import { Comment, CommentUser, CommentSortType } from '@/types/comment-types';

// Export disabled functions that throw errors
export async function getOptimizedComments(
  pageId: string,
  sortBy: CommentSortType = 'recent',
  limitCount = 25,
  lastDoc?: any,
  useCache = true
): Promise<{ comments: Comment[], hasMore: boolean, lastDoc?: any }> {
  throw new Error('Optimized comments service temporarily disabled during Supabase migration.');
}

export async function createOptimizedComment(
  content: string,
  pageId: string,
  author: CommentUser,
  parentId?: string
): Promise<Comment> {
  throw new Error('Optimized comments service temporarily disabled during Supabase migration.');
}

export async function optimizedVoteComment(
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  throw new Error('Optimized comments service temporarily disabled during Supabase migration.');
}

export function subscribeToComments(
  pageId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.error('Optimized comments subscription temporarily disabled during Supabase migration.');
  return () => {}; // Return empty unsubscribe function
}

export async function bulkDeleteComments(commentIds: string[]): Promise<void> {
  throw new Error('Optimized comments service temporarily disabled during Supabase migration.');
}

export async function getCommentAnalytics(pageId: string): Promise<{
  totalComments: number;
  totalReplies: number;
  averageEngagement: number;
  topContributors: Array<{ authorId: string; authorName: string; count: number }>;
}> {
  throw new Error('Optimized comments service temporarily disabled during Supabase migration.');
}

// Export aliases for compatibility
export {
  getOptimizedComments as getComments,
  createOptimizedComment as createComment,
  optimizedVoteComment as voteComment
};
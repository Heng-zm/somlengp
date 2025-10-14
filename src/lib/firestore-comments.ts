'use client';

// Firebase comments service temporarily disabled during Supabase migration  
// TODO: Implement Supabase-based comments system

import { Comment, CommentUser, CommentSortType } from '@/types/comment-types';

// Export disabled functions that throw errors
export async function getComments(
  pageId: string, 
  sortBy: CommentSortType = 'recent',
  limitCount = 50,
  lastDoc?: any
): Promise<{ comments: Comment[], hasMore: boolean, lastDoc?: any }> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function createComment(
  pageId: string,
  content: string,
  author: CommentUser,
  parentId?: string
): Promise<Comment> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function updateComment(
  commentId: string,
  content: string,
  userId: string
): Promise<void> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin = false
): Promise<void> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function voteOnComment(
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote' | null
): Promise<{ upvotes: number; downvotes: number }> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function createAnonymousComment(
  pageId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function getCommentCount(pageId: string): Promise<number> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export async function getUserComments(
  userId: string,
  limitCount = 20
): Promise<Comment[]> {
  throw new Error('Comments service temporarily disabled during Supabase migration.');
}

export function subscribeToComments(
  pageId: string,
  callback: (comments: Comment[]) => void,
  sortBy: CommentSortType = 'recent'
): () => void {
  console.error('Comments subscription temporarily disabled during Supabase migration.');
  return () => {}; // Return empty unsubscribe function
}
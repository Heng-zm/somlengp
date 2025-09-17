'use client';

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  increment,
  runTransaction,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  writeBatch,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, CommentUser, CommentSortType } from '@/types/comment-types';
import { commentCache, commentPerformanceMonitor } from './comment-cache';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


// Constants for optimized queries
const COMMENTS_COLLECTION = 'comments';
const VOTES_SUBCOLLECTION = 'votes';
const BATCH_SIZE = 500; // Maximum Firestore batch size
const DEFAULT_PAGE_SIZE = 25; // Smaller page size for better performance
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Enhanced Firestore interfaces with indexing hints
interface OptimizedFirestoreComment {
  id?: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorIsVerified?: boolean;
  authorIsAnonymous?: boolean;
  authorIsGuest?: boolean;
  pageId: string;
  parentId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  upvotes: number;
  downvotes: number;
  isEdited?: boolean;
  // Optimization fields for better querying
  engagementScore?: number;
  lastActivityAt?: Timestamp;
  replyCount?: number;
  isDeleted?: boolean;
}

interface QueryResult<T> {
  data: T;
  fromCache: boolean;
  timestamp: Date;
}

/**
 * Enhanced query builder with caching and optimization
 */
class OptimizedCommentQuery {
  private baseQuery: any;
  private constraints: QueryConstraint[] = [];
  private cacheKey: string = '';
  
  constructor(private collectionRef: any) {
    this.baseQuery = collectionRef;
  }

  where(field: string, operator: any, value: any): this {
    this.constraints.push(where(field, operator, value));
    this.cacheKey += `${field}:${operator}:${value}|`;
    return this;
  }

  orderBy(field: string, direction?: 'asc' | 'desc'): this {
    this.constraints.push(orderBy(field, direction));
    this.cacheKey += `order:${field}:${direction}|`;
    return this;
  }

  limit(limitCount: number): this {
    this.constraints.push(limit(limitCount));
    this.cacheKey += `limit:${limitCount}|`;
    return this;
  }

  startAfter(lastDoc: DocumentSnapshot): this {
    this.constraints.push(startAfter(lastDoc));
    this.cacheKey += `startAfter:${lastDoc.id}|`;
    return this;
  }

  async execute<T>(useCache = true): Promise<QueryResult<T[]>> {
    const endTiming = commentPerformanceMonitor.startTiming('firestoreQuery');
    
    // Note: Generic caching disabled for now due to type constraints
    // The commentCache is specifically designed for Comment[] types

    try {
      const q = query(this.baseQuery, ...this.constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...(docData || {})
        };
      }) as T[];

      endTiming();
      return {
        data,
        fromCache: false,
        timestamp: new Date()
      };
    } catch (error) {
      endTiming();
      throw error;
    }
  }
}

/**
 * Retry mechanism for failed operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = MAX_RETRY_ATTEMPTS,
  delay = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        const code = (error as any).code;
        if (['permission-denied', 'unauthenticated', 'invalid-argument'].includes(code)) {
          throw error;
        }
      }
      
      if (attempt === maxAttempts) break;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
}

/**
 * Optimized comment conversion with enhanced metadata
 */
function convertToOptimizedComment(doc: QueryDocumentSnapshot | DocumentSnapshot): Comment | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as OptimizedFirestoreComment;
  
  const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  };
  
  return {
    id: doc.id,
    content: data.content,
    author: {
      id: data.authorId,
      name: data.authorName,
      avatar: data.authorAvatar,
      isVerified: data.authorIsVerified || false,
      isAnonymous: data.authorIsAnonymous || false,
      isGuest: data.authorIsGuest || false
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
    upvotes: data.upvotes || 0,
    downvotes: data.downvotes || 0,
    replies: [],
    parentId: data.parentId,
    isEdited: data.isEdited || false
  };
}

/**
 * Optimized batch operations for better performance
 */
class BatchManager {
  private batch: any;
  private operationCount = 0;
  private maxOperations = BATCH_SIZE;

  constructor(private db: any) {
    this.batch = writeBatch(db);
  }

  set(ref: any, data: any): void {
    this.batch.set(ref, data);
    this.operationCount++;
  }

  update(ref: any, data: any): void {
    this.batch.update(ref, data);
    this.operationCount++;
  }

  delete(ref: any): void {
    this.batch.delete(ref);
    this.operationCount++;
  }

  async commitIfNeeded(): Promise<void> {
    if (this.operationCount >= this.maxOperations) {
      await this.batch.commit();
      this.batch = writeBatch(this.db);
      this.operationCount = 0;
    }
  }

  async commit(): Promise<void> {
    if (this.operationCount > 0) {
      await this.batch.commit();
      this.operationCount = 0;
    }
  }
}

/**
 * Optimized comment retrieval with intelligent caching
 */
export async function getOptimizedComments(
  pageId: string,
  sortBy: CommentSortType = 'recent',
  limitCount: number = DEFAULT_PAGE_SIZE,
  lastDoc?: any,
  useCache = true
): Promise<{ comments: Comment[], hasMore: boolean, lastDoc?: any }> {
  if (!db) throw new Error('Firestore not initialized');

  const endTiming = commentPerformanceMonitor.startTiming('getOptimizedComments');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const queryBuilder = new OptimizedCommentQuery(commentsRef)
      .where('pageId', '==', pageId)
      // Don't filter by parentId here - we'll filter client-side
      // Firestore can't efficiently query for undefined/missing fields
      .limit(limitCount + 1); // Get one extra to check for more

    // Add sorting
    switch (sortBy) {
      case 'recent':
        queryBuilder.orderBy('createdAt', 'desc');
        break;
      case 'oldest':
        queryBuilder.orderBy('createdAt', 'asc');
        break;
      case 'popular':
        queryBuilder.orderBy('upvotes', 'desc').orderBy('createdAt', 'desc');
        break;
    }

    // Add pagination if provided
    if (lastDoc) {
      queryBuilder.startAfter(lastDoc);
    }

    const result = await queryBuilder.execute<OptimizedFirestoreComment>(useCache);
    const docs = result.data;
    
    // Check for more comments
    const hasMore = docs.length > limitCount;
    const commentsToProcess = hasMore ? docs.slice(0, limitCount) : docs;
    
    // Filter for top-level comments only (no parentId)
    const topLevelCommentData = commentsToProcess.filter(docData => !docData.parentId);
    
    // Convert to Comment objects and get replies in parallel
    const comments: Comment[] = [];
    const commentPromises = topLevelCommentData.map(async (docData) => {
      const comment = convertToOptimizedComment({ 
        id: docData.id!, 
        data: () => docData, 
        exists: () => true 
      } as any);
      
      if (comment) {
        // Get replies in parallel with caching
        const replies = await getOptimizedReplies(comment.id, sortBy, useCache);
        comment.replies = replies;
        return comment;
      }
      return null;
    });

    const resolvedComments = await Promise.all(commentPromises);
    comments.push(...resolvedComments.filter(c => c !== null) as Comment[]);

    endTiming();
    return {
      comments,
      hasMore,
      lastDoc: hasMore ? { id: commentsToProcess[commentsToProcess.length - 1].id } : undefined
    };

  } catch (error) {
    endTiming();
    console.error('Error getting optimized comments:', error);
    throw error;
  }
}

/**
 * Optimized reply retrieval with depth limiting
 */
async function getOptimizedReplies(
  parentId: string,
  sortBy: CommentSortType = 'recent',
  useCache = true,
  maxDepth = 5,
  currentDepth = 0
): Promise<Comment[]> {
  if (currentDepth >= maxDepth || !db) return [];

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    const queryBuilder = new OptimizedCommentQuery(commentsRef)
      .where('parentId', '==', parentId)
      .limit(50); // Limit replies to prevent excessive nesting

    // Add sorting for replies
    switch (sortBy) {
      case 'recent':
        queryBuilder.orderBy('createdAt', 'desc');
        break;
      case 'oldest':
        queryBuilder.orderBy('createdAt', 'asc');
        break;
      case 'popular':
        queryBuilder.orderBy('upvotes', 'desc');
        break;
    }

    const result = await queryBuilder.execute<OptimizedFirestoreComment>(useCache);
    const replies: Comment[] = [];

    // Process replies in parallel with depth control
    const replyPromises = result.data.map(async (docData) => {
      const reply = convertToOptimizedComment({
        id: docData.id!,
        data: () => docData,
        exists: () => true
      } as any);
      
      if (reply && currentDepth < maxDepth - 1) {
        // Recursively get nested replies
        reply.replies = await getOptimizedReplies(reply.id, sortBy, useCache, maxDepth, currentDepth + 1);
      }
      
      return reply;
    });

    const resolvedReplies = await Promise.all(replyPromises);
    replies.push(...resolvedReplies.filter(r => r !== null) as Comment[]);

    return replies;

  } catch (error) {
    console.error('Error getting optimized replies:', error);
    return [];
  }
}

/**
 * Optimized comment creation with batch operations
 */
export async function createOptimizedComment(
  content: string,
  pageId: string,
  author: CommentUser,
  parentId?: string
): Promise<Comment> {
  if (!db) throw new Error('Firestore not initialized');

  return withRetry(async () => {
    const endTiming = commentPerformanceMonitor.startTiming('createOptimizedComment');

    try {
      const commentsRef = collection(db!, COMMENTS_COLLECTION);
      const batch = new BatchManager(db!);

      // Calculate engagement score for initial sorting
      const engagementScore = Date.now(); // Use timestamp as initial engagement score

      const commentData: OptimizedFirestoreComment = {
        content: content.trim(),
        authorId: author.id,
        authorName: author.name,
        authorAvatar: author.avatar,
        authorIsVerified: author.isVerified || false,
        authorIsAnonymous: author.isAnonymous || false,
        authorIsGuest: author.isGuest || false,
        pageId,
        parentId: parentId || undefined,
        createdAt: serverTimestamp() as Timestamp,
        lastActivityAt: serverTimestamp() as Timestamp,
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        engagementScore,
        isEdited: false,
        isDeleted: false
      };

      const docRef = doc(commentsRef);
      batch.set(docRef, commentData);

      // If this is a reply, update parent's reply count
      if (parentId) {
        const parentRef = doc(db!, COMMENTS_COLLECTION, parentId);
        batch.update(parentRef, {
          replyCount: increment(1),
          lastActivityAt: serverTimestamp()
        });
      }

      await batch.commit();

      // Invalidate cache for this page
      commentCache.invalidate(pageId);

      // Get the created document
      const createdDoc = await getDoc(docRef);
      const comment = convertToOptimizedComment(createdDoc);

      if (!comment) {
        throw new Error('Failed to create comment');
      }

      endTiming();
      return comment;

    } catch (error) {
      endTiming();
      console.error('Error creating optimized comment:', error);
      throw error;
    }
  });
}

/**
 * Optimized voting with conflict resolution
 */
export async function optimizedVoteComment(
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  return withRetry(async () => {
    const endTiming = commentPerformanceMonitor.startTiming('optimizedVoteComment');

    try {
      await runTransaction(db!, async (transaction) => {
        const commentRef = doc(db!, COMMENTS_COLLECTION, commentId);
        const votesRef = collection(commentRef, VOTES_SUBCOLLECTION);
        const userVoteRef = doc(votesRef, userId);

        // Get current state
        const [commentDoc, userVoteDoc] = await Promise.all([
          transaction.get(commentRef),
          transaction.get(userVoteRef)
        ]);

        if (!commentDoc.exists()) {
          throw new Error('Comment not found');
        }

        const commentData = commentDoc.data() as OptimizedFirestoreComment;
        const existingVote = userVoteDoc.exists() ? userVoteDoc.data() : null;

        let upvoteDelta = 0;
        let downvoteDelta = 0;

        // Calculate vote changes
        if (existingVote) {
          if (existingVote.type === 'upvote') upvoteDelta -= 1;
          if (existingVote.type === 'downvote') downvoteDelta -= 1;
        }

        // Add new vote unless toggling off
        if (!existingVote || existingVote.type !== voteType) {
          if (voteType === 'upvote') upvoteDelta += 1;
          if (voteType === 'downvote') downvoteDelta += 1;

          transaction.set(userVoteRef, {
            userId,
            type: voteType,
            createdAt: serverTimestamp()
          });
        } else {
          // Toggle off - delete vote
          transaction.delete(userVoteRef);
        }

        // Update comment with new vote counts and engagement score
        const newUpvotes = Math.max(0, (commentData.upvotes || 0) + upvoteDelta);
        const newDownvotes = Math.max(0, (commentData.downvotes || 0) + downvoteDelta);
        const engagementScore = newUpvotes * 2 + newDownvotes + (commentData.replyCount || 0) * 3;

        transaction.update(commentRef, {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          engagementScore,
          lastActivityAt: serverTimestamp()
        });
      });

      // Invalidate relevant caches
      commentCache.invalidate('votes');

      endTiming();

    } catch (error) {
      endTiming();
      console.error('Error in optimized vote:', error);
      throw error;
    }
  });
}

/**
 * Real-time comment subscription for live updates
 */
export function subscribeToComments(
  pageId: string,
  onUpdate: (comments: Comment[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!db) {
    onError?.(new Error('Firestore not initialized'));
    return () => {};
  }

  const commentsRef = collection(db!, COMMENTS_COLLECTION);

  const q = query(
    commentsRef,
    where('pageId', '==', pageId),
    orderBy('createdAt', 'desc'),
    limit(DEFAULT_PAGE_SIZE)
  );

  return onSnapshot(q, 
    (snapshot) => {
      const comments: Comment[] = [];
      snapshot.docs.forEach(doc => {
        const comment = convertToOptimizedComment(doc);
        // Only include top-level comments (no parentId)
        if (comment && !comment.parentId) comments.push(comment);
      });
      onUpdate(comments);
    },
    (error) => {
      console.error('Real-time subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Bulk operations for admin/moderation tasks
 */
export async function bulkDeleteComments(commentIds: string[]): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const batch = new BatchManager(db!);

  for (const commentId of commentIds) {
    const commentRef = doc(db!, COMMENTS_COLLECTION, commentId);
    batch.update(commentRef, {
      isDeleted: true,
      content: '[Deleted]',
      updatedAt: serverTimestamp()
    });

    await batch.commitIfNeeded();
  }

  await batch.commit();
  commentCache.clear(); // Clear all cache after bulk operations
}

/**
 * Analytics and metrics collection
 */
export async function getCommentAnalytics(pageId: string): Promise<{
  totalComments: number;
  totalReplies: number;
  averageEngagement: number;
  topContributors: Array<{ authorId: string; authorName: string; count: number }>;
}> {
  if (!db) throw new Error('Firestore not initialized');

  const commentsRef = collection(db!, COMMENTS_COLLECTION);
  const q = query(commentsRef, where('pageId', '==', pageId));
  const snapshot = await getDocs(q);

  let totalComments = 0;
  let totalReplies = 0;
  let totalEngagement = 0;
  const contributors = new Map<string, { name: string; count: number }>();

  snapshot.docs.forEach(doc => {
    const data = doc.data() as OptimizedFirestoreComment;
    
    if (data.parentId) {
      totalReplies++;
    } else {
      totalComments++;
    }

    totalEngagement += (data.upvotes || 0) + (data.downvotes || 0);

    // Track contributors
    const existing = contributors.get(data.authorId) || { name: data.authorName, count: 0 };
    existing.count++;
    contributors.set(data.authorId, existing);
  });

  const topContributors = Array.from(contributors.entries())
    .map(([authorId, { name, count }]) => ({ authorId, authorName: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalComments,
    totalReplies,
    averageEngagement: snapshot.docs.length > 0 ? totalEngagement / snapshot.docs.length : 0,
    topContributors
  };
}

// Export optimized functions as default exports
export {
  getOptimizedComments as getComments,
  createOptimizedComment as createComment,
  optimizedVoteComment as voteComment
};

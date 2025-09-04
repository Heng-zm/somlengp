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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, CommentUser, CommentSortType } from '@/types/comment-types';

// Constants
const COMMENTS_COLLECTION = 'comments';

// Firestore document interfaces
interface FirestoreComment {
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
}

interface FirestoreVote {
  userId: string;
  type: 'upvote' | 'downvote';
  createdAt: Timestamp;
}

// Convert Firestore document to Comment type
function convertToComment(doc: QueryDocumentSnapshot | DocumentSnapshot): Comment | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as FirestoreComment;
  
  // Handle timestamp conversion safely
  const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  };
  
  const comment: Comment = {
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
  
  return comment;
}

// Generate user ID for anonymous/guest users
function generateUserId(isAnonymous: boolean = false): string {
  const prefix = isAnonymous ? 'anon' : 'guest';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate display name for anonymous/guest users
function generateDisplayName(isAnonymous: boolean = false): string {
  const anonymousNames = [
    'Anonymous Learner', 'Anonymous Student', 'Anonymous User',
    'Guest User', 'Curious Mind', 'Learning Explorer'
  ];
  
  const guestNames = [
    'Guest Visitor', 'Public User', 'Visitor',
    'Reader', 'Community Member', 'Learning Enthusiast'
  ];
  
  const names = isAnonymous ? anonymousNames : guestNames;
  return names[Math.floor(Math.random() * names.length)];
}

// Delete all replies for a comment (recursive)
async function deleteRepliesRecursive(parentId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const repliesQuery = query(
    collection(db, COMMENTS_COLLECTION),
    where('parentId', '==', parentId)
  );

  const repliesSnapshot = await getDocs(repliesQuery);
  
  // Delete replies recursively
  for (const replyDoc of repliesSnapshot.docs) {
    await deleteRepliesRecursive(replyDoc.id); // Delete nested replies
    await deleteDoc(replyDoc.ref); // Delete the reply itself
  }
}

// Get replies for a specific comment (recursive)
async function getRepliesRecursive(commentId: string, sortBy: CommentSortType = 'recent'): Promise<Comment[]> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    let q = query(
      commentsRef,
      where('parentId', '==', commentId)
    );

    // Add ordering for replies
    switch (sortBy) {
      case 'recent':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'popular':
        q = query(q, orderBy('upvotes', 'desc'), orderBy('createdAt', 'asc'));
        break;
    }

    const snapshot = await getDocs(q);
    const replies: Comment[] = [];

    for (const doc of snapshot.docs) {
      const reply = convertToComment(doc);
      if (reply) {
        // Recursively get nested replies (up to a reasonable depth)
        reply.replies = await getRepliesRecursive(reply.id, sortBy);
        replies.push(reply);
      }
    }

    return replies;
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
}

// Export server functions

// Get comments for a specific page
export async function getComments(
  pageId: string, 
  sortBy: CommentSortType = 'recent',
  limitCount: number = 50,
  lastDoc?: any
): Promise<{ comments: Comment[], hasMore: boolean, lastDoc?: any }> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // Build query based on sort type
    let q = query(
      commentsRef,
      where('pageId', '==', pageId)
      // Note: Firestore doesn't support querying for null/undefined fields directly
      // We'll filter out replies in the client-side processing instead
    );

    // Add ordering
    switch (sortBy) {
      case 'recent':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'oldest':
        q = query(q, orderBy('createdAt', 'asc'));
        break;
      case 'popular':
        q = query(q, orderBy('upvotes', 'desc'), orderBy('createdAt', 'desc'));
        break;
    }

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(limitCount + 1)); // Get one extra to check if there are more

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Check if there are more comments
    const hasMore = docs.length > limitCount;
    const commentsToReturn = hasMore ? docs.slice(0, limitCount) : docs;
    
    // Convert documents to comments and filter for top-level comments only
    const comments: Comment[] = [];
    for (const doc of commentsToReturn) {
      const comment = convertToComment(doc);
      if (comment && !comment.parentId) {
        // Only include top-level comments (no parentId)
        // Get replies for this comment
        comment.replies = await getRepliesRecursive(comment.id, sortBy);
        comments.push(comment);
      }
    }

    return {
      comments,
      hasMore,
      lastDoc: hasMore ? commentsToReturn[commentsToReturn.length - 1] : undefined
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
}

// Create a new comment
export async function createComment(
  content: string,
  pageId: string,
  author: CommentUser,
  parentId?: string
): Promise<Comment> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // Build comment data, omitting undefined fields
    const commentData: any = {
      content: content.trim(),
      authorId: author.id,
      authorName: author.name,
      authorIsVerified: author.isVerified || false,
      authorIsAnonymous: author.isAnonymous || false,
      authorIsGuest: author.isGuest || false,
      pageId,
      createdAt: serverTimestamp() as Timestamp,
      upvotes: 0,
      downvotes: 0,
      isEdited: false
    };
    
    // Only add authorAvatar if it exists
    if (author.avatar) {
      commentData.authorAvatar = author.avatar;
    }
    
    // Only add parentId if it exists
    if (parentId) {
      commentData.parentId = parentId;
    }

    const docRef = await addDoc(commentsRef, commentData);
    
    // Get the created document to return
    const createdDoc = await getDoc(docRef);
    const comment = convertToComment(createdDoc);
    
    if (!comment) {
      throw new Error('Failed to create comment');
    }

    return comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

// Create comment with auto-generated user (for anonymous/guest)
export async function createAnonymousComment(
  content: string,
  pageId: string,
  parentId?: string,
  isAnonymous: boolean = false
): Promise<Comment> {
  const author: CommentUser = {
    id: generateUserId(isAnonymous),
    name: generateDisplayName(isAnonymous),
    isAnonymous,
    isGuest: !isAnonymous,
    isVerified: false
  };

  return createComment(content, pageId, author, parentId);
}

// Vote on a comment
export async function voteComment(
  commentId: string,
  userId: string,
  voteType: 'upvote' | 'downvote'
): Promise<void> {
  if (!db) {
    console.error('Firestore not initialized - db is:', db);
    throw new Error('Firestore not initialized');
  }

  // Validate inputs
  if (!commentId || !userId || !voteType) {
    throw new Error('Invalid parameters for voting');
  }

  if (!['upvote', 'downvote'].includes(voteType)) {
    throw new Error('Invalid vote type');
  }

  console.log('Starting vote transaction:', { commentId, userId, voteType });

  try {
    await runTransaction(db, async (transaction) => {
      const commentRef = doc(db!, COMMENTS_COLLECTION, commentId);
      const votesRef = collection(commentRef, 'votes');
      const userVoteRef = doc(votesRef, userId);
      
      console.log('Getting comment and user vote data...');
      
      // Get current comment and user's existing vote
      const [commentDoc, userVoteDoc] = await Promise.all([
        transaction.get(commentRef),
        transaction.get(userVoteRef)
      ]);

      if (!commentDoc.exists()) {
        console.error('Comment not found:', commentId);
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data() as FirestoreComment;
      const existingVote = userVoteDoc.exists() ? userVoteDoc.data() as FirestoreVote : null;

      console.log('Current comment data:', {
        id: commentId,
        upvotes: commentData.upvotes,
        downvotes: commentData.downvotes,
        existingVote: existingVote?.type
      });

      let upvoteDelta = 0;
      let downvoteDelta = 0;

      // Remove previous vote if it exists
      if (existingVote) {
        if (existingVote.type === 'upvote') upvoteDelta -= 1;
        if (existingVote.type === 'downvote') downvoteDelta -= 1;
        console.log('Removing existing vote:', existingVote.type);
      }

      // Add new vote (unless it's the same as existing vote - toggle off)
      if (!existingVote || existingVote.type !== voteType) {
        if (voteType === 'upvote') upvoteDelta += 1;
        if (voteType === 'downvote') downvoteDelta += 1;

        console.log('Adding new vote:', voteType);
        
        // Set new vote
        transaction.set(userVoteRef, {
          userId,
          type: voteType,
          createdAt: serverTimestamp()
        });
      } else {
        // Toggle off - delete the vote
        console.log('Toggling off vote:', voteType);
        transaction.delete(userVoteRef);
      }

      const newUpvotes = (commentData.upvotes || 0) + upvoteDelta;
      const newDownvotes = (commentData.downvotes || 0) + downvoteDelta;
      
      console.log('Vote deltas:', {
        upvoteDelta,
        downvoteDelta,
        newUpvotes,
        newDownvotes
      });

      // Update comment vote counts
      transaction.update(commentRef, {
        upvotes: newUpvotes,
        downvotes: newDownvotes
      });
    });
    
    console.log('Vote transaction completed successfully');
  } catch (error: any) {
    console.error('Error in vote transaction:', {
      error,
      message: error?.message,
      code: error?.code,
      commentId,
      userId,
      voteType
    });
    
    // Add more specific error handling
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied - you may not have access to vote on this comment');
    } else if (error?.code === 'not-found') {
      throw new Error('Comment not found - it may have been deleted');
    } else if (error?.code === 'unavailable') {
      throw new Error('Service temporarily unavailable - please try again later');
    } else if (error?.code === 'unauthenticated') {
      throw new Error('Authentication required - please sign in again');
    }
    
    throw error;
  }
}

// Update a comment
export async function updateComment(commentId: string, content: string, authorId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data() as FirestoreComment;
    
    // Verify ownership
    if (commentData.authorId !== authorId) {
      throw new Error('Unauthorized to edit this comment');
    }

    await updateDoc(commentRef, {
      content: content.trim(),
      updatedAt: serverTimestamp(),
      isEdited: true
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(commentId: string, authorId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data() as FirestoreComment;
    
    // Verify ownership
    if (commentData.authorId !== authorId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Delete all replies first
    await deleteRepliesRecursive(commentId);
    
    // Delete the comment
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// Get user's vote for a comment
export async function getUserVote(commentId: string, userId: string): Promise<'upvote' | 'downvote' | null> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const voteRef = doc(collection(commentRef, 'votes'), userId);
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      const voteData = voteDoc.data() as FirestoreVote;
      return voteData.type;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

// Get comment stats for a page
export async function getCommentStats(pageId: string): Promise<{ totalComments: number, totalReplies: number }> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // Get all comments for this page
    const allCommentsQuery = query(commentsRef, where('pageId', '==', pageId));
    const allCommentsSnapshot = await getDocs(allCommentsQuery);
    
    let totalComments = 0;
    let totalReplies = 0;
    
    allCommentsSnapshot.docs.forEach(doc => {
      const data = doc.data() as FirestoreComment;
      if (data.parentId) {
        totalReplies++;
      } else {
        totalComments++;
      }
    });

    return { totalComments, totalReplies };
  } catch (error) {
    console.error('Error getting comment stats:', error);
    return { totalComments: 0, totalReplies: 0 };
  }
}

// Build nested comment structure from flat Firestore data
export async function getNestedComments(
  pageId: string,
  sortBy: CommentSortType = 'recent',
  limitCount: number = 50
): Promise<Comment[]> {
  if (!db) throw new Error('Firestore not initialized');

  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION);
    
    // Get all comments for this page
    const allCommentsQuery = query(
      commentsRef,
      where('pageId', '==', pageId)
    );
    
    const snapshot = await getDocs(allCommentsQuery);
    const allComments: Comment[] = [];
    
    // Convert all documents to comments
    snapshot.docs.forEach(doc => {
      const comment = convertToComment(doc);
      if (comment) {
        allComments.push(comment);
      }
    });

    // Build nested structure
    const commentMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    // First pass: create comment map
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build nested structure
    allComments.forEach(comment => {
      if (comment.parentId) {
        // This is a reply
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id)!);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap.get(comment.id)!);
      }
    });

    // Sort comments and replies
    const sortComments = (comments: Comment[]): Comment[] => {
      const sorted = [...comments].sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'popular':
            return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
          default:
            return 0;
        }
      });

      // Sort replies recursively
      return sorted.map(comment => ({
        ...comment,
        replies: comment.replies ? sortComments(comment.replies) : []
      }));
    };

    return sortComments(topLevelComments).slice(0, limitCount);
  } catch (error) {
    console.error('Error getting nested comments:', error);
    throw error;
  }
}

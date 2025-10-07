'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Comment, CommentSortType, CommentStats, CommentSystemState, CommentUser, AnonymousCommentOptions, PublicCommentOptions } from '@/types/comment-types';
import { 
  getComments,
  createComment,
  createAnonymousComment,
  voteOnComment,
  updateComment,
  deleteComment
} from '@/lib/firestore-comments';
import { commentCache, commentPerformanceMonitor } from '@/lib/comment-cache';
// Anonymous user utility functions
const generateAnonymousUser = (): CommentUser => {
  const anonymousNames = [
    'Anonymous Learner',
    'Anonymous Student', 
    'Anonymous User',
    'Guest User',
    'Curious Mind',
    'Learning Explorer'
  ];
  return {
    id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: anonymousNames[Math.floor(Math.random() * anonymousNames.length)],
    isAnonymous: true,
    isVerified: false
  };
};
// Generate guest user (public user without login)
const generateGuestUser = (customName?: string): CommentUser => {
  const guestNames = [
    'Guest Visitor',
    'Public User',
    'Visitor',
    'Reader',
    'Community Member',
    'Learning Enthusiast'
  ];
  return {
    id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: customName || guestNames[Math.floor(Math.random() * guestNames.length)],
    isGuest: true,
    isVerified: false
  };
};
const createLocalAnonymousComment = (content: string, parentId?: string): Comment => {
  return {
    id: Date.now().toString(),
    content,
    author: generateAnonymousUser(),
    createdAt: new Date(),
    upvotes: 0,
    downvotes: 0,
    replies: [],
    parentId
  };
};
interface UseCommentsProps {
  pageId?: string;
  userId?: string;
  initialComments?: Comment[];
  anonymousOptions?: AnonymousCommentOptions;
}
interface UseCommentsReturn {
  state: CommentSystemState;
  stats: CommentStats;
  actions: {
    submitComment: (content: string, parentId?: string, isAnonymous?: boolean) => Promise<void>;
    submitAnonymousComment: (content: string, parentId?: string) => Promise<void>;
    voteComment: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
    editComment: (commentId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    setSortBy: (sortType: CommentSortType) => void;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
  };
  hasMore: boolean;
  anonymousOptions: AnonymousCommentOptions;
}
// Mock data for development/demo purposes
const generateMockComments = (): Comment[] => [
  {
    id: '1',
    content: "I'm a bit unclear about how condensation forms in the water cycle. Can someone break it down?",
    author: {
      id: 'user1',
      name: 'Noah Pierre',
      avatar: undefined,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 58 * 60 * 1000), // 58 minutes ago
    upvotes: 25,
    downvotes: 3,
    replies: [
      {
        id: '2',
        content: "Condensation happens when water vapor cools down and changes back into liquid droplets. It's the step before precipitation. The example with the glass of ice water in the video was a great visual!",
        author: {
          id: 'user2',
          name: 'Skill Sprout',
          avatar: undefined,
          isVerified: true
        },
        createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        upvotes: 2,
        downvotes: 0,
        replies: [],
        parentId: '1'
      }
    ]
  },
  {
    id: '3',
    content: "I really enjoyed today's lesson on the water cycle! The animations made the processes so much easier to grasp.",
    author: {
      id: 'user3',
      name: 'Mollie Hall',
      avatar: undefined,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    upvotes: 8,
    downvotes: 2,
    replies: []
  },
  {
    id: '4',
    content: "How do we measure the amount of water vapor in the air? Is it something we'll cover later?",
    author: {
      id: 'user4',
      name: 'Lyle Kauffman',
      avatar: undefined,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    upvotes: 12,
    downvotes: 0,
    replies: [
      {
        id: '5',
        content: "Yes, I think we'll dive deeper into that in the next module on humidity. But the short answer is: we measure it using a tool called a hygrometer.",
        author: {
          id: 'user5',
          name: 'Amanda Lowery',
          avatar: undefined,
          isVerified: false
        },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        upvotes: 8,
        downvotes: 1,
        replies: [],
        parentId: '4'
      }
    ]
  },
  {
    id: '6',
    content: "Exactly! The next lesson will cover humidity, and I'm excited to see how it all connects back to the water cycle.",
    author: {
      id: 'user6',
      name: 'Owen Garcia',
      avatar: undefined,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    upvotes: 4,
    downvotes: 0,
    replies: []
  },
  {
    id: '7',
    content: "I prefer not to use my real name, but I wanted to say this explanation was really helpful. Thank you!",
    author: {
      id: 'anon_1704123456789_abc123def',
      name: 'Anonymous Learner',
      isAnonymous: true,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    upvotes: 6,
    downvotes: 0,
    replies: []
  },
  {
    id: '8',
    content: "Quick question - does evaporation happen faster in hot weather? I noticed my puddles dry up quicker in summer.",
    author: {
      id: 'anon_1704123456790_xyz789ghi',
      name: 'Curious Mind',
      isAnonymous: true,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
    upvotes: 9,
    downvotes: 1,
    replies: [
      {
        id: '9',
        content: "Yes, absolutely! Higher temperatures provide more energy for water molecules to escape into the air as vapor.",
        author: {
          id: 'anon_1704123456791_jkl456mno',
          name: 'Guest User',
          isAnonymous: true,
          isVerified: false
        },
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        upvotes: 3,
        downvotes: 0,
        replies: [],
        parentId: '8'
      }
    ]
  },
  {
    id: '10',
    content: "This is so helpful! I'm just browsing without an account and love that I can still participate in the discussion.",
    author: {
      id: 'guest_1704123456792_pqr789stu',
      name: 'Guest Visitor',
      isGuest: true,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    upvotes: 4,
    downvotes: 0,
    replies: [
      {
        id: '11',
        content: "I agree! It's great that this platform welcomes everyone to share their thoughts.",
        author: {
          id: 'guest_1704123456793_vwx123yza',
          name: 'Public User',
          isGuest: true,
          isVerified: false
        },
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        upvotes: 2,
        downvotes: 0,
        replies: [],
        parentId: '10'
      }
    ]
  },
  {
    id: '12',
    content: "I'm a teacher and I appreciate how accessible this content is for everyone. No barriers to learning!",
    author: {
      id: 'guest_1704123456794_bcd456efg',
      name: 'Learning Enthusiast',
      isGuest: true,
      isVerified: false
    },
    createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    upvotes: 7,
    downvotes: 0,
    replies: []
  }
];
export function useComments({ pageId = 'default-page', userId, initialComments, anonymousOptions }: UseCommentsProps = {}): UseCommentsReturn {
  // Memoize default anonymous options to prevent unnecessary re-renders
  const defaultAnonymousOptions: AnonymousCommentOptions = useMemo(() => ({
    allowAnonymous: true,
    anonymousDisplayName: 'Anonymous',
    requireModeration: false,
    ...anonymousOptions
  }), [anonymousOptions]);
  const [state, setState] = useState<CommentSystemState>({
    comments: initialComments || [],
    loading: false,
    error: null,
    submitting: false,
    sortBy: 'recent'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  // Use refs to track previous values for optimization
  const previousPageId = useRef<string>(pageId);
  const previousUserId = useRef<string | undefined>(userId);
  // Optimized stats calculation with better memoization
  const stats = useMemo((): CommentStats => {
    const calculateReplies = (comments: Comment[]): number => {
      return comments.reduce((total, comment) => {
        return total + (comment.replies?.length || 0) + calculateReplies(comment.replies || []);
      }, 0);
    };
    return {
      totalComments: state.comments.length,
      totalReplies: calculateReplies(state.comments)
    };
  }, [state.comments.length, state.comments]);
  // Sort comments
  const sortedComments = useMemo(() => {
    const sortComments = (comments: Comment[]): Comment[] => {
      const sorted = [...comments].sort((a, b) => {
        switch (state.sortBy) {
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
    return sortComments(state.comments);
  }, [state.comments, state.sortBy]);
  // Load comments from Firestore with caching support
  const loadComments = useCallback(async (refresh = false) => {
    if (!pageId) return;
    const endTiming = commentPerformanceMonitor.startTiming('loadComments');
    // Check cache first for initial load (not refresh)
    if (!refresh && !lastDoc) {
      const cachedComments = commentCache.get(pageId, state.sortBy);
      if (cachedComments) {
        setState(prev => ({
          ...prev,
          comments: cachedComments,
          loading: false,
          error: null
        }));
        setIsInitialized(true);
        endTiming();
        return;
      }
    }
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await getComments(
        pageId,
        state.sortBy,
        50,
        refresh ? undefined : lastDoc
      );
      const newComments = refresh ? result.comments : [...state.comments, ...result.comments];
      setState(prev => ({
        ...prev,
        comments: newComments,
        loading: false
      }));
      // Cache the comments if this is a fresh load
      if (refresh || !lastDoc) {
        commentCache.set(pageId, state.sortBy, result.comments);
      }
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading comments:', error);
      // Enhanced error handling with specific error types
      const errorMessage = error instanceof Error 
        ? error.message.includes('network') 
          ? 'Network connection error. Please check your internet connection.'
          : error.message.includes('permission')
          ? 'Permission denied. You may not have access to view these comments.'
          : 'Failed to load comments. Please try again.'
        : 'An unexpected error occurred while loading comments.';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      // Fallback to mock data if Firestore fails and not initialized
      if (!isInitialized) {
        const mockComments = generateMockComments();
        setState(prev => ({
          ...prev,
          comments: mockComments,
          loading: false
        }));
        // Cache mock data to avoid repeated fallbacks
        commentCache.set(pageId, state.sortBy, mockComments);
        setIsInitialized(true);
      }
    }
    endTiming();
  }, [pageId, state.sortBy, lastDoc, isInitialized, state.comments]);
  // Load comments on mount and when pageId or sortBy changes
  useEffect(() => {
    if (pageId && !isInitialized) {
      loadComments(true);
    }
  }, [pageId, loadComments, isInitialized]);
  // Reload when sort changes
  useEffect(() => {
    if (isInitialized && pageId) {
      setLastDoc(undefined);
      loadComments(true);
    }
  }, [state.sortBy]);
  // Submit new comment with cache invalidation and optimistic updates
  const submitComment = useCallback(async (content: string, parentId?: string, isAnonymous = false) => {
    if (!content.trim() || !pageId) return;
    if (isAnonymous && !defaultAnonymousOptions.allowAnonymous) {
      setState(prev => ({
        ...prev,
        error: 'Anonymous comments are not allowed'
      }));
      return;
    }
    // Content validation
    if (content.length > 2000) {
      setState(prev => ({
        ...prev,
        error: 'Comment is too long. Maximum 2000 characters allowed.'
      }));
      return;
    }
    const endTiming = commentPerformanceMonitor.startTiming('submitComment');
    setState(prev => ({ ...prev, submitting: true, error: null }));
    try {
      let newComment: Comment;
      if (isAnonymous || !userId) {
        // Create anonymous or guest comment
        newComment = await createAnonymousComment(
          pageId,
          content,
          parentId
        );
      } else {
        // Create authenticated user comment
        const author: CommentUser = {
          id: userId,
          name: 'Current User', // This should come from your auth system
          isVerified: false
        };
        newComment = await createComment(
          pageId,
          content,
          author,
          parentId
        );
      }
      // Invalidate cache for this page since we added a new comment
      commentCache.invalidate(pageId);
      // Refresh comments to get the latest data
      await loadComments(true);
      setState(prev => ({ ...prev, submitting: false }));
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error instanceof Error 
        ? error.message.includes('quota') 
          ? 'Comment submission limit reached. Please try again later.'
          : error.message.includes('content')
          ? 'Comment contains inappropriate content. Please modify and try again.'
          : 'Failed to submit comment. Please try again.'
        : 'An unexpected error occurred while submitting your comment.';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        submitting: false
      }));
    }
    endTiming();
  }, [pageId, userId, defaultAnonymousOptions.allowAnonymous, loadComments]);
  // Submit anonymous comment (convenience function)
  const submitAnonymousComment = useCallback(async (content: string, parentId?: string) => {
    return submitComment(content, parentId, true);
  }, [submitComment]);
  // Vote on comment
  const handleVoteComment = useCallback(async (commentId: string, voteType: 'upvote' | 'downvote') => {
    // Clear any existing errors first
    setState(prev => ({ ...prev, error: null }));
    if (!userId) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to vote on comments'
      }));
      return;
    }
    // Check Firebase initialization
    if (!pageId) {
      setState(prev => ({
        ...prev,
        error: 'Page not initialized. Please refresh the page.'
      }));
      return;
    }
    try {
      // Try to vote on the comment
      await voteOnComment(commentId, userId, voteType);
      // Refresh comments to get updated vote counts
      await loadComments(true);
    } catch (error: any) {
      console.error('Error voting on comment:', {
        error,
        commentId,
        voteType,
        userId,
        errorMessage: error?.message,
        errorCode: error?.code
      });
      // Provide more specific error messages
      let errorMessage = 'Failed to vote on comment';
      if (error?.message?.includes('Firestore not initialized')) {
        errorMessage = 'Database connection failed. Please refresh the page and try again.';
      } else if (error?.message?.includes('Comment not found')) {
        errorMessage = 'This comment no longer exists. Refreshing comments...';
        // Still try to refresh comments to update the UI
        try {
          await loadComments(true);
        } catch (refreshError) {
          console.error('Failed to refresh comments after vote error:', refreshError);
        }
        return;
      } else if (error?.message?.includes('permission')) {
        errorMessage = 'You do not have permission to vote on this comment.';
      } else if (error?.message?.includes('network') || error?.code === 'unavailable') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.code === 'unauthenticated') {
        errorMessage = 'Authentication expired. Please sign in again.';
      }
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [userId, loadComments, pageId]);
  // Edit comment
  const editComment = useCallback(async (commentId: string, content: string) => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to edit comments'
      }));
      return;
    }
    try {
      await updateComment(commentId, content, userId);
      // Refresh comments to get updated content
      await loadComments(true);
    } catch (error) {
      console.error('Error editing comment:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to edit comment'
      }));
    }
  }, [userId, loadComments]);
  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        error: 'You must be logged in to delete comments'
      }));
      return;
    }
    try {
      await deleteComment(commentId, userId);
      // Refresh comments to remove deleted comment
      await loadComments(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete comment'
      }));
    }
  }, [userId, loadComments]);
  // Set sort by
  const setSortBy = useCallback((sortType: CommentSortType) => {
    setState(prev => ({ ...prev, sortBy: sortType }));
    setLastDoc(undefined); // Reset pagination when changing sort
  }, []);
  // Load more comments
  const loadMore = useCallback(async () => {
    if (!hasMore || !pageId) return;
    await loadComments(false);
  }, [hasMore, pageId, loadComments]);
  // Refresh comments
  const refresh = useCallback(async () => {
    if (!pageId) return;
    setLastDoc(undefined);
    await loadComments(true);
  }, [pageId, loadComments]);
  return {
    state: {
      ...state,
      comments: state.comments // No need to sort here as Firestore handles sorting
    },
    stats,
    actions: {
      submitComment,
      submitAnonymousComment,
      voteComment: handleVoteComment,
      editComment,
      deleteComment: handleDeleteComment,
      setSortBy,
      loadMore,
      refresh
    },
    hasMore,
    anonymousOptions: defaultAnonymousOptions
  };
}

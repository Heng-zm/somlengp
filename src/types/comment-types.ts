export interface CommentUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  isVerified?: boolean;
  isAnonymous?: boolean;
  isGuest?: boolean;
  role?: 'admin' | 'moderator' | 'user';
  createdAt?: Date;
  lastActiveAt?: Date;
}

export interface CommentVote {
  commentId: string;
  userId: string;
  type: 'upvote' | 'downvote';
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentUser;
  createdAt: Date;
  updatedAt?: Date;
  upvotes: number;
  downvotes: number;
  replies: Comment[];
  parentId?: string;
  isEdited?: boolean;
  userVote?: 'upvote' | 'downvote';
}

export interface CommentFormData {
  content: string;
  parentId?: string;
  isAnonymous?: boolean;
}

export interface AnonymousCommentOptions {
  allowAnonymous: boolean;
  anonymousDisplayName?: string;
  requireModeration?: boolean;
}

export interface PublicCommentOptions {
  requireLogin: boolean;
  allowGuestComments: boolean;
  defaultGuestName?: string;
  showAllComments: boolean;
  enableVoting: boolean;
  enableReplies: boolean;
}

export interface CommentStats {
  totalComments: number;
  totalReplies: number;
}

export type CommentSortType = 'recent' | 'oldest' | 'popular';

export interface CommentSystemState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  sortBy: CommentSortType;
}

export interface CommentFormattingOption {
  type: 'bold' | 'italic' | 'underline' | 'link' | 'attachment' | 'emoji' | 'mention';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  action: (editor: unknown) => void;
}

// Enhanced error types for better error handling
export type CommentError = 
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'CONTENT_TOO_LONG'
  | 'CONTENT_INAPPROPRIATE'
  | 'COMMENT_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface CommentErrorDetails {
  type: CommentError;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
}

// Performance monitoring types
export interface CommentPerformanceMetrics {
  loadTime: number;
  renderTime: number;
  cacheHitRate: number;
  errorRate: number;
  averageResponseTime: number;
}

// Enhanced comment with additional metadata
export interface EnhancedComment extends Comment {
  engagementScore?: number;
  depth: number;
  hasBeenEdited: boolean;
  mentions: string[];
  lastInteractionAt: Date;
  moderationStatus?: 'approved' | 'pending' | 'rejected';
}

// Optimized comment system configuration
export interface CommentSystemConfig {
  maxDepth: number;
  enableVirtualization: boolean;
  enableCaching: boolean;
  enableOptimisticUpdates: boolean;
  enableRealTimeUpdates: boolean;
  enablePerformanceMonitoring: boolean;
  pageSizeLimit: number;
  characterLimit: number;
  rateLimitPerMinute: number;
}

// Comment system analytics
export interface CommentAnalytics {
  totalViews: number;
  totalEngagement: number;
  averageDepth: number;
  topContributors: CommentUser[];
  engagementTrends: Array<{ date: Date; count: number }>;
}

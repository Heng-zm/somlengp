'use client';

import { Comment, CommentUser, CommentError, CommentErrorDetails, CommentSystemConfig } from '@/types/comment-types';

/**
 * Comment validation utilities with enhanced error handling
 */

// Default configuration
export const DEFAULT_COMMENT_CONFIG: CommentSystemConfig = {
  maxDepth: 5,
  enableVirtualization: false,
  enableCaching: true,
  enableOptimisticUpdates: true,
  enableRealTimeUpdates: false,
  enablePerformanceMonitoring: true,
  pageSizeLimit: 50,
  characterLimit: 2000,
  rateLimitPerMinute: 10
};

// Content validation patterns
const VALIDATION_PATTERNS = {
  // Basic profanity filter (can be extended)
  profanity: /\b(spam|fake|scam)\b/gi,
  
  // URL detection
  urls: /(https?:\/\/[^\s]+)/gi,
  
  // Email detection
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  
  // Mention detection
  mentions: /@(\w+)/gi,
  
  // Excessive caps (more than 70% caps)
  excessiveCaps: /^[A-Z\s!?.,]{0,}[A-Z]{5,}[A-Z\s!?.,]*$/,
  
  // Repeated characters
  repeatedChars: /(.)\1{4,}/g
};

/**
 * Create standardized error details
 */
export function createCommentError(
  type: CommentError,
  message: string,
  retryable = false,
  details?: Record<string, unknown>
): CommentErrorDetails {
  return {
    type,
    message,
    details,
    timestamp: new Date(),
    retryable
  };
}

/**
 * Validate comment content
 */
export interface ContentValidationResult {
  isValid: boolean;
  errors: CommentErrorDetails[];
  warnings: string[];
  sanitizedContent?: string;
}

export function validateCommentContent(
  content: string,
  config: Partial<CommentSystemConfig> = {}
): ContentValidationResult {
  const fullConfig = { ...DEFAULT_COMMENT_CONFIG, ...config };
  const errors: CommentErrorDetails[] = [];
  const warnings: string[] = [];

  // Check if content is empty
  if (!content || !content.trim()) {
    errors.push(createCommentError('CONTENT_TOO_LONG', 'Comment cannot be empty'));
    return { isValid: false, errors, warnings };
  }

  // Check length
  if (content.length > fullConfig.characterLimit) {
    errors.push(createCommentError(
      'CONTENT_TOO_LONG', 
      `Comment exceeds maximum length of ${fullConfig.characterLimit} characters`,
      false,
      { currentLength: content.length, maxLength: fullConfig.characterLimit }
    ));
  }

  // Check for basic profanity/spam
  if (VALIDATION_PATTERNS.profanity.test(content)) {
    errors.push(createCommentError(
      'CONTENT_INAPPROPRIATE',
      'Comment contains inappropriate content',
      false,
      { matches: content.match(VALIDATION_PATTERNS.profanity) }
    ));
  }

  // Check for excessive caps
  if (VALIDATION_PATTERNS.excessiveCaps.test(content)) {
    warnings.push('Comment appears to be shouting (too many capital letters)');
  }

  // Check for repeated characters
  if (VALIDATION_PATTERNS.repeatedChars.test(content)) {
    warnings.push('Comment contains excessive repeated characters');
  }

  // Sanitize content
  const sanitizedContent = sanitizeCommentContent(content);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedContent
  };
}

/**
 * Sanitize comment content
 */
export function sanitizeCommentContent(content: string): string {
  return content
    // Basic XSS prevention
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate user permissions
 */
export interface PermissionValidationResult {
  canView: boolean;
  canComment: boolean;
  canVote: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canModerate: boolean;
  errors: CommentErrorDetails[];
}

export function validateUserPermissions(
  user: CommentUser | null,
  comment?: Comment,
  isOwner = false
): PermissionValidationResult {
  const errors: CommentErrorDetails[] = [];

  // Anonymous users can only view
  if (!user) {
    return {
      canView: true,
      canComment: false,
      canVote: false,
      canEdit: false,
      canDelete: false,
      canModerate: false,
      errors: [createCommentError('AUTHENTICATION_REQUIRED', 'Login required for this action', true)]
    };
  }

  // Authenticated user permissions
  const isAdmin = user.role === 'admin';
  const isModerator = user.role === 'moderator' || isAdmin;

  return {
    canView: true,
    canComment: true,
    canVote: true,
    canEdit: isOwner || isModerator,
    canDelete: isOwner || isModerator,
    canModerate: isModerator,
    errors
  };
}

/**
 * Rate limiting utilities
 */
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(userId: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }

  getRemainingTime(userId: string, windowMs: number = 60000): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    const timeUntilReset = windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }

  clear(userId?: string): void {
    if (userId) {
      this.requests.delete(userId);
    } else {
      this.requests.clear();
    }
  }
}

export const commentRateLimiter = new RateLimiter();

/**
 * Comment content analysis utilities
 */
export interface ContentAnalysis {
  wordCount: number;
  characterCount: number;
  mentions: string[];
  urls: string[];
  emails: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  readabilityScore: number;
  toxicityScore: number;
}

export function analyzeCommentContent(content: string): ContentAnalysis {
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  const mentions = Array.from(content.matchAll(VALIDATION_PATTERNS.mentions), m => m[1]);
  const urls = Array.from(content.matchAll(VALIDATION_PATTERNS.urls), m => m[0]);
  const emails = Array.from(content.matchAll(VALIDATION_PATTERNS.emails), m => m[0]);

  // Simple sentiment analysis (can be enhanced with ML)
  const positiveWords = /\b(good|great|excellent|amazing|love|like|awesome|fantastic)\b/gi;
  const negativeWords = /\b(bad|terrible|awful|hate|dislike|horrible|worst)\b/gi;
  
  const positiveCount = (content.match(positiveWords) || []).length;
  const negativeCount = (content.match(negativeWords) || []).length;
  
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  // Simple readability score (average word length)
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (averageWordLength * 5)));

  // Simple toxicity score based on patterns
  const toxicPatterns = [VALIDATION_PATTERNS.profanity, VALIDATION_PATTERNS.excessiveCaps];
  const toxicMatches = toxicPatterns.reduce((count, pattern) => {
    return count + (content.match(pattern) || []).length;
  }, 0);
  const toxicityScore = Math.min(100, toxicMatches * 20);

  return {
    wordCount: words.length,
    characterCount: content.length,
    mentions: [...new Set(mentions)], // Remove duplicates
    urls: [...new Set(urls)],
    emails: [...new Set(emails)],
    sentiment,
    readabilityScore,
    toxicityScore
  };
}

/**
 * Comment sorting utilities with performance optimization
 */
export type SortFunction = (a: Comment, b: Comment) => number;

export const SORT_FUNCTIONS: Record<string, SortFunction> = {
  recent: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  oldest: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  popular: (a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes),
  engagement: (a, b) => {
    const aEngagement = a.upvotes + a.downvotes + a.replies.length;
    const bEngagement = b.upvotes + b.downvotes + b.replies.length;
    return bEngagement - aEngagement;
  },
  controversial: (a, b) => {
    const aRatio = a.downvotes / Math.max(1, a.upvotes);
    const bRatio = b.downvotes / Math.max(1, b.upvotes);
    return bRatio - aRatio;
  }
};

/**
 * Recursively sort comments and their replies
 */
export function sortCommentsRecursively(comments: Comment[], sortBy: string): Comment[] {
  const sortFn = SORT_FUNCTIONS[sortBy] || SORT_FUNCTIONS.recent;
  
  return comments
    .sort(sortFn)
    .map(comment => ({
      ...comment,
      replies: comment.replies.length > 0 
        ? sortCommentsRecursively(comment.replies, sortBy)
        : comment.replies
    }));
}

/**
 * Comment thread utilities
 */
export interface CommentThread {
  id: string;
  rootComment: Comment;
  allComments: Comment[];
  depth: number;
  participantCount: number;
  lastActivity: Date;
}

export function buildCommentThread(rootComment: Comment): CommentThread {
  const allComments: Comment[] = [];
  let maxDepth = 0;
  const participants = new Set<string>();
  let lastActivity = rootComment.createdAt;

  function traverse(comment: Comment, depth: number) {
    allComments.push(comment);
    participants.add(comment.author.id);
    maxDepth = Math.max(maxDepth, depth);
    
    if (comment.createdAt > lastActivity) {
      lastActivity = comment.createdAt;
    }
    
    comment.replies.forEach(reply => traverse(reply, depth + 1));
  }

  traverse(rootComment, 0);

  return {
    id: rootComment.id,
    rootComment,
    allComments,
    depth: maxDepth,
    participantCount: participants.size,
    lastActivity
  };
}


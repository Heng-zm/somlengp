/**
 * Utility functions for handling anonymous comments
 */

import { CommentUser, Comment } from '@/types/comment-types';

/**
 * Anonymous user name options
 */
export const ANONYMOUS_NAMES = [
  'Anonymous Learner',
  'Anonymous Student',
  'Anonymous User',
  'Guest User',
  'Curious Mind',
  'Learning Explorer',
  'Silent Observer',
  'Thoughtful Reader',
  'Interested Visitor',
  'Knowledge Seeker'
] as const;

/**
 * Guest user name options
 */
export const GUEST_NAMES = [
  'Guest Visitor',
  'Public User', 
  'Visitor',
  'Reader',
  'Community Member',
  'Learning Enthusiast',
  'Fellow Learner',
  'Curious Reader'
] as const;

/**
 * Generates a unique anonymous user object
 * @returns CommentUser object for anonymous user
 */
export const generateAnonymousUser = (customName?: string): CommentUser => {
  const name = customName || ANONYMOUS_NAMES[Math.floor(Math.random() * ANONYMOUS_NAMES.length)];
  
  return {
    id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    isAnonymous: true,
    isVerified: false
  };
};

/**
 * Creates an anonymous comment object
 * @param content - The comment content
 * @param parentId - Optional parent comment ID for replies
 * @param customName - Optional custom anonymous name
 * @returns Complete Comment object
 */
export const createAnonymousComment = (
  content: string, 
  parentId?: string, 
  customName?: string
): Comment => {
  return {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    author: generateAnonymousUser(customName),
    createdAt: new Date(),
    upvotes: 0,
    downvotes: 0,
    replies: [],
    parentId
  };
};

/**
 * Checks if a comment is from an anonymous user
 * @param comment - The comment to check
 * @returns boolean indicating if comment is anonymous
 */
export const isAnonymousComment = (comment: Comment): boolean => {
  return comment.author.isAnonymous === true;
};

/**
 * Filters comments to show only anonymous comments
 * @param comments - Array of comments to filter
 * @returns Array of anonymous comments only
 */
export const getAnonymousComments = (comments: Comment[]): Comment[] => {
  return comments.filter(isAnonymousComment);
};

/**
 * Filters comments to show only registered user comments
 * @param comments - Array of comments to filter
 * @returns Array of registered user comments only
 */
export const getRegisteredUserComments = (comments: Comment[]): Comment[] => {
  return comments.filter(comment => !isAnonymousComment(comment));
};

/**
 * Gets anonymous comment statistics
 * @param comments - Array of comments to analyze
 * @returns Object with anonymous comment statistics
 */
export const getAnonymousCommentStats = (comments: Comment[]) => {
  const totalComments = comments.length;
  const anonymousComments = getAnonymousComments(comments);
  const registeredComments = getRegisteredUserComments(comments);
  
  return {
    total: totalComments,
    anonymous: anonymousComments.length,
    registered: registeredComments.length,
    anonymousPercentage: totalComments > 0 ? (anonymousComments.length / totalComments) * 100 : 0
  };
};

/**
 * Sanitizes anonymous user display name
 * @param name - Raw display name
 * @returns Sanitized display name
 */
export const sanitizeAnonymousName = (name: string): string => {
  // Remove any potential identifying information or harmful content
  return name
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .trim()
    .substring(0, 50); // Limit length
};

/**
 * Validates anonymous comment content
 * @param content - Comment content to validate
 * @returns Validation result with success status and message
 */
export const validateAnonymousComment = (content: string): { isValid: boolean; message?: string } => {
  if (!content.trim()) {
    return { isValid: false, message: 'Comment content cannot be empty' };
  }
  
  if (content.length > 5000) {
    return { isValid: false, message: 'Comment is too long (maximum 5000 characters)' };
  }
  
  // Check for spam patterns (basic implementation)
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]+/gi, // URLs (you might want to allow these)
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, message: 'Comment contains potentially spam content' };
    }
  }
  
  return { isValid: true };
};

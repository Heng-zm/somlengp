'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
// Note: react-window package may not be available, using fallback implementation
import { useComments } from '@/hooks/use-comments';
import { Comment } from '@/types/comment-types';
import { commentUtils } from '@/lib/comment-cache';
// Performance optimization needed: Consider memoizing inline styles, inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


// Note: CommentEditor is available in ./comment-editor but not used in this component

// Memoized comment vote buttons to prevent unnecessary re-renders
const CommentVoteButtons = memo(({ 
  comment, 
  onVote, 
  userId, 
  disabled = false 
}: {
  comment: Comment;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  userId?: string;
  disabled?: boolean;
}) => {
  const handleUpvote = useCallback(() => {
    onVote(comment.id, 'upvote');
  }, [comment.id, onVote]);

  const handleDownvote = useCallback(() => {
    onVote(comment.id, 'downvote');
  }, [comment.id, onVote]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleUpvote}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
          comment.userVote === 'upvote' 
            ? 'bg-green-100 text-green-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        disabled={!userId || disabled}
        aria-label={`Upvote comment (${comment.upvotes} votes)`}
      >
        <span>↑</span>
        <span>{comment.upvotes}</span>
      </button>
      <button
        onClick={handleDownvote}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
          comment.userVote === 'downvote' 
            ? 'bg-red-100 text-red-700' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        disabled={!userId || disabled}
        aria-label={`Downvote comment (${comment.downvotes} votes)`}
      >
        <span>↓</span>
        <span>{comment.downvotes}</span>
      </button>
    </div>
  );
});

CommentVoteButtons.displayName = 'CommentVoteButtons';

// Memoized comment author info to prevent re-renders
const CommentAuthor = memo(({ 
  author, 
  createdAt, 
  isEdited = false 
}: {
  author: Comment['author'];
  createdAt: Date;
  isEdited?: boolean;
}) => {
  const formattedDate = useMemo(() => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return createdAt.toLocaleDateString();
  }, [createdAt]);

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {author.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="font-medium text-gray-900">{author.name}</span>
          {author.isVerified && (
            <span className="ml-1 text-blue-500" title="Verified user">✓</span>
          )}
          {author.isAnonymous && (
            <span className="ml-1 text-gray-500 text-xs">(Anonymous)</span>
          )}
          {author.isGuest && (
            <span className="ml-1 text-gray-500 text-xs">(Guest)</span>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <time dateTime={createdAt.toISOString()} title={createdAt.toLocaleString()}>
          {formattedDate}
        </time>
        {isEdited && <span className="ml-1">(edited)</span>}
      </div>
    </div>
  );
});

CommentAuthor.displayName = 'CommentAuthor';

// Memoized comment content with sanitization
const CommentContent = memo(({ 
  content, 
  isEditing, 
  editContent, 
  onEditContentChange, 
  onSaveEdit, 
  onCancelEdit 
}: {
  content: string;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) => {
  const sanitizedContent = useMemo(() => 
    commentUtils.sanitizeContent(content), 
    [content]
  );

  if (isEditing) {
    return (
      <div className="mb-3">
        <textarea
          value={editContent}
          onChange={(e) => onEditContentChange(e.target.value)}
          className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={2000}
        />
        <div className="flex space-x-2 mt-2">
          <button
            onClick={onSaveEdit}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            disabled={!editContent.trim() || editContent === content}
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <p 
      className="text-gray-800 mb-3 whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
});

CommentContent.displayName = 'CommentContent';

// Main optimized comment item with React.memo
const OptimizedCommentItem = memo(({ 
  comment, 
  onReply, 
  onVote, 
  onEdit, 
  onDelete, 
  userId,
  level = 0,
  maxDepth = 5
}: {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  userId?: string;
  level?: number;
  maxDepth?: number;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);

  const handleReply = useCallback(() => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  }, [comment.id, onReply, replyContent]);

  const handleEdit = useCallback(() => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  }, [comment.id, onEdit, editContent, comment.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(comment.content);
  }, [comment.content]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  }, [comment.id, onDelete]);

  const isOwner = userId === comment.author.id;
  const marginLeft = Math.min(level * 24, maxDepth * 24); // Limit nesting depth visually
  const shouldShowReplies = level < maxDepth && comment.replies && comment.replies.length > 0;

  return (
    <div 
      style={{ marginLeft: `${marginLeft}px` }} 
      className="border-l border-gray-200 pl-4 mb-4"
      data-comment-id={comment.id}
      data-level={level}
    >
      <article className="bg-white rounded-lg p-4 shadow-sm border">
        <CommentAuthor 
          author={comment.author}
          createdAt={comment.createdAt}
          isEdited={comment.isEdited}
        />

        <CommentContent
          content={comment.content}
          isEditing={isEditing}
          editContent={editContent}
          onEditContentChange={setEditContent}
          onSaveEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CommentVoteButtons
              comment={comment}
              onVote={onVote}
              userId={userId}
              disabled={isEditing}
            />

            {level < maxDepth && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                disabled={isEditing}
              >
                Reply
              </button>
            )}
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isEditing}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
                disabled={isEditing}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              maxLength={2000}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleReply}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                disabled={!replyContent.trim()}
              >
                Post Reply
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </article>

      {/* Nested Replies */}
      {shouldShowReplies && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <OptimizedCommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onVote={onVote}
              onEdit={onEdit}
              onDelete={onDelete}
              userId={userId}
              level={level + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}

      {/* Show collapsed replies indicator if max depth reached */}
      {level >= maxDepth && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700 border border-blue-200">
          {comment.replies.length} more repl{comment.replies.length === 1 ? 'y' : 'ies'} (max depth reached)
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.comment.id === nextProps.comment.id &&
    prevProps.comment.content === nextProps.comment.content &&
    prevProps.comment.upvotes === nextProps.comment.upvotes &&
    prevProps.comment.downvotes === nextProps.comment.downvotes &&
    prevProps.comment.userVote === nextProps.comment.userVote &&
    prevProps.comment.replies.length === nextProps.comment.replies.length &&
    prevProps.userId === nextProps.userId &&
    prevProps.level === nextProps.level
  );
});

OptimizedCommentItem.displayName = 'OptimizedCommentItem';

// Virtualized comment list for large comment threads
const VirtualizedCommentList = memo(({ 
  comments, 
  onReply, 
  onVote, 
  onEdit, 
  onDelete, 
  userId,
  height = 600
}: {
  comments: Array<Comment & { level: number }>;
  onReply: (commentId: string, content: string) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  userId?: string;
  height?: number;
}) => {
  const itemRenderer = useCallback(({ index, style }: { index: number; style: any }) => {
    const comment = comments[index];
    return (
      <div style={style}>
        <OptimizedCommentItem
          comment={comment}
          onReply={onReply}
          onVote={onVote}
          onEdit={onEdit}
          onDelete={onDelete}
          userId={userId}
          level={comment.level}
        />
      </div>
    );
  }, [comments, onReply, onVote, onEdit, onDelete, userId]);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  // Use regular rendering for small comment lists
  if (comments.length <= 20) {
    return (
      <div>
        {comments.map((comment) => (
          <OptimizedCommentItem
            key={comment.id}
            comment={comment}
            onReply={onReply}
            onVote={onVote}
            onEdit={onEdit}
            onDelete={onDelete}
            userId={userId}
            level={comment.level}
          />
        ))}
      </div>
    );
  }

  // Fallback: Use regular rendering for large lists (virtualization disabled)
  return (
    <div style={{ maxHeight: height, overflowY: 'auto' }}>
      {comments.map((comment, index) => (
        <OptimizedCommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onVote={onVote}
          onEdit={onEdit}
          onDelete={onDelete}
          userId={userId}
          level={comment.level}
        />
      ))}
    </div>
  );
});

VirtualizedCommentList.displayName = 'VirtualizedCommentList';

// Main optimized comments system component
interface OptimizedCommentsSystemProps {
  pageId: string;
  userId?: string;
  enableVirtualization?: boolean;
  maxDepth?: number;
  className?: string;
}

export const OptimizedCommentsSystem = memo(({ 
  pageId, 
  userId, 
  enableVirtualization = false,
  maxDepth = 5,
  className = ""
}: OptimizedCommentsSystemProps) => {
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const {
    state,
    stats,
    actions,
    hasMore,
    anonymousOptions
  } = useComments({
    pageId,
    userId,
    anonymousOptions: {
      allowAnonymous: true,
      anonymousDisplayName: 'Anonymous',
      requireModeration: false
    }
  });

  const handleSubmitComment = useCallback(async () => {
    if (newCommentContent.trim()) {
      await actions.submitComment(newCommentContent, undefined, isAnonymous);
      setNewCommentContent('');
    }
  }, [newCommentContent, isAnonymous, actions]);

  const handleReply = useCallback(async (parentId: string, content: string) => {
    await actions.submitComment(content, parentId, isAnonymous);
  }, [actions, isAnonymous]);

  // Flatten comments for virtualization if enabled
  const displayComments = useMemo((): Array<Comment & { level: number }> => {
    if (enableVirtualization) {
      return commentUtils.flattenComments(state.comments);
    }
    // Ensure comments have a level property for type compatibility in the non-virtualized case
    return state.comments.map(comment => ({ ...comment, level: 0 }));
  }, [state.comments, enableVirtualization]);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <header className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Comments ({stats.totalComments + stats.totalReplies})
        </h2>
        
        {/* Performance Stats (dev mode only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500">
            Depth: {commentUtils.getMaxDepth(state.comments)} | 
            Flattened: {enableVirtualization ? displayComments.length : 'N/A'}
          </div>
        )}
      </header>

      {/* Error Display */}
      {state.error && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{state.error}</p>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <label htmlFor="sort-select" className="text-sm text-gray-600">Sort by:</label>
        <select
          id="sort-select"
          value={state.sortBy}
          onChange={(e) => actions.setSortBy(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* New Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="mb-3">
          <label htmlFor="new-comment" className="sr-only">Write a comment</label>
          <textarea
            id="new-comment"
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {newCommentContent.length}/2000 characters
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {anonymousOptions.allowAnonymous && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Post anonymously</span>
              </label>
            )}
          </div>
          <button
            onClick={handleSubmitComment}
            disabled={!newCommentContent.trim() || state.submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {state.submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      {state.loading && state.comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading comments...</p>
        </div>
      ) : enableVirtualization ? (
        <VirtualizedCommentList
          comments={displayComments}
          onReply={handleReply}
          onVote={actions.voteComment}
          onEdit={actions.editComment}
          onDelete={actions.deleteComment}
          userId={userId}
        />
      ) : (
        <div>
          {displayComments.map((comment: any) => (
            <OptimizedCommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onVote={actions.voteComment}
              onEdit={actions.editComment}
              onDelete={actions.deleteComment}
              userId={userId}
              maxDepth={maxDepth}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={actions.loadMore}
                disabled={state.loading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {state.loading ? 'Loading...' : 'Load More Comments'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Footer */}
      <footer className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Comments: {stats.totalComments}</span>
          <span>Total Replies: {stats.totalReplies}</span>
        </div>
      </footer>
    </div>
  );
});

OptimizedCommentsSystem.displayName = 'OptimizedCommentsSystem';

export default OptimizedCommentsSystem;

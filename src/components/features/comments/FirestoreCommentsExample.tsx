'use client';

import React, { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { Comment } from '@/types/comment-types';
// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  userId?: string;
  level?: number;
}

function CommentItem({ 
  comment, 
  onReply, 
  onVote, 
  onEdit, 
  onDelete, 
  userId,
  level = 0 
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const isOwner = userId === comment.author.id;
  const marginLeft = level * 24;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }} className="border-l border-gray-200 pl-4 mb-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.author.name.charAt(0)}
            </div>
            <div>
              <span className="font-medium text-gray-900">{comment.author.name}</span>
              {comment.author.isVerified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
              {comment.author.isAnonymous && (
                <span className="ml-1 text-gray-500 text-xs">(Anonymous)</span>
              )}
              {comment.author.isGuest && (
                <span className="ml-1 text-gray-500 text-xs">(Guest)</span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {comment.createdAt.toLocaleDateString()} {comment.createdAt.toLocaleTimeString()}
            {comment.isEdited && <span className="ml-1">(edited)</span>}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 mb-3">{comment.content}</p>
        )}

        {/* Vote and Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Voting */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onVote(comment.id, 'upvote')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                  comment.userVote === 'upvote' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                disabled={!userId}
              >
                <span>↑</span>
                <span>{comment.upvotes}</span>
              </button>
              <button
                onClick={() => onVote(comment.id, 'downvote')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                  comment.userVote === 'downvote' 
                    ? 'bg-red-100 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                disabled={!userId}
              >
                <span>↓</span>
                <span>{comment.downvotes}</span>
              </button>
            </div>

            {/* Reply Button */}
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reply
            </button>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded-md resize-none"
              rows={2}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleReply}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                disabled={!replyContent.trim()}
              >
                Post Reply
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onVote={onVote}
              onEdit={onEdit}
              onDelete={onDelete}
              userId={userId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FirestoreCommentsExampleProps {
  pageId: string;
  userId?: string;
}

export function FirestoreCommentsExample({ pageId, userId }: FirestoreCommentsExampleProps) {
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

  const handleSubmitComment = async () => {
    if (newCommentContent.trim()) {
      await actions.submitComment(newCommentContent, undefined, isAnonymous);
      setNewCommentContent('');
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    await actions.submitComment(content, parentId, isAnonymous);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Comments ({stats.totalComments + stats.totalReplies})</h2>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={state.sortBy}
          onChange={(e) => actions.setSortBy(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* New Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <textarea
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-3 border rounded-md resize-none"
          rows={3}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            {anonymousOptions.allowAnonymous && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Post anonymously</span>
              </label>
            )}
          </div>
          <button
            onClick={handleSubmitComment}
            disabled={!newCommentContent.trim() || state.submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
      ) : state.comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div>
          {state.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onVote={actions.voteComment}
              onEdit={actions.editComment}
              onDelete={actions.deleteComment}
              userId={userId}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={actions.loadMore}
                disabled={state.loading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                {state.loading ? 'Loading...' : 'Load More Comments'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Comments: {stats.totalComments}</span>
          <span>Total Replies: {stats.totalReplies}</span>
        </div>
      </div>
    </div>
  );
}

export default FirestoreCommentsExample;

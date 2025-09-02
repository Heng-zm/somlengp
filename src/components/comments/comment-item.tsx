'use client';

import { useState, memo } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, MoreHorizontal, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Comment } from '@/types/comment-types';
import { CommentEditor } from './comment-editor';

interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onReply: (content: string, parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  className?: string;
  level?: number;
  maxLevel?: number;
}

export const CommentItem = memo(function CommentItem({
  comment,
  onVote,
  onReply,
  onEdit,
  onDelete,
  className,
  level = 0,
  maxLevel = 3
}: CommentItemProps) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    onVote(comment.id, voteType);
  };

  const handleReplySubmit = (content: string) => {
    onReply(content, comment.id);
    setShowReplyEditor(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-grow min-w-0">
          {/* User Info and Time */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">
                {comment.author.name}
              </span>
              {comment.author.isVerified && (
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">(edited)</span>
            )}
          </div>

          {/* Comment Text */}
          <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-3 leading-relaxed break-words">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Voting */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('upvote')}
                className={cn(
                  "h-6 px-2 text-xs hover:bg-green-50 dark:hover:bg-green-950/20",
                  comment.userVote === 'upvote' && "bg-green-50 dark:bg-green-950/20 text-green-600"
                )}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {comment.upvotes}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote('downvote')}
                className={cn(
                  "h-6 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-950/20",
                  comment.userVote === 'downvote' && "bg-red-50 dark:bg-red-950/20 text-red-600"
                )}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                {comment.downvotes}
              </Button>
            </div>

            {/* Reply */}
            {level < maxLevel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyEditor(!showReplyEditor)}
                className="h-6 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {onEdit && (
                  <DropdownMenuItem className="text-xs">
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem className="text-xs text-red-600">
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-xs">
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply Editor */}
          {showReplyEditor && (
            <div className="mt-3">
              <CommentEditor
                placeholder="Write a reply..."
                onSubmit={handleReplySubmit}
                parentId={comment.id}
                submitText="Reply"
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 sm:ml-11 space-y-3 border-l border-gray-200 dark:border-gray-700 pl-2 sm:pl-3">
          {showReplies && comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
              maxLevel={maxLevel}
            />
          ))}
          
          {!showReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(true)}
              className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

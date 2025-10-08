'use client';

import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Comment, CommentSortType, CommentStats } from '@/types/comment-types';
import { CommentEditor } from './comment-editor';
import { CommentItem } from './comment-item';

interface LimitedCommentsListProps {
  comments: Comment[];
  stats: CommentStats;
  sortBy: CommentSortType;
  loading?: boolean;
  error?: string | null;
  initialLimit?: number; // Number of comments to show initially
  onSubmitComment: (content: string) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onReply: (content: string, parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  className?: string;
  // Translations
  commentsTitle?: string;
  addCommentPlaceholder?: string;
  submitText?: string;
  showMoreText?: string;
  showLessText?: string;
}

export const LimitedCommentsList = memo(function LimitedCommentsList({
  comments,
  stats,
  sortBy,
  loading = false,
  error = null,
  initialLimit = 3,
  onSubmitComment,
  onVote,
  onReply,
  onEdit,
  onDelete,
  className,
  commentsTitle = "Comments",
  addCommentPlaceholder = "Add comment...",
  submitText = "Submit",
  showMoreText = "See more comments",
  showLessText = "Show less"
}: LimitedCommentsListProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Determine which comments to display
  const displayedComments = showAll ? comments : comments.slice(0, initialLimit);
  const hasMoreComments = comments.length > initialLimit;
  const hiddenCount = comments.length - initialLimit;

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load comments. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-0">
        {/* Comment Editor */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <CommentEditor
            placeholder={addCommentPlaceholder}
            onSubmit={onSubmitComment}
            submitText={submitText}
          />
        </div>

        {/* Comments Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {commentsTitle}
              </h3>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {stats.totalComments}
              </span>
            </div>
            
            {/* Show/Hide indicator */}
            {hasMoreComments && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {showAll ? comments.length : Math.min(initialLimit, comments.length)} of {comments.length}
              </div>
            )}
          </div>
        </div>

        {/* Comments List */}
        <div className="px-6 py-4">
          {loading && comments.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <CommentSkeleton key={index} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No comments yet
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {displayedComments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-2 duration-300",
                      showAll && index >= initialLimit && "animate-in fade-in slide-in-from-top-2"
                    )}
                    style={{
                      animationDelay: showAll && index >= initialLimit 
                        ? `${(index - initialLimit) * 100}ms` 
                        : `${index * 100}ms`
                    }}
                  >
                    <CommentItem
                      comment={comment}
                      onVote={onVote}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                ))}
              </div>

              {/* Show More/Less Button */}
              {hasMoreComments && (
                <div className="flex flex-col items-center mt-6 space-y-2">
                  {!showAll && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {hiddenCount} more comment{hiddenCount !== 1 ? 's' : ''}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={toggleShowAll}
                    className={cn(
                      "group transition-all duration-200 hover:scale-105",
                      !showAll 
                        ? "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/20"
                        : "text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:hover:bg-gray-950/20"
                    )}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                        {showLessText}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                        {showMoreText} ({hiddenCount})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Loading skeleton for comments
const CommentSkeleton = memo(function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      <div className="flex-grow space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-2 mt-2">
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
});

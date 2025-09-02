'use client';

import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Comment, CommentSortType, CommentStats } from '@/types/comment-types';
import { CommentEditor } from './comment-editor';
import { CommentItem } from './comment-item';

interface CommentsListProps {
  comments: Comment[];
  stats: CommentStats;
  sortBy: CommentSortType;
  loading?: boolean;
  error?: string | null;
  initialLimit?: number; // Number of comments to show initially
  enableInitialLimit?: boolean; // Whether to use initial limit functionality
  onSubmitComment: (content: string) => void;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onReply: (content: string, parentId: string) => void;
  onSortChange: (sortType: CommentSortType) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
  // Translations
  commentsTitle?: string;
  sortLabels?: {
    recent: string;
    oldest: string;
    popular: string;
  };
  addCommentPlaceholder?: string;
  submitText?: string;
  showMoreText?: string;
  showLessText?: string;
}

const sortOptions = [
  { value: 'recent' as CommentSortType, label: 'Most recent' },
  { value: 'oldest' as CommentSortType, label: 'Oldest first' },
  { value: 'popular' as CommentSortType, label: 'Most popular' }
];

export const CommentsList = memo(function CommentsList({
  comments,
  stats,
  sortBy,
  loading = false,
  error = null,
  initialLimit = 3,
  enableInitialLimit = false,
  onSubmitComment,
  onVote,
  onReply,
  onSortChange,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
  className,
  commentsTitle = "Comments",
  sortLabels = {
    recent: "Most recent",
    oldest: "Oldest first", 
    popular: "Most popular"
  },
  addCommentPlaceholder = "Add comment...",
  submitText = "Submit",
  showMoreText = "Show more",
  showLessText = "Show less"
}: CommentsListProps) {
  const [showAll, setShowAll] = useState(!enableInitialLimit);
  
  // Determine which comments to display when initial limit is enabled
  const displayedComments = enableInitialLimit && !showAll 
    ? comments.slice(0, initialLimit) 
    : comments;
  
  const hasMoreComments = enableInitialLimit && comments.length > initialLimit;
  const hiddenCount = enableInitialLimit ? comments.length - initialLimit : 0;
  
  const toggleShowAll = () => {
    setShowAll(!showAll);
  };
  
  const getSortLabel = (sortType: CommentSortType) => {
    return sortLabels[sortType] || sortOptions.find(opt => opt.value === sortType)?.label || 'Most recent';
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
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <CommentEditor
            placeholder={addCommentPlaceholder}
            onSubmit={onSubmitComment}
            submitText={submitText}
          />
        </div>

        {/* Comments Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                {commentsTitle}
              </h3>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                {stats.totalComments}
              </span>
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 sm:px-3"
                >
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">{getSortLabel(sortBy)}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                      "text-sm cursor-pointer",
                      sortBy === option.value && "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {sortLabels[option.value] || option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comments List */}
        <div className="px-4 sm:px-6 py-4">
          {loading && comments.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <CommentSkeleton key={index} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
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
                      enableInitialLimit && showAll && index >= initialLimit && "animate-in fade-in slide-in-from-top-2"
                    )}
                    style={{
                      animationDelay: enableInitialLimit && showAll && index >= initialLimit 
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

              {/* Initial Limit Toggle Button */}
              {hasMoreComments && (
                <div className="flex flex-col items-center mt-6 space-y-3">
                  <Button
                    variant="ghost"
                    onClick={toggleShowAll}
                    className={cn(
                      "group transition-all duration-200 hover:bg-transparent",
                      !showAll 
                        ? "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        : "text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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

          {/* Load More Button (for pagination) */}
          {hasMore && showAll && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/20"
              >
                {loading ? 'Loading...' : 'Load more comments'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Loading skeleton for comments
const CommentSkeleton = memo(function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-grow space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
});

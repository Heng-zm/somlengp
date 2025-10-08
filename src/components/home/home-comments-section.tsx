'use client';

import { useMemo, useContext, useState } from 'react';
import { MessageCircle, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { useComments } from '@/hooks/use-comments';
import { CommentsList } from '@/components/features/comments/limited-comments-list';
import { cn } from '@/lib/utils';

interface HomeCommentsSectionProps {
  className?: string;
}

export function HomeCommentsSection({ className }: HomeCommentsSectionProps) {
  const langContext = useContext(LanguageContext);
  
  if (!langContext) {
    throw new Error('HomeCommentsSection must be used within a LanguageProvider');
  }

  const { language } = langContext;
  const t = useMemo(() => {
    const translations = allTranslations[language];
    return {
      ...translations,
      getFileTooLargeDescription: (size: number) => translations.fileTooLargeDescription(size)
    };
  }, [language]);

  // Initialize comments hook with anonymous options enabled for public access
  const {
    state,
    stats,
    actions,
    hasMore,
    anonymousOptions
  } = useComments({
    pageId: 'home',
    anonymousOptions: {
      allowAnonymous: true,
      anonymousDisplayName: 'Anonymous User',
      requireModeration: false
    }
  });

  // Handle comment submission - defaults to guest user for public access
  const handleSubmitComment = async (content: string) => {
    await actions.submitComment(content);
  };

  // Handle reply submission
  const handleReply = async (content: string, parentId: string) => {
    await actions.submitComment(content, parentId);
  };

  return (
    <Card className={cn("w-full shadow-lg border-orange-200/50 dark:border-orange-800/50", className)}>
      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Community Discussion
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Share your thoughts and connect with other users
              </p>
            </div>
          </div>
          
          {/* Stats badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
              <Users className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">{stats.totalComments} {stats.totalComments === 1 ? 'comment' : 'comments'}</span>
              <span className="xs:hidden">{stats.totalComments}</span>
            </Badge>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">{stats.totalReplies} {stats.totalReplies === 1 ? 'reply' : 'replies'}</span>
              <span className="xs:hidden">{stats.totalReplies}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CommentsList
          comments={state.comments}
          stats={stats}
          sortBy={state.sortBy}
          loading={state.loading}
          error={state.error}
          onSubmitComment={handleSubmitComment}
          onVote={actions.voteComment}
          onReply={handleReply}
          onSortChange={actions.setSortBy}
          onEdit={actions.editComment}
          onDelete={actions.deleteComment}
          onLoadMore={actions.loadMore}
          hasMore={hasMore}
          enableInitialLimit={true}
          initialLimit={4}
          commentsTitle={t.comments}
          sortLabels={{
            recent: t.sortMostRecent,
            oldest: t.sortOldest,
            popular: t.sortPopular
          }}
          addCommentPlaceholder={t.addCommentPlaceholder}
          submitText={t.submit}
          showMoreText="See more comments"
          showLessText="Show less"
          className="border-0 shadow-none"
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { memo, useContext } from 'react';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { useComments } from '@/hooks/use-comments';
import { CommentsList } from './comments-list';
import { cn } from '@/lib/utils';

interface CommentSystemProps {
  pageId?: string;
  userId?: string;
  className?: string;
  title?: string;
}

export const CommentSystem = memo(function CommentSystem({
  pageId,
  userId,
  className,
  title
}: CommentSystemProps) {
  const langContext = useContext(LanguageContext);
  
  if (!langContext) {
    throw new Error('CommentSystem must be used within a LanguageProvider');
  }

  const { language } = langContext;
  const t = allTranslations[language];

  const {
    state,
    stats,
    actions,
    hasMore
  } = useComments({ pageId, userId });

  return (
    <div className={cn("w-full", className)}>
      <CommentsList
        comments={state.comments}
        stats={stats}
        sortBy={state.sortBy}
        loading={state.loading}
        error={state.error}
        onSubmitComment={actions.submitComment}
        onVote={actions.voteComment}
        onReply={actions.submitComment}
        onSortChange={actions.setSortBy}
        onEdit={actions.editComment}
        onDelete={actions.deleteComment}
        onLoadMore={actions.loadMore}
        hasMore={hasMore}
        // Translations
        commentsTitle={title || t.comments}
        sortLabels={{
          recent: t.sortMostRecent,
          oldest: t.sortOldest,
          popular: t.sortPopular
        }}
        addCommentPlaceholder={t.addCommentPlaceholder}
        submitText={t.submit}
        showMoreText={t.showMore}
      />
    </div>
  );
});

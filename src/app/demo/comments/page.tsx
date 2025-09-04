'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Code2, Eye } from 'lucide-react';
import { CommentsList } from '@/components/comments/comments-list';
import { LimitedCommentsList } from '@/components/comments/limited-comments-list';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/contexts/auth-context';

export default function CommentsDemo() {
  const [useStandalone, setUseStandalone] = useState(false);
  const [enableLimit, setEnableLimit] = useState(true);
  const [initialLimit, setInitialLimit] = useState(3);
  const { user } = useAuth();
  
  const { state, stats, actions } = useComments({
    pageId: 'demo-page',
    userId: user?.uid
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Comments Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive demonstration of comment list with &quot;Show 3 comments and See more&quot; functionality
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Component Type Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Component Type</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={useStandalone}
                    onCheckedChange={setUseStandalone}
                    id="component-type"
                  />
                  <label htmlFor="component-type" className="text-sm text-gray-600">
                    {useStandalone ? 'LimitedCommentsList' : 'CommentsList (Enhanced)'}
                  </label>
                </div>
                <Badge variant={useStandalone ? "default" : "secondary"} className="text-xs">
                  {useStandalone ? 'Standalone Component' : 'Enhanced Existing'}
                </Badge>
              </div>

              {/* Initial Limit Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Enable Initial Limit</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={enableLimit}
                    onCheckedChange={setEnableLimit}
                    id="enable-limit"
                  />
                  <label htmlFor="enable-limit" className="text-sm text-gray-600">
                    {enableLimit ? 'Limited View' : 'Show All'}
                  </label>
                </div>
                <Badge variant={enableLimit ? "default" : "outline"} className="text-xs">
                  {enableLimit ? `Show ${initialLimit} initially` : 'Show all comments'}
                </Badge>
              </div>

              {/* Limit Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Initial Limit</label>
                <div className="flex gap-2">
                  {[2, 3, 5].map(limit => (
                    <Button
                      key={limit}
                      variant={initialLimit === limit ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInitialLimit(limit)}
                      className="flex-1"
                    >
                      {limit}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Comments to show initially
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Comments:</span>
                <Badge>{stats.totalComments}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Total Replies:</span>
                <Badge variant="secondary">{stats.totalReplies}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Demo
              <Badge variant="outline" className="ml-auto">
                {useStandalone ? 'LimitedCommentsList' : 'CommentsList'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {useStandalone ? (
              <LimitedCommentsList
                comments={state.comments}
                stats={stats}
                sortBy={state.sortBy}
                loading={state.loading}
                error={state.error}
                initialLimit={initialLimit}
                onSubmitComment={(content) => actions.submitComment(content)}
                onVote={actions.voteComment}
                onReply={(content, parentId) => actions.submitComment(content, parentId)}
                onEdit={actions.editComment}
                onDelete={actions.deleteComment}
                commentsTitle="Demo Comments"
                showMoreText={`See more comments`}
                showLessText="Show less"
              />
            ) : (
              <CommentsList
                comments={state.comments}
                stats={stats}
                sortBy={state.sortBy}
                loading={state.loading}
                error={state.error}
                initialLimit={initialLimit}
                enableInitialLimit={enableLimit}
                onSubmitComment={(content) => actions.submitComment(content)}
                onVote={actions.voteComment}
                onReply={(content, parentId) => actions.submitComment(content, parentId)}
                onSortChange={actions.setSortBy}
                onEdit={actions.editComment}
                onDelete={actions.deleteComment}
                onLoadMore={actions.loadMore}
                hasMore={false}
                commentsTitle="Demo Comments"
                showMoreText={`See more comments`}
                showLessText="Show less"
              />
            )}
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Usage Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">1. Using LimitedCommentsList (Standalone)</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
{`<LimitedCommentsList
  comments={comments}
  stats={stats}
  sortBy="recent"
  initialLimit={3}
  onSubmitComment={handleSubmit}
  onVote={handleVote}
  onReply={handleReply}
  showMoreText="See more comments"
  showLessText="Show less"
/>`}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">2. Using Enhanced CommentsList</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm">
{`<CommentsList
  comments={comments}
  stats={stats}
  sortBy="recent"
  initialLimit={3}
  enableInitialLimit={true}
  onSubmitComment={handleSubmit}
  onVote={handleVote}
  onReply={handleReply}
  onSortChange={handleSort}
  showMoreText="See more comments"
  showLessText="Show less"
/>`}
                </pre>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Key Features:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Shows 3 comments initially (configurable)</li>
                <li>• &quot;See more&quot; button shows remaining comments count</li>
                <li>• Smooth animations when expanding/collapsing</li>
                <li>• Responsive design with hover effects</li>
                <li>• Works with existing comment functionality</li>
                <li>• Backward compatible with existing CommentsList</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

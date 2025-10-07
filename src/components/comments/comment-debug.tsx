'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/contexts/auth-context';
import { AlertCircle, CheckCircle2, XCircle, User } from 'lucide-react';
import { getUserId, getDisplayName } from '@/lib/supabase-user-utils';

export function CommentDebug() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const { user, loading: authLoading } = useAuth();
  
  const { state, actions, stats } = useComments({
    pageId: 'debug-page',
    userId: getUserId(user) || undefined
  });

  const updateTestResult = (testName: string, result: 'success' | 'error', error?: string) => {
    setTestResults(prev => ({ ...prev, [testName]: result }));
    if (error) {
      setErrorMessages(prev => ({ ...prev, [testName]: error }));
    }
  };

  const testSubmitComment = async () => {
    try {
      setTestResults(prev => ({ ...prev, submitComment: 'pending' }));
      await actions.submitComment('This is a test comment');
      updateTestResult('submitComment', 'success');
    } catch (error) {
      updateTestResult('submitComment', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testSubmitAnonymousComment = async () => {
    try {
      setTestResults(prev => ({ ...prev, submitAnonymous: 'pending' }));
      await actions.submitAnonymousComment('This is an anonymous test comment');
      updateTestResult('submitAnonymous', 'success');
    } catch (error) {
      updateTestResult('submitAnonymous', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testVoteComment = async () => {
    if (state.comments.length === 0) {
      updateTestResult('voteComment', 'error', 'No comments to vote on. Add a comment first.');
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, voteComment: 'pending' }));
      await actions.voteComment(state.comments[0].id, 'upvote');
      updateTestResult('voteComment', 'success');
    } catch (error) {
      updateTestResult('voteComment', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testReplyToComment = async () => {
    if (state.comments.length === 0) {
      updateTestResult('replyComment', 'error', 'No comments to reply to. Add a comment first.');
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, replyComment: 'pending' }));
      await actions.submitComment('This is a test reply', state.comments[0].id);
      updateTestResult('replyComment', 'success');
    } catch (error) {
      updateTestResult('replyComment', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testEditComment = async () => {
    if (state.comments.length === 0) {
      updateTestResult('editComment', 'error', 'No comments to edit. Add a comment first.');
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, editComment: 'pending' }));
      await actions.editComment(state.comments[0].id, 'This is an edited test comment');
      updateTestResult('editComment', 'success');
    } catch (error) {
      updateTestResult('editComment', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testDeleteComment = async () => {
    if (state.comments.length === 0) {
      updateTestResult('deleteComment', 'error', 'No comments to delete. Add a comment first.');
      return;
    }

    try {
      setTestResults(prev => ({ ...prev, deleteComment: 'pending' }));
      await actions.deleteComment(state.comments[0].id);
      updateTestResult('deleteComment', 'success');
    } catch (error) {
      updateTestResult('deleteComment', 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Testing...</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-200">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Comment System Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Authentication Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {authLoading ? (
                  <Badge variant="outline">Loading...</Badge>
                ) : user ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    ✓ Authenticated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    ✗ Not Authenticated
                  </Badge>
                )}
              </div>
              <div>User ID: {getUserId(user) || 'None'}</div>
              <div>Display Name: {getDisplayName(user) || 'None'}</div>
              <div>Email: {user?.email || 'None'}</div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">System Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Loading: {state.loading ? 'Yes' : 'No'}</div>
              <div>Error: {state.error || 'None'}</div>
              <div>Comments: {stats.totalComments}</div>
              <div>Replies: {stats.totalReplies}</div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Test Actions</h3>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.submitComment)}
                <span>Submit Comment</span>
                {getStatusBadge(testResults.submitComment)}
              </div>
              <Button 
                onClick={testSubmitComment}
                disabled={state.submitting}
                size="sm"
              >
                Test
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.submitAnonymous)}
                <span>Submit Anonymous Comment</span>
                {getStatusBadge(testResults.submitAnonymous)}
              </div>
              <Button 
                onClick={testSubmitAnonymousComment}
                disabled={state.submitting}
                size="sm"
              >
                Test
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.voteComment)}
                <span>Vote on Comment</span>
                {getStatusBadge(testResults.voteComment)}
              </div>
              <Button 
                onClick={testVoteComment}
                disabled={state.submitting || state.comments.length === 0}
                size="sm"
              >
                Test
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.replyComment)}
                <span>Reply to Comment</span>
                {getStatusBadge(testResults.replyComment)}
              </div>
              <Button 
                onClick={testReplyToComment}
                disabled={state.submitting || state.comments.length === 0}
                size="sm"
              >
                Test
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.editComment)}
                <span>Edit Comment</span>
                {getStatusBadge(testResults.editComment)}
              </div>
              <Button 
                onClick={testEditComment}
                disabled={state.submitting || state.comments.length === 0}
                size="sm"
              >
                Test
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.deleteComment)}
                <span>Delete Comment</span>
                {getStatusBadge(testResults.deleteComment)}
              </div>
              <Button 
                onClick={testDeleteComment}
                disabled={state.submitting || state.comments.length === 0}
                size="sm"
                variant="destructive"
              >
                Test
              </Button>
            </div>
          </div>

          {/* Error Messages */}
          {Object.entries(errorMessages).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-600">Error Details</h3>
              {Object.entries(errorMessages).map(([test, error]) => (
                <div key={test} className="bg-red-50 p-3 rounded-lg text-sm">
                  <strong>{test}:</strong> {error}
                </div>
              ))}
            </div>
          )}

          {/* Raw Data */}
          <div className="space-y-2">
            <h3 className="font-semibold">Raw Comment Data</h3>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(state.comments, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, User, MessageCircle, Settings } from 'lucide-react' // TODO: Consider importing icons individually for better tree shaking;
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions

const SystemDebugPageComponent = function SystemDebugPage() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  
  // Mock data for demonstration
  const mockStats = {
    totalComments: 12,
    totalReplies: 8
  };
  
  const mockUser = {
    uid: 'demo-user-123',
    displayName: 'Demo User',
    email: 'demo@example.com'
  };

  const updateTestResult = (testName: string, result: 'success' | 'error', error?: string) => {
    setTestResults(prev => ({ ...prev, [testName]: result }));
    if (error) {
      setErrorMessages(prev => ({ ...prev, [testName]: error }));
    }
  };

  const mockTest = (testName: string, delay = 1000) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }));
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      if (success) {
        updateTestResult(testName, 'success');
      } else {
        updateTestResult(testName, 'error', 'Mock test failure for demonstration');
      }
    }, delay);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">System Debug Panel</h1>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comment System Diagnostics</CardTitle>
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
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      ✓ Authenticated (Demo)
                    </Badge>
                  </div>
                  <div>User ID: {mockUser.uid}</div>
                  <div>Display Name: {mockUser.displayName}</div>
                  <div>Email: {mockUser.email}</div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">System Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Loading: No</div>
                  <div>Error: None</div>
                  <div>Comments: {mockStats.totalComments}</div>
                  <div>Replies: {mockStats.totalReplies}</div>
                </div>
              </div>

              {/* Test Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">Test Actions</h3>
                
                {['submitComment', 'submitAnonymous', 'voteComment', 'replyComment', 'editComment', 'deleteComment'].map((testName) => (
                  <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults[testName])}
                      <span className="capitalize">
                        {testName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {getStatusBadge(testResults[testName])}
                    </div>
                    <Button 
                      onClick={() => mockTest(testName)}
                      size="sm"
                      variant={testName === 'deleteComment' ? 'destructive' : 'default'}
                    >
                      Test
                    </Button>
                  </div>
                ))}
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

              {/* Mock Data Display */}
              <div className="space-y-2">
                <h3 className="font-semibold">Sample Comment Display</h3>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="mb-2 text-gray-600">This debug panel shows mock data for demonstration purposes.</p>
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        JD
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">John Doe</span>
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                          <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-700">This is a sample comment for testing the debug interface.</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <button className="flex items-center gap-1 hover:text-blue-600">
                            <MessageCircle className="h-3 w-3" /> Reply
                          </button>
                          <span>↑ 5 votes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default memo(SystemDebugPageComponent);
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  commentCache, 
  commentPerformanceMonitor, 
  CommentPerformanceMonitor 
} from '@/lib/comment-cache';
import { getCommentAnalytics } from '@/lib/optimized-firestore-comments';
import { 
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

  BarChart, 
  TrendingUp, 
  Clock, 
  Database, 
  Users, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface PerformanceDashboardProps {
  pageId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CommentPerformanceDashboard({ 
  pageId, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get real-time performance metrics
  const performanceData = useMemo(() => {
    const allMetrics = commentPerformanceMonitor.getAllMetrics();
    const cacheStats = commentCache.getStats();
    const hitRate = commentCache.getHitRate();

    return {
      loadTime: allMetrics.loadComments || { avg: 0, min: 0, max: 0, count: 0 },
      submitTime: allMetrics.submitComment || { avg: 0, min: 0, max: 0, count: 0 },
      voteTime: allMetrics.optimizedVoteComment || { avg: 0, min: 0, max: 0, count: 0 },
      queryTime: allMetrics.firestoreQuery || { avg: 0, min: 0, max: 0, count: 0 },
      cacheStats,
      hitRate
    };
  }, [metrics]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getCommentAnalytics(pageId);
      setAnalytics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [pageId, autoRefresh, refreshInterval]);

  // Performance status indicators
  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 100) return { status: 'excellent', color: 'green', label: 'Excellent' };
    if (avgTime < 500) return { status: 'good', color: 'blue', label: 'Good' };
    if (avgTime < 1000) return { status: 'fair', color: 'yellow', label: 'Fair' };
    return { status: 'poor', color: 'red', label: 'Needs Improvement' };
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comment System Performance Dashboard</h2>
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={fetchAnalytics} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cache Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(performanceData.hitRate)}
            </div>
            <p className="text-xs text-muted-foreground">Cache hit rate</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache size:</span>
                <span>{performanceData.cacheStats.size}/{performanceData.cacheStats.maxSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache hits:</span>
                <span className="text-green-600">{performanceData.cacheStats.hits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cache misses:</span>
                <span className="text-red-600">{performanceData.cacheStats.misses}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Performance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(performanceData.loadTime.avg)}
            </div>
            <p className="text-xs text-muted-foreground">Average load time</p>
            <div className="mt-4">
              <Badge 
                variant="outline" 
                className={`text-${getPerformanceStatus(performanceData.loadTime.avg).color}-600 border-${getPerformanceStatus(performanceData.loadTime.avg).color}-200`}
              >
                {getPerformanceStatus(performanceData.loadTime.avg).label}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Min:</span>
                <span>{formatTime(performanceData.loadTime.min)}</span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span>{formatTime(performanceData.loadTime.max)}</span>
              </div>
              <div className="flex justify-between">
                <span>Samples:</span>
                <span>{performanceData.loadTime.count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comment Statistics</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? analytics.totalComments + analytics.totalReplies : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Total interactions</p>
            {analytics && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Comments:</span>
                  <span>{analytics.totalComments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Replies:</span>
                  <span>{analytics.totalReplies}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Engagement:</span>
                  <span>{analytics.averageEngagement.toFixed(1)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submit Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(performanceData.submitTime.avg)}
            </div>
            <p className="text-xs text-muted-foreground">Average submit time</p>
            <div className="mt-4">
              <Badge 
                variant="outline" 
                className={`text-${getPerformanceStatus(performanceData.submitTime.avg).color}-600 border-${getPerformanceStatus(performanceData.submitTime.avg).color}-200`}
              >
                {getPerformanceStatus(performanceData.submitTime.avg).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Vote Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vote Performance</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(performanceData.voteTime.avg)}
            </div>
            <p className="text-xs text-muted-foreground">Average vote time</p>
            <div className="mt-4">
              <Badge 
                variant="outline" 
                className={`text-${getPerformanceStatus(performanceData.voteTime.avg).color}-600 border-${getPerformanceStatus(performanceData.voteTime.avg).color}-200`}
              >
                {getPerformanceStatus(performanceData.voteTime.avg).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics?.topContributors ? (
              <div className="space-y-2">
                {analytics.topContributors.slice(0, 5).map((contributor: any, index: number) => (
                  <div key={contributor.authorId} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm truncate max-w-[120px]" title={contributor.authorName}>
                        {contributor.authorName}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {contributor.count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading contributors...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Operation</th>
                  <th className="text-right p-2">Average</th>
                  <th className="text-right p-2">Min</th>
                  <th className="text-right p-2">Max</th>
                  <th className="text-right p-2">Samples</th>
                  <th className="text-right p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(commentPerformanceMonitor.getAllMetrics()).map(([operation, data]) => {
                  const status = getPerformanceStatus(data.avg);
                  return (
                    <tr key={operation} className="border-b">
                      <td className="p-2 font-medium">{operation}</td>
                      <td className="p-2 text-right">{formatTime(data.avg)}</td>
                      <td className="p-2 text-right">{formatTime(data.min)}</td>
                      <td className="p-2 text-right">{formatTime(data.max)}</td>
                      <td className="p-2 text-right">{data.count}</td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {status.status === 'excellent' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {status.status === 'poor' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          <span className={`text-${status.color}-600`}>
                            {status.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Cache Health</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hit Rate:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${performanceData.hitRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{formatPercentage(performanceData.hitRate)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ 
                          width: `${(performanceData.cacheStats.size / performanceData.cacheStats.maxSize) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      {performanceData.cacheStats.size}/{performanceData.cacheStats.maxSize}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Operation Health</h3>
              <div className="space-y-2">
                {[
                  { name: 'Load Comments', data: performanceData.loadTime },
                  { name: 'Submit Comment', data: performanceData.submitTime },
                  { name: 'Vote Comment', data: performanceData.voteTime }
                ].map(({ name, data }) => {
                  const status = getPerformanceStatus(data.avg);
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm">{name}:</span>
                      <div className="flex items-center space-x-2">
                        {status.status === 'excellent' && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {status.status === 'poor' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        <Badge 
                          variant="outline" 
                          className={`text-xs text-${status.color}-600 border-${status.color}-200`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cache Actions */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold text-sm mb-3">Cache Management</h3>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  commentCache.clear();
                  setMetrics(Date.now()); // Force re-render
                }}
              >
                Clear All Cache
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  commentCache.invalidate(pageId);
                  setMetrics(Date.now()); // Force re-render
                }}
              >
                Clear Page Cache
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  commentCache.cleanExpired();
                  setMetrics(Date.now()); // Force re-render
                }}
              >
                Clean Expired
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.hitRate < 70 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Low Cache Hit Rate</p>
                  <p className="text-xs text-gray-600">
                    Consider increasing cache TTL or improving cache key strategy. Current hit rate: {formatPercentage(performanceData.hitRate)}
                  </p>
                </div>
              </div>
            )}

            {performanceData.loadTime.avg > 1000 && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Slow Load Performance</p>
                  <p className="text-xs text-gray-600">
                    Consider implementing pagination or reducing initial load size. Current average: {formatTime(performanceData.loadTime.avg)}
                  </p>
                </div>
              </div>
            )}

            {performanceData.loadTime.avg < 200 && performanceData.hitRate > 80 && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Excellent Performance</p>
                  <p className="text-xs text-gray-600">
                    Your comment system is performing optimally with fast load times and good cache efficiency.
                  </p>
                </div>
              </div>
            )}

            {(performanceData.cacheStats.size / performanceData.cacheStats.maxSize) > 0.8 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <Database className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cache Near Capacity</p>
                  <p className="text-xs text-gray-600">
                    Cache is {Math.round((performanceData.cacheStats.size / performanceData.cacheStats.maxSize) * 100)}% full. 
                    Consider increasing cache size or cleaning expired entries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Cache Debug</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(performanceData.cacheStats, null, 2)}
                </pre>
              </div>
              
              {analytics && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Analytics Debug</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(analytics, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CommentPerformanceDashboard;

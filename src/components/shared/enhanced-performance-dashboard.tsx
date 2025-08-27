'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Eye,
  Wifi,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePerformanceAlerting } from '@/lib/performance-alerts';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PerformanceData {
  timestamp: number;
  LCP: number;
  FID: number;
  CLS: number;
  TTFB: number;
}

interface PerformanceInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'regression' | 'improvement';
  metric: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  timestamp: number;
  data: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

// Mock data generator for historical performance data
function generateHistoricalData(days = 7): PerformanceData[] {
  const data: PerformanceData[] = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    data.push({
      timestamp,
      LCP: 2200 + Math.random() * 800,
      FID: 50 + Math.random() * 100,
      CLS: 0.05 + Math.random() * 0.15,
      TTFB: 300 + Math.random() * 400
    });
  }
  
  return data;
}

// Chart colors for different metrics
const CHART_COLORS = {
  LCP: '#8884d8',
  FID: '#82ca9d',
  CLS: '#ffc658',
  TTFB: '#ff7300'
};

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
  critical: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-600'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
};

// Performance score calculation
const calculatePerformanceScore = (data: PerformanceData[]): number => {
  if (!data.length) return 0;
  
  const latest = data[data.length - 1];
  const scores = {
    LCP: latest.LCP <= 2500 ? 100 : latest.LCP <= 4000 ? 50 : 0,
    FID: latest.FID <= 100 ? 100 : latest.FID <= 300 ? 50 : 0,
    CLS: latest.CLS <= 0.1 ? 100 : latest.CLS <= 0.25 ? 50 : 0,
    TTFB: latest.TTFB <= 800 ? 100 : latest.TTFB <= 1800 ? 50 : 0
  };
  
  return Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 4);
};

// Metric card component
const MetricCard = memo(function MetricCard({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const TrendIcon = trendIcon;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color }}>
          {value.toFixed(unit === 'ms' ? 0 : 3)}{unit}
        </div>
        <p className={cn(
          "text-xs flex items-center gap-1 mt-1",
          trend === 'up' ? "text-red-600" : trend === 'down' ? "text-green-600" : "text-gray-600"
        )}>
          <TrendIcon className="h-3 w-3" />
          {trend === 'stable' ? 'Stable' : trend === 'up' ? 'Trending up' : 'Improving'}
        </p>
      </CardContent>
    </Card>
  );
});

// Main enhanced dashboard component
interface EnhancedPerformanceDashboardProps {
  className?: string;
  showInsights?: boolean;
  showRecommendations?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const EnhancedPerformanceDashboard = memo(function EnhancedPerformanceDashboard({
  className,
  showInsights = true,
  showRecommendations = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: EnhancedPerformanceDashboardProps) {
  const [historicalData, setHistoricalData] = useState<PerformanceData[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const alerting = usePerformanceAlerting();
  const alerts = alerting.getAlerts(true); // Only unresolved alerts
  
  // Fetch performance data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Generate mock historical data
      const mockHistoricalData = generateHistoricalData(selectedTimeRange === '7d' ? 7 : 30);
      setHistoricalData(mockHistoricalData);
      
      // Fetch insights from API
      const insightsResponse = await fetch(`/api/analytics/insights?type=insights&timeRange=${selectedTimeRange}`);
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }
      
      // Fetch recommendations from API
      const recommendationsResponse = await fetch('/api/analytics/insights?type=recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Export performance data
  const exportData = useCallback(() => {
    const dataToExport = {
      timestamp: Date.now(),
      historicalData,
      insights,
      recommendations,
      alerts,
      metadata: {
        timeRange: selectedTimeRange,
        generatedBy: 'Somleng Performance Dashboard'
      }
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [historicalData, insights, recommendations, alerts, selectedTimeRange]);

  const performanceScore = calculatePerformanceScore(historicalData);
  const latestData = historicalData[historicalData.length - 1];
  
  if (isLoading && historicalData.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            <span>Loading performance data...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time performance monitoring and insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Time Range:</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Metric:</label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="all">All Metrics</option>
                  <option value="LCP">LCP Only</option>
                  <option value="FID">FID Only</option>
                  <option value="CLS">CLS Only</option>
                  <option value="TTFB">TTFB Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Performance Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Overall Performance Score</h3>
              <p className="text-sm text-muted-foreground">
                Based on Core Web Vitals thresholds
              </p>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-4xl font-bold",
                performanceScore >= 90 ? "text-green-600" :
                performanceScore >= 70 ? "text-yellow-600" : "text-red-600"
              )}>
                {performanceScore}
              </div>
              <Progress value={performanceScore} className="w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Active Performance Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{alert.metric}: {alert.value}{alert.metric === 'CLS' ? '' : 'ms'}</div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                  </div>
                  <Badge 
                    className={cn(
                      "border",
                      SEVERITY_COLORS[alert.severity]
                    )}
                    variant="secondary"
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{alerts.length - 3} more alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Metrics */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Largest Contentful Paint"
            value={latestData.LCP}
            unit="ms"
            trend="stable"
            icon={Eye}
            color={CHART_COLORS.LCP}
          />
          <MetricCard
            title="First Input Delay"
            value={latestData.FID}
            unit="ms"
            trend="down"
            icon={Zap}
            color={CHART_COLORS.FID}
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={latestData.CLS}
            unit=""
            trend="stable"
            icon={Activity}
            color={CHART_COLORS.CLS}
          />
          <MetricCard
            title="Time to First Byte"
            value={latestData.TTFB}
            unit="ms"
            trend="up"
            icon={Wifi}
            color={CHART_COLORS.TTFB}
          />
        </div>
      )}

      {/* Charts and Insights */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(name === 'CLS' ? 3 : 0)}${name === 'CLS' ? '' : 'ms'}`,
                        name
                      ]}
                    />
                    {selectedMetric === 'all' || selectedMetric === 'LCP' ? (
                      <Line type="monotone" dataKey="LCP" stroke={CHART_COLORS.LCP} strokeWidth={2} />
                    ) : null}
                    {selectedMetric === 'all' || selectedMetric === 'FID' ? (
                      <Line type="monotone" dataKey="FID" stroke={CHART_COLORS.FID} strokeWidth={2} />
                    ) : null}
                    {selectedMetric === 'all' || selectedMetric === 'TTFB' ? (
                      <Line type="monotone" dataKey="TTFB" stroke={CHART_COLORS.TTFB} strokeWidth={2} />
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {insight.type === 'improvement' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : insight.type === 'regression' ? (
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    {insight.title}
                  </CardTitle>
                  <Badge 
                    className={cn(
                      "border",
                      SEVERITY_COLORS[insight.severity]
                    )}
                    variant="secondary"
                  >
                    {insight.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <strong>Impact:</strong>
                    <p className="text-sm mt-1">{insight.impact}</p>
                  </div>
                  <div>
                    <strong>Recommendation:</strong>
                    <p className="text-sm mt-1">{insight.recommendation}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{insight.metric} metric</span>
                  <span>{new Date(insight.timestamp).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{rec.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={cn(
                        "border",
                        PRIORITY_COLORS[rec.priority]
                      )}
                      variant="secondary"
                    >
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="outline">
                      {rec.effort} effort
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Action:</strong>
                    <p className="text-sm mt-1">{rec.action}</p>
                  </div>
                  <div>
                    <strong>Estimated Impact:</strong>
                    <p className="text-sm mt-1">{rec.estimatedImpact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="LCP" fill={CHART_COLORS.LCP} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Good Performance Days</span>
                    <Badge variant="secondary">5/7</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average LCP</span>
                    <span className="font-mono">
                      {latestData ? latestData.LCP.toFixed(0) : '0'}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Best Performance Day</span>
                    <span className="text-green-600">Yesterday</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Issues Resolved</span>
                    <Badge className="bg-green-100 text-green-800">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

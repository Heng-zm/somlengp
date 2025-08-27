import { NextRequest, NextResponse } from 'next/server';

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

interface PerformanceTrend {
  metric: string;
  timeframe: string;
  dataPoints: Array<{
    timestamp: number;
    value: number;
    count: number;
  }>;
  trend: {
    direction: 'improving' | 'degrading' | 'stable';
    magnitude: number;
    confidence: number;
  };
}

// Mock data for demonstration (in production, fetch from database)
function generateInsights(): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const now = Date.now();

  // Sample insights based on common performance patterns
  insights.push({
    id: `insight_${now}_1`,
    type: 'trend',
    metric: 'LCP',
    severity: 'medium',
    title: 'Largest Contentful Paint trending upward',
    description: 'LCP has increased by 15% over the past 7 days, indicating slower content loading.',
    impact: 'Users may experience slower perceived page load times, potentially affecting engagement.',
    recommendation: 'Consider optimizing image sizes, implementing lazy loading, or reviewing server response times.',
    timestamp: now,
    data: {
      current: 2800,
      previous: 2435,
      change: 15,
      trend: 'up'
    }
  });

  insights.push({
    id: `insight_${now}_2`,
    type: 'improvement',
    metric: 'CLS',
    severity: 'low',
    title: 'Cumulative Layout Shift improved significantly',
    description: 'CLS has decreased by 25% over the past 3 days, showing better visual stability.',
    impact: 'Users experience fewer unexpected layout shifts, improving usability.',
    recommendation: 'Maintain current optimization practices and monitor for regressions.',
    timestamp: now - 86400000,
    data: {
      current: 0.08,
      previous: 0.107,
      change: -25,
      trend: 'down'
    }
  });

  insights.push({
    id: `insight_${now}_3`,
    type: 'anomaly',
    metric: 'TTFB',
    severity: 'high',
    title: 'Unusual spike in Time to First Byte',
    description: 'TTFB showed unusual spikes between 2-4 AM, suggesting server performance issues.',
    impact: 'Users during these hours may experience significantly slower initial page responses.',
    recommendation: 'Investigate server logs, database performance, or CDN configuration during these hours.',
    timestamp: now - 43200000,
    data: {
      current: 1200,
      previous: 400,
      change: 200,
      trend: 'up'
    }
  });

  return insights;
}

function generateTrends(): PerformanceTrend[] {
  const now = Date.now();
  const trends: PerformanceTrend[] = [];

  // Generate sample trend data for different metrics
  const metrics = ['LCP', 'FID', 'CLS', 'TTFB'];
  
  metrics.forEach(metric => {
    const dataPoints = [];
    for (let i = 6; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      let baseValue = 2000; // Base value in ms
      
      // Different base values for different metrics
      switch (metric) {
        case 'LCP':
          baseValue = 2500;
          break;
        case 'FID':
          baseValue = 80;
          break;
        case 'CLS':
          baseValue = 0.1;
          break;
        case 'TTFB':
          baseValue = 400;
          break;
      }

      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.3;
      const value = baseValue * (1 + variation);
      
      dataPoints.push({
        timestamp,
        value: Math.round(value * 100) / 100,
        count: Math.floor(Math.random() * 100) + 50
      });
    }

    // Calculate trend direction
    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const change = (lastValue - firstValue) / firstValue;

    let direction: 'improving' | 'degrading' | 'stable' = 'stable';
    if (Math.abs(change) > 0.05) {
      // For CLS, lower is better; for others, lower is also generally better
      direction = change < 0 ? 'improving' : 'degrading';
    }

    trends.push({
      metric,
      timeframe: '7d',
      dataPoints,
      trend: {
        direction,
        magnitude: Math.abs(change * 100),
        confidence: 0.8 + Math.random() * 0.19 // 80-99% confidence
      }
    });
  });

  return trends;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'insights';
    const timeRange = searchParams.get('timeRange') || '7d';
    const metric = searchParams.get('metric');

    if (type === 'insights') {
      let insights = generateInsights();
      
      // Filter by metric if specified
      if (metric) {
        insights = insights.filter(insight => insight.metric === metric);
      }

      // Sort by severity and timestamp
      insights.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.timestamp - a.timestamp;
      });

      return NextResponse.json({
        insights,
        count: insights.length,
        timeRange,
        generatedAt: Date.now()
      });
    }

    if (type === 'trends') {
      let trends = generateTrends();

      // Filter by metric if specified
      if (metric) {
        trends = trends.filter(trend => trend.metric === metric);
      }

      // Calculate overall performance score
      const overallScore = trends.reduce((acc, trend) => {
        let metricScore = 100;
        
        // Penalize based on trend direction
        if (trend.trend.direction === 'degrading') {
          metricScore -= trend.trend.magnitude;
        } else if (trend.trend.direction === 'improving') {
          metricScore = Math.min(100, 100 + trend.trend.magnitude * 0.5);
        }

        return acc + metricScore;
      }, 0) / trends.length;

      return NextResponse.json({
        trends,
        overallScore: Math.round(overallScore),
        timeRange,
        generatedAt: Date.now()
      });
    }

    if (type === 'comparison') {
      // Generate comparison data between different time periods
      const currentPeriod = generateTrends();
      const previousPeriod = generateTrends().map(trend => ({
        ...trend,
        dataPoints: trend.dataPoints.map(dp => ({
          ...dp,
          timestamp: dp.timestamp - (7 * 24 * 60 * 60 * 1000),
          value: dp.value * (0.9 + Math.random() * 0.2) // Slight variation for comparison
        }))
      }));

      const comparison = currentPeriod.map((current, index) => {
        const previous = previousPeriod[index];
        const currentAvg = current.dataPoints.reduce((sum, dp) => sum + dp.value, 0) / current.dataPoints.length;
        const previousAvg = previous.dataPoints.reduce((sum, dp) => sum + dp.value, 0) / previous.dataPoints.length;
        const change = ((currentAvg - previousAvg) / previousAvg) * 100;

        return {
          metric: current.metric,
          current: {
            average: Math.round(currentAvg * 100) / 100,
            trend: current.trend
          },
          previous: {
            average: Math.round(previousAvg * 100) / 100,
            trend: previous.trend
          },
          change: Math.round(change * 100) / 100,
          improvement: change < 0 // Negative change is improvement for most metrics
        };
      });

      return NextResponse.json({
        comparison,
        timeRange,
        generatedAt: Date.now()
      });
    }

    if (type === 'recommendations') {
      // Generate actionable recommendations based on performance data
      const recommendations = [
        {
          id: 'rec_1',
          priority: 'high',
          category: 'loading',
          title: 'Optimize image loading strategy',
          description: 'Large images are contributing to slower LCP times',
          action: 'Implement next/image with proper sizing and lazy loading',
          estimatedImpact: 'Reduce LCP by 15-25%',
          effort: 'medium',
          resources: [
            'https://nextjs.org/docs/api-reference/next/image',
            'https://web.dev/optimize-lcp/'
          ]
        },
        {
          id: 'rec_2',
          priority: 'medium',
          category: 'caching',
          title: 'Implement service worker caching',
          description: 'Static assets could benefit from better caching strategies',
          action: 'Add service worker with cache-first strategy for static assets',
          estimatedImpact: 'Reduce repeat visit load times by 40%',
          effort: 'high',
          resources: [
            'https://web.dev/service-workers-cache-storage/',
            'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'
          ]
        },
        {
          id: 'rec_3',
          priority: 'low',
          category: 'monitoring',
          title: 'Set up performance budgets',
          description: 'Proactive monitoring can prevent performance regressions',
          action: 'Configure performance budgets in CI/CD pipeline',
          estimatedImpact: 'Prevent future performance regressions',
          effort: 'low',
          resources: [
            'https://web.dev/performance-budgets-101/',
            'https://github.com/GoogleChrome/lighthouse-ci'
          ]
        }
      ];

      return NextResponse.json({
        recommendations,
        count: recommendations.length,
        generatedAt: Date.now()
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use: insights, trends, comparison, or recommendations' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Analytics insights endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

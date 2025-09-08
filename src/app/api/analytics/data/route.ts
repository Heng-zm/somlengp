import { NextRequest, NextResponse } from 'next/server';

interface PerformanceDataPoint {
  metric: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
  sessionId: string;
}

interface AnalyticsPayload {
  event: string;
  properties?: Record<string, string | number | boolean>;
  performance?: Record<string, number>;
  user?: {
    connection?: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
  };
  timestamp: number;
  url: string;
  sessionId: string;
}

// In-memory storage for demo (in production, use a proper database)
let performanceData: PerformanceDataPoint[] = [];
let analyticsEvents: AnalyticsPayload[] = [];

// Clean up old data (older than 7 days)
function cleanupOldData() {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  performanceData = performanceData.filter(d => d.timestamp > sevenDaysAgo);
  analyticsEvents = analyticsEvents.filter(e => e.timestamp > sevenDaysAgo);
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsPayload = await request.json();
    
    // Validate required fields
    if (!body.event || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: event, timestamp' },
        { status: 400 }
      );
    }

    // Store the analytics event
    analyticsEvents.push({
      ...body,
      timestamp: Date.now() // Use server timestamp
    });

    // Extract performance metrics if present
    if (body.performance) {
      Object.entries(body.performance).forEach(([metric, value]) => {
        if (typeof value === 'number' && value > 0) {
          performanceData.push({
            metric,
            value,
            timestamp: body.timestamp,
            url: body.url || '',
            userAgent: body.user?.userAgent || '',
            connection: body.user?.connection,
            sessionId: body.sessionId || 'unknown'
          });
        }
      });
    }

    // Clean up old data periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanupOldData();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '86400000'); // Default 24h
    const metric = searchParams.get('metric');
    const format = searchParams.get('format') || 'summary';

    const cutoff = Date.now() - timeRange;
    let filteredData = performanceData.filter(d => d.timestamp > cutoff);

    if (metric) {
      filteredData = filteredData.filter(d => d.metric === metric);
    }

    if (format === 'raw') {
      return NextResponse.json({
        data: filteredData,
        count: filteredData.length,
        timeRange,
        generatedAt: Date.now()
      });
    }

    // Generate summary statistics
    const metrics = filteredData.reduce((acc, dataPoint) => {
      if (!acc[dataPoint.metric]) {
        acc[dataPoint.metric] = {
          values: [],
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity
        };
      }

      const metric = acc[dataPoint.metric];
      metric.values.push(dataPoint.value);
      metric.count++;
      metric.sum += dataPoint.value;
      metric.min = Math.min(metric.min, dataPoint.value);
      metric.max = Math.max(metric.max, dataPoint.value);

      return acc;
    }, {} as Record<string, { values: number[]; count: number; sum: number; min: number; max: number }>);

    // Calculate percentiles and averages
    const summary = Object.entries(metrics).map(([metricName, data]) => {
      const sortedValues = data.values.sort((a: number, b: number) => a - b);
      const len = sortedValues.length;

      return {
        metric: metricName,
        count: data.count,
        average: Math.round(data.sum / data.count * 100) / 100,
        median: len > 0 ? sortedValues[Math.floor(len / 2)] : 0,
        p75: len > 0 ? sortedValues[Math.floor(len * 0.75)] : 0,
        p95: len > 0 ? sortedValues[Math.floor(len * 0.95)] : 0,
        p99: len > 0 ? sortedValues[Math.floor(len * 0.99)] : 0,
        min: data.min === Infinity ? 0 : data.min,
        max: data.max === -Infinity ? 0 : data.max
      };
    });

    // Performance budget violations
    const budgets = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800
    };

    const violations = summary.filter(s => {
      const budget = budgets[s.metric as keyof typeof budgets];
      return budget && s.p95 > budget;
    });

    // Connection type distribution
    const connectionTypes = filteredData.reduce((acc, d) => {
      const conn = d.connection || 'unknown';
      acc[conn] = (acc[conn] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary,
      violations,
      connectionTypes,
      totalDataPoints: filteredData.length,
      timeRange,
      generatedAt: Date.now()
    });

  } catch (error) {
    console.error('Analytics GET endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

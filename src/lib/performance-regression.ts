'use client';

interface PerformanceBaseline {
  id: string;
  name: string;
  timestamp: number;
  metrics: {
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    bundleSize: number;
  };
  environment: {
    userAgent: string;
    connection: string;
    viewport: { width: number; height: number };
  };
  commit?: string;
  branch?: string;
  buildId?: string;
}

interface RegressionResult {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  changePercent: number;
  threshold: number;
  isRegression: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  impact: string;
}

interface RegressionReport {
  id: string;
  timestamp: number;
  baseline: PerformanceBaseline;
  current: PerformanceBaseline;
  results: RegressionResult[];
  overall: {
    score: number;
    hasRegressions: boolean;
    severityBreakdown: Record<string, number>;
    recommendation: string;
  };
  cicd?: {
    shouldBlock: boolean;
    blockingMetrics: string[];
    warningMetrics: string[];
  };
}

interface MetricThreshold {
  minor: number;     // % increase that triggers minor warning
  moderate: number;  // % increase that triggers moderate warning
  severe: number;    // % increase that triggers severe warning/block
  absolute?: number; // Absolute value threshold (optional)
}

interface RegressionThresholds {
  LCP?: MetricThreshold;
  FID?: MetricThreshold;
  CLS?: MetricThreshold;
  TTFB?: MetricThreshold;
  bundleSize?: MetricThreshold;
}

type MetricName = keyof PerformanceBaseline['metrics'];

interface ExtendedRegressionThresholds extends RegressionThresholds {
  [key: string]: MetricThreshold | undefined;
}

// Default regression thresholds (percentage increases)
const DEFAULT_THRESHOLDS: ExtendedRegressionThresholds = {
  LCP: { minor: 5, moderate: 10, severe: 20, absolute: 4000 }, // 4s absolute max
  FID: { minor: 10, moderate: 25, severe: 50, absolute: 300 }, // 300ms absolute max
  CLS: { minor: 10, moderate: 25, severe: 50, absolute: 0.25 }, // 0.25 absolute max
  TTFB: { minor: 15, moderate: 30, severe: 60, absolute: 1800 }, // 1.8s absolute max
  bundleSize: { minor: 5, moderate: 10, severe: 15 } // Bundle size increases
} as const;

class PerformanceRegressionTester {
  private baselines: PerformanceBaseline[] = [];
  private thresholds: ExtendedRegressionThresholds = DEFAULT_THRESHOLDS;

  constructor(customThresholds?: Partial<ExtendedRegressionThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
    this.loadBaselines();
  }

  // Load baselines from storage
  private loadBaselines() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('performance_baselines');
      if (stored) {
        this.baselines = JSON.parse(stored);
        // Clean up old baselines (older than 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.baselines = this.baselines.filter(b => b.timestamp > thirtyDaysAgo);
        this.saveBaselines();
      }
    } catch (error) {
      console.warn('Failed to load performance baselines:', error);
    }
  }

  // Save baselines to storage
  private saveBaselines() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('performance_baselines', JSON.stringify(this.baselines));
    } catch (error) {
      console.warn('Failed to save performance baselines:', error);
    }
  }

  // Create a new baseline
  createBaseline(
    name: string,
    metrics: PerformanceBaseline['metrics'],
    options?: {
      commit?: string;
      branch?: string;
      buildId?: string;
    }
  ): PerformanceBaseline {
    const baseline: PerformanceBaseline = {
      id: `baseline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      metrics,
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        connection: this.getConnectionType(),
        viewport: typeof window !== 'undefined' 
          ? { width: window.innerWidth, height: window.innerHeight }
          : { width: 1920, height: 1080 }
      },
      commit: options?.commit,
      branch: options?.branch || 'main',
      buildId: options?.buildId
    };

    this.baselines.push(baseline);
    this.saveBaselines();

    // Keep only the latest 20 baselines per branch
    this.pruneBaselines();

    return baseline;
  }

  // Get connection type
  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
      return conn?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Prune old baselines
  private pruneBaselines() {
    const baselinesByBranch = this.baselines.reduce((acc, baseline) => {
      const branch = baseline.branch || 'main';
      if (!acc[branch]) acc[branch] = [];
      acc[branch].push(baseline);
      return acc;
    }, {} as Record<string, PerformanceBaseline[]>);

    // Keep latest 20 baselines per branch
    this.baselines = [];
    Object.entries(baselinesByBranch).forEach(([, baselines]) => {
      const sorted = baselines.sort((a, b) => b.timestamp - a.timestamp);
      this.baselines.push(...sorted.slice(0, 20));
    });

    this.saveBaselines();
  }

  // Run regression test
  runRegressionTest(
    currentMetrics: PerformanceBaseline['metrics'],
    baselineName?: string,
    options?: {
      commit?: string;
      branch?: string;
      buildId?: string;
    }
  ): RegressionReport {
    // Find the appropriate baseline
    let baseline: PerformanceBaseline | undefined;
    
    if (baselineName) {
      baseline = this.baselines.find(b => b.name === baselineName);
    } else {
      // Find the most recent baseline for the same branch
      const branch = options?.branch || 'main';
      const branchBaselines = this.baselines
        .filter(b => b.branch === branch)
        .sort((a, b) => b.timestamp - a.timestamp);
      baseline = branchBaselines[0];
    }

    if (!baseline) {
      throw new Error('No baseline found for regression testing');
    }

    // Create current baseline for comparison
    const current: PerformanceBaseline = {
      id: `current_${Date.now()}`,
      name: 'Current',
      timestamp: Date.now(),
      metrics: currentMetrics,
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        connection: this.getConnectionType(),
        viewport: typeof window !== 'undefined'
          ? { width: window.innerWidth, height: window.innerHeight }
          : { width: 1920, height: 1080 }
      },
      commit: options?.commit,
      branch: options?.branch,
      buildId: options?.buildId
    };

    // Run comparisons
    const results: RegressionResult[] = [];
    
    Object.entries(currentMetrics).forEach(([metricKey, currentValue]) => {
      const metric = metricKey as MetricName;
      const baselineValue = baseline!.metrics[metric];
      if (typeof baselineValue === 'number' && typeof currentValue === 'number') {
        const change = currentValue - baselineValue;
        const changePercent = (change / baselineValue) * 100;
        const threshold = this.thresholds[metricKey];
        
        let severity: RegressionResult['severity'] = 'none';
        let isRegression = false;

        if (threshold) {
          // Check absolute thresholds first
          if (threshold.absolute && currentValue > threshold.absolute) {
            severity = 'severe';
            isRegression = true;
          }
          // Then check percentage thresholds (only for increases)
          else if (changePercent > 0) {
            if (changePercent >= threshold.severe) {
              severity = 'severe';
              isRegression = true;
            } else if (changePercent >= threshold.moderate) {
              severity = 'moderate';
              isRegression = true;
            } else if (changePercent >= threshold.minor) {
              severity = 'minor';
              isRegression = true;
            }
          }
        }

        results.push({
          metric: metricKey,
          baseline: baselineValue,
          current: currentValue,
          change,
          changePercent,
          threshold: threshold?.severe || 0,
          isRegression,
          severity,
          impact: this.getImpactDescription(metricKey, changePercent, severity)
        });
      }
    });

    // Calculate overall assessment
    const regressions = results.filter(r => r.isRegression);
    const severityBreakdown = results.reduce((acc, result) => {
      if (result.severity !== 'none') {
        acc[result.severity] = (acc[result.severity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const overallScore = this.calculateRegressionScore(results);
    const hasRegressions = regressions.length > 0;

    // CI/CD decisions
    const blockingMetrics = results
      .filter(r => r.severity === 'severe')
      .map(r => r.metric);
    
    const warningMetrics = results
      .filter(r => r.severity === 'moderate' || r.severity === 'minor')
      .map(r => r.metric);

    const report: RegressionReport = {
      id: `regression_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      baseline,
      current,
      results,
      overall: {
        score: overallScore,
        hasRegressions,
        severityBreakdown,
        recommendation: this.getOverallRecommendation(results)
      },
      cicd: {
        shouldBlock: blockingMetrics.length > 0,
        blockingMetrics,
        warningMetrics
      }
    };

    return report;
  }

  // Calculate regression score (0-100)
  private calculateRegressionScore(results: RegressionResult[]): number {
    let totalScore = 100;
    
    results.forEach(result => {
      if (result.isRegression) {
        switch (result.severity) {
          case 'severe':
            totalScore -= 30;
            break;
          case 'moderate':
            totalScore -= 15;
            break;
          case 'minor':
            totalScore -= 5;
            break;
        }
      }
    });

    return Math.max(0, totalScore);
  }

  // Get impact description for a metric change
  private getImpactDescription(metric: string, changePercent: number, severity: string): string {
    if (severity === 'none') return 'No significant impact';

    const impactDescriptions = {
      LCP: {
        minor: 'Slightly slower content loading',
        moderate: 'Noticeably slower content loading',
        severe: 'Significantly slower content loading, poor user experience'
      },
      FID: {
        minor: 'Slightly less responsive interactions',
        moderate: 'Noticeably less responsive interactions',
        severe: 'Significantly less responsive interactions, poor interactivity'
      },
      CLS: {
        minor: 'Minor layout instability',
        moderate: 'Noticeable layout shifts',
        severe: 'Significant layout instability, poor visual stability'
      },
      TTFB: {
        minor: 'Slightly slower server response',
        moderate: 'Noticeably slower server response',
        severe: 'Significantly slower server response'
      },
      bundleSize: {
        minor: 'Slightly larger bundle, minor impact on load time',
        moderate: 'Noticeably larger bundle, slower initial loads',
        severe: 'Significantly larger bundle, much slower initial loads'
      }
    };

    return impactDescriptions[metric as keyof typeof impactDescriptions]?.[severity as keyof typeof impactDescriptions.LCP] 
      || `${changePercent > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(changePercent).toFixed(1)}%`;
  }

  // Get overall recommendation
  private getOverallRecommendation(results: RegressionResult[]): string {
    const severe = results.filter(r => r.severity === 'severe');
    const moderate = results.filter(r => r.severity === 'moderate');
    const minor = results.filter(r => r.severity === 'minor');

    if (severe.length > 0) {
      return `❌ Deployment should be blocked. ${severe.length} severe regression(s) detected. Address performance issues before deploying.`;
    }
    
    if (moderate.length > 0) {
      return `⚠️ Proceed with caution. ${moderate.length} moderate regression(s) detected. Consider optimizing before deploying.`;
    }
    
    if (minor.length > 0) {
      return `💡 Minor regressions detected. Monitor these metrics and consider optimization in future iterations.`;
    }
    
    return '✅ No performance regressions detected. Safe to deploy.';
  }

  // Get all baselines
  getBaselines(): PerformanceBaseline[] {
    return [...this.baselines];
  }

  // Get baseline by name
  getBaseline(name: string): PerformanceBaseline | undefined {
    return this.baselines.find(b => b.name === name);
  }

  // Delete baseline
  deleteBaseline(id: string): boolean {
    const index = this.baselines.findIndex(b => b.id === id);
    if (index >= 0) {
      this.baselines.splice(index, 1);
      this.saveBaselines();
      return true;
    }
    return false;
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<ExtendedRegressionThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Export regression report
  exportReport(report: RegressionReport, format: 'json' | 'junit' = 'json'): string {
    if (format === 'junit') {
      return this.generateJUnitXML(report);
    }
    
    return JSON.stringify(report, null, 2);
  }

  // Generate JUnit XML for CI/CD integration
  private generateJUnitXML(report: RegressionReport): string {
    const testCases = report.results.map(result => {
      const testName = `Performance.${result.metric}`;
      const className = 'PerformanceRegressionTest';
      
      if (!result.isRegression) {
        return `    <testcase classname="${className}" name="${testName}" time="0"/>`;
      }

      const errorType = result.severity === 'severe' ? 'failure' : 'error';
      const message = `${result.metric} regression: ${result.changePercent.toFixed(2)}% increase (${result.current} vs ${result.baseline})`;
      
      return `    <testcase classname="${className}" name="${testName}" time="0">
      <${errorType} type="PerformanceRegression" message="${message}">
${result.impact}
Baseline: ${result.baseline}
Current: ${result.current}
Change: ${result.change} (${result.changePercent.toFixed(2)}%)
      </${errorType}>
    </testcase>`;
    }).join('\n');

    const totalTests = report.results.length;
    const failures = report.results.filter(r => r.severity === 'severe').length;
    const errors = report.results.filter(r => r.isRegression && r.severity !== 'severe').length;

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="PerformanceRegressionTest" tests="${totalTests}" failures="${failures}" errors="${errors}" time="0" timestamp="${new Date(report.timestamp).toISOString()}">
${testCases}
</testsuite>`;
  }
}

// Singleton instance
let regressionTesterInstance: PerformanceRegressionTester | null = null;

export function getPerformanceRegressionTester(customThresholds?: Partial<ExtendedRegressionThresholds>): PerformanceRegressionTester {
  if (!regressionTesterInstance) {
    regressionTesterInstance = new PerformanceRegressionTester(customThresholds);
  }
  return regressionTesterInstance;
}

// Utility functions for CI/CD integration
export function runPerformanceRegression(
  metrics: PerformanceBaseline['metrics'],
  options?: {
    baselineName?: string;
    commit?: string;
    branch?: string;
    buildId?: string;
    thresholds?: Partial<ExtendedRegressionThresholds>;
  }
): RegressionReport {
  const tester = getPerformanceRegressionTester(options?.thresholds);
  return tester.runRegressionTest(metrics, options?.baselineName, {
    commit: options?.commit,
    branch: options?.branch,
    buildId: options?.buildId
  });
}

export function createPerformanceBaseline(
  name: string,
  metrics: PerformanceBaseline['metrics'],
  options?: {
    commit?: string;
    branch?: string;
    buildId?: string;
  }
): PerformanceBaseline {
  const tester = getPerformanceRegressionTester();
  return tester.createBaseline(name, metrics, options);
}

// React hook for regression testing
export function usePerformanceRegression() {
  const tester = getPerformanceRegressionTester();

  return {
    createBaseline: (name: string, metrics: PerformanceBaseline['metrics'], options?: { commit?: string; branch?: string; buildId?: string }) =>
      tester.createBaseline(name, metrics, options),
    runTest: (metrics: PerformanceBaseline['metrics'], baselineName?: string, options?: { commit?: string; branch?: string; buildId?: string }) =>
      tester.runRegressionTest(metrics, baselineName, options),
    getBaselines: () => tester.getBaselines(),
    deleteBaseline: (id: string) => tester.deleteBaseline(id),
    updateThresholds: (thresholds: Partial<ExtendedRegressionThresholds>) => tester.updateThresholds(thresholds),
    exportReport: (report: RegressionReport, format: 'json' | 'junit' = 'json') => 
      tester.exportReport(report, format)
  };
}

export type {
  PerformanceBaseline,
  RegressionResult,
  RegressionReport,
  RegressionThresholds,
  ExtendedRegressionThresholds,
  MetricThreshold,
  MetricName
};

export { PerformanceRegressionTester, DEFAULT_THRESHOLDS };

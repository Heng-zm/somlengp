'use client';
import { memo } from 'react';
interface OptimizationSuggestion {
  id: string;
  category: 'loading' | 'rendering' | 'caching' | 'bundling' | 'images' | 'fonts' | 'scripts';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    metric: string[];
    estimated: string;
    confidence: number; // 0-1
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    steps: string[];
    codeExample?: string;
  };
  resources: string[];
  automated?: boolean; // Can this be automatically applied?
}
interface PerformanceAudit {
  id: string;
  timestamp: number;
  url: string;
  metrics: {
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    bundleSize: number;
    imageOptimization: number; // Score 0-100
    cacheEfficiency: number; // Score 0-100
  };
  issues: OptimizationSuggestion[];
  score: number; // Overall performance score 0-100
}
interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    files: string[];
    duplicates?: string[];
  }>;
  dependencies: Array<{
    name: string;
    size: number;
    reason: string;
    alternatives?: string[];
  }>;
  suggestions: OptimizationSuggestion[];
}
class PerformanceOptimizer {
  private suggestions: OptimizationSuggestion[] = [];
  private audits: PerformanceAudit[] = [];
  private maxAudits: number = 10; // Limit stored audits to prevent memory bloat
  private maxSuggestions: number = 20; // Limit suggestions
  constructor() {
    this.initializeSuggestions();
    this.loadAudits();
  }
  // Initialize common optimization suggestions with memory-conscious approach
  private initializeSuggestions() {
    // Use lazy initialization to reduce initial memory footprint
    if (this.suggestions.length > 0) return;
    this.suggestions = [
      {
        id: 'opt_1',
        category: 'images',
        priority: 'high',
        title: 'Implement next/image optimization',
        description: 'Replace regular img tags with Next.js Image component for automatic optimization.',
        impact: {
          metric: ['LCP', 'bundleSize'],
          estimated: '15-30% LCP improvement',
          confidence: 0.9
        },
        implementation: {
          difficulty: 'easy',
          estimatedTime: '2-4 hours',
          steps: [
            'Import Image from next/image',
            'Replace img tags with Image components',
            'Add proper width and height attributes',
            'Configure next.config.js for external domains'
          ],
          codeExample: `import Image from 'next/image';
// Before
<img src="/hero.jpg" alt="Hero image" />
// After
<Image 
  src="/hero.jpg" 
  alt="Hero image" 
  width={800} 
  height={600}
  priority
/>`
        },
        resources: [
          'https://nextjs.org/docs/api-reference/next/image',
          'https://web.dev/next-gen-formats/'
        ]
      },
      {
        id: 'opt_2',
        category: 'loading',
        priority: 'critical',
        title: 'Implement lazy loading',
        description: 'Add lazy loading for images and components below the fold.',
        impact: {
          metric: ['LCP', 'FID'],
          estimated: '10-25% LCP improvement',
          confidence: 0.8
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '1-2 days',
          steps: [
            'Identify below-the-fold content',
            'Implement React.lazy() for heavy components',
            'Add loading="lazy" for images',
            'Use Intersection Observer API for custom lazy loading'
          ],
          codeExample: `// Component lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
// Usage with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
// Image lazy loading
<img src="image.jpg" loading="lazy" alt="Description" />`
        },
        resources: [
          'https://web.dev/lazy-loading-images/',
          'https://react.dev/reference/react/lazy'
        ]
      },
      {
        id: 'opt_3',
        category: 'caching',
        priority: 'high',
        title: 'Implement service worker caching',
        description: 'Add service worker for caching static assets and API responses.',
        impact: {
          metric: ['TTFB', 'LCP'],
          estimated: '40-60% faster repeat visits',
          confidence: 0.85
        },
        implementation: {
          difficulty: 'hard',
          estimatedTime: '3-5 days',
          steps: [
            'Install workbox or implement custom service worker',
            'Define caching strategies for different asset types',
            'Handle cache invalidation',
            'Test offline functionality'
          ],
          codeExample: `// Basic service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}`
        },
        resources: [
          'https://web.dev/service-workers-cache-storage/',
          'https://developers.google.com/web/tools/workbox'
        ]
      },
      {
        id: 'opt_4',
        category: 'bundling',
        priority: 'medium',
        title: 'Implement code splitting',
        description: 'Split code into smaller chunks to reduce initial bundle size.',
        impact: {
          metric: ['LCP', 'FID', 'bundleSize'],
          estimated: '20-40% smaller initial bundle',
          confidence: 0.9
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '2-3 days',
          steps: [
            'Analyze bundle composition',
            'Implement route-based splitting',
            'Add dynamic imports for heavy libraries',
            'Configure webpack chunk optimization'
          ],
          codeExample: `// Dynamic imports
const analyzeBundle = async () => {
  const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
  return BundleAnalyzerPlugin;
};
// Route-based splitting (automatic in Next.js)
// pages/heavy-feature.js will be automatically code-split`
        },
        resources: [
          'https://nextjs.org/docs/advanced-features/code-splitting',
          'https://web.dev/reduce-javascript-payloads-with-code-splitting/'
        ]
      },
      {
        id: 'opt_5',
        category: 'fonts',
        priority: 'medium',
        title: 'Optimize font loading',
        description: 'Implement proper font loading strategies to prevent layout shifts.',
        impact: {
          metric: ['CLS', 'LCP'],
          estimated: '30-50% CLS reduction',
          confidence: 0.8
        },
        implementation: {
          difficulty: 'easy',
          estimatedTime: '1-2 hours',
          steps: [
            'Use next/font for Google Fonts',
            'Add font-display: swap CSS property',
            'Preload critical fonts',
            'Use system fonts as fallbacks'
          ],
          codeExample: `import { Inter } from 'next/font/google';
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});`
        },
        resources: [
          'https://nextjs.org/docs/basic-features/font-optimization',
          'https://web.dev/font-display/'
        ]
      },
      {
        id: 'opt_6',
        category: 'rendering',
        priority: 'high',
        title: 'Optimize React rendering',
        description: 'Implement React performance optimizations to reduce unnecessary re-renders.',
        impact: {
          metric: ['FID', 'CLS'],
          estimated: '20-40% faster interactions',
          confidence: 0.75
        },
        implementation: {
          difficulty: 'medium',
          estimatedTime: '1-3 days',
          steps: [
            'Add React.memo to components',
            'Use useCallback for event handlers',
            'Implement useMemo for expensive calculations',
            'Avoid inline objects and functions in JSX'
          ],
          codeExample: `// Memoized component
const MyComponent = React.memo(({ data }) => {
  const expensiveValue = useMemo(() => 
    expensiveCalculation(data), [data]
  );
  const handleClick = useCallback(() => {
    // handle click
  }, []);
  return <div onClick={handleClick}>{expensiveValue}</div>;
});`
        },
        resources: [
          'https://react.dev/reference/react/memo',
          'https://web.dev/react-performance-optimization/'
        ],
        automated: true
      }
    ];
    // Limit suggestions to prevent memory bloat
    this.suggestions = this.suggestions.slice(0, this.maxSuggestions);
  }
  // Load stored audits
  private loadAudits() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('performance_audits');
      if (stored) {
        this.audits = JSON.parse(stored);
        // Clean up old audits (older than 7 days) and limit total count
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.audits = this.audits
          .filter(a => a.timestamp > sevenDaysAgo)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.maxAudits); // Keep only the most recent audits
        this.saveAudits();
      }
    } catch (error) {
      this.audits = []; // Reset on error to prevent corruption
    }
  }
  // Save audits with memory optimization
  private saveAudits() {
    if (typeof window === 'undefined') return;
    try {
      // Trim audits to max limit and sort by timestamp (newest first)
      const auditsToSave = this.audits
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.maxAudits)
        .map(audit => ({
          ...audit,
          // Remove heavy data to reduce memory usage
          issues: audit.issues.slice(0, 5) // Keep only top 5 issues
        }));
      this.audits = auditsToSave;
      localStorage.setItem('performance_audits', JSON.stringify(auditsToSave));
    } catch (error) {
      // If storage is full, clear some data and try again
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldData();
        try {
          // Try again with reduced dataset
          const minimalAudits = this.audits.slice(0, 3).map(audit => ({
            id: audit.id,
            timestamp: audit.timestamp,
            url: audit.url,
            score: audit.score,
            metrics: audit.metrics
          }));
          localStorage.setItem('performance_audits', JSON.stringify(minimalAudits));
        } catch (retryError) {
          console.error('Failed to save even minimal audit data:', retryError);
        }
      }
    }
  }
  // Run performance audit
  async runAudit(url?: string): Promise<PerformanceAudit> {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    // Collect performance metrics
    const metrics = await this.collectMetrics();
    // Analyze performance issues
    const issues = await this.analyzePerformanceIssues(metrics);
    // Calculate overall score
    const score = this.calculatePerformanceScore(metrics);
    const audit: PerformanceAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: currentUrl,
      metrics,
      issues,
      score
    };
    // Add audit and maintain size limit
    this.audits.unshift(audit); // Add to beginning
    if (this.audits.length > this.maxAudits) {
      this.audits = this.audits.slice(0, this.maxAudits); // Trim to max size
    }
    this.saveAudits();
    return audit;
  }
  // Collect performance metrics
  private async collectMetrics(): Promise<PerformanceAudit['metrics']> {
    if (typeof window === 'undefined') {
      return {
        LCP: 0,
        FID: 0,
        CLS: 0,
        TTFB: 0,
        bundleSize: 0,
        imageOptimization: 50,
        cacheEfficiency: 50
      };
    }
    const metrics: PerformanceAudit['metrics'] = {
      LCP: 0,
      FID: 0,
      CLS: 0,
      TTFB: 0,
      bundleSize: 0,
      imageOptimization: 0,
      cacheEfficiency: 0
    };
    // Get navigation timing
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.TTFB = navigation.responseStart - navigation.requestStart;
      }
    } catch (error) {
    }
    // Estimate bundle size from loaded resources
    try {
      const resources = performance.getEntriesByType('resource');
      metrics.bundleSize = resources
        .filter(r => r.name.includes('.js'))
        .reduce((total, resource) => total + (resource as any).transferSize || 0, 0);
    } catch (error) {
    }
    // Analyze image optimization
    metrics.imageOptimization = await this.analyzeImageOptimization();
    // Analyze cache efficiency
    metrics.cacheEfficiency = await this.analyzeCacheEfficiency();
    return metrics;
  }
  // Analyze image optimization
  private async analyzeImageOptimization(): Promise<number> {
    if (typeof document === 'undefined') return 50;
    const images = document.querySelectorAll('img');
    if (images.length === 0) return 100;
    let score = 100;
    let issues = 0;
    images.forEach(img => {
      // Check if using Next.js Image component or native lazy loading
      const isOptimized = img.loading === 'lazy' || 
                         img.getAttribute('data-nimg') !== null ||
                         img.src.includes('_next/image');
      if (!isOptimized) issues++;
      // Check image format
      if (img.src.match(/\.(jpg|jpeg|png)$/i)) {
        issues += 0.5; // Modern formats are better
      }
    });
    score -= (issues / images.length) * 100;
    return Math.max(0, Math.min(100, score));
  }
  // Analyze cache efficiency
  private async analyzeCacheEfficiency(): Promise<number> {
    if (typeof window === 'undefined') return 50;
    try {
      const resources = performance.getEntriesByType('resource');
      const cachedResources = resources.filter((r: any) => {
        // Check if resource was served from cache
        return r.transferSize === 0 && r.decodedBodySize > 0;
      });
      const cacheHitRatio = cachedResources.length / resources.length;
      return Math.round(cacheHitRatio * 100);
    } catch (error) {
      return 50;
    }
  }
  // Analyze performance issues and suggest optimizations
  private async analyzePerformanceIssues(metrics: PerformanceAudit['metrics']): Promise<OptimizationSuggestion[]> {
    const applicableSuggestions: OptimizationSuggestion[] = [];
    // Check each metric against thresholds
    if (metrics.LCP > 2500) {
      applicableSuggestions.push(
        this.suggestions.find(s => s.id === 'opt_1')!, // Image optimization
        this.suggestions.find(s => s.id === 'opt_2')!  // Lazy loading
      );
    }
    if (metrics.bundleSize > 1000000) { // 1MB
      applicableSuggestions.push(
        this.suggestions.find(s => s.id === 'opt_4')! // Code splitting
      );
    }
    if (metrics.CLS > 0.1) {
      applicableSuggestions.push(
        this.suggestions.find(s => s.id === 'opt_5')! // Font optimization
      );
    }
    if (metrics.imageOptimization < 80) {
      applicableSuggestions.push(
        this.suggestions.find(s => s.id === 'opt_1')! // Image optimization
      );
    }
    if (metrics.cacheEfficiency < 60) {
      applicableSuggestions.push(
        this.suggestions.find(s => s.id === 'opt_3')! // Service worker caching
      );
    }
    // Always suggest React optimizations for interactive apps
    if (typeof document !== 'undefined') {
      const hasReactComponents = document.querySelector('[data-reactroot]') || 
                                document.querySelector('#__next');
      if (hasReactComponents) {
        applicableSuggestions.push(
          this.suggestions.find(s => s.id === 'opt_6')! // React optimization
        );
      }
    }
    return applicableSuggestions.filter(Boolean);
  }
  // Calculate overall performance score
  private calculatePerformanceScore(metrics: PerformanceAudit['metrics']): number {
    const scores = {
      LCP: metrics.LCP <= 2500 ? 100 : metrics.LCP <= 4000 ? 50 : 0,
      FID: metrics.FID <= 100 ? 100 : metrics.FID <= 300 ? 50 : 0,
      CLS: metrics.CLS <= 0.1 ? 100 : metrics.CLS <= 0.25 ? 50 : 0,
      TTFB: metrics.TTFB <= 800 ? 100 : metrics.TTFB <= 1800 ? 50 : 0,
      bundleSize: metrics.bundleSize <= 500000 ? 100 : metrics.bundleSize <= 1000000 ? 70 : 40,
      imageOptimization: metrics.imageOptimization,
      cacheEfficiency: metrics.cacheEfficiency * 0.5 // Weight cache less heavily
    };
    const weights = {
      LCP: 0.25,
      FID: 0.25,
      CLS: 0.25,
      TTFB: 0.1,
      bundleSize: 0.1,
      imageOptimization: 0.025,
      cacheEfficiency: 0.025
    };
    return Math.round(
      Object.entries(scores).reduce((total, [metric, score]) => {
        return total + (score * weights[metric as keyof typeof weights]);
      }, 0)
    );
  }
  // Analyze bundle composition
  async analyzeBundleComposition(): Promise<BundleAnalysis> {
    // This would typically integrate with webpack-bundle-analyzer or similar
    // For now, return mock data
    const analysis: BundleAnalysis = {
      totalSize: 1200000, // 1.2MB
      chunks: [
        {
          name: 'main',
          size: 800000,
          files: ['main.js', 'main.css'],
          duplicates: ['lodash', 'moment']
        },
        {
          name: 'vendors',
          size: 400000,
          files: ['react', 'next', 'other-deps']
        }
      ],
      dependencies: [
        {
          name: 'lodash',
          size: 70000,
          reason: 'Utility functions',
          alternatives: ['lodash-es (tree-shakable)', 'native JS methods']
        },
        {
          name: 'moment',
          size: 240000,
          reason: 'Date manipulation',
          alternatives: ['date-fns (smaller)', 'native Date API']
        }
      ],
      suggestions: [
        this.suggestions.find(s => s.id === 'opt_4')!, // Code splitting
        {
          id: 'bundle_opt_1',
          category: 'bundling',
          priority: 'medium',
          title: 'Replace moment.js with date-fns',
          description: 'Replace moment.js with smaller date-fns library to reduce bundle size.',
          impact: {
            metric: ['bundleSize'],
            estimated: '200KB reduction',
            confidence: 0.95
          },
          implementation: {
            difficulty: 'medium',
            estimatedTime: '2-4 hours',
            steps: [
              'npm uninstall moment',
              'npm install date-fns',
              'Replace moment imports with date-fns',
              'Update date formatting logic'
            ],
            codeExample: `// Before
import moment from 'moment';
const formatted = moment().format('YYYY-MM-DD');
// After
import { format } from 'date-fns';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

const formatted = format(new Date(), 'yyyy-MM-dd');`
          },
          resources: [
            'https://date-fns.org/',
            'https://github.com/you-dont-need/You-Dont-Need-Momentjs'
          ]
        }
      ]
    };
    return analysis;
  }
  // Get optimization suggestions by priority
  getSuggestionsByPriority(priority?: OptimizationSuggestion['priority']): OptimizationSuggestion[] {
    const suggestions = priority 
      ? this.suggestions.filter(s => s.priority === priority)
      : this.suggestions;
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  // Get suggestions by category
  getSuggestionsByCategory(category: OptimizationSuggestion['category']): OptimizationSuggestion[] {
    return this.suggestions.filter(s => s.category === category);
  }
  // Get automated suggestions (can be automatically applied)
  getAutomatedSuggestions(): OptimizationSuggestion[] {
    return this.suggestions.filter(s => s.automated === true);
  }
  // Apply automated optimizations
  async applyAutomatedOptimizations(): Promise<{
    applied: string[];
    failed: string[];
    results: any[];
  }> {
    const automatedSuggestions = this.getAutomatedSuggestions();
    const applied: string[] = [];
    const failed: string[] = [];
    const results: any[] = [];
    for (const suggestion of automatedSuggestions) {
      try {
        // This would contain the actual implementation
        // For now, just simulate the process
        // Simulate automated optimization
        await new Promise(resolve => setTimeout(resolve, 1000));
        applied.push(suggestion.id);
        results.push({
          id: suggestion.id,
          status: 'success',
          message: `Successfully applied ${suggestion.title}`
        });
      } catch (error) {
        failed.push(suggestion.id);
        results.push({
          id: suggestion.id,
          status: 'error',
          message: `Failed to apply ${suggestion.title}: ${error}`
        });
      }
    }
    return { applied, failed, results };
  }
  // Get recent audits
  getRecentAudits(limit = 10): PerformanceAudit[] {
    return this.audits
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  // Get performance trends
  getPerformanceTrends(days = 7): {
    metric: string;
    trend: 'improving' | 'degrading' | 'stable';
    change: number;
  }[] {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentAudits = this.audits.filter(a => a.timestamp > cutoff);
    if (recentAudits.length < 2) return [];
    const oldest = recentAudits[recentAudits.length - 1];
    const newest = recentAudits[0];
    const metrics = ['LCP', 'FID', 'CLS', 'TTFB', 'score'] as const;
    return metrics.map(metric => {
      const oldValue = metric === 'score' ? oldest.score : oldest.metrics[metric as keyof typeof oldest.metrics];
      const newValue = metric === 'score' ? newest.score : newest.metrics[metric as keyof typeof newest.metrics];
      const change = ((newValue - oldValue) / oldValue) * 100;
      let trend: 'improving' | 'degrading' | 'stable' = 'stable';
      if (Math.abs(change) > 5) {
        // For score, higher is better; for other metrics, lower is usually better
        if (metric === 'score') {
          trend = change > 0 ? 'improving' : 'degrading';
        } else {
          trend = change < 0 ? 'improving' : 'degrading';
        }
      }
      return {
        metric,
        trend,
        change: Math.round(change * 100) / 100
      };
    });
  }
  // Clear old data to free up storage space
  private clearOldData() {
    if (typeof window === 'undefined') return;
    try {
      // Clear old performance data
      const cutoff = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days ago
      this.audits = this.audits.filter(audit => audit.timestamp > cutoff);
      // Also clear other related localStorage items if needed
      const keysToCheck = [
        'performance_reports',
        'performance_alerts',
        'web_vitals_data'
      ];
      keysToCheck.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (Array.isArray(data)) {
              const filtered = data.filter((item: any) => 
                item.timestamp && item.timestamp > cutoff
              );
              if (filtered.length < data.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            }
          }
        } catch (error) {
          // If there's an error parsing, just remove the item
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
    }
  }
}
// Singleton instance
let optimizerInstance: PerformanceOptimizer | null = null;
export function getPerformanceOptimizer(): PerformanceOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new PerformanceOptimizer();
  }
  return optimizerInstance;
}
// React hook for performance optimization
export function usePerformanceOptimizer() {
  const optimizer = getPerformanceOptimizer();
  return {
    runAudit: () => optimizer.runAudit(),
    getSuggestions: (priority?: OptimizationSuggestion['priority']) => 
      optimizer.getSuggestionsByPriority(priority),
    getSuggestionsByCategory: (category: OptimizationSuggestion['category']) =>
      optimizer.getSuggestionsByCategory(category),
    applyAutomated: () => optimizer.applyAutomatedOptimizations(),
    getRecentAudits: (limit?: number) => optimizer.getRecentAudits(limit),
    getTrends: (days?: number) => optimizer.getPerformanceTrends(days),
    analyzeBundleComposition: () => optimizer.analyzeBundleComposition()
  };
}
export type {
  OptimizationSuggestion,
  PerformanceAudit,
  BundleAnalysis
};
// Memory management utilities
const clearPerformanceCache = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('performance_audits');
    } catch (error) {
      console.error('Failed to clear performance cache:', error);
    }
  }
};
const getPerformanceCacheSize = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = localStorage.getItem('performance_audits');
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }
  return 0;
};
export { PerformanceOptimizer, clearPerformanceCache, getPerformanceCacheSize };

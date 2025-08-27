'use client';

import { getAccessibilityTester, AccessibilityReport, AccessibilityIssue, AccessibilityTest } from './accessibility-tester';
import { getPerformanceMonitor } from './performance-monitor';

// Enhanced testing framework interfaces
export interface AccessibilityTestConfig {
  enableWCAG21: boolean;
  enableWCAG22: boolean;
  enableCustomRules: boolean;
  includeBestPractices: boolean;
  ignoreMinorIssues: boolean;
  customTags?: string[];
  excludeSelectors?: string[];
  includeSelectors?: string[];
  reportLevel: 'A' | 'AA' | 'AAA';
  outputFormat: 'detailed' | 'summary' | 'json';
  autofix: boolean;
}

export interface AccessibilityTestSuite {
  id: string;
  name: string;
  description: string;
  tests: AccessibilityTest[];
  config: Partial<AccessibilityTestConfig>;
}

export interface AutofixSuggestion {
  issueId: string;
  element: Element;
  fix: {
    type: 'attribute' | 'text' | 'structure' | 'css';
    action: 'add' | 'modify' | 'remove';
    target: string;
    value?: string;
    reason: string;
  };
  confidence: 'high' | 'medium' | 'low';
  impact: string;
}

export interface AccessibilityBenchmark {
  id: string;
  timestamp: number;
  url: string;
  score: number;
  issues: number;
  regressions: AccessibilityIssue[];
  improvements: AccessibilityIssue[];
  trend: 'improving' | 'degrading' | 'stable';
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA';
  guidelines: {
    [guideline: string]: {
      compliant: boolean;
      issues: AccessibilityIssue[];
      score: number;
    };
  };
  overallCompliance: number;
}

const DEFAULT_CONFIG: AccessibilityTestConfig = {
  enableWCAG21: true,
  enableWCAG22: true,
  enableCustomRules: true,
  includeBestPractices: true,
  ignoreMinorIssues: false,
  reportLevel: 'AA',
  outputFormat: 'detailed',
  autofix: false
};

// WCAG 2.1 Guidelines mapping
const WCAG_GUIDELINES = {
  '1.1.1': {
    name: 'Non-text Content',
    level: 'A',
    description: 'All non-text content must have text alternatives',
    testIds: ['alt-text']
  },
  '1.3.1': {
    name: 'Info and Relationships',
    level: 'A',
    description: 'Information and relationships conveyed through presentation must be available in text',
    testIds: ['heading-structure', 'form-labels']
  },
  '1.4.3': {
    name: 'Contrast (Minimum)',
    level: 'AA',
    description: 'Text must have a contrast ratio of at least 4.5:1',
    testIds: ['color-contrast']
  },
  '1.4.6': {
    name: 'Contrast (Enhanced)',
    level: 'AAA',
    description: 'Text must have a contrast ratio of at least 7:1',
    testIds: ['color-contrast']
  },
  '2.1.1': {
    name: 'Keyboard',
    level: 'A',
    description: 'All functionality must be available from a keyboard',
    testIds: ['keyboard-accessibility']
  },
  '2.4.1': {
    name: 'Bypass Blocks',
    level: 'A',
    description: 'A mechanism is available to bypass blocks of content',
    testIds: ['skip-navigation']
  },
  '2.4.6': {
    name: 'Headings and Labels',
    level: 'AA',
    description: 'Headings and labels describe topic or purpose',
    testIds: ['heading-structure', 'form-labels']
  },
  '2.4.7': {
    name: 'Focus Visible',
    level: 'AA',
    description: 'Any keyboard operable interface has a mode where focus indicator is visible',
    testIds: ['focus-management']
  },
  '4.1.2': {
    name: 'Name, Role, Value',
    level: 'A',
    description: 'For all UI components, name and role can be programmatically determined',
    testIds: ['aria-labels', 'aria-roles']
  }
};

// Advanced accessibility tests
const ADVANCED_TESTS: AccessibilityTest[] = [
  {
    id: 'skip-navigation',
    name: 'Skip Navigation',
    description: 'Pages should provide skip navigation links',
    category: 'structure',
    severity: 'warning',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      
      // Check for skip links
      const skipLinks = rootElement.querySelectorAll('a[href^="#"], a[href^="#main"], a[href^="#content"]');
      const hasSkipLink = Array.from(skipLinks).some(link => 
        (link as HTMLElement).innerText?.toLowerCase().includes('skip') ||
        link.getAttribute('href') === '#main' ||
        link.getAttribute('href') === '#content'
      );
      
      if (!hasSkipLink && rootElement.querySelectorAll('nav, header, main').length > 1) {
        issues.push({
          id: `skip-nav-${Math.random().toString(36).substr(2, 9)}`,
          testId: 'skip-navigation',
          category: 'structure',
          severity: 'warning',
          message: 'Consider adding skip navigation links for keyboard users',
          element: rootElement,
          selector: 'body',
          suggestion: 'Add a "Skip to main content" link at the beginning of the page',
          impact: 'moderate',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html'
        });
      }
      
      return issues;
    }
  },
  
  {
    id: 'landmark-roles',
    name: 'Landmark Roles',
    description: 'Page should have appropriate landmark roles',
    category: 'structure',
    severity: 'warning',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      
      const hasMain = rootElement.querySelector('main, [role="main"]');
      const hasNav = rootElement.querySelector('nav, [role="navigation"]');
      const hasHeader = rootElement.querySelector('header, [role="banner"]');
      
      if (!hasMain) {
        issues.push({
          id: `landmark-main-${Math.random().toString(36).substr(2, 9)}`,
          testId: 'landmark-roles',
          category: 'structure',
          severity: 'warning',
          message: 'Page should have a main landmark',
          element: rootElement,
          selector: 'body',
          suggestion: 'Add a <main> element or role="main" to identify the main content area',
          impact: 'moderate',
          helpUrl: 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/'
        });
      }
      
      return issues;
    }
  },
  
  {
    id: 'language-attributes',
    name: 'Language Attributes',
    description: 'Page and content changes in language should be identified',
    category: 'content',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      
      // Check html lang attribute
      const htmlElement = document.documentElement;
      const langAttribute = htmlElement.getAttribute('lang');
      
      if (!langAttribute) {
        issues.push({
          id: `lang-missing-${Math.random().toString(36).substr(2, 9)}`,
          testId: 'language-attributes',
          category: 'content',
          severity: 'error',
          message: 'Page is missing language attribute',
          element: htmlElement,
          selector: 'html',
          suggestion: 'Add lang attribute to <html> element (e.g., lang="en")',
          impact: 'serious',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
        });
      } else if (langAttribute.length < 2) {
        issues.push({
          id: `lang-invalid-${Math.random().toString(36).substr(2, 9)}`,
          testId: 'language-attributes',
          category: 'content',
          severity: 'error',
          message: 'Invalid language attribute value',
          element: htmlElement,
          selector: 'html',
          suggestion: 'Use a valid language code (e.g., "en", "en-US", "fr")',
          impact: 'serious',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
        });
      }
      
      return issues;
    }
  },
  
  {
    id: 'motion-preferences',
    name: 'Motion Preferences',
    description: 'Respect user motion preferences',
    category: 'content',
    severity: 'warning',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      
      // Check for animations without prefers-reduced-motion support
      const animatedElements = rootElement.querySelectorAll('[style*="animation"], [style*="transition"]');
      
      animatedElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const hasAnimation = style.animationName !== 'none' || style.transitionDuration !== '0s';
        
        if (hasAnimation) {
          // This is a simplified check - in reality, you'd check CSS rules
          issues.push({
            id: `motion-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'motion-preferences',
            category: 'content',
            severity: 'notice',
            message: 'Consider respecting prefers-reduced-motion for animations',
            element,
            selector: getElementSelector(element),
            suggestion: 'Use @media (prefers-reduced-motion: reduce) to disable animations for users who prefer reduced motion',
            impact: 'minor',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html'
          });
        }
      });
      
      return issues;
    }
  }
];

function getElementSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {
      selector += '.' + classes.slice(0, 2).join('.');
    }
  }
  
  return selector;
}

export class AccessibilityTestingFramework {
  private config: AccessibilityTestConfig;
  private tester = getAccessibilityTester();
  private performanceMonitor = getPerformanceMonitor();
  private benchmarks: AccessibilityBenchmark[] = [];
  private testSuites: Map<string, AccessibilityTestSuite> = new Map();

  constructor(config: Partial<AccessibilityTestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeFramework();
  }

  private initializeFramework() {
    // Add advanced tests to the tester
    ADVANCED_TESTS.forEach(test => {
      this.tester.addCustomTest(test);
    });

    // Initialize default test suites
    this.createDefaultTestSuites();
  }

  private createDefaultTestSuites() {
    // WCAG 2.1 AA Compliance Suite
    this.testSuites.set('wcag-2.1-aa', {
      id: 'wcag-2.1-aa',
      name: 'WCAG 2.1 AA Compliance',
      description: 'Tests for WCAG 2.1 Level AA compliance',
      tests: this.tester.getAvailableTests().filter(test => 
        ['aria-labels', 'aria-roles', 'color-contrast', 'keyboard-accessibility', 'alt-text', 'form-labels', 'heading-structure', 'focus-management'].includes(test.id)
      ),
      config: { reportLevel: 'AA' }
    });

    // Performance & Accessibility Suite
    this.testSuites.set('performance-accessibility', {
      id: 'performance-accessibility',
      name: 'Performance & Accessibility',
      description: 'Combined performance and accessibility testing',
      tests: this.tester.getAvailableTests(),
      config: { includeBestPractices: true }
    });
  }

  // Run comprehensive accessibility test
  async runComprehensiveTest(rootElement?: Element): Promise<{
    report: AccessibilityReport;
    wcagCompliance: WCAGCompliance;
    autofixSuggestions: AutofixSuggestion[];
    performanceImpact: number;
  }> {
    const startTime = performance.now();
    
    // Run all accessibility tests
    const report = await this.tester.runAllTests(rootElement);
    
    // Analyze WCAG compliance
    const wcagCompliance = this.analyzeWCAGCompliance(report);
    
    // Generate autofix suggestions
    const autofixSuggestions = this.generateAutofixSuggestions(report.issues);
    
    // Calculate performance impact
    const endTime = performance.now();
    const performanceImpact = endTime - startTime;
    
    // Track metrics
    this.performanceMonitor?.trackCustomMetric('accessibility_test_duration', performanceImpact);
    this.performanceMonitor?.trackCustomMetric('accessibility_issues_found', report.summary.total);
    
    return {
      report,
      wcagCompliance,
      autofixSuggestions,
      performanceImpact
    };
  }

  // Run specific test suite
  async runTestSuite(suiteId: string, rootElement?: Element): Promise<AccessibilityReport> {
    const suite = this.testSuites.get(suiteId);
    if (!suite) {
      throw new Error(`Test suite "${suiteId}" not found`);
    }

    const issues: AccessibilityIssue[] = [];
    const root = rootElement || document.body;

    for (const test of suite.tests) {
      try {
        const testIssues = await this.tester.runTest(test.id, root);
        issues.push(...testIssues);
      } catch (error) {
        console.error(`Test ${test.id} failed:`, error);
      }
    }

    return this.generateReport(issues, root);
  }

  // Analyze WCAG compliance
  private analyzeWCAGCompliance(report: AccessibilityReport): WCAGCompliance {
    const guidelines: WCAGCompliance['guidelines'] = {};
    let compliantCount = 0;
    let totalCount = 0;

    Object.entries(WCAG_GUIDELINES).forEach(([guidelineId, guideline]) => {
      const relatedIssues = report.issues.filter(issue => 
        guideline.testIds.includes(issue.testId)
      );

      const isCompliant = relatedIssues.length === 0;
      const score = Math.max(0, 100 - (relatedIssues.length * 10));

      guidelines[guidelineId] = {
        compliant: isCompliant,
        issues: relatedIssues,
        score
      };

      if (guideline.level === this.config.reportLevel || guideline.level === 'A') {
        totalCount++;
        if (isCompliant) compliantCount++;
      }
    });

    return {
      level: this.config.reportLevel,
      guidelines,
      overallCompliance: totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0
    };
  }

  // Generate autofix suggestions
  private generateAutofixSuggestions(issues: AccessibilityIssue[]): AutofixSuggestion[] {
    const suggestions: AutofixSuggestion[] = [];

    issues.forEach(issue => {
      const suggestion = this.createAutofixSuggestion(issue);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private createAutofixSuggestion(issue: AccessibilityIssue): AutofixSuggestion | null {
    if (!issue.element) return null;

    switch (issue.testId) {
      case 'alt-text':
        return {
          issueId: issue.id,
          element: issue.element,
          fix: {
            type: 'attribute',
            action: 'add',
            target: 'alt',
            value: 'Descriptive alternative text',
            reason: 'Images need alt text for screen readers'
          },
          confidence: 'high',
          impact: 'Improves accessibility for visually impaired users'
        };

      case 'form-labels':
        return {
          issueId: issue.id,
          element: issue.element,
          fix: {
            type: 'attribute',
            action: 'add',
            target: 'aria-label',
            value: 'Descriptive label',
            reason: 'Form controls need labels for accessibility'
          },
          confidence: 'medium',
          impact: 'Helps users understand form control purpose'
        };

      case 'focus-management':
        return {
          issueId: issue.id,
          element: issue.element,
          fix: {
            type: 'css',
            action: 'add',
            target: 'focus-visible',
            value: 'outline: 2px solid #0066cc;',
            reason: 'Keyboard users need visible focus indicators'
          },
          confidence: 'high',
          impact: 'Improves keyboard navigation experience'
        };

      case 'language-attributes':
        return {
          issueId: issue.id,
          element: issue.element,
          fix: {
            type: 'attribute',
            action: 'add',
            target: 'lang',
            value: 'en',
            reason: 'Screen readers need language information'
          },
          confidence: 'high',
          impact: 'Improves pronunciation and navigation for screen readers'
        };

      default:
        return null;
    }
  }

  // Apply autofix suggestions
  async applyAutofixes(suggestions: AutofixSuggestion[]): Promise<{
    applied: number;
    failed: number;
    results: Array<{ suggestionId: string; success: boolean; error?: string }>;
  }> {
    if (!this.config.autofix) {
      throw new Error('Autofix is not enabled');
    }

    const results = [];
    let applied = 0;
    let failed = 0;

    for (const suggestion of suggestions) {
      try {
        if (suggestion.confidence === 'high') {
          this.applyFix(suggestion);
          applied++;
          results.push({ suggestionId: suggestion.issueId, success: true });
        }
      } catch (error) {
        failed++;
        results.push({ 
          suggestionId: suggestion.issueId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { applied, failed, results };
  }

  private applyFix(suggestion: AutofixSuggestion) {
    const { element, fix } = suggestion;

    switch (fix.type) {
      case 'attribute':
        if (fix.action === 'add' && fix.value) {
          element.setAttribute(fix.target, fix.value);
        } else if (fix.action === 'remove') {
          element.removeAttribute(fix.target);
        }
        break;

      case 'text':
        if (fix.action === 'add' && fix.value) {
          element.textContent = fix.value;
        }
        break;

      case 'css':
        if (fix.action === 'add' && fix.value) {
          (element as HTMLElement).style.cssText += fix.value;
        }
        break;
    }
  }

  // Create accessibility benchmark
  createBenchmark(report: AccessibilityReport): AccessibilityBenchmark {
    const previousBenchmark = this.benchmarks[this.benchmarks.length - 1];
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    let regressions: AccessibilityIssue[] = [];
    let improvements: AccessibilityIssue[] = [];

    if (previousBenchmark) {
      if (report.score > previousBenchmark.score) {
        trend = 'improving';
      } else if (report.score < previousBenchmark.score) {
        trend = 'degrading';
      }

      // Simplified regression/improvement detection
      if (report.summary.total > previousBenchmark.issues) {
        regressions = report.issues.slice(0, report.summary.total - previousBenchmark.issues);
      } else if (report.summary.total < previousBenchmark.issues) {
        improvements = []; // Would need previous issues to compare
      }
    }

    const benchmark: AccessibilityBenchmark = {
      id: `benchmark_${Date.now()}`,
      timestamp: Date.now(),
      url: report.url,
      score: report.score,
      issues: report.summary.total,
      regressions,
      improvements,
      trend
    };

    this.benchmarks.push(benchmark);

    // Keep only last 50 benchmarks
    if (this.benchmarks.length > 50) {
      this.benchmarks = this.benchmarks.slice(-50);
    }

    return benchmark;
  }

  // Generate detailed report
  private generateReport(issues: AccessibilityIssue[], rootElement: Element): AccessibilityReport {
    const totalElements = rootElement.querySelectorAll('*').length;
    const testedElements = new Set(issues.map(issue => issue.element)).size;
    
    const summary = {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      notices: issues.filter(i => i.severity === 'notice').length
    };
    
    // Enhanced scoring algorithm
    let score = 100;
    score -= summary.errors * 15; // Increased penalty for errors
    score -= summary.warnings * 5;
    score -= summary.notices * 1;
    
    // Bonus for good practices
    const hasGoodStructure = rootElement.querySelector('main, [role="main"]') !== null;
    const hasSkipLinks = rootElement.querySelector('a[href^="#"]') !== null;
    if (hasGoodStructure) score += 5;
    if (hasSkipLinks) score += 5;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: window.location.href,
      issues,
      score,
      summary,
      coverage: {
        totalElements,
        testedElements,
        percentage: totalElements > 0 ? Math.round((testedElements / totalElements) * 100) : 0
      }
    };
  }

  // Integration with Jest
  createJestMatchers() {
    return {
      toBeAccessible: async (received: Element) => {
        const report = await this.tester.runAllTests(received);
        const hasErrors = report.summary.errors > 0;
        
        return {
          pass: !hasErrors,
          message: () => hasErrors 
            ? `Expected element to be accessible, but found ${report.summary.errors} error(s): ${report.issues.filter(i => i.severity === 'error').map(i => i.message).join(', ')}`
            : 'Expected element not to be accessible'
        };
      },

      toHaveNoA11yViolations: async (received: Element) => {
        const report = await this.tester.runAllTests(received);
        const hasViolations = report.summary.total > 0;
        
        return {
          pass: !hasViolations,
          message: () => hasViolations 
            ? `Expected no accessibility violations, but found ${report.summary.total}: ${report.issues.map(i => i.message).join(', ')}`
            : 'Expected accessibility violations'
        };
      },

      toMeetWCAGLevel: async (received: Element, level: 'A' | 'AA' | 'AAA') => {
        const config = { ...this.config, reportLevel: level };
        const framework = new AccessibilityTestingFramework(config);
        const { wcagCompliance } = await framework.runComprehensiveTest(received);
        
        return {
          pass: wcagCompliance.overallCompliance >= 95, // Allow some tolerance
          message: () => `Expected ${wcagCompliance.overallCompliance}% WCAG ${level} compliance to be at least 95%`
        };
      }
    };
  }

  // Get accessibility metrics for monitoring
  getAccessibilityMetrics(): {
    totalIssues: number;
    criticalIssues: number;
    averageScore: number;
    complianceRate: number;
    trend: 'improving' | 'degrading' | 'stable';
  } {
    if (this.benchmarks.length === 0) {
      return {
        totalIssues: 0,
        criticalIssues: 0,
        averageScore: 100,
        complianceRate: 100,
        trend: 'stable'
      };
    }

    const recent = this.benchmarks.slice(-10); // Last 10 benchmarks
    const totalIssues = recent.reduce((sum, b) => sum + b.issues, 0);
    const criticalIssues = recent.reduce((sum, b) => sum + b.regressions.length, 0);
    const averageScore = recent.reduce((sum, b) => sum + b.score, 0) / recent.length;
    const complianceRate = recent.filter(b => b.score >= 85).length / recent.length * 100;
    
    const latestTrend = this.benchmarks[this.benchmarks.length - 1]?.trend || 'stable';

    return {
      totalIssues,
      criticalIssues,
      averageScore: Math.round(averageScore),
      complianceRate: Math.round(complianceRate),
      trend: latestTrend
    };
  }

  // Export configuration
  exportConfig(): AccessibilityTestConfig {
    return { ...this.config };
  }

  // Import configuration
  importConfig(config: Partial<AccessibilityTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get available test suites
  getTestSuites(): AccessibilityTestSuite[] {
    return Array.from(this.testSuites.values());
  }

  // Add custom test suite
  addTestSuite(suite: AccessibilityTestSuite): void {
    this.testSuites.set(suite.id, suite);
  }
}

// Singleton instance
let accessibilityFramework: AccessibilityTestingFramework | null = null;

export function getAccessibilityFramework(config?: Partial<AccessibilityTestConfig>): AccessibilityTestingFramework {
  if (!accessibilityFramework) {
    accessibilityFramework = new AccessibilityTestingFramework(config);
  }
  return accessibilityFramework;
}

// Jest integration helper
export function setupAccessibilityMatchers() {
  if (typeof expect !== 'undefined') {
    const framework = getAccessibilityFramework();
    expect.extend(framework.createJestMatchers());
  }
}

// React hook for accessibility testing
export function useAccessibilityTesting(config?: Partial<AccessibilityTestConfig>) {
  const framework = getAccessibilityFramework(config);
  
  return {
    runComprehensiveTest: (rootElement?: Element) => framework.runComprehensiveTest(rootElement),
    runTestSuite: (suiteId: string, rootElement?: Element) => framework.runTestSuite(suiteId, rootElement),
    createBenchmark: (report: AccessibilityReport) => framework.createBenchmark(report),
    applyAutofixes: (suggestions: AutofixSuggestion[]) => framework.applyAutofixes(suggestions),
    getMetrics: () => framework.getAccessibilityMetrics(),
    getTestSuites: () => framework.getTestSuites()
  };
}

// Export types and utilities
export { WCAG_GUIDELINES, ADVANCED_TESTS };

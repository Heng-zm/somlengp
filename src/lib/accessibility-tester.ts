'use client';

// Automated Accessibility Testing Utilities
interface AccessibilityTest {
  id: string;
  name: string;
  description: string;
  category: 'aria' | 'color' | 'keyboard' | 'structure' | 'content' | 'focus';
  severity: 'error' | 'warning' | 'notice';
  test: (element?: Element) => AccessibilityIssue[];
}

interface AccessibilityIssue {
  id: string;
  testId: string;
  category: string;
  severity: 'error' | 'warning' | 'notice';
  message: string;
  element?: Element;
  selector?: string;
  suggestion: string;
  helpUrl?: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface AccessibilityReport {
  id: string;
  timestamp: number;
  url: string;
  issues: AccessibilityIssue[];
  score: number;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    notices: number;
  };
  coverage: {
    totalElements: number;
    testedElements: number;
    percentage: number;
  };
}

interface ColorContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  aa: boolean;
  aaa: boolean;
  level: 'AAA' | 'AA' | 'Fail';
}

// Utility functions
function getElementSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {
      selector += '.' + classes.slice(0, 2).join('.');
    }
  }
  
  // Add position if there are siblings
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element);
      selector += `:nth-of-type(${index + 1})`;
    }
  }
  
  return selector;
}

function getRgbValues(color: string): [number, number, number] | null {
  // Handle different color formats
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
  }
  
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return [parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2])];
    }
  }
  
  // Handle named colors (simplified)
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    transparent: [255, 255, 255], // Default to white for transparent
  };
  
  return namedColors[color.toLowerCase()] || null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = getRgbValues(color1);
  const rgb2 = getRgbValues(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

function isInteractiveElement(element: Element): boolean {
  const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
  const tagName = element.tagName.toLowerCase();
  
  return (
    interactiveTags.includes(tagName) ||
    element.hasAttribute('onclick') ||
    element.hasAttribute('onkeydown') ||
    element.hasAttribute('tabindex') ||
    element.getAttribute('role') === 'button' ||
    element.getAttribute('role') === 'link'
  );
}

function isFocusable(element: Element): boolean {
  if (element.hasAttribute('disabled')) return false;
  if ((element as HTMLElement).hidden) return false;
  
  const tabIndex = parseInt(element.getAttribute('tabindex') || '0');
  if (tabIndex < 0) return false;
  
  const focusableTags = ['input', 'button', 'select', 'textarea', 'a'];
  const tagName = element.tagName.toLowerCase();
  
  return (
    focusableTags.includes(tagName) ||
    tabIndex >= 0 ||
    element.hasAttribute('contenteditable')
  );
}

// Accessibility Tests
const accessibilityTests: AccessibilityTest[] = [
  // ARIA Tests
  {
    id: 'aria-labels',
    name: 'ARIA Labels',
    description: 'Elements with ARIA attributes must have proper labels',
    category: 'aria',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const elementsWithAria = rootElement.querySelectorAll('[aria-*]');
      
      elementsWithAria.forEach(element => {
        // Check for aria-labelledby references
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
          const labelIds = labelledBy.split(/\s+/);
          const missingLabels = labelIds.filter(id => !document.getElementById(id));
          
          if (missingLabels.length > 0) {
            issues.push({
              id: `aria-labels-${Math.random().toString(36).substr(2, 9)}`,
              testId: 'aria-labels',
              category: 'aria',
              severity: 'error',
              message: `aria-labelledby references non-existent elements: ${missingLabels.join(', ')}`,
              element,
              selector: getElementSelector(element),
              suggestion: 'Ensure all IDs referenced in aria-labelledby exist in the document',
              impact: 'critical',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
            });
          }
        }
        
        // Check for aria-describedby references
        const describedBy = element.getAttribute('aria-describedby');
        if (describedBy) {
          const descIds = describedBy.split(/\s+/);
          const missingDescs = descIds.filter(id => !document.getElementById(id));
          
          if (missingDescs.length > 0) {
            issues.push({
              id: `aria-desc-${Math.random().toString(36).substr(2, 9)}`,
              testId: 'aria-labels',
              category: 'aria',
              severity: 'warning',
              message: `aria-describedby references non-existent elements: ${missingDescs.join(', ')}`,
              element,
              selector: getElementSelector(element),
              suggestion: 'Ensure all IDs referenced in aria-describedby exist in the document',
              impact: 'moderate',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
            });
          }
        }
      });
      
      return issues;
    }
  },
  
  {
    id: 'aria-roles',
    name: 'ARIA Roles',
    description: 'Elements with ARIA roles must be valid',
    category: 'aria',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ];
      
      const elementsWithRole = rootElement.querySelectorAll('[role]');
      
      elementsWithRole.forEach(element => {
        const role = element.getAttribute('role')?.toLowerCase();
        if (role && !validRoles.includes(role)) {
          issues.push({
            id: `invalid-role-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'aria-roles',
            category: 'aria',
            severity: 'error',
            message: `Invalid ARIA role: "${role}"`,
            element,
            selector: getElementSelector(element),
            suggestion: `Use a valid ARIA role. Valid roles include: ${validRoles.slice(0, 10).join(', ')}, etc.`,
            impact: 'serious',
            helpUrl: 'https://www.w3.org/TR/wai-aria-1.1/#role_definitions'
          });
        }
      });
      
      return issues;
    }
  },
  
  // Color Contrast Tests
  {
    id: 'color-contrast',
    name: 'Color Contrast',
    description: 'Text must have sufficient color contrast against its background',
    category: 'color',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const textElements = rootElement.querySelectorAll('*');
      
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        const textContent = (element as HTMLElement).innerText?.trim();
        
        if (!textContent || textContent.length === 0) return;
        
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        // Skip if transparent or no background
        if (!color || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          return;
        }
        
        const contrastRatio = getContrastRatio(color, backgroundColor);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        
        const minRatio = isLargeText ? 3 : 4.5;
        const aaRatio = isLargeText ? 4.5 : 7;
        
        if (contrastRatio < minRatio) {
          issues.push({
            id: `contrast-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'color-contrast',
            category: 'color',
            severity: 'error',
            message: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)}:1 (required: ${minRatio}:1)`,
            element,
            selector: getElementSelector(element),
            suggestion: `Increase contrast between text and background. Current: ${contrastRatio.toFixed(2)}:1, Required: ${minRatio}:1`,
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
          });
        } else if (contrastRatio < aaRatio) {
          issues.push({
            id: `contrast-aa-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'color-contrast',
            category: 'color',
            severity: 'warning',
            message: `Color contrast could be improved for AAA compliance: ${contrastRatio.toFixed(2)}:1 (AAA requires: ${aaRatio}:1)`,
            element,
            selector: getElementSelector(element),
            suggestion: `Consider increasing contrast for better accessibility. Current: ${contrastRatio.toFixed(2)}:1, AAA: ${aaRatio}:1`,
            impact: 'moderate',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html'
          });
        }
      });
      
      return issues;
    }
  },
  
  // Keyboard Navigation Tests
  {
    id: 'keyboard-accessibility',
    name: 'Keyboard Accessibility',
    description: 'Interactive elements must be keyboard accessible',
    category: 'keyboard',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const interactiveElements = rootElement.querySelectorAll('*');
      
      interactiveElements.forEach(element => {
        if (isInteractiveElement(element) && !isFocusable(element)) {
          issues.push({
            id: `keyboard-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'keyboard-accessibility',
            category: 'keyboard',
            severity: 'error',
            message: 'Interactive element is not keyboard accessible',
            element,
            selector: getElementSelector(element),
            suggestion: 'Add tabindex="0" or ensure the element is naturally focusable',
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
          });
        }
        
        // Check for missing keyboard event handlers on clickable elements
        if (element.hasAttribute('onclick') && element.tagName.toLowerCase() !== 'button' && element.tagName.toLowerCase() !== 'a') {
          const hasKeyboardHandler = element.hasAttribute('onkeydown') || element.hasAttribute('onkeyup') || element.hasAttribute('onkeypress');
          
          if (!hasKeyboardHandler) {
            issues.push({
              id: `keyboard-handler-${Math.random().toString(36).substr(2, 9)}`,
              testId: 'keyboard-accessibility',
              category: 'keyboard',
              severity: 'warning',
              message: 'Clickable element missing keyboard event handlers',
              element,
              selector: getElementSelector(element),
              suggestion: 'Add onKeyDown handler to support keyboard interaction',
              impact: 'moderate',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
            });
          }
        }
      });
      
      return issues;
    }
  },
  
  // Content Tests
  {
    id: 'alt-text',
    name: 'Alt Text',
    description: 'Images must have appropriate alternative text',
    category: 'content',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const images = rootElement.querySelectorAll('img');
      
      images.forEach(img => {
        const alt = img.getAttribute('alt');
        const ariaLabel = img.getAttribute('aria-label');
        const role = img.getAttribute('role');
        
        // Skip decorative images
        if (role === 'presentation' || alt === '') return;
        
        if (!alt && !ariaLabel) {
          issues.push({
            id: `alt-missing-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'alt-text',
            category: 'content',
            severity: 'error',
            message: 'Image missing alternative text',
            element: img,
            selector: getElementSelector(img),
            suggestion: 'Add alt attribute or aria-label to describe the image content',
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
          });
        }
        
        // Check for poor alt text
        if (alt) {
          const poorAltText = ['image', 'picture', 'photo', 'graphic', 'icon'];
          const altLower = alt.toLowerCase();
          
          if (poorAltText.some(poor => altLower.includes(poor)) && alt.split(' ').length < 3) {
            issues.push({
              id: `alt-poor-${Math.random().toString(36).substr(2, 9)}`,
              testId: 'alt-text',
              category: 'content',
              severity: 'warning',
              message: 'Alt text could be more descriptive',
              element: img,
              selector: getElementSelector(img),
              suggestion: 'Describe what the image shows or conveys, not just that it is an image',
              impact: 'moderate',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
            });
          }
        }
      });
      
      return issues;
    }
  },
  
  // Form Labels Test
  {
    id: 'form-labels',
    name: 'Form Labels',
    description: 'Form controls must have associated labels',
    category: 'content',
    severity: 'error',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const formControls = rootElement.querySelectorAll('input, textarea, select');
      
      formControls.forEach(control => {
        if (!control) return;
        
        const type = (control as HTMLInputElement).type;
        
        // Skip hidden inputs
        if (type === 'hidden') return;
        
        const hasLabel = (control as HTMLInputElement).labels?.length ?? 0 > 0;
        const hasAriaLabel = control.hasAttribute('aria-label');
        const hasAriaLabelledby = control.hasAttribute('aria-labelledby');
        const hasTitle = control.hasAttribute('title');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
          issues.push({
            id: `form-label-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'form-labels',
            category: 'content',
            severity: 'error',
            message: 'Form control missing label',
            element: control,
            selector: getElementSelector(control),
            suggestion: 'Add a label element, aria-label, or aria-labelledby attribute',
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
          });
        }
      });
      
      return issues;
    }
  },
  
  // Heading Structure Test
  {
    id: 'heading-structure',
    name: 'Heading Structure',
    description: 'Headings must follow a logical hierarchy',
    category: 'structure',
    severity: 'warning',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const headings = Array.from(rootElement.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      
      if (headings.length === 0) return issues;
      
      let previousLevel = 0;
      
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = (heading as HTMLElement).innerText?.trim();
        
        // Check for empty headings
        if (!text) {
          issues.push({
            id: `heading-empty-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'heading-structure',
            category: 'structure',
            severity: 'error',
            message: 'Heading is empty',
            element: heading,
            selector: getElementSelector(heading),
            suggestion: 'Add descriptive text to the heading or remove it',
            impact: 'moderate',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
          });
        }
        
        // Check for skipped levels
        if (index === 0 && level !== 1) {
          issues.push({
            id: `heading-start-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'heading-structure',
            category: 'structure',
            severity: 'warning',
            message: 'Page should start with h1 heading',
            element: heading,
            selector: getElementSelector(heading),
            suggestion: 'Consider using h1 for the main page heading',
            impact: 'moderate',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
          });
        }
        
        if (previousLevel > 0 && level > previousLevel + 1) {
          issues.push({
            id: `heading-skip-${Math.random().toString(36).substr(2, 9)}`,
            testId: 'heading-structure',
            category: 'structure',
            severity: 'warning',
            message: `Heading level skipped from h${previousLevel} to h${level}`,
            element: heading,
            selector: getElementSelector(heading),
            suggestion: 'Use headings in sequential order (h1, h2, h3, etc.)',
            impact: 'moderate',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
          });
        }
        
        previousLevel = level;
      });
      
      return issues;
    }
  },
  
  // Focus Management Test
  {
    id: 'focus-management',
    name: 'Focus Management',
    description: 'Focus indicators must be visible and logical',
    category: 'focus',
    severity: 'warning',
    test: (rootElement = document.body) => {
      const issues: AccessibilityIssue[] = [];
      const focusableElements = rootElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      focusableElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const pseudoStyle = window.getComputedStyle(element, ':focus');
        
        // Check for focus indicator suppression
        if (style.outline === 'none' || style.outline === '0') {
          // Check if there's a custom focus indicator
          const hasCustomFocus = 
            pseudoStyle.boxShadow !== style.boxShadow ||
            pseudoStyle.border !== style.border ||
            pseudoStyle.backgroundColor !== style.backgroundColor;
          
          if (!hasCustomFocus) {
            issues.push({
              id: `focus-indicator-${Math.random().toString(36).substr(2, 9)}`,
              testId: 'focus-management',
              category: 'focus',
              severity: 'warning',
              message: 'Element missing visible focus indicator',
              element,
              selector: getElementSelector(element),
              suggestion: 'Provide a visible focus indicator using outline, border, or box-shadow',
              impact: 'moderate',
              helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html'
            });
          }
        }
      });
      
      return issues;
    }
  }
];

// Main Accessibility Tester Class
export class AccessibilityTester {
  private tests: Map<string, AccessibilityTest>;
  
  constructor() {
    this.tests = new Map();
    accessibilityTests.forEach(test => {
      this.tests.set(test.id, test);
    });
  }
  
  // Run all tests
  async runAllTests(rootElement?: Element): Promise<AccessibilityReport> {
    const issues: AccessibilityIssue[] = [];
    const root = rootElement || document.body;
    
    for (const test of this.tests.values()) {
      try {
        const testIssues = test.test(root);
        issues.push(...testIssues);
      } catch (error) {
        console.error(`Test ${test.id} failed:`, error);
      }
    }
    
    return this.generateReport(issues, root);
  }
  
  // Run specific test
  async runTest(testId: string, rootElement?: Element): Promise<AccessibilityIssue[]> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test "${testId}" not found`);
    }
    
    const root = rootElement || document.body;
    return test.test(root);
  }
  
  // Run tests by category
  async runTestsByCategory(category: string, rootElement?: Element): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    const root = rootElement || document.body;
    
    for (const test of this.tests.values()) {
      if (test.category === category) {
        try {
          const testIssues = test.test(root);
          issues.push(...testIssues);
        } catch (error) {
          console.error(`Test ${test.id} failed:`, error);
        }
      }
    }
    
    return issues;
  }
  
  // Test color contrast for specific element
  testColorContrast(element: HTMLElement): ColorContrastResult | null {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    if (!color || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      return null;
    }
    
    const ratio = getContrastRatio(color, backgroundColor);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = style.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    
    const aaThreshold = isLargeText ? 3 : 4.5;
    const aaaThreshold = isLargeText ? 4.5 : 7;
    
    return {
      foreground: color,
      background: backgroundColor,
      ratio,
      aa: ratio >= aaThreshold,
      aaa: ratio >= aaaThreshold,
      level: ratio >= aaaThreshold ? 'AAA' : ratio >= aaThreshold ? 'AA' : 'Fail'
    };
  }
  
  // Generate accessibility report
  private generateReport(issues: AccessibilityIssue[], rootElement: Element): AccessibilityReport {
    const totalElements = rootElement.querySelectorAll('*').length;
    const testedElements = new Set(issues.map(issue => issue.element)).size;
    
    const summary = {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      notices: issues.filter(i => i.severity === 'notice').length
    };
    
    // Calculate score (0-100)
    let score = 100;
    score -= summary.errors * 10; // -10 points per error
    score -= summary.warnings * 5; // -5 points per warning
    score -= summary.notices * 1; // -1 point per notice
    score = Math.max(0, score);
    
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
  
  // Get available tests
  getAvailableTests(): AccessibilityTest[] {
    return Array.from(this.tests.values());
  }
  
  // Add custom test
  addCustomTest(test: AccessibilityTest): void {
    this.tests.set(test.id, test);
  }
  
  // Remove test
  removeTest(testId: string): boolean {
    return this.tests.delete(testId);
  }
}

// Singleton instance
let accessibilityTester: AccessibilityTester | null = null;

export function getAccessibilityTester(): AccessibilityTester {
  if (!accessibilityTester) {
    accessibilityTester = new AccessibilityTester();
  }
  return accessibilityTester;
}

// React hook for accessibility testing
export function useAccessibilityTesting() {
  const tester = getAccessibilityTester();
  
  return {
    runAllTests: (rootElement?: Element) => tester.runAllTests(rootElement),
    runTest: (testId: string, rootElement?: Element) => tester.runTest(testId, rootElement),
    runTestsByCategory: (category: string, rootElement?: Element) => 
      tester.runTestsByCategory(category, rootElement),
    testColorContrast: (element: HTMLElement) => tester.testColorContrast(element),
    getAvailableTests: () => tester.getAvailableTests(),
    addCustomTest: (test: AccessibilityTest) => tester.addCustomTest(test),
  };
}

// Utility functions for external use
export function checkColorContrast(foreground: string, background: string): ColorContrastResult {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    foreground,
    background,
    ratio,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
  };
}

export function isAccessibleColor(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = isLargeText ? 3 : 4.5;
  return ratio >= threshold;
}

export {
  type AccessibilityTest,
  type AccessibilityIssue,
  type AccessibilityReport,
  type ColorContrastResult 
};

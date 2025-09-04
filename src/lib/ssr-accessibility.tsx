'use client';

import { ReactElement, createElement } from 'react';

// Server-side accessibility types
export interface SSRAccessibilityConfig {
  enableStructuralSemantics: boolean;
  enableSkipNavigation: boolean;
  enableAccessibleForms: boolean;
  enableProgressiveDisclosure: boolean;
  enableFallbackContent: boolean;
  generateNoScriptAlternatives: boolean;
  optimizeForPrintMedia: boolean;
  enableBasicInteractivity: boolean;
}

export interface SSRAccessibilityReport {
  hasSkipNavigation: boolean;
  hasProperHeadingStructure: boolean;
  hasAccessibleForms: boolean;
  hasLandmarkRoles: boolean;
  hasNoScriptSupport: boolean;
  hasPrintOptimization: boolean;
  score: number;
  recommendations: string[];
}

export interface NoScriptAlternative {
  original: string;
  alternative: string;
  description: string;
  fallbackType: 'html' | 'css' | 'text' | 'redirect';
}

const DEFAULT_SSR_CONFIG: SSRAccessibilityConfig = {
  enableStructuralSemantics: true,
  enableSkipNavigation: true,
  enableAccessibleForms: true,
  enableProgressiveDisclosure: true,
  enableFallbackContent: true,
  generateNoScriptAlternatives: true,
  optimizeForPrintMedia: true,
  enableBasicInteractivity: true,
};

// Server-side accessibility manager
export class SSRAccessibilityManager {
  private config: SSRAccessibilityConfig;
  private alternatives: NoScriptAlternative[] = [];
  private structuralElements: Map<string, Element[]> = new Map();

  constructor(config: Partial<SSRAccessibilityConfig> = {}) {
    this.config = { ...DEFAULT_SSR_CONFIG, ...config };
  }

  // Generate enhanced HTML structure for SSR
  public generateAccessibleHTML(content: string): string {
    let enhancedHTML = content;

    if (this.config.enableStructuralSemantics) {
      enhancedHTML = this.addStructuralSemantics(enhancedHTML);
    }

    if (this.config.enableSkipNavigation) {
      enhancedHTML = this.addSkipNavigation(enhancedHTML);
    }

    if (this.config.generateNoScriptAlternatives) {
      enhancedHTML = this.generateNoScriptAlternatives(enhancedHTML);
    }

    if (this.config.optimizeForPrintMedia) {
      enhancedHTML = this.addPrintOptimizations(enhancedHTML);
    }

    return enhancedHTML;
  }

  private addStructuralSemantics(html: string): string {
    // Add semantic HTML structure if missing
    let enhanced = html;

    // Wrap main content in semantic elements
    if (!html.includes('<main')) {
      enhanced = enhanced.replace(
        /<div[^>]*class="[^"]*main[^"]*"[^>]*>/,
        '<main role="main" id="main">'
      ).replace('</div>', '</main>');
    }

    // Add navigation landmarks
    enhanced = enhanced.replace(
      /<div[^>]*class="[^"]*nav[^"]*"[^>]*>/g,
      '<nav role="navigation">'
    );

    // Add header and footer landmarks
    enhanced = enhanced.replace(
      /<div[^>]*class="[^"]*header[^"]*"[^>]*>/g,
      '<header role="banner">'
    );

    enhanced = enhanced.replace(
      /<div[^>]*class="[^"]*footer[^"]*"[^>]*>/g,
      '<footer role="contentinfo">'
    );

    return enhanced;
  }

  private addSkipNavigation(html: string): string {
    const skipNavHTML = `
      <nav class="skip-navigation" aria-label="Skip navigation links">
        <a href="#main" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
        <a href="#search" class="skip-link">Skip to search</a>
        <a href="#footer" class="skip-link">Skip to footer</a>
      </nav>
      
      <style>
        .skip-navigation {
          position: absolute;
          top: -1000px;
          left: -1000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
          z-index: 10000;
        }
        
        .skip-navigation:focus-within {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: auto;
          height: auto;
          padding: 8px;
          background: #000;
          color: #fff;
          border-bottom: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        
        .skip-link {
          display: block;
          padding: 8px 12px;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          margin: 2px;
        }
        
        .skip-link:focus {
          outline: 2px solid #fff;
          outline-offset: 2px;
          background: rgba(255,255,255,0.2);
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .skip-navigation:focus-within {
            background: ButtonFace;
            color: ButtonText;
            border-color: ButtonText;
          }
          
          .skip-link {
            background: ButtonFace;
            color: ButtonText;
            border-color: ButtonText;
          }
          
          .skip-link:focus {
            outline-color: Highlight;
            background: Highlight;
            color: HighlightText;
          }
        }
        
        /* Print support */
        @media print {
          .skip-navigation {
            position: static;
            width: auto;
            height: auto;
            background: transparent;
            color: black;
            border: 1px solid black;
            margin-bottom: 1rem;
          }
          
          .skip-link {
            color: black;
            background: transparent;
            border-color: black;
          }
        }
      </style>
    `;

    return html.replace('<body', `<body>${skipNavHTML}`);
  }

  private generateNoScriptAlternatives(html: string): string {
    let enhanced = html;
    
    // Common interactive elements that need no-script alternatives
    const alternatives = [
      {
        selector: 'button[type="submit"]',
        alternative: `
          <noscript>
            <div class="no-js-form-notice">
              <p><strong>JavaScript is disabled.</strong></p>
              <p>This form requires JavaScript. Please enable JavaScript or use the alternative contact methods below.</p>
            </div>
          </noscript>
        `
      },
      {
        selector: '.modal-trigger',
        alternative: `
          <noscript>
            <div class="no-js-modal-content">
              <h3>Information</h3>
              <p>This content is normally shown in a popup dialog. Since JavaScript is disabled, here's the information directly:</p>
            </div>
          </noscript>
        `
      },
      {
        selector: '.dropdown-menu',
        alternative: `
          <noscript>
            <div class="no-js-menu">
              <h3>Menu Options</h3>
              <ul>
                <li><a href="/option1">Option 1</a></li>
                <li><a href="/option2">Option 2</a></li>
                <li><a href="/option3">Option 3</a></li>
              </ul>
            </div>
          </noscript>
        `
      },
      {
        selector: '.tab-content',
        alternative: `
          <noscript>
            <div class="no-js-tabs">
              <h3>All Tab Content</h3>
              <p>JavaScript is required for tabbed navigation. All content is shown below:</p>
            </div>
          </noscript>
        `
      }
    ];

    // Add generic no-script support message
    const noScriptMessage = `
      <noscript>
        <div class="no-js-message" role="alert">
          <h2>Enhanced Features Require JavaScript</h2>
          <p>This website uses JavaScript to provide enhanced accessibility features and functionality. 
             For the best experience, please enable JavaScript in your browser.</p>
          <p>Basic functionality and content remain accessible without JavaScript.</p>
        </div>
        
        <style>
          .no-js-message {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            text-align: center;
          }
          
          .no-js-form-notice,
          .no-js-modal-content,
          .no-js-menu,
          .no-js-tabs {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 16px;
            margin: 16px 0;
          }
          
          .no-js-form-notice h3,
          .no-js-modal-content h3,
          .no-js-menu h3,
          .no-js-tabs h3 {
            margin: 0 0 12px 0;
            color: #374151;
          }
          
          @media print {
            .no-js-message,
            .no-js-form-notice,
            .no-js-modal-content,
            .no-js-menu,
            .no-js-tabs {
              border: 1px solid black;
              background: transparent;
            }
          }
        </style>
      </noscript>
    `;

    enhanced = enhanced.replace('</body>', `${noScriptMessage}</body>`);

    return enhanced;
  }

  private addPrintOptimizations(html: string): string {
    const printStyles = `
      <style media="print">
        /* Print accessibility optimizations */
        
        /* Show hidden content that may be important */
        .sr-only {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 0 0.5rem 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
          border: 0 !important;
          font-size: 0.9rem !important;
          color: #666 !important;
        }
        
        /* Expand collapsed content */
        [aria-expanded="false"] + * {
          display: block !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* Show URLs for links */
        a[href]:after {
          content: " (" attr(href) ")";
          font-size: 0.8rem;
          color: #666;
        }
        
        a[href^="mailto:"]:after {
          content: " (" attr(href) ")";
        }
        
        a[href^="tel:"]:after {
          content: " (" attr(href) ")";
        }
        
        /* Hide print-unfriendly elements */
        .no-print,
        .skip-navigation,
        button,
        input[type="button"],
        input[type="submit"],
        .modal-overlay,
        .dropdown-menu,
        .tooltip {
          display: none !important;
        }
        
        /* Improve form display */
        form {
          border: 1px solid #000;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        form:before {
          content: "Form (interactive elements not available in print)";
          display: block;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        input, select, textarea {
          border: 1px solid #000 !important;
          background: transparent !important;
          padding: 0.25rem !important;
          margin-right: 0.5rem;
        }
        
        /* Improve table readability */
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 0.5rem;
          text-align: left;
        }
        
        /* Add page break controls */
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .no-page-break {
          page-break-inside: avoid;
        }
      </style>
    `;

    return html.replace('</head>', `${printStyles}</head>`);
  }

  // Generate semantic HTML structure
  public generateSemanticStructure(content: {
    header?: string;
    navigation?: Array<{ href: string; label: string }>;
    main?: string;
    aside?: string;
    footer?: string;
  }): string {
    const { header, navigation, main, aside, footer } = content;

    return `
      <!DOCTYPE html>
      <html lang="en" class="no-js">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <title>Accessible Application</title>
          ${this.generateCSSOnlyStyles()}
          <script>
            document.documentElement.classList.remove('no-js');
            document.documentElement.classList.add('js');
          </script>
        </head>
        <body>
          ${this.config.enableSkipNavigation ? this.generateSkipNavigation(navigation) : ''}
          
          ${header ? `
            <header role="banner" id="header">
              ${header}
            </header>
          ` : ''}
          
          ${navigation ? `
            <nav role="navigation" id="navigation" aria-label="Main navigation">
              <ul>
                ${navigation.map(item => `
                  <li><a href="${item.href}">${item.label}</a></li>
                `).join('')}
              </ul>
            </nav>
          ` : ''}
          
          <main role="main" id="main">
            ${main || ''}
          </main>
          
          ${aside ? `
            <aside role="complementary" id="aside">
              ${aside}
            </aside>
          ` : ''}
          
          ${footer ? `
            <footer role="contentinfo" id="footer">
              ${footer}
            </footer>
          ` : ''}
          
          ${this.generateNoScriptSupport()}
        </body>
      </html>
    `;
  }

  private generateSkipNavigation(navigation?: Array<{ href: string; label: string }>): string {
    const defaultLinks = [
      { href: '#main', label: 'Skip to main content' },
      { href: '#navigation', label: 'Skip to navigation' },
      { href: '#footer', label: 'Skip to footer' }
    ];

    const links = navigation ? 
      [...defaultLinks, ...navigation.slice(0, 3).map(item => ({ href: item.href, label: `Go to ${item.label}` }))] :
      defaultLinks;

    return `
      <nav class="skip-navigation" aria-label="Skip navigation links">
        <div class="skip-links">
          ${links.map(link => `
            <a href="${link.href}" class="skip-link">${link.label}</a>
          `).join('')}
        </div>
      </nav>
    `;
  }

  private generateCSSOnlyStyles(): string {
    return `
      <style>
        /* CSS-only accessibility features */
        
        /* Skip navigation styles */
        .skip-navigation {
          position: absolute;
          top: -1000px;
          left: -1000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
          z-index: 10000;
        }
        
        .skip-navigation:focus-within {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: auto;
          height: auto;
          padding: 8px;
          background: #000;
          color: #fff;
          border-bottom: 2px solid #fff;
        }
        
        .skip-links {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .skip-link {
          padding: 8px 12px;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
        }
        
        .skip-link:focus {
          outline: 2px solid #fff;
          outline-offset: 2px;
          background: rgba(255,255,255,0.2);
        }
        
        /* No-JS visible skip navigation */
        .no-js .skip-navigation {
          position: static;
          width: auto;
          height: auto;
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 8px;
          margin-bottom: 1rem;
        }
        
        .no-js .skip-link {
          color: #0066cc;
          background: transparent;
          border-color: #0066cc;
        }
        
        /* CSS-only accordion/collapsible */
        .css-accordion {
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .css-accordion-item {
          border-bottom: 1px solid #eee;
        }
        
        .css-accordion-item:last-child {
          border-bottom: none;
        }
        
        .css-accordion-header {
          display: block;
          width: 100%;
          padding: 1rem;
          text-align: left;
          background: #f8f9fa;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 0;
        }
        
        .css-accordion-header:hover {
          background: #e9ecef;
        }
        
        .css-accordion-header:focus {
          outline: 2px solid #0066cc;
          outline-offset: -2px;
        }
        
        .css-accordion-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        
        .css-accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        
        .css-accordion-input:checked + .css-accordion-header + .css-accordion-content {
          max-height: 1000px;
          padding: 1rem;
        }
        
        /* No-script fallback for accordion */
        .no-js .css-accordion-content {
          max-height: none !important;
          overflow: visible !important;
          display: block !important;
          padding: 1rem !important;
        }
        
        /* CSS-only dropdown menu */
        .css-dropdown {
          position: relative;
          display: inline-block;
        }
        
        .css-dropdown-content {
          display: none;
          position: absolute;
          background: #fff;
          min-width: 200px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          z-index: 1000;
        }
        
        .css-dropdown:hover .css-dropdown-content,
        .css-dropdown:focus-within .css-dropdown-content {
          display: block;
        }
        
        .css-dropdown-link {
          display: block;
          padding: 8px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
        }
        
        .css-dropdown-link:hover,
        .css-dropdown-link:focus {
          background: #f8f9fa;
          outline: 1px solid #0066cc;
        }
        
        /* No-script fallback for dropdown */
        .no-js .css-dropdown-content {
          display: block !important;
          position: static !important;
          box-shadow: none !important;
          border: 1px solid #ccc !important;
          margin-top: 8px;
        }
        
        /* CSS-only tabs */
        .css-tabs {
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .css-tab-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        
        .css-tab-label {
          display: inline-block;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #ccc;
          cursor: pointer;
          font-weight: 500;
        }
        
        .css-tab-label:hover {
          background: #e9ecef;
        }
        
        .css-tab-label:focus {
          outline: 2px solid #0066cc;
          outline-offset: -2px;
        }
        
        .css-tab-input:checked + .css-tab-label {
          background: #fff;
          border-bottom-color: transparent;
        }
        
        .css-tab-panel {
          display: none;
          padding: 1rem;
        }
        
        .css-tab-input:checked + .css-tab-label + .css-tab-panel {
          display: block;
        }
        
        /* No-script fallback for tabs */
        .no-js .css-tab-panel {
          display: block !important;
          border-top: 1px solid #ccc;
        }
        
        .no-js .css-tab-label {
          background: transparent !important;
          border: none !important;
          padding-bottom: 8px !important;
          font-weight: bold;
          display: block;
        }
        
        /* Focus indicators for all interactive elements */
        button:focus,
        a:focus,
        input:focus,
        select:focus,
        textarea:focus,
        [tabindex]:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          * {
            border-color: ButtonText !important;
          }
          
          button, input, select, textarea {
            border: 2px solid ButtonText !important;
            background: ButtonFace !important;
            color: ButtonText !important;
          }
          
          a {
            color: LinkText !important;
            text-decoration: underline !important;
          }
          
          :focus {
            outline-color: Highlight !important;
            outline-width: 3px !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        
        /* Print-specific styles */
        @media print {
          /* Hide interactive elements */
          button,
          input[type="button"],
          input[type="submit"],
          input[type="reset"],
          .no-print {
            display: none !important;
          }
          
          /* Show form labels clearly */
          label {
            font-weight: bold;
          }
          
          /* Add borders to form fields for clarity */
          input, select, textarea {
            border: 1px solid #000 !important;
            background: transparent !important;
          }
          
          /* Improve table printing */
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 0.5rem;
            text-align: left;
          }
          
          /* Page break controls */
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          /* Show hidden content that's important for understanding */
          .print-show {
            display: block !important;
          }
        }
        
        /* Ensure minimum touch target sizes */
        button,
        a,
        input,
        select,
        textarea,
        [role="button"],
        [tabindex="0"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Improve readability */
        body {
          line-height: 1.5;
        }
        
        h1, h2, h3, h4, h5, h6 {
          line-height: 1.2;
          margin-bottom: 0.5rem;
        }
        
        p {
          margin-bottom: 1rem;
        }
        
        /* Ensure sufficient color contrast */
        body {
          color: #333;
          background: #fff;
        }
        
        a {
          color: #0066cc;
        }
        
        a:visited {
          color: #800080;
        }
        
        /* Error and success states */
        .error {
          color: #d32f2f;
          border-color: #d32f2f;
        }
        
        .success {
          color: #2e7d32;
          border-color: #2e7d32;
        }
        
        .warning {
          color: #f57c00;
          border-color: #f57c00;
        }
      </style>
    `;
  }

  private generateNoScriptSupport(): string {
    return `
      <!-- Enhanced no-script support -->
      <noscript>
        <style>
          /* Enhanced styles for no-script environments */
          .js-only {
            display: none !important;
          }
          
          .no-js-only {
            display: block !important;
          }
          
          /* Make all collapsed content visible */
          .collapsible-content,
          .tab-panel,
          .modal-content {
            display: block !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* Simplify layouts for better accessibility */
          .complex-layout {
            display: block !important;
          }
          
          .flex {
            display: block !important;
          }
          
          .grid {
            display: block !important;
          }
          
          /* Improve form accessibility */
          form {
            border: 1px solid #ccc;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          fieldset {
            border: 1px solid #999;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          
          legend {
            font-weight: bold;
            padding: 0 0.5rem;
          }
          
          /* Add visual indicators */
          .required::after {
            content: " (required)";
            color: #d32f2f;
          }
          
          /* Navigation improvements */
          nav ul {
            list-style: none;
            padding: 0;
          }
          
          nav li {
            border-bottom: 1px solid #eee;
          }
          
          nav a {
            display: block;
            padding: 8px 12px;
            text-decoration: none;
          }
          
          nav a:focus,
          nav a:hover {
            background: #f0f0f0;
            outline: 1px solid #0066cc;
          }
        </style>
        
        <!-- No-script message -->
        <div class="no-js-message" role="alert">
          <h2>JavaScript is Disabled</h2>
          <p>This application is designed to be accessible without JavaScript. 
             However, enabling JavaScript will provide enhanced accessibility features 
             and improved user experience.</p>
          <p><strong>Current status:</strong> Basic accessibility features are active.</p>
        </div>
        
        <!-- Alternative navigation for complex components -->
        <div class="no-js-alternatives">
          <h2>Alternative Navigation</h2>
          <p>Use the following methods to navigate this application:</p>
          <ul>
            <li><strong>Tab key:</strong> Move between interactive elements</li>
            <li><strong>Enter key:</strong> Activate links and buttons</li>
            <li><strong>Arrow keys:</strong> Navigate within form controls</li>
            <li><strong>Page Up/Down:</strong> Scroll through content</li>
          </ul>
        </div>
      </noscript>
    `;
  }

  // Form enhancement for SSR
  public enhanceFormForSSR(formHTML: string): string {
    let enhanced = formHTML;
    
    // Add proper form structure
    enhanced = enhanced.replace(
      /<form/g,
      '<form novalidate role="form"'
    );

    // Add fieldsets for grouped inputs
    enhanced = this.wrapFormSections(enhanced);
    
    // Add form submission handling
    enhanced = this.addFormSubmissionHandling(enhanced);
    
    return enhanced;
  }

  private wrapFormSections(html: string): string {
    // This would analyze the form structure and add fieldsets
    // For now, return as-is (would need more complex parsing)
    return html;
  }

  private addFormSubmissionHandling(html: string): string {
    const noScriptSubmission = `
      <noscript>
        <div class="no-js-form-info">
          <p><strong>Form Submission:</strong> Without JavaScript, this form will submit 
             directly to the server. You will be redirected to a confirmation page.</p>
        </div>
      </noscript>
    `;
    
    return html.replace('</form>', `${noScriptSubmission}</form>`);
  }

  // Generate accessibility report for SSR content
  public auditSSRContent(html: string): SSRAccessibilityReport {
    const report: SSRAccessibilityReport = {
      hasSkipNavigation: html.includes('skip-navigation') || html.includes('Skip to'),
      hasProperHeadingStructure: this.hasProperHeadingStructure(html),
      hasAccessibleForms: this.hasAccessibleForms(html),
      hasLandmarkRoles: this.hasLandmarkRoles(html),
      hasNoScriptSupport: html.includes('<noscript>'),
      hasPrintOptimization: html.includes('media="print"') || html.includes('@media print'),
      score: 0,
      recommendations: []
    };

    // Calculate score
    let score = 0;
    if (report.hasSkipNavigation) score += 20;
    if (report.hasProperHeadingStructure) score += 20;
    if (report.hasAccessibleForms) score += 20;
    if (report.hasLandmarkRoles) score += 20;
    if (report.hasNoScriptSupport) score += 10;
    if (report.hasPrintOptimization) score += 10;

    report.score = score;

    // Generate recommendations
    const recommendations = [];
    if (!report.hasSkipNavigation) {
      recommendations.push('Add skip navigation links for keyboard users');
    }
    if (!report.hasProperHeadingStructure) {
      recommendations.push('Improve heading hierarchy (h1, h2, h3, etc.)');
    }
    if (!report.hasAccessibleForms) {
      recommendations.push('Add proper labels and fieldsets to forms');
    }
    if (!report.hasLandmarkRoles) {
      recommendations.push('Add landmark roles (main, navigation, etc.)');
    }
    if (!report.hasNoScriptSupport) {
      recommendations.push('Add no-script fallbacks for better progressive enhancement');
    }
    if (!report.hasPrintOptimization) {
      recommendations.push('Add print-friendly styles for better accessibility');
    }

    report.recommendations = recommendations;

    return report;
  }

  private hasProperHeadingStructure(html: string): boolean {
    // Simple check for heading hierarchy
    return html.includes('<h1') && (html.includes('<h2') || html.includes('<h3'));
  }

  private hasAccessibleForms(html: string): boolean {
    // Check for basic form accessibility
    return html.includes('<label') || html.includes('aria-label') || html.includes('<fieldset');
  }

  private hasLandmarkRoles(html: string): boolean {
    const landmarks = ['role="main"', 'role="navigation"', 'role="banner"', 'role="contentinfo"', '<main', '<nav', '<header', '<footer'];
    return landmarks.some(landmark => html.includes(landmark));
  }

  // CSS-only component generators
  public generateCSSOnlyAccordion(items: Array<{ title: string; content: string; id: string }>): string {
    return `
      <div class="css-accordion">
        ${items.map((item, index) => `
          <div class="css-accordion-item">
            <input 
              type="checkbox" 
              id="accordion-${item.id}" 
              class="css-accordion-input"
              ${index === 0 ? 'checked' : ''}
            />
            <label for="accordion-${item.id}" class="css-accordion-header">
              ${item.title}
            </label>
            <div class="css-accordion-content">
              ${item.content}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  public generateCSSOnlyTabs(tabs: Array<{ title: string; content: string; id: string }>): string {
    return `
      <div class="css-tabs">
        <div class="css-tab-headers">
          ${tabs.map((tab, index) => `
            <input 
              type="radio" 
              name="tab-group" 
              id="tab-${tab.id}" 
              class="css-tab-input"
              ${index === 0 ? 'checked' : ''}
            />
            <label for="tab-${tab.id}" class="css-tab-label">
              ${tab.title}
            </label>
          `).join('')}
        </div>
        
        <div class="css-tab-panels">
          ${tabs.map(tab => `
            <div class="css-tab-panel" id="panel-${tab.id}">
              <h3 class="sr-only">${tab.title}</h3>
              ${tab.content}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Utility methods
  public createAccessibleForm(fields: Array<{
    type: string;
    name: string;
    label: string;
    required?: boolean;
    options?: string[];
  }>): string {
    return `
      <form method="post" novalidate>
        <fieldset>
          <legend>Form Information</legend>
          
          ${fields.map(field => {
            const fieldId = `field-${field.name}`;
            const requiredAttr = field.required ? 'required aria-required="true"' : '';
            const requiredLabel = field.required ? ' *' : '';
            
            switch (field.type) {
              case 'text':
              case 'email':
              case 'password':
              case 'tel':
                return `
                  <div class="form-field">
                    <label for="${fieldId}" class="form-label">
                      ${field.label}${requiredLabel}
                    </label>
                    <input 
                      type="${field.type}" 
                      id="${fieldId}" 
                      name="${field.name}" 
                      ${requiredAttr}
                      class="form-input"
                    />
                  </div>
                `;
              
              case 'select':
                return `
                  <div class="form-field">
                    <label for="${fieldId}" class="form-label">
                      ${field.label}${requiredLabel}
                    </label>
                    <select id="${fieldId}" name="${field.name}" ${requiredAttr} class="form-select">
                      <option value="">Choose an option</option>
                      ${field.options?.map(option => `<option value="${option}">${option}</option>`).join('') || ''}
                    </select>
                  </div>
                `;
                
              case 'textarea':
                return `
                  <div class="form-field">
                    <label for="${fieldId}" class="form-label">
                      ${field.label}${requiredLabel}
                    </label>
                    <textarea 
                      id="${fieldId}" 
                      name="${field.name}" 
                      ${requiredAttr}
                      class="form-textarea"
                      rows="4"
                    ></textarea>
                  </div>
                `;
                
              default:
                return '';
            }
          }).join('')}
          
          <div class="form-actions">
            <button type="submit" class="form-submit">Submit</button>
            <button type="reset" class="form-reset">Reset</button>
          </div>
        </fieldset>
        
        <noscript>
          <div class="no-js-form-info">
            <p><strong>Form will be submitted directly to the server.</strong></p>
            <p>Please ensure all required fields are completed before submitting.</p>
          </div>
        </noscript>
      </form>
    `;
  }
}

// Singleton instance for SSR
let ssrAccessibilityManager: SSRAccessibilityManager | null = null;

export function getSSRAccessibilityManager(config?: Partial<SSRAccessibilityConfig>): SSRAccessibilityManager {
  if (!ssrAccessibilityManager) {
    ssrAccessibilityManager = new SSRAccessibilityManager(config);
  }
  return ssrAccessibilityManager;
}

// React component for SSR accessibility wrapper
export interface SSRAccessibilityWrapperProps {
  children: React.ReactNode;
  enableSkipNav?: boolean;
  skipLinks?: Array<{ href: string; label: string }>;
}

export const SSRAccessibilityWrapper: React.FC<SSRAccessibilityWrapperProps> = ({
  children,
  enableSkipNav = true,
  skipLinks = [
    { href: '#main', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ]
}) => {
  return (
    <>
      {/* Skip Navigation */}
      {enableSkipNav && (
        <nav className="skip-navigation" aria-label="Skip navigation links">
          <div className="skip-links">
            {skipLinks.map(link => (
              <a key={link.href} href={link.href} className="skip-link">
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
      
      {/* Main content */}
      <div className="ssr-accessibility-enhanced">
        {children}
      </div>
      
      {/* No-script support */}
      <noscript>
        <div className="no-js-enhanced-message">
          <h2>JavaScript-Free Mode Active</h2>
          <p>You are viewing this application with JavaScript disabled. 
             Core functionality remains accessible through standard HTML.</p>
          <ul>
            <li>Use Tab to navigate between interactive elements</li>
            <li>Use Enter to activate links and submit forms</li>
            <li>Use arrow keys in form controls</li>
            <li>All content and forms are accessible via keyboard</li>
          </ul>
        </div>
      </noscript>
    </>
  );
};

export default {
  SSRAccessibilityManager,
  getSSRAccessibilityManager,
  SSRAccessibilityWrapper
};

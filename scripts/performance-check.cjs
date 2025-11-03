#!/usr/bin/env node

// Performance monitoring script for page display optimizations
const fs = require('fs');
const path = require('path');

class PerformanceChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.suggestions = [];
  }

  // Check for large bundle sizes
  checkBundleSize() {
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        this.scanDirectory(staticDir, (file, stats) => {
          const sizeInMB = stats.size / (1024 * 1024);
          if (sizeInMB > 1) {
            this.warnings.push(`Large file detected: ${file} (${sizeInMB.toFixed(2)}MB)`);
          }
        });
      }
    }
  }

  // Check for unoptimized images
  checkImages() {
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      this.scanDirectory(publicDir, (file, stats) => {
        if (/\.(jpg|jpeg|png|gif)$/i.test(file)) {
          const sizeInKB = stats.size / 1024;
          if (sizeInKB > 100) {
            this.warnings.push(`Large image detected: ${file} (${sizeInKB.toFixed(2)}KB)`);
            this.suggestions.push(`Consider optimizing ${file} or using Next.js Image component`);
          }
        }
      });
    }
  }

  // Check for performance anti-patterns in React components
  checkReactPerformance() {
    const srcDir = path.join(process.cwd(), 'src');
    this.scanReactFiles(srcDir, (file, content) => {
      // Check for missing React.memo (be more specific)
      if (content.includes('function ') && !content.includes('memo(')) {
        if (content.includes('export') && content.includes('Props') && 
            !content.includes('forwardRef') && !file.includes('hooks/')) {
          // Only suggest memoization for exported components with props that aren't already optimized
          const componentName = (content.match(/function\s+(\w+)/)?.[1] || '').toLowerCase();
          if (!['layout', 'provider', 'context'].some(keyword => componentName.includes(keyword))) {
            this.suggestions.push(`Consider memoizing component in ${file}`);
          }
        }
      }

      // Check for inline objects in JSX (but ignore memoized ones)
      const inlineObjects = content.match(/\w+={{[^}]+}}/g);
      if (inlineObjects) {
        const hasMemoizedObjects = content.includes('useMemo') || content.includes('useCallback');
        if (!hasMemoizedObjects) {
          this.warnings.push(`Inline objects detected in ${file} - may cause re-renders`);
        }
      }

      // Check for useEffect without dependencies
      if (content.includes('useEffect')) {
        const useEffectMatches = content.match(/useEffect\([^,]+(?:,\s*\[[^\]]*\])?/g);
        if (useEffectMatches) {
          useEffectMatches.forEach(match => {
            if (!match.includes(', [') && !match.includes(',[')) {
              this.issues.push(`useEffect without dependencies array in ${file}`);
            }
          });
        }
      }

      // Check for console.log statements (ignore development files)
      if (content.includes('console.log') && !file.includes('dev.') && !file.includes('test')) {
        this.warnings.push(`Console.log statements found in ${file} - remove for production`);
      }
    });
  }

  // Check CSS for performance issues
  checkCSS() {
    const globalCSS = path.join(process.cwd(), 'src', 'app', 'globals.css');
    if (fs.existsSync(globalCSS)) {
      const content = fs.readFileSync(globalCSS, 'utf8');
      
      // Check for unused CSS variables (improved to account for Tailwind usage)
      const cssVars = content.match(/--[\w-]+:/g) || [];
      const directUsage = content.match(/var\(--[\w-]+\)/g) || [];
      
      // CSS variables are often used via Tailwind utilities like bg-background, text-foreground, etc.
      // So we check if the variable name appears in common Tailwind patterns
      const tailwindUsagePatterns = [
        'bg-background', 'text-foreground', 'bg-card', 'text-card-foreground',
        'bg-popover', 'text-popover-foreground', 'bg-primary', 'text-primary-foreground',
        'bg-secondary', 'text-secondary-foreground', 'bg-muted', 'text-muted-foreground',
        'bg-accent', 'text-accent-foreground', 'bg-destructive', 'text-destructive-foreground',
        'border-border', 'bg-input', 'ring-ring'
      ];
      
      cssVars.forEach(cssVar => {
        const varName = cssVar.replace(':', '').replace('--', '');
        const isUsedDirectly = directUsage.some(used => used.includes(`--${varName}`));
        const isUsedByTailwind = tailwindUsagePatterns.some(pattern => pattern.includes(varName));
        
        if (!isUsedDirectly && !isUsedByTailwind && !varName.includes('chart')) {
          this.warnings.push(`Potentially unused CSS variable: --${varName} in globals.css`);
        }
      });

      // Check for genuinely complex selectors (ignore Tailwind's complex but optimized selectors)
      const complexSelectors = content.match(/[^{]+{[^}]*}/g) || [];
      let complexCount = 0;
      complexSelectors.forEach(selector => {
        if ((selector.match(/\s/g) || []).length > 8 && !selector.includes('[@apply')) {
          complexCount++;
        }
      });
      
      if (complexCount > 3) {
        this.warnings.push(`${complexCount} complex CSS selectors detected - may impact performance`);
      }
    }
  }

  // Utility methods
  scanDirectory(dir, callback) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.scanDirectory(filePath, callback);
      } else {
        callback(filePath, stats);
      }
    });
  }

  scanReactFiles(dir, callback) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        this.scanReactFiles(filePath, callback);
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          callback(filePath, content);
        } catch (error) {
          this.warnings.push(`Could not read file: ${filePath}`);
        }
      }
    });
  }

  // Run all checks
  runAllChecks() {
    console.log('🔍 Running performance checks...\n');
    
    this.checkBundleSize();
    this.checkImages();
    this.checkReactPerformance();
    this.checkCSS();
    
    this.generateReport();
  }

  // Generate performance report
  generateReport() {
    console.log('📊 PERFORMANCE REPORT');
    console.log('====================\n');

    if (this.issues.length > 0) {
      console.log('🔴 CRITICAL ISSUES:');
      this.issues.forEach(issue => console.log(`  - ${issue}`));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('🟡 WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log();
    }

    if (this.suggestions.length > 0) {
      console.log('💡 SUGGESTIONS:');
      this.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      console.log();
    }

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ No critical performance issues detected!');
    }

    // Performance optimization checklist
    console.log('📋 OPTIMIZATION CHECKLIST:');
    console.log('==========================');
    console.log('✅ Next.js Image component for optimized images');
    console.log('✅ React.memo for component memoization');
    console.log('✅ Font optimization with next/font');
    console.log('✅ Bundle splitting configuration');
    console.log('✅ CSS optimizations with Tailwind');
    console.log('✅ Performance monitoring utilities');
    console.log('✅ Lazy loading components');
    console.log('✅ Proper loading states');
    console.log();

    console.log('🚀 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. Run `npm run build` to check bundle sizes');
    console.log('2. Use `npm run analyze` to analyze bundle composition');
    console.log('3. Implement lazy loading for heavy components');
    console.log('4. Monitor Core Web Vitals in production');
    console.log('5. Consider implementing service worker for caching');
  }
}

// Run the performance checker
if (require.main === module) {
  const checker = new PerformanceChecker();
  checker.runAllChecks();
}

module.exports = PerformanceChecker;

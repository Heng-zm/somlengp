#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DynamicImportOptimizer {
  constructor() {
    this.optimizedFiles = [];
    this.errors = [];
    this.suggestions = [];
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // Skip test files and examples
      if (filePath.includes('.test.') || filePath.includes('.example.')) {
        return;
      }

      // 1. Identify heavy components that should be lazy loaded
      const heavyComponentSuggestions = this.identifyHeavyComponents(content, filePath);
      if (heavyComponentSuggestions.length > 0) {
        this.suggestions.push(...heavyComponentSuggestions);
      }

      // 2. Add lazy loading for route components
      const lazyResult = this.addLazyLoading(modifiedContent, filePath);
      if (lazyResult.changed) {
        modifiedContent = lazyResult.content;
        hasChanges = true;
      }

      // 3. Optimize third-party imports
      const importResult = this.optimizeThirdPartyImports(modifiedContent);
      if (importResult.changed) {
        modifiedContent = importResult.content;
        hasChanges = true;
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.optimizedFiles.push(filePath);
        console.log(`✅ Optimized imports in: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  identifyHeavyComponents(content, filePath) {
    const suggestions = [];
    
    // Components that should be lazy loaded
    const heavyPatterns = [
      { pattern: /recharts|Chart/g, component: 'Charts library components' },
      { pattern: /Monaco|Editor/g, component: 'Code editor components' },
      { pattern: /@radix-ui.*Dialog|Modal/g, component: 'Dialog/Modal components' },
      { pattern: /framer-motion/g, component: 'Animation components' },
      { pattern: /QRScanner|Camera/g, component: 'Camera/QR scanner components' }
    ];

    heavyPatterns.forEach(({ pattern, component }) => {
      if (pattern.test(content)) {
        suggestions.push({
          file: filePath,
          suggestion: `Consider lazy loading ${component} to reduce initial bundle size`,
          type: 'lazy-load'
        });
      }
    });

    return suggestions;
  }

  addLazyLoading(content, filePath) {
    let modified = content;
    let changed = false;

    // For page components, add lazy loading setup
    if (filePath.includes('/app/') && filePath.endsWith('/page.tsx')) {
      // Add Suspense import if not present
      if (!content.includes('Suspense') && content.includes('from \'react\'')) {
        modified = modified.replace(
          /import React(?:, { ([^}]+) })? from 'react'/,
          (match, imports) => {
            const newImports = imports ? `${imports}, Suspense` : 'Suspense';
            return `import React, { ${newImports} } from 'react'`;
          }
        );
        changed = true;
      }

      // Add loading component suggestion as comment
      if (!content.includes('Loading component') && !content.includes('Suspense')) {
        const comment = `// TODO: Consider adding Suspense boundary with loading component for better UX\n// Example: <Suspense fallback={<LoadingSpinner />}>\n\n`;
        
        const exportMatch = modified.match(/export default function/);
        if (exportMatch) {
          const index = modified.indexOf(exportMatch[0]);
          modified = modified.slice(0, index) + comment + modified.slice(index);
          changed = true;
        }
      }
    }

    return { content: modified, changed };
  }

  optimizeThirdPartyImports(content) {
    let modified = content;
    let changed = false;

    const optimizations = [
      // Optimize lucide-react imports - use individual imports
      {
        pattern: /import { ([^}]+) } from 'lucide-react'/g,
        replacement: (match, imports) => {
          const icons = imports.split(',').map(icon => icon.trim());
          if (icons.length > 5) {
            // If using many icons, suggest tree shaking
            return `${match} // TODO: Consider importing icons individually for better tree shaking`;
          }
          return match;
        }
      },
      
      // Optimize @radix-ui imports
      {
        pattern: /import { ([^}]+) } from '@radix-ui\/([^']+)'/g,
        replacement: (match, imports, module) => {
          // These are already optimized, but add note about bundle impact
          if (imports.split(',').length > 3) {
            return `${match} // Note: Large import from @radix-ui/${module}`;
          }
          return match;
        }
      },

      // Optimize framer-motion imports
      {
        pattern: /import { ([^}]+) } from 'framer-motion'/g,
        replacement: (match, imports) => {
          return `${match} // TODO: Consider lazy loading animations for better initial load`;
        }
      }
    ];

    optimizations.forEach(({ pattern, replacement }) => {
      const before = modified;
      modified = modified.replace(pattern, replacement);
      if (before !== modified) {
        changed = true;
      }
    });

    return { content: modified, changed };
  }

  createLazyComponents() {
    const lazyComponents = [
      {
        name: 'QRScanner',
        path: 'src/components/lazy/QRScannerLazy.tsx',
        content: `import { lazy } from 'react';
import { ComponentType } from 'react';

// Lazy load QR scanner components to reduce initial bundle size
export const OptimizedQRScanner = lazy(() => import('../optimized-qr-scanner'));
export const QRScanner = lazy(() => import('../qr-scanner'));
export const SimpleQRScanner = lazy(() => import('../simple-qr-scanner'));

// Re-export types if needed
export type { OptimizedQRScannerProps } from '../optimized-qr-scanner';`
      },
      {
        name: 'Charts',
        path: 'src/components/lazy/ChartsLazy.tsx', 
        content: `import { lazy } from 'react';

// Lazy load chart components to reduce initial bundle size
export const PerformanceDashboard = lazy(() => import('../shared/performance-dashboard'));
export const EnhancedPerformanceDashboard = lazy(() => import('../shared/enhanced-performance-dashboard'));`
      },
      {
        name: 'LoadingSpinner',
        path: 'src/components/ui/loading-spinner.tsx',
        content: `export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}`
      }
    ];

    lazyComponents.forEach(({ name, path: filePath, content }) => {
      const fullPath = path.join(process.cwd(), filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Only create if file doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Created lazy component: ${filePath}`);
      }
    });
  }

  scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          this.scanDirectory(filePath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        this.analyzeFile(filePath);
      }
    });
  }

  run() {
    console.log('📦 Optimizing dynamic imports and bundle splitting...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    // Create lazy loading helper components
    this.createLazyComponents();
    
    console.log('\n📊 OPTIMIZATION RESULTS:');
    console.log('========================');
    console.log(`✅ Analyzed files: ${this.optimizedFiles.length}`);
    console.log(`💡 Suggestions: ${this.suggestions.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.suggestions.length > 0) {
      console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.suggestion}`);
        console.log(`   File: ${path.relative(process.cwd(), suggestion.file)}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n🚀 Bundle optimization analysis complete!');
    console.log('Review suggestions and implement lazy loading for heavy components.');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new DynamicImportOptimizer();
  optimizer.run();
}

module.exports = DynamicImportOptimizer;
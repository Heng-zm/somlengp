#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ComprehensivePerformanceFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.optimizations = {
      useEffectDeps: 0,
      inlineObjects: 0,
      memoization: 0,
      eventHandlers: 0,
      imports: 0
    };
  }

  optimizeFile(filePath) {
    try {
      if (this.shouldSkipFile(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // 1. Fix useEffect without dependencies
      const useEffectResult = this.fixUseEffect(modifiedContent);
      if (useEffectResult.changed) {
        modifiedContent = useEffectResult.content;
        hasChanges = true;
        this.optimizations.useEffectDeps++;
      }

      // 2. Add React.memo where appropriate
      const memoResult = this.addReactMemo(modifiedContent);
      if (memoResult.changed) {
        modifiedContent = memoResult.content;
        hasChanges = true;
        this.optimizations.memoization++;
      }

      // 3. Optimize imports
      const importResult = this.optimizeImports(modifiedContent);
      if (importResult.changed) {
        modifiedContent = importResult.content;
        hasChanges = true;
        this.optimizations.imports++;
      }

      // 4. Add performance comments for inline objects
      const inlineObjectResult = this.addInlineObjectComments(modifiedContent);
      if (inlineObjectResult.changed) {
        modifiedContent = inlineObjectResult.content;
        hasChanges = true;
        this.optimizations.inlineObjects++;
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.fixedFiles.push(filePath);
        console.log(`✅ Optimized: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error optimizing ${filePath}:`, error.message);
    }
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      /\\.test\\./,
      /\\.spec\\./,
      /\\.stories\\./,
      /\\.example\\./,
      /node_modules/,
      /__tests__/,
      /\\.d\\.ts$/
    ];
    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  fixUseEffect(content) {
    let modified = content;
    let changed = false;

    // Fix useEffect without dependency arrays
    const useEffectPattern = /useEffect\\(\\s*([^,)]+)\\s*\\)(?!\\s*,\\s*\\[)/g;
    
    modified = modified.replace(useEffectPattern, (match, callback) => {
      // Skip if already has dependencies or is malformed
      if (callback.includes('[') || callback.includes(',')) {
        return match;
      }
      changed = true;
      return `useEffect(${callback.trim()}, [])`;
    });

    return { content: modified, changed };
  }

  addReactMemo(content) {
    let modified = content;
    let changed = false;

    // Check if it's a React component file that should be memoized
    if (!this.isReactComponent(content)) {
      return { content: modified, changed: false };
    }

    // Skip if already memoized or forwardRef
    if (content.includes('memo(') || content.includes('forwardRef') || 
        content.includes('Context.Provider') || content.includes('createContext')) {
      return { content: modified, changed: false };
    }

    // Add memo import if not present
    if (!content.includes('memo') && content.includes('from \'react\'')) {
      modified = modified.replace(
        /import React(?:, \{ ([^}]+) \})? from 'react'/,
        (match, imports) => {
          if (imports) {
            return `import React, { ${imports}, memo } from 'react'`;
          } else {
            return `import React, { memo } from 'react'`;
          }
        }
      );
      changed = true;
    }

    // Find export default function and wrap with memo
    const exportDefaultPattern = /export default function (\\w+)\\(/;
    const match = modified.match(exportDefaultPattern);
    if (match) {
      const componentName = match[1];
      // Add memo wrapper
      modified = modified.replace(
        new RegExp(`export default function ${componentName}`, 'g'),
        `const ${componentName}Component = function ${componentName}`
      );
      modified += `\\n\\nexport default memo(${componentName}Component);`;
      changed = true;
    }

    return { content: modified, changed };
  }

  isReactComponent(content) {
    return (
      content.includes('export default function') ||
      content.includes('export function') ||
      content.includes('const ') && content.includes('= (') && content.includes('return')
    ) && (
      content.includes('jsx') || 
      content.includes('<') || 
      content.includes('React.') ||
      /\\.(tsx|jsx)$/.test(content)
    );
  }

  optimizeImports(content) {
    let modified = content;
    let changed = false;

    // Combine multiple React imports into one line
    const reactImports = [];
    const reactImportPattern = /import React(?:, \\{ ([^}]+) \\})? from 'react';?\\n?/g;
    let match;

    while ((match = reactImportPattern.exec(content)) !== null) {
      if (match[1]) {
        reactImports.push(...match[1].split(',').map(imp => imp.trim()));
      }
    }

    if (reactImports.length > 1) {
      // Remove duplicate imports and combine
      const uniqueImports = [...new Set(reactImports)];
      const combinedImport = `import React, { ${uniqueImports.join(', ')} } from 'react';\\n`;
      
      modified = modified.replace(reactImportPattern, '');
      modified = combinedImport + modified;
      changed = true;
    }

    return { content: modified, changed };
  }

  addInlineObjectComments(content) {
    let modified = content;
    let changed = false;

    const inlinePatterns = [
      { pattern: /style=\\{\\{[^}]+\\}\\}/g, suggestion: 'Move inline styles to useMemo or constants' },
      { pattern: /className=\\{`[^`]*\\$\\{[^}]*\\}[^`]*`\\}/g, suggestion: 'Use useMemo for dynamic className' },
      { pattern: /onClick=\\{\\(\\) => [^}]+\\}/g, suggestion: 'Use useCallback for event handlers' }
    ];

    const suggestions = [];
    inlinePatterns.forEach(({ pattern, suggestion }) => {
      if (pattern.test(content)) {
        suggestions.push(suggestion);
      }
    });

    if (suggestions.length > 0 && !content.includes('TODO: Performance optimizations')) {
      const comment = `// TODO: Performance optimizations needed:\\n${suggestions.map(s => `// - ${s}`).join('\\n')}\\n\\n`;
      
      // Add comment after imports
      const importMatch = modified.match(/^((?:import[^;]+;[\\r\\n]*)*)/);
      if (importMatch) {
        const imports = importMatch[1];
        const rest = modified.substring(imports.length);
        modified = imports + comment + rest;
        changed = true;
      }
    }

    return { content: modified, changed };
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
      } else if (/\\.(tsx?|jsx?)$/.test(file)) {
        this.optimizeFile(filePath);
      }
    });
  }

  run() {
    console.log('⚡ Running comprehensive performance optimizations...\\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\\n📊 OPTIMIZATION RESULTS:');
    console.log('========================');
    console.log(`✅ Optimized files: ${this.fixedFiles.length}`);
    console.log(`🔧 useEffect deps fixed: ${this.optimizations.useEffectDeps}`);
    console.log(`🎭 Components memoized: ${this.optimizations.memoization}`);
    console.log(`📦 Imports optimized: ${this.optimizations.imports}`);
    console.log(`💡 Inline object comments: ${this.optimizations.inlineObjects}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\\n🚀 Performance optimization complete!');
    console.log('Review TODO comments in files for manual optimizations.');
  }
}

// Run the comprehensive optimizer
if (require.main === module) {
  const optimizer = new ComprehensivePerformanceFixer();
  optimizer.run();
}

module.exports = ComprehensivePerformanceFixer;
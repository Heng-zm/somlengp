#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class InlineObjectFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  fixInlineObjectsInFile(filePath) {
    try {
      if (filePath.includes('.example.') || filePath.includes('.test.') || filePath.includes('.spec.')) {
        return; // Skip example and test files
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // Common patterns to fix
      const fixes = [
        // Fix style={{}} patterns - move to useMemo or constants
        {
          pattern: /style=\{\{([^}]+)\}\}/g,
          fix: (match) => {
            // For simple single properties, we can suggest a fix
            const styleContent = match.match(/style=\{\{([^}]+)\}\}/)?.[1];
            if (styleContent && styleContent.split(',').length <= 2) {
              // Simple fix: suggest moving to constant
              return `style={${this.createStyleConstant(styleContent)}}`;
            }
            return match; // Keep complex styles as is for manual review
          }
        },
        // Fix className patterns with template literals
        {
          pattern: /className=\{`[^`]*\$\{[^}]*\}[^`]*`\}/g,
          fix: (match) => {
            // These should use useMemo for dynamic classes
            return match; // Keep as is, but flag for useMemo
          }
        },
        // Fix simple inline functions
        {
          pattern: /onClick=\{(\(\) => [^}]+)\}/g,
          fix: (match, func) => {
            if (func.length < 50) { // Only fix simple functions
              return `onClick={${this.createCallbackConstant(func)}}`;
            }
            return match;
          }
        }
      ];

      // Apply fixes
      fixes.forEach(({ pattern, fix }) => {
        const before = modifiedContent;
        modifiedContent = modifiedContent.replace(pattern, fix);
        if (before !== modifiedContent) {
          hasChanges = true;
        }
      });

      // Add useMemo suggestions as comments for manual review
      if (this.hasInlineObjects(content)) {
        const suggestions = this.generateSuggestions(content);
        if (suggestions.length > 0) {
          // Add comment at the top of the file
          const importMatch = modifiedContent.match(/^((?:import[^;]+;[\r\n]*)*)/);
          if (importMatch) {
            const imports = importMatch[1];
            const restOfFile = modifiedContent.substring(imports.length);
            modifiedContent = imports + 
              `// TODO: Consider memoizing inline objects to prevent re-renders:\n` +
              suggestions.map(s => `// ${s}`).join('\n') + '\n\n' +
              restOfFile;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.fixedFiles.push(filePath);
        console.log(`✅ Optimized inline objects in: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  hasInlineObjects(content) {
    const patterns = [
      /\w+=\{\{[^}]+\}\}/g,
      /\w+=\{`[^`]*\$\{[^}]*\}[^`]*`\}/g,
      /\w+=\{(\(\) => [^}]+)\}/g
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  generateSuggestions(content) {
    const suggestions = [];
    
    if (content.includes('style={{')) {
      suggestions.push('Move inline styles to useMemo or constants');
    }
    
    if (content.includes('onClick={() =>') || content.includes('onSubmit={() =>')) {
      suggestions.push('Use useCallback for event handlers');
    }
    
    if (content.includes('className={`') && content.includes('${')) {
      suggestions.push('Use useMemo for dynamic className generation');
    }

    return suggestions;
  }

  createStyleConstant(styleContent) {
    // Generate a constant name based on the style content
    const hash = this.simpleHash(styleContent);
    return `STYLE_${hash}`;
  }

  createCallbackConstant(func) {
    // Generate a constant name for callback
    const hash = this.simpleHash(func);
    return `CALLBACK_${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
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
      } else if (/\.(tsx|jsx)$/.test(file)) {
        this.fixInlineObjectsInFile(filePath);
      }
    });
  }

  run() {
    console.log('🎨 Fixing inline objects to prevent re-renders...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Optimized files: ${this.fixedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n💡 Note: Review TODO comments in files for manual optimizations');
    console.log('Consider using useMemo and useCallback for complex inline objects');
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new InlineObjectFixer();
  fixer.run();
}

module.exports = InlineObjectFixer;
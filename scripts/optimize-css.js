#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CSSOptimizer {
  constructor() {
    this.optimizedFiles = [];
    this.removedVariables = [];
    this.errors = [];
  }

  findCSSVariableUsage() {
    const usage = new Set();
    const srcDir = path.join(process.cwd(), 'src');
    
    this.scanForUsage(srcDir, usage);
    
    // Add common Tailwind CSS variables that are used via classes
    const tailwindVariables = [
      'background', 'foreground', 'card', 'card-foreground',
      'popover', 'popover-foreground', 'primary', 'primary-foreground',
      'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'destructive-foreground',
      'border', 'input', 'ring', 'radius', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'
    ];
    
    tailwindVariables.forEach(variable => usage.add(variable));
    
    return usage;
  }

  scanForUsage(dir, usage) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          this.scanForUsage(filePath, usage);
        }
      } else if (/\.(tsx?|jsx?|css|scss)$/.test(file)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find var() usage
          const varMatches = content.match(/var\(--([a-zA-Z0-9-]+)\)/g) || [];
          varMatches.forEach(match => {
            const varName = match.match(/var\(--([a-zA-Z0-9-]+)\)/)?.[1];
            if (varName) {
              usage.add(varName);
            }
          });
          
          // Find CSS class usage that might map to CSS variables
          const classMatches = content.match(/(?:class|className)=["'][^"']*["']/g) || [];
          classMatches.forEach(match => {
            const classes = match.match(/["']([^"']*)["']/)?.[1]?.split(/\s+/) || [];
            classes.forEach(cls => {
              // Map common Tailwind classes to CSS variables
              if (cls.startsWith('bg-')) {
                const varName = cls.replace('bg-', '');
                usage.add(varName);
              } else if (cls.startsWith('text-')) {
                const varName = cls.replace('text-', '');
                usage.add(varName);
              } else if (cls.startsWith('border-')) {
                const varName = cls.replace('border-', '');
                usage.add(varName);
              }
            });
          });
          
        } catch (error) {
          this.errors.push({ file: filePath, error: error.message });
        }
      }
    });
  }

  optimizeGlobalCSS() {
    const globalCSSPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    
    if (!fs.existsSync(globalCSSPath)) {
      console.log('❌ globals.css not found');
      return;
    }

    const content = fs.readFileSync(globalCSSPath, 'utf8');
    const usage = this.findCSSVariableUsage();
    
    console.log('🔍 Found usage for variables:', Array.from(usage).sort());
    
    // Find all CSS variables in the file
    const cssVarRegex = /--([a-zA-Z0-9-]+):\s*[^;]+;/g;
    let match;
    const definedVars = [];
    
    while ((match = cssVarRegex.exec(content)) !== null) {
      definedVars.push({
        fullMatch: match[0],
        varName: match[1],
        index: match.index
      });
    }
    
    console.log('📝 Defined variables:', definedVars.map(v => v.varName).sort());
    
    // Identify unused variables (excluding mono- prefixed ones which might be used in themes)
    const unusedVars = definedVars.filter(variable => {
      // Keep chart variables and essential theme variables
      if (variable.varName.startsWith('chart-') || 
          ['radius', 'background', 'foreground', 'border', 'input', 'ring'].includes(variable.varName)) {
        return false;
      }
      
      // Keep mono variables as they might be part of a color system
      if (variable.varName.startsWith('mono-')) {
        return false;
      }
      
      return !usage.has(variable.varName);
    });
    
    if (unusedVars.length === 0) {
      console.log('✅ No unused CSS variables found in globals.css');
      return;
    }
    
    console.log('🗑️  Removing unused variables:', unusedVars.map(v => v.varName));
    
    // Remove unused variables
    let modifiedContent = content;
    unusedVars.reverse().forEach(variable => {
      // Remove the variable line and any following empty line
      const lines = modifiedContent.split('\\n');
      const lineIndex = lines.findIndex(line => line.includes(variable.fullMatch));
      
      if (lineIndex !== -1) {
        lines.splice(lineIndex, 1);
        // Remove empty line after if it exists
        if (lineIndex < lines.length && lines[lineIndex].trim() === '') {
          lines.splice(lineIndex, 1);
        }
      }
      
      this.removedVariables.push(variable.varName);
    });
    
    modifiedContent = unusedVars.reduce((content, variable) => {
      return content.replace(new RegExp(`\\s*${variable.fullMatch.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*`, 'g'), '');
    }, modifiedContent);
    
    // Clean up extra whitespace
    modifiedContent = modifiedContent.replace(/\n\n\n+/g, '\n\n');
    
    fs.writeFileSync(globalCSSPath, modifiedContent);
    this.optimizedFiles.push(globalCSSPath);
    
    console.log(`✅ Optimized globals.css - removed ${unusedVars.length} unused variables`);
  }

  run() {
    console.log('🎨 Optimizing CSS files...\n');
    
    this.optimizeGlobalCSS();
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Optimized files: ${this.optimizedFiles.length}`);
    console.log(`🗑️  Removed variables: ${this.removedVariables.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.removedVariables.length > 0) {
      console.log('\nRemoved variables:');
      this.removedVariables.forEach(variable => {
        console.log(`  - --${variable}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✨ CSS optimization complete!');
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new CSSOptimizer();
  optimizer.run();
}

module.exports = CSSOptimizer;
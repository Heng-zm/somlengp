#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ConsoleLogRemover {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      /\.test\./,
      /\.spec\./,
      /\.stories\./,
      /dev\./,
      /debug\./,
      /example\./,
      /demo\./,
      /__tests__/,
      /\.d\.ts$/,
      /node_modules/,
    ];
    
    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  removeConsoleLogsFromFile(filePath) {
    try {
      if (this.shouldSkipFile(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // Improved patterns to match complete console statements only
      const patterns = [
        // Single line console statements with semicolon
        /^\s*console\.(log|info|debug|trace)\([^)]*\);?\s*$/gm,
        // Multi-line console statements (but preserve console.warn and console.error for production logging)
      ];

      patterns.forEach(pattern => {
        const matches = modifiedContent.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Skip console.error and console.warn - keep them for production logging
            if (match.includes('console.error') || match.includes('console.warn')) {
              return;
            }
            
            // Only remove console.log, console.info, console.debug, console.trace
            if (match.includes('console.log') || match.includes('console.info') || 
                match.includes('console.debug') || match.includes('console.trace')) {
              modifiedContent = modifiedContent.replace(match, '');
              hasChanges = true;
            }
          });
        }
      });

      // Clean up empty lines left by removed console statements
      if (hasChanges) {
        modifiedContent = modifiedContent.replace(/^\s*\n/gm, '\n').replace(/\n\n\n+/g, '\n\n');
        
        fs.writeFileSync(filePath, modifiedContent);
        this.fixedFiles.push(filePath);
        console.log(`✅ Removed console logs from: ${path.relative(process.cwd(), filePath)}`);
      }
      
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, .next, and .git directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          this.scanDirectory(filePath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        this.removeConsoleLogsFromFile(filePath);
      }
    });
  }

  run() {
    console.log('🧹 Removing console.log statements from production files...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Cleaned files: ${this.fixedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✨ Console statements cleaned up for production!');
    console.log('Note: console.error statements for error handling were preserved.');
  }
}

// Run the remover
if (require.main === module) {
  const remover = new ConsoleLogRemover();
  remover.run();
}

module.exports = ConsoleLogRemover;
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class UseEffectFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  fixUseEffectInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // Improved pattern to match useEffect without dependency array
      const useEffectPattern = /useEffect\(\s*([^,)]+)\s*\)/g;
      
      let match;
      const replacements = [];
      
      while ((match = useEffectPattern.exec(content)) !== null) {
        const fullMatch = match[0];
        const callback = match[1].trim();
        
        // Check if callback is malformed or already has dependency array
        if (callback.includes(',') || fullMatch.includes('[') || callback.includes('(,')) {
          continue; // Skip malformed or already handled cases
        }
        
        // Add empty dependency array
        const replacement = `useEffect(${callback}, [])`;
        replacements.push({
          original: fullMatch,
          replacement: replacement,
          index: match.index
        });
        hasChanges = true;
      }
      
      // Apply replacements from end to start to maintain correct indices
      replacements.reverse().forEach(replacement => {
        modifiedContent = 
          modifiedContent.slice(0, replacement.index) + 
          replacement.replacement + 
          modifiedContent.slice(replacement.index + replacement.original.length);
      });

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.fixedFiles.push(filePath);
        console.log(`✅ Fixed useEffect dependencies in: ${filePath}`);
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
        this.fixUseEffectInFile(filePath);
      }
    });
  }

  run() {
    console.log('🔧 Fixing useEffect dependency arrays...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Fixed files: ${this.fixedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n⚠️  Note: Please review the changes and add proper dependencies where needed.');
    console.log('Empty dependency arrays ([]) mean the effect runs only once on mount.');
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new UseEffectFixer();
  fixer.run();
}

module.exports = UseEffectFixer;
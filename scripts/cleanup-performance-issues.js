#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  rootDir: process.cwd(),
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  exclude: [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '__tests__',
    '.test.',
    '.spec.'
  ],
  // Console methods to remove in production
  consoleMethods: ['console.log', 'console.debug', 'console.info'],
  // Keep these console methods for important messages
  keepConsoleMethods: ['console.error', 'console.warn']
};

// Statistics tracking
const stats = {
  filesProcessed: 0,
  consoleStatementsRemoved: 0,
  unusedImportsRemoved: 0,
  issuesFixed: 0
};

// Utility functions
function isExcluded(filePath) {
  return config.exclude.some(exclude => filePath.includes(exclude));
}

function hasValidExtension(filePath) {
  return config.extensions.some(ext => filePath.endsWith(ext));
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    
    if (isExcluded(fullPath)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (hasValidExtension(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Content processing functions
function removeConsoleStatements(content) {
  let modified = content;
  let removedCount = 0;
  
  // Remove console.log, console.debug, console.info statements
  const consolePattern = /\s*console\.(log|debug|info)\([^)]*\);\s*/g;
  const matches = content.match(consolePattern);
  
  if (matches) {
    removedCount = matches.length;
    modified = content.replace(consolePattern, '');
    
    // Clean up empty lines that might be left
    modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');
  }
  
  return { content: modified, removedCount };
}

function removeUnusedImports(content) {
  const lines = content.split('\n');
  const importLines = [];
  const codeLines = [];
  let removedCount = 0;
  
  // Separate import lines from code
  for (const line of lines) {
    if (line.trim().startsWith('import ')) {
      importLines.push(line);
    } else {
      codeLines.push(line);
    }
  }
  
  const codeContent = codeLines.join('\n');
  const usedImports = [];
  
  // Check each import line
  for (const importLine of importLines) {
    // Extract imported items
    const match = importLine.match(/import\s+(?:{([^}]+)}|([^,\s]+))/);
    if (match) {
      const imports = match[1] ? 
        match[1].split(',').map(i => i.trim()) : 
        [match[2]];
      
      // Check if any import is used in the code
      const isUsed = imports.some(imp => {
        const cleanName = imp.replace(/\s+as\s+\w+/, '').trim();
        return codeContent.includes(cleanName);
      });
      
      if (isUsed) {
        usedImports.push(importLine);
      } else {
        removedCount++;
      }
    } else {
      // Keep imports we can't parse
      usedImports.push(importLine);
    }
  }
  
  // Reconstruct content
  const newContent = [...usedImports, '', ...codeLines].join('\n');
  
  return { content: newContent, removedCount };
}

function fixCommonIssues(content) {
  let modified = content;
  let fixCount = 0;
  
  // Fix missing alt attributes on img tags
  const imgPattern = /<img\s+([^>]*?)(?:alt\s*=\s*["'][^"']*["'])?\s*([^>]*?)>/g;
  modified = modified.replace(imgPattern, (match, before, after) => {
    if (!match.includes('alt=')) {
      fixCount++;
      return `<img ${before}alt="" ${after}>`;
    }
    return match;
  });
  
  // Fix React unescaped entities
  const entityPattern = /(['"])(.*?)(['"])/g;
  modified = modified.replace(entityPattern, (match, quote1, content, quote2) => {
    if (content.includes("'") && !content.includes("&apos;")) {
      const fixed = content.replace(/'/g, "&apos;");
      if (fixed !== content) {
        fixCount++;
        return `${quote1}${fixed}${quote2}`;
      }
    }
    return match;
  });
  
  return { content: modified, fixCount };
}

function processFile(filePath) {
  try {
    const relativePath = path.relative(config.rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    let modifiedContent = content;
    let hasChanges = false;
    
    // Remove console statements
    const consoleResult = removeConsoleStatements(modifiedContent);
    modifiedContent = consoleResult.content;
    stats.consoleStatementsRemoved += consoleResult.removedCount;
    if (consoleResult.removedCount > 0) hasChanges = true;
    
    // Remove unused imports (only for TypeScript/JavaScript files)
    if (['.ts', '.tsx', '.js', '.jsx'].some(ext => filePath.endsWith(ext))) {
      const importResult = removeUnusedImports(modifiedContent);
      modifiedContent = importResult.content;
      stats.unusedImportsRemoved += importResult.removedCount;
      if (importResult.removedCount > 0) hasChanges = true;
    }
    
    // Fix common issues
    const fixResult = fixCommonIssues(modifiedContent);
    modifiedContent = fixResult.content;
    stats.issuesFixed += fixResult.fixCount;
    if (fixResult.fixCount > 0) hasChanges = true;
    
    // Write back if there are changes
    if (hasChanges && modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      console.log(`✅ Processed: ${relativePath}`);
      
      if (consoleResult.removedCount > 0) {
        console.log(`   - Removed ${consoleResult.removedCount} console statements`);
      }
      if (importResult.removedCount > 0) {
        console.log(`   - Removed ${importResult.removedCount} unused imports`);
      }
      if (fixResult.fixCount > 0) {
        console.log(`   - Fixed ${fixResult.fixCount} common issues`);
      }
    }
    
    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
function main() {
  console.log('🚀 Starting performance optimization cleanup...\n');
  
  const startTime = Date.now();
  const files = getAllFiles(path.join(config.rootDir, 'src'));
  
  console.log(`Found ${files.length} files to process\n`);
  
  files.forEach(processFile);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 CLEANUP SUMMARY');
  console.log('==================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Console statements removed: ${stats.consoleStatementsRemoved}`);
  console.log(`Unused imports removed: ${stats.unusedImportsRemoved}`);
  console.log(`Common issues fixed: ${stats.issuesFixed}`);
  console.log(`Execution time: ${duration}s`);
  
  if (stats.consoleStatementsRemoved === 0 && stats.unusedImportsRemoved === 0 && stats.issuesFixed === 0) {
    console.log('\n✨ No performance issues found! Code is already clean.');
  } else {
    console.log('\n✅ Performance cleanup completed successfully!');
    console.log('💡 Remember to test your application after these changes.');
    console.log('💡 Run `npm run lint` and `npm run typecheck` to verify everything is working.');
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  processFile,
  getAllFiles,
  removeConsoleStatements,
  removeUnusedImports,
  fixCommonIssues
};

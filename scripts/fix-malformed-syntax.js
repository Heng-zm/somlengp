#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to fix
const patterns = [
  // Fix malformed function parameters: (, [])
  {
    name: 'malformed function parameters',
    regex: /\(\s*,\s*\[\]\s*\)/g,
    replacement: '()'
  },
  // Fix malformed function calls with empty first parameter: function(, [])
  {
    name: 'malformed function calls',
    regex: /(\w+)\(\s*,\s*\[\]\s*\)/g,
    replacement: '$1()'
  },
  // Fix setTimeout with malformed parameters: setTimeout((, []) => {
  {
    name: 'malformed setTimeout',
    regex: /setTimeout\(\s*\(\s*,\s*\[\]\s*\)\s*=>\s*/g,
    replacement: 'setTimeout(() => '
  },
  // Fix return statements with malformed parameters: return (, []) => {
  {
    name: 'malformed return statements',
    regex: /return\s*\(\s*,\s*\[\]\s*\)\s*=>\s*/g,
    replacement: 'return () => '
  },
  // Fix function calls with trailing , []
  {
    name: 'trailing arrays in function calls',
    regex: /(\w+\([^)]*)([^,)]+),\s*\[\]\s*\)/g,
    replacement: '$1$2)'
  },
  // Fix clearTimeout with malformed parameters
  {
    name: 'malformed clearTimeout',
    regex: /clearTimeout\(([^,)]+),\s*\[\]\s*\)/g,
    replacement: 'clearTimeout($1)'
  },
  // Fix router.replace with extra array parameter
  {
    name: 'malformed router calls',
    regex: /(router\.\w+\([^)]+),\s*\[\]\s*\)/g,
    replacement: '$1)'
  },
  // Fix catch statements with extra array parameter
  {
    name: 'malformed catch statements',
    regex: /catch\s*\(([^,)]+),\s*\[\]\s*\)/g,
    replacement: 'catch ($1)'
  },
  // Fix scrollTo with extra array parameter
  {
    name: 'malformed scrollTo calls',
    regex: /(\w+\.scrollTo\([^)]+),\s*\[[^\]]*\]\s*\)/g,
    replacement: '$1)'
  },
  // Fix function parameters with trailing array: (param, [])
  {
    name: 'malformed function parameters with trailing arrays',
    regex: /(\([^)]*\w+\s*),\s*\[\]\s*\)/g,
    replacement: '$1)'
  }
];

let totalFilesProcessed = 0;
let totalFilesFixed = 0;
let totalFixesApplied = 0;

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let fileHadChanges = false;
    let fileFixesCount = 0;
    const appliedFixes = [];

    patterns.forEach(pattern => {
      const originalContent = modifiedContent;
      modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
      
      if (originalContent !== modifiedContent) {
        // Count how many times this pattern was fixed
        const matches = originalContent.match(pattern.regex);
        if (matches) {
          fileFixesCount += matches.length;
          appliedFixes.push(`${matches.length} ${pattern.name}`);
          fileHadChanges = true;
        }
      }
    });

    if (fileHadChanges) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✅ Fixed ${fileFixesCount} issues in: ${path.relative(process.cwd(), filePath)}`);
      console.log(`   Applied fixes: ${appliedFixes.join(', ')}`);
      totalFilesFixed++;
      totalFixesApplied += fileFixesCount;
    }

    totalFilesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
        walkDirectory(itemPath);
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      processFile(itemPath);
    }
  });
}

console.log('🔧 Starting comprehensive syntax repair for malformed patterns...\n');

// Start processing from src directory
walkDirectory(srcDir);

console.log(`\n📊 Syntax Repair Summary:`);
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Files fixed: ${totalFilesFixed}`);
console.log(`   Total fixes applied: ${totalFixesApplied}`);

if (totalFilesFixed > 0) {
  console.log(`\n✅ Syntax repair completed successfully!`);
  console.log(`\n🚀 You can now try running your development server again.`);
} else {
  console.log(`\n✨ No syntax errors found that needed fixing.`);
}
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

let totalFilesProcessed = 0;
let totalFilesFixed = 0;

function fixUseClientPlacement(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find the "use client" directive
    let useClientIndex = -1;
    let firstImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '"use client"' || line === "'use client'") {
        useClientIndex = i;
      }
      
      if (line.startsWith('import ') && firstImportIndex === -1) {
        firstImportIndex = i;
      }
    }
    
    // If "use client" is found and there are imports before it
    if (useClientIndex !== -1 && firstImportIndex !== -1 && firstImportIndex < useClientIndex) {
      // Remove "use client" from its current position
      const useClientLine = lines[useClientIndex];
      lines.splice(useClientIndex, 1);
      
      // Find the proper position to insert it (before all imports, after comments/empty lines)
      let insertIndex = 0;
      while (insertIndex < lines.length) {
        const line = lines[insertIndex].trim();
        if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
          insertIndex++;
        } else {
          break;
        }
      }
      
      // Insert "use client" at the proper position
      lines.splice(insertIndex, 0, useClientLine);
      
      // Add an empty line after "use client" if there isn't one
      if (insertIndex + 1 < lines.length && lines[insertIndex + 1].trim() !== '') {
        lines.splice(insertIndex + 1, 0, '');
      }
      
      const newContent = lines.join('\n');
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Fixed "use client" placement in: ${path.relative(process.cwd(), filePath)}`);
        totalFilesFixed++;
      }
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
      fixUseClientPlacement(itemPath);
    }
  });
}

console.log('🔧 Fixing "use client" directive placement...\n');

// Start processing from src directory
walkDirectory(srcDir);

console.log(`\n📊 Use Client Fix Summary:`);
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Files fixed: ${totalFilesFixed}`);

if (totalFilesFixed > 0) {
  console.log(`\n✅ "Use client" placement fixes completed successfully!`);
} else {
  console.log(`\n✨ No "use client" placement issues found.`);
}
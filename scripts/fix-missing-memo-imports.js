#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

let totalFilesProcessed = 0;
let totalFilesFixed = 0;

function fixMemoImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses memo but doesn't import it
    const usesMemo = /\bmemo\s*\(/.test(content);
    const hasMemoImport = /import\s*\{[^}]*\bmemo\b[^}]*\}\s*from\s*['"]react['"]/.test(content);
    
    if (usesMemo && !hasMemoImport) {
      let modifiedContent = content;
      
      // Look for existing React imports
      const reactImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react['"];?/);
      
      if (reactImportMatch) {
        // Add memo to existing React import
        const existingImports = reactImportMatch[1].trim();
        const newImports = existingImports ? `${existingImports}, memo` : 'memo';
        modifiedContent = content.replace(
          /import\s*\{([^}]*)\}\s*from\s*['"]react['"];?/,
          `import { ${newImports} } from 'react';`
        );
      } else {
        // Look for default React import
        const defaultImportMatch = content.match(/import\s+React\s+from\s*['"]react['"];?/);
        if (defaultImportMatch) {
          // Add named import alongside default import
          modifiedContent = content.replace(
            /import\s+React\s+from\s*['"]react['"];?/,
            `import React, { memo } from 'react';`
          );
        } else {
          // Add new React import at the top after 'use client' or other directives
          const lines = content.split('\n');
          let insertIndex = 0;
          
          // Skip over 'use client', comments, and empty lines
          while (insertIndex < lines.length) {
            const line = lines[insertIndex].trim();
            if (line === '' || line.startsWith('//') || line.startsWith('/*') || 
                line === "'use client';" || line === '"use client";') {
              insertIndex++;
            } else {
              break;
            }
          }
          
          lines.splice(insertIndex, 0, "import { memo } from 'react';");
          modifiedContent = lines.join('\n');
        }
      }
      
      // Only write if content actually changed
      if (modifiedContent !== content) {
        fs.writeFileSync(filePath, modifiedContent);
        console.log(`✅ Fixed memo import in: ${path.relative(process.cwd(), filePath)}`);
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
      fixMemoImports(itemPath);
    }
  });
}

console.log('🔧 Fixing missing memo imports...\n');

// Start processing from src directory
walkDirectory(srcDir);

console.log(`\n📊 Memo Import Fix Summary:`);
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Files fixed: ${totalFilesFixed}`);

if (totalFilesFixed > 0) {
  console.log(`\n✅ Memo import fixes completed successfully!`);
} else {
  console.log(`\n✨ No missing memo imports found.`);
}
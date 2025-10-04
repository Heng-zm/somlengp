#!/usr/bin/env node

/**
 * Script to automatically fix common code quality issues
 * Run with: node scripts/fix-common-issues.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting automated fixes for common code quality issues...\n');

// Function to recursively find all TypeScript/JavaScript files
function findSourceFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findSourceFiles(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix unused error variables in catch blocks
function fixUnusedErrorVariables(content) {
  // Replace catch (error) with catch (_error) if error is not used
  return content.replace(
    /catch\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)\s*\{([^}]*)\}/g,
    (match, errorVar, body) => {
      // Check if the error variable is used in the body
      const errorRegex = new RegExp(`\\b${errorVar}\\b`, 'g');
      const matches = body.match(errorRegex);
      
      // If error is not used or used only once (just the parameter), prefix with underscore
      if (!matches || matches.length <= 1) {
        return match.replace(`(${errorVar})`, `(_${errorVar})`);
      }
      
      return match;
    }
  );
}

// Add console.error for unused error variables
function addErrorLogging(content) {
  // Look for catch blocks with unused error variables and add logging
  return content.replace(
    /catch\s*\(\s*_([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)\s*\{\s*([^}]*)\s*\}/g,
    (match, errorVar, body) => {
      // If there's no logging, add it
      if (!body.includes('console.') && !body.includes('log')) {
        const indent = match.match(/\n(\s*)/)?.[1] || '  ';
        return match.replace(
          '{',
          `{\n${indent}  console.error('Error in operation:', _${errorVar});`
        );
      }
      return match;
    }
  );
}

// Remove unused function parameters by prefixing with underscore
function fixUnusedParameters(content) {
  // Simple heuristic: if a parameter name appears only once in the function, it's likely unused
  return content.replace(
    /function\s+[^(]*\(([^)]*)\)\s*\{([^}]*)\}/g,
    (match, params, body) => {
      if (!params.trim()) return match;
      
      const paramList = params.split(',').map(p => p.trim());
      const fixedParams = paramList.map(param => {
        const paramName = param.split(':')[0].trim();
        if (paramName && !paramName.startsWith('_')) {
          const paramRegex = new RegExp(`\\b${paramName}\\b`, 'g');
          const usages = (body.match(paramRegex) || []).length;
          
          // If parameter is used only once (the declaration), prefix with underscore
          if (usages === 0) {
            return param.replace(paramName, `_${paramName}`);
          }
        }
        return param;
      });
      
      return match.replace(`(${params})`, `(${fixedParams.join(', ')})`);
    }
  );
}

let filesProcessed = 0;
let issuesFixed = 0;

try {
  const sourceFiles = findSourceFiles('src');
  console.log(`📁 Found ${sourceFiles.length} source files to analyze\n`);
  
  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let modifiedContent = content;
      
      // Apply fixes
      const originalContent = modifiedContent;
      modifiedContent = fixUnusedErrorVariables(modifiedContent);
      modifiedContent = addErrorLogging(modifiedContent);
      
      // Only write if content changed
      if (modifiedContent !== originalContent) {
        fs.writeFileSync(file, modifiedContent);
        console.log(`✅ Fixed issues in: ${file.replace(process.cwd(), '.')}`);
        issuesFixed++;
      }
      
      filesProcessed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Processing complete!`);
  console.log(`📊 Files processed: ${filesProcessed}`);
  console.log(`🔧 Files with fixes applied: ${issuesFixed}`);
  
  if (issuesFixed > 0) {
    console.log(`\n💡 Recommendations:`);
    console.log(`   • Run 'npm run lint' to check for remaining issues`);
    console.log(`   • Run 'npm run typecheck' to verify TypeScript compilation`);
    console.log(`   • Review the changes and test your application`);
  }
  
} catch (error) {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}
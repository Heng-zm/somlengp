#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Patterns to fix
const patterns = [
  // Fix malformed function parameters: (, [])
  {
    regex: /\(\s*,\s*\[\]\s*\)/g,
    replacement: '()'
  },
  // Fix malformed function calls with empty first parameter: function(, [])
  {
    regex: /(\w+\s*)\(\s*,\s*\[\]\s*\)/g,
    replacement: '$1()'
  },
  // Fix setTimeout with malformed parameters: setTimeout((, []) => {
  {
    regex: /setTimeout\(\s*\(\s*,\s*\[\]\s*\)\s*=>\s*\{/g,
    replacement: 'setTimeout(() => {'
  },
  // Fix return statements with malformed parameters: return (, []) => {
  {
    regex: /return\s*\(\s*,\s*\[\]\s*\)\s*=>\s*\{/g,
    replacement: 'return () => {'
  },
  // Fix function calls with trailing , []
  {
    regex: /(\w+\([^)]*)\,\s*\[\]\s*\)/g,
    replacement: '$1)'
  },
  // Fix clearTimeout with malformed parameters
  {
    regex: /clearTimeout\([^,)]+,\s*\[\]\s*\)/g,
    replacement: (match) => {
      const cleanMatch = match.replace(/,\s*\[\]\s*/, '');
      return cleanMatch;
    }
  }
];

let totalFilesProcessed = 0;
let totalFilesFixed = 0;
let totalFixesApplied = 0;
    this.errors = [];
  }

  repairFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // Fix broken useEffect patterns
      const repairs = [
        // Fix "useEffect((, []) => {" patterns
        {
          pattern: /useEffect\(\(,\s*\[\]\)\s*=>\s*\{/g,
          replacement: 'useEffect(() => {'
        },
        // Fix "useEffect((, [callback]) => {" patterns  
        {
          pattern: /useEffect\(\(,\s*\[([^\]]*)\]\)\s*=>\s*\{/g,
          replacement: 'useEffect(() => {'
        },
        // Fix conditional statements with ", []" in them like "if (title && pathname, [])"
        {
          pattern: /if\s*\([^)]+,\s*\[\]\s*\)/g,
          replacement: (match) => {
            return match.replace(/,\s*\[\]\s*\)/, ')');
          }
        },
        // Fix "useEffect(callback, [])" where callback has embedded ", []"
        {
          pattern: /useEffect\(\s*([^,()]+),\s*\[\]\s*,\s*\[\]\s*\)/g,
          replacement: 'useEffect($1, [])'
        }
      ];

      repairs.forEach(repair => {
        const before = modifiedContent;
        modifiedContent = modifiedContent.replace(repair.pattern, repair.replacement);
        if (before !== modifiedContent) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.repairedFiles.push(filePath);
        console.log(`✅ Repaired useEffect syntax in: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error repairing ${filePath}:`, error.message);
    }
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
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        this.repairFile(filePath);
      }
    });
  }

  run() {
    console.log('🔧 Repairing broken useEffect syntax...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Repaired files: ${this.repairedFiles.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✨ useEffect syntax repairs complete!');
  }
}

// Run the repair tool
if (require.main === module) {
  const repairTool = new UseEffectRepairTool();
  repairTool.run();
}

module.exports = UseEffectRepairTool;
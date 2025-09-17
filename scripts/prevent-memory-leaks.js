#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class MemoryLeakPrevention {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
    this.leakPatterns = {
      eventListeners: 0,
      intervals: 0,
      timeouts: 0,
      subscriptions: 0,
      refs: 0
    };
  }

  analyzeFile(filePath) {
    try {
      if (this.shouldSkipFile(filePath)) {
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;

      // 1. Fix event listener cleanup
      const eventResult = this.fixEventListenerCleanup(modifiedContent);
      if (eventResult.changed) {
        modifiedContent = eventResult.content;
        hasChanges = true;
        this.leakPatterns.eventListeners++;
      }

      // 2. Fix interval/timeout cleanup
      const timerResult = this.fixTimerCleanup(modifiedContent);
      if (timerResult.changed) {
        modifiedContent = timerResult.content;
        hasChanges = true;
        this.leakPatterns.intervals += timerResult.intervals;
        this.leakPatterns.timeouts += timerResult.timeouts;
      }

      // 3. Fix ref cleanup
      const refResult = this.fixRefCleanup(modifiedContent);
      if (refResult.changed) {
        modifiedContent = refResult.content;
        hasChanges = true;
        this.leakPatterns.refs++;
      }

      // 4. Add cleanup suggestions
      const suggestionResult = this.addCleanupSuggestions(modifiedContent);
      if (suggestionResult.changed) {
        modifiedContent = suggestionResult.content;
        hasChanges = true;
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, modifiedContent);
        this.fixedFiles.push(filePath);
        console.log(`✅ Added memory leak prevention in: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  shouldSkipFile(filePath) {
    const skipPatterns = [
      /\\.test\\./,
      /\\.spec\\./,
      /\\.stories\\./,
      /\\.example\\./,
      /node_modules/,
      /__tests__/,
      /\\.d\\.ts$/
    ];
    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  fixEventListenerCleanup(content) {
    let modified = content;
    let changed = false;

    // Find addEventListener calls without proper cleanup
    const addEventListenerPattern = /addEventListener\\(['"]([^'"]+)['"],\\s*([^,)]+)(?:,\\s*([^)]+))?\\)/g;
    let match;
    const eventListeners = [];

    while ((match = addEventListenerPattern.exec(content)) !== null) {
      eventListeners.push({
        event: match[1],
        handler: match[2].trim(),
        options: match[3]
      });
    }

    if (eventListeners.length > 0) {
      // Check if there's a cleanup useEffect
      if (!content.includes('removeEventListener')) {
        const cleanupCode = this.generateEventListenerCleanup(eventListeners);
        
        // Find the last useEffect and add cleanup suggestion
        if (content.includes('useEffect')) {
          const comment = `\\n// TODO: Add event listener cleanup to prevent memory leaks:\\n${cleanupCode}\\n`;
          const lastUseEffectIndex = content.lastIndexOf('useEffect');
          modified = content.slice(0, lastUseEffectIndex) + comment + content.slice(lastUseEffectIndex);
          changed = true;
        }
      }
    }

    return { content: modified, changed };
  }

  fixTimerCleanup(content) {
    let modified = content;
    let changed = false;
    let intervals = 0;
    let timeouts = 0;

    // Find setInterval/setTimeout without cleanup
    const intervalPattern = /setInterval\\(/g;
    const timeoutPattern = /setTimeout\\(/g;

    const intervalMatches = content.match(intervalPattern) || [];
    const timeoutMatches = content.match(timeoutPattern) || [];

    if (intervalMatches.length > 0 || timeoutMatches.length > 0) {
      if (!content.includes('clearInterval') && !content.includes('clearTimeout')) {
        const cleanupSuggestion = `\\n// TODO: Add timer cleanup to prevent memory leaks:\\n// useEffect(() => {\\n//   return () => {\\n//     clearInterval(intervalId);\\n//     clearTimeout(timeoutId);\\n//   };\\n// }, []);\\n`;
        
        // Add suggestion after imports
        const importMatch = modified.match(/^((?:import[^;]+;[\\r\\n]*)*)/);
        if (importMatch) {
          const imports = importMatch[1];
          const rest = modified.substring(imports.length);
          modified = imports + cleanupSuggestion + rest;
          changed = true;
          intervals = intervalMatches.length;
          timeouts = timeoutMatches.length;
        }
      }
    }

    return { content: modified, changed, intervals, timeouts };
  }

  fixRefCleanup(content) {
    let modified = content;
    let changed = false;

    // Find useRef usage that might need cleanup
    if (content.includes('useRef') && content.includes('current') && 
        !content.includes('cleanup') && !content.includes('null')) {
      
      const refCleanupSuggestion = `\\n// TODO: Consider ref cleanup in useEffect cleanup:\\n// useEffect(() => {\\n//   return () => {\\n//     if (ref.current) {\\n//       // Cleanup ref.current if needed\\n//       ref.current = null;\\n//     }\\n//   };\\n// }, []);\\n`;
      
      // Add after imports
      const importMatch = modified.match(/^((?:import[^;]+;[\\r\\n]*)*)/);
      if (importMatch) {
        const imports = importMatch[1];
        const rest = modified.substring(imports.length);
        modified = imports + refCleanupSuggestion + rest;
        changed = true;
      }
    }

    return { content: modified, changed };
  }

  addCleanupSuggestions(content) {
    let modified = content;
    let changed = false;

    const suggestions = [];

    // Check for potential memory leak patterns
    if (content.includes('WebSocket') || content.includes('EventSource')) {
      suggestions.push('Close WebSocket/EventSource connections in cleanup');
    }

    if (content.includes('canvas') && content.includes('getContext')) {
      suggestions.push('Clear canvas context and remove references');
    }

    if (content.includes('IntersectionObserver') || content.includes('MutationObserver')) {
      suggestions.push('Disconnect observers in cleanup');
    }

    if (content.includes('requestAnimationFrame')) {
      suggestions.push('Cancel animation frames in cleanup');
    }

    if (suggestions.length > 0 && !content.includes('Memory leak prevention')) {
      const comment = `\\n// Memory leak prevention checklist:\\n${suggestions.map(s => `// - ${s}`).join('\\n')}\\n\\n`;
      
      const importMatch = modified.match(/^((?:import[^;]+;[\\r\\n]*)*)/);
      if (importMatch) {
        const imports = importMatch[1];
        const rest = modified.substring(imports.length);
        modified = imports + comment + rest;
        changed = true;
      }
    }

    return { content: modified, changed };
  }

  generateEventListenerCleanup(eventListeners) {
    return eventListeners.map(({ event, handler }) => 
      `// useEffect(() => {\\n//   return () => removeEventListener('${event}', ${handler});\\n// }, []);`
    ).join('\\n');
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
      } else if (/\\.(tsx?|jsx?)$/.test(file)) {
        this.analyzeFile(filePath);
      }
    });
  }

  run() {
    console.log('🔒 Preventing memory leaks and adding cleanup patterns...\\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
    
    console.log('\\n📊 MEMORY LEAK PREVENTION RESULTS:');
    console.log('==================================');
    console.log(`✅ Files analyzed: ${this.fixedFiles.length}`);
    console.log(`🎧 Event listeners: ${this.leakPatterns.eventListeners}`);
    console.log(`⏱️  Intervals/timeouts: ${this.leakPatterns.intervals + this.leakPatterns.timeouts}`);
    console.log(`📎 Refs: ${this.leakPatterns.refs}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\\nErrors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\\n🚀 Memory leak prevention analysis complete!');
    console.log('Review TODO comments and implement proper cleanup in useEffect.');
  }
}

// Run the memory leak prevention
if (require.main === module) {
  const preventer = new MemoryLeakPrevention();
  preventer.run();
}

module.exports = MemoryLeakPrevention;
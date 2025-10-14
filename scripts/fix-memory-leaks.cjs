#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing memory leaks in components...');

const memoryLeakFiles = [
  'hooks/use-screen-capture.ts',
  'lib/accessibility-manager.ts',
  'lib/api-cache.ts',
  'lib/comment-cache.ts',
  'lib/error-utils.ts',
  'lib/otp-service.ts',
  'lib/performance-monitor.ts',
  'lib/performance-tracker.ts',
  'lib/progressive-enhancement-core.ts',
  'lib/service-worker.ts',
  'lib/static-performance.tsx',
  'lib/web-vitals.ts',
  'components/analytics-wrapper.tsx'
];

function fixMemoryLeaks() {
  const srcDir = path.join(__dirname, '../src');
  
  memoryLeakFiles.forEach(relativeFile => {
    const filePath = path.join(srcDir, relativeFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${relativeFile}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Fix addEventListener without removeEventListener
      if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
        console.log(`🔧 Fixing addEventListener in ${relativeFile}...`);
        
        // Add cleanup comment and structure for manual review
        const addEventListenerPattern = /(addEventListener\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\))/g;
        let matches = content.match(addEventListenerPattern);
        
        if (matches && matches.length > 0) {
          // Add comment about cleanup needed
          content = `${content}

// TODO: Memory leak fix needed - Add cleanup for event listeners:
// useEffect(() => {
//   const cleanup = () => {
//     // Add removeEventListener calls here
//   };
//   return cleanup;
// }, []);`;
          hasChanges = true;
        }
      }
      
      // Fix setInterval without clearInterval
      if (content.includes('setInterval') && !content.includes('clearInterval')) {
        console.log(`🔧 Fixing setInterval in ${relativeFile}...`);
        
        // Add cleanup structure for intervals
        content = content.replace(
          /(const\s+\w*interval\w*\s*=\s*setInterval\s*\([^)]+\);?)/g,
          `$1

// Memory leak fix: Clear interval on cleanup
// useEffect(() => {
//   return () => {
//     if (interval) clearInterval(interval);
//   };
// }, []);`
        );
        hasChanges = true;
      }
      
      // Add useEffect import if needed and not present
      if (hasChanges && !content.includes('useEffect') && filePath.endsWith('.tsx')) {
        content = content.replace(
          /(import\s+(?:React(?:,\s*\{[^}]+\})?)\s+from\s+['"]react['"];?)/,
          (match) => {
            if (match.includes('useEffect')) return match;
            return match.replace('React', 'React, { useEffect }');
          }
        );
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${relativeFile}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${relativeFile}:`, error.message);
    }
  });
}

// Create a comprehensive useEffect cleanup hook
const useCleanupHook = `
// Custom hook for managing cleanup operations
import { useEffect, useRef, useCallback } from 'react';

interface CleanupManager {
  addEventListenerCleanup: (element: Element | Window, event: string, handler: EventListener) => void;
  addIntervalCleanup: (intervalId: number) => void;
  addTimeoutCleanup: (timeoutId: number) => void;
  addGenericCleanup: (cleanupFn: () => void) => void;
}

export function useCleanup(): CleanupManager {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addEventListenerCleanup = useCallback((element: Element | Window, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    cleanupFunctions.current.push(() => {
      element.removeEventListener(event, handler);
    });
  }, []);

  const addIntervalCleanup = useCallback((intervalId: number) => {
    cleanupFunctions.current.push(() => {
      clearInterval(intervalId);
    });
  }, []);

  const addTimeoutCleanup = useCallback((timeoutId: number) => {
    cleanupFunctions.current.push(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const addGenericCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return {
    addEventListenerCleanup,
    addIntervalCleanup,
    addTimeoutCleanup,
    addGenericCleanup
  };
}
`;

// Write the cleanup hook
const hooksDir = path.join(__dirname, '../src/hooks');
const cleanupHookPath = path.join(hooksDir, 'use-cleanup.ts');

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

fs.writeFileSync(cleanupHookPath, useCleanupHook);
console.log('✅ Created useCleanup hook at hooks/use-cleanup.ts');

// Run the memory leak fixes
fixMemoryLeaks();

console.log(`
📋 Memory Leak Fix Summary:
1. ✅ Added cleanup comments to files with potential leaks
2. ✅ Created useCleanup hook for better memory management
3. ⚠️  Manual review needed for proper cleanup implementation

Next steps:
1. Review each flagged file and implement proper cleanup
2. Replace direct addEventListener with useCleanup hook
3. Replace direct setInterval with useCleanup hook
4. Test all components for memory leaks

Example usage of useCleanup hook:

\`\`\`typescript
import { useCleanup } from '@/hooks/use-cleanup';

function MyComponent() {
  const cleanup = useCleanup();
  
  useEffect(() => {
    // Instead of: element.addEventListener('click', handler);
    cleanup.addEventListenerCleanup(element, 'click', handler);
    
    // Instead of: const interval = setInterval(...);
    const interval = setInterval(...);
    cleanup.addIntervalCleanup(interval);
  }, [cleanup]);
}
\`\`\`
`);
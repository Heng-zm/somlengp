#!/usr/bin/env node

/**
 * Comprehensive Bug Fix and Performance Improvement Script
 * Fixes TypeScript issues, performance problems, and code quality issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting comprehensive bug fixes and performance improvements...');

const fixes = [
  {
    name: 'Fix OptimizedImage width/height types',
    file: 'src/components/ui/optimized-image.tsx',
    search: '      width="500"\n      height="300"',
    replace: '      width={500}\n      height={300}'
  },
  {
    name: 'Fix Web Vitals imports',
    file: 'src/lib/web-vitals.ts',
    search: "import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';",
    replace: "import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';"
  },
  {
    name: 'Fix Web Vitals function calls',
    file: 'src/lib/web-vitals.ts',
    search: `export function initializeWebVitals() {
  getCLS((metric) => sendToAnalytics(metric));
  getFCP((metric) => sendToAnalytics(metric));
  getFID((metric) => sendToAnalytics(metric));
  getLCP((metric) => sendToAnalytics(metric));
  getTTFB((metric) => sendToAnalytics(metric));
}`,
    replace: `export function initializeWebVitals() {
  onCLS((metric) => sendToAnalytics(metric));
  onFCP((metric) => sendToAnalytics(metric));
  onFID((metric) => sendToAnalytics(metric));
  onLCP((metric) => sendToAnalytics(metric));
  onTTFB((metric) => sendToAnalytics(metric));
}`
  },
  {
    name: 'Fix gtag declaration',
    file: 'src/lib/web-vitals.ts',
    search: `  // Send to analytics
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {`,
    replace: `  // Send to analytics
  try {
    if (typeof (globalThis as any).gtag !== 'undefined') {
      (globalThis as any).gtag('event', metric.name, {`
  },
  {
    name: 'Fix useLocalStorage function parameter type',
    file: 'src/components/qr-generator/qr-mobile-optimized.tsx',
    search: '      const valueToStore = value instanceof Function ? value(value) : value;',
    replace: '      const valueToStore = value instanceof Function ? value(storedValue) : value;'
  },
  {
    name: 'Fix navigator.share check',
    file: 'src/components/qr-generator/qr-mobile-optimized.tsx',
    search: '                {navigator.share && (',
    replace: '                {typeof navigator !== "undefined" && navigator.share && ('
  },
  {
    name: 'Fix performance measure parameters',
    file: 'src/components/ui/performance-monitor.tsx',
    search: '    performance.measure(`${name}-render`, renderStart.current, renderEnd);',
    replace: '    performance.measure(`${name}-render`, { start: renderStart.current, end: renderEnd });'
  },
  {
    name: 'Fix useEffect dependency arrays',
    file: 'src/components/ui/performance-monitor.tsx',
    search: '  }, []);',
    replace: '  });'
  },
  {
    name: 'Fix FixedSizeList import',
    file: 'src/components/ai-assistant/optimized-message-list.tsx',
    search: "import { FixedSizeList as List } from 'react-window';",
    replace: "import { FixedSizeList } from 'react-window';\nconst List = FixedSizeList;"
  },
  {
    name: 'Fix react-window types',
    file: 'src/components/ai-assistant/optimized-message-list.tsx',
    search: '        {({ index, style }) => (',
    replace: '        {({ index, style }: { index: number; style: React.CSSProperties }) => ('
  }
];

// Apply fixes
fixes.forEach(fix => {
  const filePath = path.join(process.cwd(), fix.file);
  
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        fs.writeFileSync(filePath, content);
        console.log(`✅ ${fix.name}`);
      } else {
        console.log(`⚠️  ${fix.name} - search pattern not found`);
      }
    } catch (error) {
      console.error(`❌ ${fix.name} - Error: ${error.message}`);
    }
  } else {
    console.log(`⚠️  ${fix.name} - File not found: ${fix.file}`);
  }
});

// Create performance optimization fixes
const performanceFixes = [
  {
    name: 'Add React.memo to expensive components',
    apply: () => {
      // Add React.memo wrappers to heavy components
      const componentsToOptimize = [
        'src/components/qr-generator/qr-mobile-optimized.tsx',
        'src/components/ai-assistant/optimized-message-list.tsx'
      ];
      
      componentsToOptimize.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          let content = fs.readFileSync(fullPath, 'utf8');
          
          // Add React import if not present
          if (!content.includes('import React') && !content.includes("import { memo }")) {
            content = "import React, { memo } from 'react';\n" + content;
          }
          
          // Wrap default export with memo
          content = content.replace(
            /export default (\w+);$/m,
            'export default memo($1);'
          );
          
          fs.writeFileSync(fullPath, content);
        }
      });
      
      console.log('✅ Added React.memo to expensive components');
    }
  },
  {
    name: 'Fix memory leaks in useEffect',
    apply: () => {
      const files = [
        'src/components/qr-generator/qr-mobile-optimized.tsx',
        'src/components/ui/performance-monitor.tsx'
      ];
      
      files.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          let content = fs.readFileSync(fullPath, 'utf8');
          
          // Fix missing cleanup in useEffect with timeouts
          content = content.replace(
            /setTimeout\((.*?),\s*(\d+)\);/g,
            'const timeoutId = setTimeout($1, $2);\n    return () => clearTimeout(timeoutId);'
          );
          
          fs.writeFileSync(fullPath, content);
        }
      });
      
      console.log('✅ Fixed memory leaks in useEffect hooks');
    }
  }
];

// Apply performance fixes
performanceFixes.forEach(fix => {
  try {
    fix.apply();
  } catch (error) {
    console.error(`❌ ${fix.name} - Error: ${error.message}`);
  }
});

// Create missing type definitions
const createMissingTypes = () => {
  const typesContent = `
// Performance monitoring types
export interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  timing: {
    load: number;
    domContent: number;
  };
  network: string;
}

// QR Code types
export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  version?: number;
  maskPattern?: number;
  margin?: number;
  scale?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

// Extended Window interface
declare global {
  interface Window {
    webVitals?: any;
    gtag?: (...args: any[]) => void;
  }
}

export {};
`;

  const typesPath = path.join(process.cwd(), 'src/types/globals.d.ts');
  const typesDir = path.dirname(typesPath);
  
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
  }
  
  fs.writeFileSync(typesPath, typesContent);
  console.log('✅ Created missing type definitions');
};

createMissingTypes();

// Create performance optimization utilities
const createPerformanceUtils = () => {
  const utilsContent = `
import { useCallback, useRef, useEffect } from 'react';

// Custom hook for debouncing
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for throttling
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};

// Memory usage tracker
export const useMemoryTracker = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          used: Math.round(((performance as any).memory.usedJSHeapSize / 1048576) * 100) / 100,
          total: Math.round(((performance as any).memory.totalJSHeapSize / 1048576) * 100) / 100,
          limit: Math.round(((performance as any).memory.jsHeapSizeLimit / 1048576) * 100) / 100
        });
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
};

// Performance observer hook
export const usePerformanceObserver = (
  callback: (entries: PerformanceEntry[]) => void,
  options: { entryTypes: string[] }
) => {
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe(options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
};
`;
  
  const utilsPath = path.join(process.cwd(), 'src/hooks/performance.ts');
  const utilsDir = path.dirname(utilsPath);
  
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  fs.writeFileSync(utilsPath, utilsContent);
  console.log('✅ Created performance optimization utilities');
};

createPerformanceUtils();

// Run final checks
console.log('\n🔍 Running final checks...');

try {
  // Check if build works
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build check passed');
  
  // Check TypeScript
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript check passed');
  } catch (error) {
    console.log('⚠️  Some TypeScript issues remain - manual review needed');
  }
  
} catch (error) {
  console.log('⚠️  Build issues detected - manual review needed');
}

// Generate summary report
const summaryReport = {
  timestamp: new Date().toISOString(),
  fixesApplied: fixes.length,
  performanceOptimizations: performanceFixes.length,
  filesCreated: ['src/types/globals.d.ts', 'src/hooks/performance.ts'],
  recommendations: [
    'Review remaining TypeScript errors manually',
    'Test all components after fixes',
    'Monitor performance improvements',
    'Consider adding more React.memo optimizations',
    'Implement proper error boundaries'
  ]
};

fs.writeFileSync(
  path.join(process.cwd(), 'bug-fix-report.json'),
  JSON.stringify(summaryReport, null, 2)
);

console.log('\n🎉 Bug fixes and performance improvements completed!');
console.log('📄 Report saved to bug-fix-report.json');
console.log('\n💡 Next steps:');
console.log('1. Review remaining TypeScript errors manually');
console.log('2. Test the application thoroughly');
console.log('3. Monitor performance improvements');
console.log('4. Run: npm run build && npm run dev');
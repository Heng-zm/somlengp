/**
 * Import Optimization and Tree Shaking Utilities
 * Reduces bundle size through optimized imports
 */

// ============================================================================
// OPTIMIZED ICON IMPORTS
// ============================================================================

/**
 * Tree-shakable icon imports from Lucide React
 * Only import what you need to reduce bundle size
 */

// Core icons - frequently used
export {
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

// QR Code specific icons
export {
  QrCode,
  Camera,
  Download,
  Share,
  Copy,
  Settings,
  History,
  Scan
} from 'lucide-react';

// UI icons
export {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  Upload,
  FileText,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  Shield
} from 'lucide-react';

// Navigation icons
export {
  Home,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';

// ============================================================================
// OPTIMIZED UTILITY IMPORTS
// ============================================================================

/**
 * Re-export commonly used utilities to avoid deep imports
 */

// Class name utilities
export { cn } from '@/lib/utils';

// Toast utilities
export { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '@/lib/toast-utils';

// ============================================================================
// LODASH TREE SHAKING
// ============================================================================

/**
 * Individual lodash function imports for better tree shaking
 * Instead of import _ from 'lodash', use specific functions
 */

// Array utilities
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import uniqBy from 'lodash/uniqBy';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import chunk from 'lodash/chunk';

// Object utilities
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';

// Export optimized lodash functions
export const lodash = {
  debounce,
  throttle,
  uniqBy,
  groupBy,
  sortBy,
  chunk,
  cloneDeep,
  merge,
  omit,
  pick,
  isEmpty
};

// ============================================================================
// DATE-FNS TREE SHAKING
// ============================================================================

/**
 * Optimized date-fns imports
 */
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { isValid } from 'date-fns/isValid';
import { differenceInDays } from 'date-fns/differenceInDays';
import { addDays } from 'date-fns/addDays';
import { subDays } from 'date-fns/subDays';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';

export const dateFns = {
  format,
  parseISO,
  isValid,
  differenceInDays,
  addDays,
  subDays,
  startOfDay,
  endOfDay
};

// ============================================================================
// NEXT.JS OPTIMIZED IMPORTS
// ============================================================================

/**
 * Optimized Next.js component imports
 */
export { default as Image } from 'next/image';
export { default as Link } from 'next/link';
export { default as Head } from 'next/head';
export { default as Script } from 'next/script';
export { useRouter } from 'next/router';
export { usePathname, useSearchParams } from 'next/navigation';

// ============================================================================
// REACT OPTIMIZED IMPORTS
// ============================================================================

/**
 * Commonly used React imports
 */
export {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  forwardRef,
  useImperativeHandle,
  createContext,
  useContext
} from 'react';

// ============================================================================
// UI COMPONENT OPTIMIZED IMPORTS
// ============================================================================

/**
 * Tree-shakable UI component imports
 */

// Core UI components
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Textarea } from '@/components/ui/textarea';

// Layout components
export { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

// Form components
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export { Switch } from '@/components/ui/switch';
export { Slider } from '@/components/ui/slider';
export { Checkbox } from '@/components/ui/checkbox';

// Navigation components
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Feedback components
export { Badge } from '@/components/ui/badge';
export { Alert, AlertDescription } from '@/components/ui/alert';
export { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// BUNDLE SIZE ANALYSIS
// ============================================================================

/**
 * Analyzes import statements for bundle size optimization
 */
export interface ImportAnalysis {
  module: string;
  imports: string[];
  estimatedSize: number;
  optimizationSuggestions: string[];
}

export function analyzeImports(): ImportAnalysis[] {
  if (process.env.NODE_ENV !== 'development') {
    return [];
  }

  // This would be used during build time or development
  const analysis: ImportAnalysis[] = [
    {
      module: 'lucide-react',
      imports: ['QrCode', 'Camera', 'Download'], // Example
      estimatedSize: 24, // KB
      optimizationSuggestions: [
        'Using individual icon imports - good!',
        'Consider using react-icons for smaller bundle size'
      ]
    },
    {
      module: 'lodash',
      imports: ['debounce', 'throttle'],
      estimatedSize: 8, // KB
      optimizationSuggestions: [
        'Using individual function imports - excellent!'
      ]
    }
  ];

  return analysis;
}

// ============================================================================
// IMPORT REPLACEMENT UTILITIES
// ============================================================================

/**
 * Provides lightweight alternatives to heavy libraries
 */

// Lightweight debounce implementation
export function lightweightDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Lightweight throttle implementation
export function lightweightThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Lightweight deep clone (for simple objects)
export function lightweightClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => lightweightClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = lightweightClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// Lightweight unique array function
export function lightweightUnique<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ============================================================================
// WEBPACK BUNDLE ANALYZER INTEGRATION
// ============================================================================

/**
 * Provides bundle analysis information during development
 */
export function getBundleStats() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // This would integrate with webpack-bundle-analyzer or similar
  return {
    totalSize: '1.2MB', // Example
    chunks: [
      { name: 'main', size: '800KB' },
      { name: 'vendors', size: '300KB' },
      { name: 'runtime', size: '100KB' }
    ],
    suggestions: [
      'Consider code splitting for QR generator component',
      'Optimize image imports',
      'Review lodash usage'
    ]
  };
}

// ============================================================================
// PERFORMANCE BUDGET CHECKER
// ============================================================================

/**
 * Checks if imports exceed performance budget
 */
export interface PerformanceBudget {
  maxBundleSize: number; // MB
  maxChunkSize: number; // KB
  maxAssetSize: number; // KB
}

export function checkPerformanceBudget(budget: PerformanceBudget) {
  if (process.env.NODE_ENV !== 'development') {
    return { withinBudget: true, violations: [] };
  }

  // This would be implemented with actual bundle analysis
  const violations: string[] = [];
  
  // Example checks
  const currentBundleSize = 1.5; // MB
  if (currentBundleSize > budget.maxBundleSize) {
    violations.push(`Bundle size ${currentBundleSize}MB exceeds budget of ${budget.maxBundleSize}MB`);
  }

  return {
    withinBudget: violations.length === 0,
    violations
  };
}

// ============================================================================
// EXPORT OPTIMIZATION BUNDLE
// ============================================================================

export const ImportOptimization = {
  // Utilities
  lodash,
  dateFns,
  
  // Lightweight alternatives
  debounce: lightweightDebounce,
  throttle: lightweightThrottle,
  clone: lightweightClone,
  unique: lightweightUnique,
  
  // Analysis tools
  analyzeImports,
  getBundleStats,
  checkPerformanceBudget
};

export default ImportOptimization;
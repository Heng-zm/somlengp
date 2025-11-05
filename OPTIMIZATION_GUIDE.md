# Website Optimization Guide

## Current Status

**Initial Bundle Size**: 910 kB (First Load JS shared by all pages)
**Target**: Reduce to ~400-500 kB

## Implemented Optimizations

### 1. Font Optimization ✅
- **Reduced font weights**: From 5 weights (300, 400, 500, 600, 700) to 2 (400, 600)
- **Subset optimization**: Load only 'latin' subset initially (khmer on-demand)
- **Enabled font fallback**: Reduces Cumulative Layout Shift (CLS)
- **Expected savings**: ~100-150 KB

### 2. Enhanced Package Imports ✅
Created optimized `next.config.optimized.js` with:
- Tree-shaking for Radix UI components
- Optimized imports for lucide-react, recharts, syntax highlighter
- **Expected savings**: ~50-100 KB

### 3. Improved Code Splitting ✅
New cache groups in webpack config:
```
- framework (React/Next.js) - Priority 50
- radixUI (Radix components) - Priority 40
- icons (Lucide/Radix icons) - Priority 35
- fileProcessing (PDF/ZIP/QR) - Priority 30 (lazy load)
- aiAnalytics (AI/Analytics) - Priority 25
- supabase - Priority 23
- markdown - Priority 20
- animations - Priority 18
- vendor - Priority 10
```

### 4. Dynamic Component Loader ✅
Created `src/components/optimized/dynamic-loader.tsx`:
- Pre-configured loaders for heavy components
- Automatic loading skeletons
- SSR disabled for client-only features
- Preload on hover/focus capability

## Recommended Next Steps

### High Priority 🔴

#### 1. Apply Optimized Config
```bash
# Backup current config
Copy-Item next.config.js next.config.backup.js

# Use optimized config
Copy-Item next.config.optimized.js next.config.js

# Rebuild
npm run build
```

#### 2. Implement Dynamic Imports

**AI Assistant Page** (`src/app/ai-assistant/page.tsx`):
```typescript
import { createDynamicComponent } from '@/components/optimized/dynamic-loader';

const DynamicAIInterface = createDynamicComponent(
  () => import('@/components/features/ai/ai-interface'),
  { height: '600px', ssr: false }
);
```

**PDF Tools** (`src/app/combine-pdf/page.tsx`, `src/app/pdf-transcript/page.tsx`):
```typescript
import { createDynamicComponent } from '@/components/optimized/dynamic-loader';

const DynamicPDFProcessor = createDynamicComponent(
  () => import('@/components/features/pdf/pdf-processor'),
  { height: '500px', ssr: false }
);
```

**QR Scanner** (`src/app/scanner/page.tsx`):
```typescript
import { createDynamicComponent } from '@/components/optimized/dynamic-loader';

const DynamicQRScanner = createDynamicComponent(
  () => import('@/components/features/qr/qr-scanner'),
  { height: '400px', ssr: false }
);
```

#### 3. Optimize Heavy Dependencies

**Markdown Renderer**: Use lightweight alternative
```bash
npm install react-markdown-light
# or use react-markdown with minimal plugins
```

**Syntax Highlighting**: Lazy load specific languages
```typescript
// Instead of importing all languages
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/esm/prism';
// Import only needed languages
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
```

### Medium Priority 🟡

#### 4. Image Optimization

**Use Next.js Image Component everywhere**:
```typescript
import Image from 'next/image';

// Instead of <img>
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  quality={85}
  placeholder="blur"
/>
```

#### 5. Remove Unused Dependencies

```bash
# Analyze dependencies
npm run analyze:deps

# Common candidates for removal:
# - Unused UI libraries
# - Duplicate utilities
# - Dev dependencies in production
```

#### 6. Implement Route-based Code Splitting

Ensure each page only loads what it needs:
```typescript
// app/some-page/page.tsx
export const dynamic = 'force-dynamic'; // or 'force-static' for static pages
export const revalidate = 3600; // ISR with 1 hour revalidation
```

### Low Priority 🟢

#### 7. Service Worker Optimization

Update `public/sw.js` to cache more aggressively:
```javascript
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Cache static assets aggressively
// Cache API responses with strategies
```

#### 8. Database Query Optimization

Optimize Supabase queries:
```typescript
// Use select() to fetch only needed columns
const { data } = await supabase
  .from('profiles')
  .select('id, email, display_name') // Only what's needed
  .eq('id', userId)
  .single();

// Use limit() for lists
.select('*')
.limit(20);
```

#### 9. Implement Intersection Observer

Lazy load images and components when they enter viewport:
```typescript
const ObservedComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? <HeavyComponent /> : <Skeleton />}
    </div>
  );
};
```

## Performance Monitoring

### Web Vitals Tracking
Already configured with `@vercel/analytics` and `@vercel/speed-insights`.

### Key Metrics to Track:
- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1
- **TTFB** (Time to First Byte): Target < 800ms

### Monitor with:
```bash
# Build and analyze
npm run build
npm run analyze

# Performance check
npm run perf:check

# Lighthouse CI
npm run lighthouse
```

## Expected Results

After implementing all optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Load JS | 910 KB | 400-500 KB | 45-55% |
| LCP | ~4s | <2.5s | 37% |
| Time to Interactive | ~5s | <3s | 40% |
| Bundle Count | 58 chunks | 40-45 chunks | Optimized |

## Testing Checklist

- [ ] Backup current config (`next.config.js`)
- [ ] Apply optimized config (`next.config.optimized.js`)
- [ ] Run build and verify no errors
- [ ] Test critical pages (home, ai-assistant, scanner, pdf tools)
- [ ] Check bundle size reduction
- [ ] Verify all features still work
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit
- [ ] Deploy to staging
- [ ] Monitor performance in production

## Quick Implementation Script

```bash
# 1. Apply optimizations
Copy-Item next.config.optimized.js next.config.js

# 2. Rebuild
npm run build

# 3. Check bundle size
npm run analyze

# 4. Run tests
npm run test:ci

# 5. Performance check
npm run perf:check
```

## Rollback Plan

If issues occur:
```bash
# Restore original config
Copy-Item next.config.backup.js next.config.js

# Rebuild
npm run build
```

## Additional Resources

- [Next.js Performance Docs](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals Guide](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-rendering-performance)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

## Support

For issues or questions about optimizations, check:
1. Build output for errors
2. Browser console for runtime issues
3. Lighthouse report for specific recommendations
4. `npm run analyze` for bundle composition

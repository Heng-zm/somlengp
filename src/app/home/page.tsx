
'use client';
import { useMemo, useState, useEffect, useCallback, useDeferredValue, memo } from 'react';
// Optimized individual icon imports for better tree shaking
import { 
  Mic, 
  FileText, 
  Combine, 
  Image as ImageIcon, 
  Wand2, 
  AudioLines, 
  Sparkles, 
  QrCode, 
  Shield,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { getPerformanceTracker, DEFAULT_BUDGETS } from '@/lib/performance-tracker';
import { OptimizedFeatureGrid } from '@/components/home/optimized-feature-grid';
import { SearchToolBar } from '@/components/home/search-tool-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/shared/footer';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

const VISITOR_SESSION_KEY = 'ozo-designer-session-visited';
const HomePageComponent = function HomePage() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const { t } = useLanguage();
  // Optimized visitor count with caching and retry logic
  const fetchVisitorCount = useMemo(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const cacheKey = 'visitor_count_cache';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    return async (isIncrement: boolean) => {
      try {
        // Check cache first for GET requests
        if (!isIncrement && typeof window !== 'undefined') {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { count, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheExpiry) {
              setVisitorCount(count);
              return;
            }
          }
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('Request timeout after 5 seconds'), 5000);
        // Memoized request options to prevent re-renders
        const requestOptions = {
          method: isIncrement ? 'POST' : 'GET',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        };
        const response = await fetch('/api/visit', requestOptions);
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && typeof data.count === 'number') {
          setVisitorCount(data.count);
          // Cache the result for GET requests
          if (!isIncrement && typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify({
              count: data.count,
              timestamp: Date.now()
            }));
          }
        } else {
          throw new Error('Invalid response format');
        }
        retryCount = 0; // Reset on success
      } catch (error) {
        // Silently ignore abort errors (timeouts are expected)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error(`Failed to fetch visitor count (attempt ${retryCount + 1}):`, error);
        if (retryCount < maxRetries && error instanceof Error) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          setTimeout(() => fetchVisitorCount(isIncrement), delay);
          return;
        }
        // Fallback to cached data or default
        if (!isIncrement && typeof window !== 'undefined') {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { count } = JSON.parse(cached);
            setVisitorCount(count);
          }
        }
      }
    };
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = sessionStorage.getItem(VISITOR_SESSION_KEY);
      if (hasVisited) {
        fetchVisitorCount(false);
      } else {
        fetchVisitorCount(true);
        sessionStorage.setItem(VISITOR_SESSION_KEY, 'true');
      }
    }
  }, [fetchVisitorCount]);
  // Initialize performance tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tracker = getPerformanceTracker();
      // Check performance budgets after page load
      const budgetTimeout = setTimeout(() => {
        const budgetCheck = tracker.checkBudget(DEFAULT_BUDGETS);
        if (!budgetCheck.passed) {
          // Performance budget exceeded - could log this or show warning
          console.warn('Performance budget exceeded:', budgetCheck);
        }
      }, 2000);
      return () => clearTimeout(budgetTimeout);
    }
  }, []);
  const featureCards = useMemo(() => [
    // Most popular tools first for better mobile UX
    { href: '/ai-assistant', title: t('smartAiChat'), description: t('smartAiChatDesc'), icon: Sparkles },
    { href: '/generate-qr-code', title: t('qrGenerator'), description: t('qrGeneratorDesc'), icon: QrCode },
    { href: '/voice-transcript', title: t('voiceToText'), description: t('voiceToTextDesc'), icon: Mic },
    { href: '/text-to-speech', title: t('textReader'), description: t('textReaderDesc'), icon: AudioLines },
    // Screen and media tools
    // Document tools
    { href: '/pdf-transcript', title: t('pdfReader'), description: t('pdfReaderDesc'), icon: FileText },
    { href: '/combine-pdf', title: t('pdfMerger'), description: t('pdfMergerDesc'), icon: Combine },
    { href: '/image-to-pdf', title: t('imageToPdfTitle'), description: t('imageToPdfDesc'), icon: ImageIcon },
    { href: '/convert-image-format', title: t('imageConverter'), description: t('imageConverterDesc'), icon: Wand2 },
    // New useful tools
    { href: '/password-generator', title: t('passwordGen'), description: t('passwordGenDesc'), icon: Shield },
  ], [t]);
  const primaryFeature = featureCards[0];
  const otherFeatures = featureCards.slice(1);

  // Search state and filtering for other tools
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const filteredOtherFeatures = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return otherFeatures;
    return otherFeatures.filter((f) =>
      [f.title, f.description].some((s) => s.toLowerCase().includes(q))
    );
  }, [otherFeatures, deferredQuery]);

  const scrollToOtherTools = useCallback(() => {
    const el = typeof document !== 'undefined' ? document.getElementById('other-tools') : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Smooth-scroll to results when user starts searching
  useEffect(() => {
    if (searchQuery.trim()) scrollToOtherTools();
  }, [searchQuery, scrollToOtherTools]);
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-slate-50 dark:bg-slate-950 lg:min-h-dvh">
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.14),_transparent_65%)] lg:block"
            aria-hidden="true"
          />
          <div className="relative max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20">
                Somleng workspace
              </span>
              {visitorCount !== null && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {visitorCount.toLocaleString()} people have used these tools
                </span>
              )}
            </div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
              Create, convert, and communicate from one workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              AI, voice, QR, image, and PDF utilities designed to help you finish everyday work faster.
            </p>
            <div className="mt-7 max-w-2xl">
              <SearchToolBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={scrollToOtherTools}
              />
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-8 lg:mt-10 lg:space-y-10">
          {filteredOtherFeatures.length === 0 ? (
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  No tools found
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try a different keyword or clear the search.
                </p>
              </div>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            </Card>
          ) : null}

          <OptimizedFeatureGrid
            primaryFeature={primaryFeature}
            otherFeatures={filteredOtherFeatures}
            startNowText={t('startNow')}
            otherToolsText="Explore tools"
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default memo(HomePageComponent);


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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { getPerformanceTracker, DEFAULT_BUDGETS } from '@/lib/performance-tracker';
import { OptimizedHomeHeader } from '@/components/home/optimized-home-header';
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
  const { language, toggleLanguage, theme, toggleTheme, t } = useLanguage();
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
        const timeoutId = setTimeout(() => controller.abort(), 5000);
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
        console.error(`Failed to fetch visitor count (attempt ${retryCount + 1}):`, error);
        if (retryCount < maxRetries && error instanceof Error && error.name !== 'AbortError') {
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
  // Memoized callbacks for better performance
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);
  const handleLanguageToggle = useCallback(() => {
    toggleLanguage();
  }, [toggleLanguage]);
  return (
    <>
      <div className="flex flex-col h-full text-foreground">
        <OptimizedHomeHeader
          visitorCount={visitorCount}
          theme={theme}
          language={language}
          onThemeToggle={handleThemeToggle}
          onLanguageToggle={handleLanguageToggle}
        />
        <ScrollArea className="flex-grow pt-20 sm:pt-24 md:pt-28">
          <main id="main-content" role="main" className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12 lg:py-12 space-y-8 sm:space-y-10 md:space-y-12 max-w-[1600px] mx-auto">
            <SearchToolBar value={searchQuery} onChange={setSearchQuery} onSubmit={scrollToOtherTools} />
            {filteredOtherFeatures.length === 0 ? (
              <div className="mt-3">
                <Card className="p-5 flex items-center justify-between rounded-2xl border border-gray-200 bg-white">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">No tools found</h4>
                    <p className="text-sm text-gray-600">Try different keywords or clear your search.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>Clear</Button>
                </Card>
              </div>
            ) : null}
            <OptimizedFeatureGrid
              primaryFeature={primaryFeature}
              otherFeatures={filteredOtherFeatures}
              startNowText={t('startNow')}
              otherToolsText={"Other Tool"}
            />
          </main>
          <Footer />
        </ScrollArea>
      </div>
    </>
  );
}

export default memo(HomePageComponent);
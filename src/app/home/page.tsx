
'use client';

import { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { Mic, FileText, Combine, Image as ImageIcon, Wand2, AudioLines, Sparkles, QrCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { getPerformanceTracker, DEFAULT_BUDGETS } from '@/lib/performance-tracker';
import { OptimizedHomeHeader } from '@/components/home/optimized-home-header';
import { OptimizedFeatureGrid } from '@/components/home/optimized-feature-grid';
import { HomeCommentsSection } from '@/components/home/home-comments-section';
import { Footer } from '@/components/shared/footer';

const VISITOR_SESSION_KEY = 'ozo-designer-session-visited';

export default function HomePage() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const langContext = useContext(LanguageContext);
  
  if (!langContext) {
    throw new Error('Home page must be used within a LanguageProvider');
  }

const { language, toggleLanguage, theme, toggleTheme } = langContext;
  const t = useMemo(() => {
    const translations = allTranslations[language];
    return {
      ...translations,
      // Helper to resolve function-based translations
      getFileTooLargeDescription: (size: number) => translations.fileTooLargeDescription(size)
    };
  }, [language]);
  
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
          console.warn('Performance budget violations:', budgetCheck.violations);
        }
      }, 2000);
      
      return () => clearTimeout(budgetTimeout);
    }
  }, []);
  

  const featureCards = useMemo(() => [
    { href: '/voice-transcript', title: t.voiceScribe, description: t.voiceTranscriptDescription, icon: Mic },
    { href: '/ai-assistant', title: 'AI Assistant', description: 'Chat with an intelligent AI assistant powered by Gemini 1.5 Flash for help with any questions or tasks.', icon: Sparkles },
    { href: '/pdf-transcript', title: t.pdfTranscript, description: t.pdfTranscriptDescription, icon: FileText },
    { href: '/text-to-speech', title: 'Text to Speech', description: 'Convert text into natural-sounding speech.', icon: AudioLines },
    { href: '/generate-qr-code', title: t.generateQrCode, description: t.generateQrCodeDescription, icon: QrCode },
    { href: '/combine-pdf', title: t.combinePdf, description: t.combinePdfDescription, icon: Combine },
    { href: '/image-to-pdf', title: t.imageToPdf, description: t.imageToPdfDescription, icon: ImageIcon },
    { href: '/convert-image-format', title: t.convertImageFormat, description: t.convertImageFormatDescription, icon: Wand2 },
  ], [t]);
  
  const primaryFeature = featureCards[0];
  const otherFeatures = featureCards.slice(1);
  
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
          <main className="p-4 sm:p-6 space-y-8">
            <OptimizedFeatureGrid
              primaryFeature={primaryFeature}
              otherFeatures={otherFeatures}
              startNowText={t.startNow}
              otherToolsText={t.otherTools}
            />
            
            {/* Comments section below tool cards */}
            <HomeCommentsSection 
              className="mt-8"
            />
          </main>
          <Footer />
        </ScrollArea>
      </div>
    </>
  );
}


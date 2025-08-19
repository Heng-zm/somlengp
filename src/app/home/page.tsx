
'use client';

import { useContext, useMemo, useState, useEffect, memo, Suspense } from 'react';
import Link from 'next/link';
import { Mic, FileText, Menu, Combine, Image as ImageIcon, Users, Wand2, AudioLines, Sun, Moon, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/shared/sidebar';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuthFormsHomeOnly } from '@/components/auth/auth-forms-home-only';
import { AIAssistantWidget } from '@/components/shared/ai-assistant-widget';
import Image from 'next/image';
import { getPerformanceTracker, DEFAULT_BUDGETS } from '@/lib/performance-tracker';

const VISITOR_SESSION_KEY = 'ozo-designer-session-visited';

export default function HomePage() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [isLoadingVisitorCount, setIsLoadingVisitorCount] = useState(true);
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
        setIsLoadingVisitorCount(true);
        
        // Check cache first for GET requests
        if (!isIncrement && typeof window !== 'undefined') {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { count, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheExpiry) {
              setVisitorCount(count);
              setIsLoadingVisitorCount(false);
              return;
            }
          }
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/visit', { 
          method: isIncrement ? 'POST' : 'GET',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
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
      } finally {
        setIsLoadingVisitorCount(false);
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
      setTimeout(() => {
        const budgetCheck = tracker.checkBudget(DEFAULT_BUDGETS);
        if (!budgetCheck.passed) {
          console.warn('Performance budget violations:', budgetCheck.violations);
        }
      }, 2000);
    }
  }, []);
  
  const featureCards = useMemo(() => [
    { href: '/voice-transcript', title: t.voiceScribe, description: t.voiceTranscriptDescription, icon: Mic },
    { href: '/ai-assistant', title: 'AI Assistant', description: 'Chat with an intelligent AI assistant powered by Gemini 1.5 Flash for help with any questions or tasks.', icon: Sparkles },
    { href: '/pdf-transcript', title: t.pdfTranscript, description: t.pdfTranscriptDescription, icon: FileText },
    { href: '/text-to-speech', title: 'Text to Speech', description: 'Convert text into natural-sounding speech.', icon: AudioLines },
    { href: '/combine-pdf', title: t.combinePdf, description: t.combinePdfDescription, icon: Combine },
    { href: '/image-to-pdf', title: t.imageToPdf, description: t.imageToPdfDescription, icon: ImageIcon },
    { href: '/convert-image-format', title: t.convertImageFormat, description: t.convertImageFormatDescription, icon: Wand2 },
  ], [t]);
  
  const primaryFeature = featureCards[0];
  const otherFeatures = featureCards.slice(1);

  return (
    <div className="flex flex-col h-full text-foreground">
      <header className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Image 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXQ6IUyl8D8fpZl8p9BvXg-PCxKPa-1vOp0oPC2-uKH-H_M1T" 
            alt="Somleng logo" 
            width={32} 
            height={32} 
            priority
            quality={90}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            data-ai-hint="logo" 
            className="rounded-full flex-shrink-0 transition-opacity duration-200" 
          />
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Somleng</h1>
            <div className="hidden sm:block">
              {visitorCount !== null ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{visitorCount} User</span>
                  </div>
              ) : (
                  <Skeleton className="h-6 w-24 rounded-md" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="flex items-center">
              <AuthFormsHomeOnly />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:inline-flex" type="button">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" type="button">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] bg-background/80 backdrop-blur-lg">
                  <SheetHeader className="p-4 border-b sr-only">
                      <SheetTitle>Main Menu</SheetTitle>
                  </SheetHeader>
                  <Sidebar language={language} toggleLanguage={toggleLanguage} />
                </SheetContent>
            </Sheet>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <main className="p-4 sm:p-6 space-y-8">
            <Link href={primaryFeature.href} passHref>
                <Card className="w-full p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-2xl hover:border-primary/20 group">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="p-4 bg-primary/20 rounded-xl w-fit border border-primary/30">
                            <primaryFeature.icon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-3xl font-bold">{primaryFeature.title}</h2>
                            <p className="text-muted-foreground mt-2 max-w-lg">{primaryFeature.description}</p>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button variant="default" className="group-hover:bg-primary/90">
                            {t.startNow}
                            <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </Card>
            </Link>
            
            <div className="space-y-6">
                <h3 className="text-xl sm:text-2xl font-semibold px-2 text-center sm:text-left">{t.otherTools}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                    {otherFeatures.map((card) => (
                        <Suspense key={card.href} fallback={
                          <Card className="w-full h-full p-5 flex items-center gap-5 animate-pulse">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <div className="flex-grow space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </Card>
                        }>
                          <FeatureCard
                              href={card.href}
                              title={card.title}
                              description={card.description}
                              icon={card.icon}
                          />
                        </Suspense>
                    ))}
                </div>
            </div>
        </main>
      </ScrollArea>
      
      {/* Floating AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const FeatureCard = memo(function FeatureCard({ href, title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Link href={href} passHref>
      <Card className={cn(
        "w-full h-full p-5 flex items-center gap-5",
        "bg-card text-card-foreground border",
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out",
        "motion-safe:hover:scale-[1.02] hover:shadow-xl hover:border-primary/20",
        "motion-reduce:hover:bg-secondary/50",
        "group focus-visible:ring-2 focus-visible:ring-primary"
      )}>
          <div className="p-3 bg-secondary rounded-lg border motion-safe:will-change-transform">
            <Icon className="w-6 h-6 text-primary motion-safe:transition-colors motion-safe:group-hover:text-primary" />
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
          <ArrowRight className="text-muted-foreground/50 motion-safe:transition-transform motion-safe:group-hover:translate-x-1 motion-safe:will-change-transform" />
      </Card>
    </Link>
  );
});

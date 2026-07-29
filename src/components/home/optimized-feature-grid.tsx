'use client';

import { memo, Suspense, lazy, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/lib/performance';

// Memory leak prevention: Observers need cleanup
// Add cleanup in useEffect return function

interface FeatureCardData {
  href?: string;
  action?: () => void;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface FeatureCardProps extends FeatureCardData {
  priority?: boolean;
  onLoad?: () => void;
}

interface OptimizedFeatureGridProps {
  primaryFeature: FeatureCardData;
  otherFeatures: FeatureCardData[];
  startNowText: string;
  otherToolsText: string;
}

// Optimized primary feature card with intersection observer
const PrimaryFeatureCard = memo(function PrimaryFeatureCard({ 
  href, 
  title, 
  description, 
  icon: Icon, 
  startNowText 
}: FeatureCardData & { startNowText: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });

  const cardContent = (
    <Card className={cn(
      "group flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-md sm:p-8 lg:p-10",
      "transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-blue-500/30",
      isVisible ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4"
    )}>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur sm:h-20 sm:w-20">
          <Icon className="h-8 w-8 text-white sm:h-10 sm:w-10" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
            Featured
          </p>
          <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-blue-100 sm:text-base">{description}</p>
        </div>
      </div>
      <div className="mt-8 flex items-center sm:justify-end">
        <Button 
          size="lg"
          className="bg-white text-blue-700 shadow-sm hover:bg-blue-50"
        >
          {startNowText}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div ref={cardRef}>
      {href ? (
        <Link href={href} passHref aria-label={`${title} - ${startNowText}`}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
});

// Optimized feature card with lazy loading
const OptimizedFeatureCard = memo(function OptimizedFeatureCard({ 
  href, 
  action,
  title, 
  description, 
  icon: Icon, 
  priority = false,
  onLoad 
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef, { 
    threshold: 0.1,
    rootMargin: priority ? '50px' : '20px' 
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [isVisible, isLoaded, onLoad]);

  const cardContent = (
    <Card 
      className={cn(
        "group flex h-full w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm",
        "transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
        "dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500/40"
      )}
      onClick={action}
      role={action ? 'button' : undefined}
      tabIndex={action ? 0 : undefined}
      aria-label={action ? `${title} - ${description}` : undefined}
      onKeyDown={action ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action?.(); } } : undefined}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20 sm:h-14 sm:w-14">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-base">{title}</h2>
        <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ArrowRight
        className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Card>
  );

  return (
    <div ref={cardRef}>
      {isVisible ? (
        href ? (
          <Link href={href} passHref aria-label={`${title} - ${description}`}>
            {cardContent}
          </Link>
        ) : (
          cardContent
        )
      ) : (
        <Card className="w-full h-full p-5 flex items-center gap-5 animate-pulse">
          <Skeleton className="w-[75px] h-[75px] rounded-2xl" />
          <div className="flex-grow space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      )}
    </div>
  );
});

// Virtual grid for large feature lists
const VirtualFeatureGrid = memo(function VirtualFeatureGrid({ 
  features, 
  className 
}: { 
  features: FeatureCardData[]; 
  className?: string; 
}) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 6 });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load more items when we're near the end
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            if (index >= visibleRange.end - 2) {
              setVisibleRange(prev => ({
                ...prev,
                end: Math.min(prev.end + 3, features.length)
              }));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const gridElement = gridRef.current;
    if (gridElement) {
      const items = gridElement.querySelectorAll('[data-index]');
      items.forEach(item => observer.observe(item));
    }

    return () => observer.disconnect();
  }, [visibleRange.end, features.length]);

  const visibleFeatures = features.slice(visibleRange.start, visibleRange.end);

  return (
    <div 
      ref={gridRef}
      className={cn(
        "grid grid-cols-1 auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {visibleFeatures.map((feature, index) => (
        <div 
          key={feature.href || feature.title} 
          data-index={String(visibleRange.start + index)}
        >
          <Suspense fallback={
            <Card className="w-full h-full p-5 flex items-center gap-5 animate-pulse">
              <Skeleton className="w-[75px] h-[75px] rounded-2xl" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          }>
            <OptimizedFeatureCard
              href={feature.href}
              action={feature.action}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              priority={index < 3}
            />
          </Suspense>
        </div>
      ))}
    </div>
  );
});

// Main optimized feature grid component
export const OptimizedFeatureGrid = memo(function OptimizedFeatureGrid({
  primaryFeature,
  otherFeatures,
  startNowText,
  otherToolsText
}: OptimizedFeatureGridProps) {
  return (
    <>
      {/* Primary Feature */}
      <PrimaryFeatureCard
        {...primaryFeature}
        startNowText={startNowText}
      />
      
      {/* Other Features */}
      <div id="other-tools" className="mt-10 space-y-5 scroll-mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            Toolkit
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {otherToolsText}
          </h3>
          </div>
          <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
            {otherFeatures.length} tools available
          </p>
        </div>
        <VirtualFeatureGrid 
          features={otherFeatures}
          className="min-h-[300px]"
        />
      </div>

    </>
  );
});

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
      "w-full p-6 sm:p-8 md:p-12 flex flex-col justify-between overflow-hidden rounded-2xl",
      "transition-all duration-500 ease-out",
      "bg-gradient-to-br from-primary/10 via-background to-background",
      "hover:shadow-2xl hover:border-primary/30 hover:scale-[1.01] group",
      "transform-gpu", // Force GPU acceleration
      "border-2",
      isVisible ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4"
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        <div className="flex items-center justify-center h-[88px] w-[88px] bg-gray-100 rounded-[12px] border border-gray-200">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-black" aria-hidden="true" />
        </div>
        <div className="flex-grow text-center sm:text-left space-y-3 min-w-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">{title}</h2>
          <p className="text-gray-700 text-base sm:text-lg mt-2 max-w-2xl mx-auto sm:mx-0 leading-relaxed break-words">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-center sm:justify-end mt-8 gap-3">
        <Button 
          variant="default" 
          size="lg"
          className="rounded-full bg-black text-white hover:bg-black/90 will-change-transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95 px-8 py-6 text-base font-semibold"
        >
          {startNowText}
        </Button>
        <div
          className="flex items-center justify-center rounded-full bg-black text-white shadow-sm shrink-0 aspect-square"
          style={{ width: 44, height: 44 }}
          aria-hidden="true"
        >
          <ArrowRight className="h-5 w-5" />
        </div>
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
        "w-full h-full p-5 sm:p-6 flex items-center gap-4",
        "rounded-[12px] bg-white text-foreground border border-gray-200 shadow",
        "hover:bg-gray-50 transition-colors",
        "focus-visible:ring-0"
      )}
      onClick={action}
      role={action ? 'button' : undefined}
      tabIndex={action ? 0 : undefined}
      aria-label={action ? `${title} - ${description}` : undefined}
      onKeyDown={action ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action?.(); } } : undefined}
    >
      <div className="flex items-center justify-center h-[75px] w-[75px] shrink-0 rounded-[18px] bg-gray-50 border border-gray-200">
        <Icon className="w-10 h-10 text-gray-900" aria-hidden="true" />
      </div>
      <div className="flex-grow min-w-0">
        <h2 className="text-[16px] font-semibold mb-1 truncate">{title}</h2>
        <p className="text-[13px] text-gray-600 leading-6 break-words line-clamp-2">{description}</p>
      </div>
      <div
        className="ml-auto flex items-center justify-center rounded-full bg-black text-white shadow-sm pointer-events-none shrink-0 aspect-square"
        style={{ width: 26, height: 26 }}
        aria-hidden="true"
      >
        <span
          className="block rounded-full bg-white"
          style={{ width: 14, height: 8 }}
        />
      </div>
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
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3",
        "gap-5 sm:gap-6 lg:gap-8 auto-rows-fr",
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
      <div id="other-tools" className="space-y-6 mt-12">
        <div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {otherToolsText}
          </h3>
          <div className="mt-2 h-1 w-20 bg-foreground rounded-full" />
        </div>
        <VirtualFeatureGrid 
          features={otherFeatures}
          className="min-h-[300px]"
        />
      </div>

    </>
  );
});

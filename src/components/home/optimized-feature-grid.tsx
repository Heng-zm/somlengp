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
        <div className="flex items-center justify-center p-5 bg-primary/20 rounded-2xl border-2 border-primary/30 will-change-transform transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/30 group-hover:border-primary/50">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary transition-transform duration-300 group-hover:rotate-6" />
        </div>
        <div className="flex-grow text-center sm:text-left space-y-3 min-w-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">{title}</h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-2 max-w-2xl mx-auto sm:mx-0 leading-relaxed break-words">{description}</p>
        </div>
      </div>
      <div className="flex justify-center sm:flex sm:justify-end mt-8">
        <Button 
          variant="default" 
          size="lg"
          className="group-hover:bg-primary/90 will-change-transform transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 px-8 py-6 text-base font-semibold"
        >
          {startNowText}
          <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
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
        "w-full h-full p-6 flex items-center gap-5 rounded-xl",
        "bg-card text-card-foreground border-2",
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
        "motion-safe:hover:scale-[1.03] hover:shadow-xl hover:border-primary/30 hover:-translate-y-1",
        "motion-reduce:hover:bg-secondary/50",
        "group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "transform-gpu will-change-transform",
        action ? "cursor-pointer active:scale-95" : ""
      )}
      onClick={action}
      role={action ? 'button' : undefined}
      tabIndex={action ? 0 : undefined}
      aria-label={action ? `${title} - ${description}` : undefined}
      onKeyDown={action ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } } : undefined}
    >
      <div className="flex items-center justify-center p-4 bg-secondary/80 rounded-xl border-2 motion-safe:will-change-transform motion-safe:transition-all motion-safe:duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:bg-primary/10 motion-safe:group-hover:border-primary/30">
        <Icon className="w-7 h-7 text-primary motion-safe:transition-all motion-safe:duration-300 motion-safe:group-hover:scale-110" />
      </div>
      <div className="flex-grow min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold mb-1.5 transition-colors duration-200 group-hover:text-primary truncate">{title}</h2>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed break-words">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 flex-shrink-0 text-muted-foreground/50 motion-safe:transition-all motion-safe:duration-300 motion-safe:group-hover:translate-x-2 motion-safe:group-hover:text-primary motion-safe:will-change-transform" />
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
          <Skeleton className="w-12 h-12 rounded-lg" />
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
              <Skeleton className="w-12 h-12 rounded-lg" />
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
      <div className="space-y-8 mt-12">
      <div className="flex justify-center sm:justify-start sm:text-left">
          <h3 className="text-2xl sm:text-3xl font-bold px-2 tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text break-words">
            {otherToolsText}
          </h3>
          <div className="h-1 w-20 bg-primary rounded-full mt-3 mx-auto sm:mx-0 transition-all duration-300"></div>
        </div>
        <VirtualFeatureGrid 
          features={otherFeatures}
          className="min-h-[300px]"
        />
      </div>

    </>
  );
});

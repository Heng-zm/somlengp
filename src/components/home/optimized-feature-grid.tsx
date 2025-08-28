'use client';

import { memo, Suspense, lazy, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/lib/performance';

// Lazy load the AI Assistant Widget
const AIAssistantWidget = lazy(() => import('@/components/shared/ai-assistant-widget').then(mod => ({ default: mod.AIAssistantWidget })));

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

  return (
    <div ref={cardRef}>
      <Link href={href} passHref>
        <Card className={cn(
          "w-full p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden",
          "transition-all duration-300 ease-in-out",
          "bg-gradient-to-br from-primary/10 via-background to-background",
          "hover:shadow-2xl hover:border-primary/20 group",
          "transform-gpu", // Force GPU acceleration
          isVisible ? "opacity-100" : "opacity-50"
        )}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="p-4 bg-primary/20 rounded-xl w-fit border border-primary/30 will-change-transform">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-grow">
              <h2 className="text-3xl font-bold">{title}</h2>
              <p className="text-muted-foreground mt-2 max-w-lg">{description}</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button 
              variant="default" 
              className="group-hover:bg-primary/90 will-change-transform"
            >
              {startNowText}
              <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1 will-change-transform" />
            </Button>
          </div>
        </Card>
      </Link>
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
        "w-full h-full p-5 flex items-center gap-5",
        "bg-card text-card-foreground border",
        "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out",
        "motion-safe:hover:scale-[1.02] hover:shadow-xl hover:border-primary/20",
        "motion-reduce:hover:bg-secondary/50",
        "group focus-visible:ring-2 focus-visible:ring-primary",
        "transform-gpu will-change-transform",
        action ? "cursor-pointer" : ""
      )}
      onClick={action}
    >
      <div className="p-3 bg-secondary rounded-lg border motion-safe:will-change-transform">
        <Icon className="w-6 h-6 text-primary motion-safe:transition-colors motion-safe:group-hover:text-primary" />
      </div>
      <div className="flex-grow">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
      <ArrowRight className="text-muted-foreground/50 motion-safe:transition-transform motion-safe:group-hover:translate-x-1 motion-safe:will-change-transform" />
    </Card>
  );

  return (
    <div ref={cardRef}>
      {isVisible ? (
        href ? (
          <Link href={href} passHref>
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
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
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
        "gap-4 sm:gap-6 auto-rows-fr",
        className
      )}
    >
      {visibleFeatures.map((feature, index) => (
        <div 
          key={feature.href || feature.title} 
          data-index={visibleRange.start + index}
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
      <div className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-semibold px-2 text-center sm:text-left">
          {otherToolsText}
        </h3>
        <VirtualFeatureGrid 
          features={otherFeatures}
          className="min-h-[300px]"
        />
      </div>

      {/* Floating AI Assistant Widget */}
      <Suspense fallback={null}>
        <AIAssistantWidget />
      </Suspense>
    </>
  );
});

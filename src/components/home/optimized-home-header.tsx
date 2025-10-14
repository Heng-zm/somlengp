'use client';

import { memo, useCallback, Suspense, lazy } from 'react';
import { Sun, Moon, Menu, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Language } from '@/lib/translations';

// Lazy load sheet components
const Sheet = lazy(() => import('@/components/ui/sheet').then(mod => ({ default: mod.Sheet })));
const SheetContent = lazy(() => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetContent })));
const SheetHeader = lazy(() => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetHeader })));
const SheetTitle = lazy(() => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetTitle })));
const SheetTrigger = lazy(() => import('@/components/ui/sheet').then(mod => ({ default: mod.SheetTrigger })));
const Sidebar = lazy(() => import('@/components/shared/sidebar').then(mod => ({ default: mod.Sidebar })));

interface HomeHeaderProps {
  visitorCount: number | null;
  theme: string;
  language: Language;
  onThemeToggle: () => void;
  onLanguageToggle: () => void;
}

// Memoized visitor count display
const VisitorCount = memo(function VisitorCount({ count }: { count: number | null }) {
  if (count === null) {
    return <Skeleton className="h-6 w-24 rounded-md" />;
  }

  const label = `${count} ${count === 1 ? 'User' : 'Users'}`;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      <Users className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
});

// Memoized theme toggle button
const ThemeToggleButton = memo(function ThemeToggleButton({ 
  theme, 
  onToggle 
}: { 
  theme: string; 
  onToggle: () => void; 
}) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onToggle} 
      className="hidden md:inline-flex" 
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
});

// Memoized language toggle button
const LanguageToggleButton = memo(function LanguageToggleButton({ 
  language, 
  onToggle 
}: { 
  language: Language; 
  onToggle: () => void; 
}) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onToggle} 
      type="button"
      aria-label="Switch language"
    >
      <Globe className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Current language: {language}</span>
    </Button>
  );
});

// Memoized mobile menu
const MobileMenu = memo(function MobileMenu({ 
  language, 
  onLanguageToggle 
}: { 
  language: Language; 
  onLanguageToggle: () => void; 
}) {
  return (
    <Suspense fallback={
      <Button variant="ghost" size="icon" type="button" disabled>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>
    }>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" type="button" aria-label="Open menu">
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[300px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SheetHeader className="p-4 border-b sr-only">
            <SheetTitle>Main Menu</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </Suspense>
  );
});

// Main optimized header component
export const OptimizedHomeHeader = memo(function OptimizedHomeHeader({
  visitorCount,
  theme,
  language,
  onThemeToggle,
  onLanguageToggle
}: HomeHeaderProps) {
  const handleThemeToggle = useCallback(() => {
    onThemeToggle();
  }, [onThemeToggle]);

  const handleLanguageToggle = useCallback(() => {
    onLanguageToggle();
  }, [onLanguageToggle]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center p-3 sm:p-4 md:p-6">
      {/* Left side - Menu button */}
      <div className="flex items-center flex-shrink-0">
        <MobileMenu language={language} onLanguageToggle={handleLanguageToggle} />
      </div>
      
      {/* Center - Title */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-0 flex-1">
        <div className="flex flex-col gap-1 min-w-0 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Somleng
          </h1>
          <div className="hidden sm:block">
            <VisitorCount count={visitorCount} />
          </div>
        </div>
      </div>
      
      {/* Right side - Controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <LanguageToggleButton language={language} onToggle={handleLanguageToggle} />
        <ThemeToggleButton theme={theme} onToggle={handleThemeToggle} />
      </div>
    </header>
  );
});

'use client';

import { Languages, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


interface LanguageToggleProps {
  variant?: 'button' | 'minimal' | 'sidebar';
  className?: string;
}

export function LanguageToggle({ variant = 'button', className }: LanguageToggleProps) {
  const { language, toggleLanguage, t, isKhmer, isEnglish } = useLanguage();

  // For minimal variant (just toggle without dropdown)
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'text-foreground',
          className
        )}
        title={`Switch to ${isKhmer ? 'English' : 'ភាសាខ្មែរ'}`}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isKhmer ? 'English' : 'ខ្មែរ'}
        </span>
      </button>
    );
  }

  // For sidebar variant
  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          'flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium rounded-lg transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'text-foreground',
          className
        )}
        title={`Switch to ${isKhmer ? 'English' : 'ភាសាខ្មែរ'}`}
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        <div className="flex items-center justify-between w-full">
          <span>Language</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
            {isKhmer ? 'ខ្មែរ' : 'EN'}
          </span>
        </div>
      </button>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-2 h-9 px-3',
            className
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">
            {isKhmer ? 'ភាសាខ្មែរ' : 'English'}
          </span>
          <span className="sm:hidden text-xs font-medium">
            {isKhmer ? 'ខ្មែរ' : 'EN'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => language !== 'en' && toggleLanguage()}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            isEnglish && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🇺🇸</span>
            <span>English</span>
          </div>
          {isEnglish && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => language !== 'km' && toggleLanguage()}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            isKhmer && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🇰🇭</span>
            <span>ភាសាខ្មែរ</span>
          </div>
          {isKhmer && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Language } from '@/lib/translations';
import { FeaturePageLayoutProvider } from './feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';

// Helper function to get initial theme with SSR safety
function getInitialTheme(): string {
  if (typeof window === 'undefined') return 'light';
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'en' ? 'km' : 'en'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  }, []);

  // Initialize theme on mount to prevent hydration mismatch
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language;
  }, [language, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme, mounted]);

  const contextValue = useMemo(() => ({
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  }), [language, theme, toggleLanguage, toggleTheme]);

  return (
    <LanguageContext.Provider value={contextValue}>
      <FeaturePageLayoutProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        </div>
      </FeaturePageLayoutProvider>
    </LanguageContext.Provider>
  );
}

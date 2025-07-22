
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Language } from '@/lib/translations';
import { FeaturePageLayoutProvider } from './feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState('light');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'km' : 'en'));
  };

  const toggleTheme = () => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return newTheme;
    });
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const contextValue = useMemo(() => ({
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  }), [language, theme]);

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

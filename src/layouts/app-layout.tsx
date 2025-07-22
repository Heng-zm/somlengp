
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Language } from '@/lib/translations';
import { FeaturePageLayoutProvider } from './feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'km' : 'en'));
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    toggleLanguage
  }), [language]);

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

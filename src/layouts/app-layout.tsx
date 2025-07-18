
"use client";

import { useState, useMemo } from 'react';
import type { Language } from '@/lib/translations';
import { FeaturePageLayoutProvider } from './feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'km' : 'en'));
  };

  const contextValue = useMemo(() => ({
    language,
    toggleLanguage
  }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      <FeaturePageLayoutProvider>
        <div className="flex flex-col h-screen bg-background">
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {children}
          </main>
        </div>
      </FeaturePageLayoutProvider>
    </LanguageContext.Provider>
  );
}

"use client";

import { createContext, useState, useMemo } from 'react';
import type { Language } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

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
      <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {children}
        </main>
      </div>
    </LanguageContext.Provider>
  );
}

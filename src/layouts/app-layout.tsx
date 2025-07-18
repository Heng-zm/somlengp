
"use client";

import { Sidebar } from '@/components/shared/sidebar';
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
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <Sidebar language={language} toggleLanguage={toggleLanguage} />
        </div>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Main Content */}
          {children}
        </main>
      </div>
    </LanguageContext.Provider>
  );
}

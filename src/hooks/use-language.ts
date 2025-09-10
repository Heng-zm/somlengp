'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations, resolveTranslation, type Language } from '@/lib/translations';

export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { language, toggleLanguage, theme, toggleTheme } = context;
  
  // Get current translations based on language
  const translations = allTranslations[language];
  
  // Helper function to get translated text
  const t = (key: keyof typeof translations, params?: { size?: number }) => {
    const value = translations[key];
    if (typeof value === 'function' && params?.size !== undefined) {
      return value(params.size);
    }
    return resolveTranslation(value, params?.size);
  };

  return {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    t,
    translations,
    isKhmer: language === 'km',
    isEnglish: language === 'en',
  };
}

export type UseLanguageReturn = ReturnType<typeof useLanguage>;

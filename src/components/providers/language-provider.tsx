'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LanguageContext, type Theme } from '@/contexts/language-context';
import type { Language } from '@/lib/translations';

interface LanguageProviderProps {
  children: ReactNode;
}

const noop = () => {};

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const savedLanguage = localStorage.getItem(
      'preferred-language'
    ) as Language;
    if (savedLanguage === 'km' || savedLanguage === 'en') {
      return savedLanguage;
    }
  } catch {
    // Use the default when browser storage is unavailable.
  }

  return 'en';
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const actualLanguage = getInitialLanguage();
    const actualTheme = getInitialTheme();

    setLanguage(actualLanguage);
    setTheme(actualTheme);
    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem('preferred-language', language);
    } catch {
      // The UI can still use the selected language for this session.
    }

    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.body.classList.remove('lang-en', 'lang-km');
    document.body.classList.add(`lang-${language}`);
  }, [language, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem('preferred-theme', theme);
    } catch {
      // The UI can still use the selected theme for this session.
    }

    document.documentElement.classList.toggle('dark', theme === 'dark');

    const themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    themeColorMeta?.setAttribute(
      'content',
      theme === 'dark' ? '#020617' : '#f8fafc'
    );
  }, [theme, isInitialized]);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'km' : 'en'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const contextValue = useMemo(
    () => ({
      language: isInitialized ? language : ('en' as Language),
      toggleLanguage: isInitialized ? toggleLanguage : noop,
      theme: isInitialized ? theme : ('light' as Theme),
      toggleTheme: isInitialized ? toggleTheme : noop,
    }),
    [isInitialized, language, theme, toggleLanguage, toggleTheme]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

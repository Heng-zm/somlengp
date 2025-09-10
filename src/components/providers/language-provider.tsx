'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { LanguageContext } from '@/contexts/language-context';
import type { Language } from '@/lib/translations';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language and theme from localStorage
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('preferred-language') as Language;
      const savedTheme = localStorage.getItem('preferred-theme');

      // Set language (default to English if not found)
      if (savedLanguage && (savedLanguage === 'km' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }

      // Set theme (default to light if not found)
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load language preferences from localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('preferred-language', language);
      
      // Update document language attribute for accessibility and SEO
      document.documentElement.lang = language === 'km' ? 'km' : 'en';
      
      // Update document direction for RTL languages (Khmer is LTR, so we keep it as ltr)
      document.documentElement.dir = 'ltr';
      
      // Add language-specific class to body for CSS styling
      document.body.className = document.body.className.replace(/lang-\w+/g, '');
      document.body.classList.add(`lang-${language}`);
      
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error);
    }
  }, [language, isInitialized]);

  // Save theme preference when it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem('preferred-theme', theme);
      
      // Update document theme class
      document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
      document.documentElement.classList.add(`theme-${theme}`);
      
      // Update theme-color meta tag for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? '#1a202c' : '#ffffff');
      }
    } catch (error) {
      console.warn('Failed to save theme preference to localStorage:', error);
    }
  }, [theme, isInitialized]);

  const toggleLanguage = () => {
    setLanguage(current => current === 'en' ? 'km' : 'en');
  };

  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light');
  };

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        toggleLanguage, 
        theme, 
        toggleTheme 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

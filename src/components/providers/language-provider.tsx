'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { LanguageContext } from '@/contexts/language-context';
import type { Language } from '@/lib/translations';

interface LanguageProviderProps {
  children: ReactNode;
}

// Helper function to get initial theme without causing hydration mismatch
function getInitialTheme(): string {
  // Always return 'light' on server-side to match initial render
  if (typeof window === 'undefined') {
    return 'light';
  }
  
  try {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// Helper function to get initial language
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en';
  }
  
  try {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && (savedLanguage === 'km' || savedLanguage === 'en')) {
      return savedLanguage;
    }
  } catch {
    // Ignore errors
  }
  
  return 'en';
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState(getInitialTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language and theme from localStorage
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('preferred-language') as Language;
      const savedTheme = localStorage.getItem('preferred-theme');
      let actualTheme = 'light';

      // Set language (default to English if not found)
      if (savedLanguage && (savedLanguage === 'km' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }

      // Set theme (default to system preference if not found)
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        actualTheme = savedTheme;
      } else {
        // Detect system theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        actualTheme = prefersDark ? 'dark' : 'light';
      }
      
      // Apply theme immediately to prevent flash
      if (actualTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setTheme(actualTheme);
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
      
      // Update document theme class - use standard 'dark' class for Tailwind
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update theme-color meta tag for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? 'hsl(224 71% 4%)' : 'hsl(240 10% 99%)');
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

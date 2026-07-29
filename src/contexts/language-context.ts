
import { createContext } from 'react';
import type { Language } from '@/lib/translations';

export type Theme = 'light' | 'dark';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    theme: Theme;
    toggleTheme: () => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

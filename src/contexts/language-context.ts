
import { createContext } from 'react';
import type { Language } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

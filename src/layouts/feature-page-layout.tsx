
"use client";

import { createContext, useState, useMemo, useContext } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';


// Model Context
interface ModelContextType {
    selectedModel: string;
    setSelectedModel: (model: string) => void;
}
export const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Provider for Model context
export function FeaturePageLayoutProvider({ children }: { children: React.ReactNode }) {
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
    
    const modelContextValue = useMemo(() => ({
        selectedModel,
        setSelectedModel,
    }), [selectedModel]);

    return (
        <ModelContext.Provider value={modelContextValue}>
            {children}
        </ModelContext.Provider>
    );
}

// The actual layout component
interface FeaturePageLayoutProps {
    children: React.ReactNode;
    title: string;
    showModelSelector?: boolean;
}

export function FeaturePageLayout({ children, title, showModelSelector = false }: FeaturePageLayoutProps) {
    const langContext = useContext(LanguageContext);
    if (!langContext) {
        throw new Error('FeaturePageLayout must be used within an AppLayout');
    }
    const { language } = langContext;
    const t = useMemo(() => allTranslations[language], [language]);

    const modelContext = useContext(ModelContext);
    if (!modelContext) {
        throw new Error('FeaturePageLayout must be used within a FeaturePageLayoutProvider');
    }
    const { selectedModel, setSelectedModel } = modelContext;

    const modelOptions = useMemo(() => ([
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash' },
    ]), []);

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/">
                    <ChevronLeft />
                    <span className="sr-only">Back to Home</span>
                  </Link>
                </Button>
                <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
                {showModelSelector ? (
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-fit md:w-[180px] text-xs sm:text-sm">
                            <SelectValue placeholder={t.selectModel} />
                        </SelectTrigger>
                        <SelectContent>
                            {modelOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="w-10"></div> // Placeholder for alignment
                )}
            </header>
            <div className="flex-grow overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

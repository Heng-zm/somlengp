
"use client";

import { createContext, useState, useMemo, useContext } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash-latest');
    
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

    const modelDisplayNames = useMemo(() => ({
        'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
        'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
    }), []);

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
                <Link href="/" passHref>
                   <Button variant="ghost" size="icon">
                      <ArrowLeft />
                   </Button>
                </Link>
                <h1 className="text-xl font-bold">{title}</h1>
                {showModelSelector ? (
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-fit md:w-[180px]">
                            <SelectValue placeholder={t.selectModel} />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(modelDisplayNames).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="w-10"></div> // Placeholder for alignment
                )}
            </header>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

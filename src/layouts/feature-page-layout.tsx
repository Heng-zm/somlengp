
"use client";

import { createContext, useState, useMemo, useContext } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';

export function FeaturePageLayoutProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
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

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-4 border-b border-white/10">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/">
                    <ChevronLeft />
                    <span className="sr-only">Back to Home</span>
                  </Link>
                </Button>
                <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
                <div className="w-10"></div>
            </header>
            <div className="flex-grow overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

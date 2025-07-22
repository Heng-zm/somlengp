
"use client";

import { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { useHistory } from '@/hooks/use-history';

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
    const pathname = usePathname();
    const { addHistoryItem } = useHistory();

    if (!langContext) {
        throw new Error('FeaturePageLayout must be used within an AppLayout');
    }
    const { language } = langContext;
    const t = useMemo(() => allTranslations[language], [language]);

    useEffect(() => {
        if (title && pathname) {
            addHistoryItem({ href: pathname, label: title, timestamp: Date.now() });
        }
    }, [title, pathname, addHistoryItem]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/home">
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

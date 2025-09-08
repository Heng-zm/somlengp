
"use client";

import React, { useContext, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/language-context';
import { useHistory } from '@/hooks/use-history';
import { ModelSelector, DEFAULT_AI_MODELS, AIModel } from '@/components/shared/model-selector';

export function FeaturePageLayoutProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

// The actual layout component
interface FeaturePageLayoutProps {
    children: React.ReactNode;
    title: string;
    showModelSelector?: boolean;
    rightElement?: React.ReactNode;
}

export const FeaturePageLayout = React.memo<FeaturePageLayoutProps>(function FeaturePageLayout({ children, title, showModelSelector = false, rightElement }) {
    const langContext = useContext(LanguageContext);
    const pathname = usePathname();
    const { addHistoryItem } = useHistory();
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_AI_MODELS[0]);

    if (!langContext) {
        throw new Error('FeaturePageLayout must be used within an AppLayout');
    }

    useEffect(() => {
        if (title && pathname) {
            addHistoryItem({ href: pathname, label: title, timestamp: Date.now() });
        }
    }, [title, pathname, addHistoryItem]);

    // Memoize header and main content
    const header = React.useMemo(() => (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between p-2 sm:p-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/home">
                <ChevronLeft />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
            {rightElement ? (
                rightElement
            ) : showModelSelector ? (
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    size="sm"
                />
            ) : (
                <div className="w-10"></div>
            )}
        </header>
    ), [title, showModelSelector, selectedModel, rightElement]);

    const mainContent = React.useMemo(() => (
        <div className="flex-grow overflow-y-auto pt-16">
            {children}
        </div>
    ), [children]);

    return (
        <div className="flex flex-col h-full">
            {header}
            {mainContent}
        </div>
    );
});

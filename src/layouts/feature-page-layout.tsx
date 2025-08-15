
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
}

export const FeaturePageLayout = React.memo<FeaturePageLayoutProps>(function FeaturePageLayout({ children, title, showModelSelector = false }) {
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
        <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-4 border-b">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/home">
                <ChevronLeft />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
            {showModelSelector ? (
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    size="sm"
                />
            ) : (
                <div className="w-10"></div>
            )}
        </header>
    ), [title, showModelSelector, selectedModel]);

    const mainContent = React.useMemo(() => (
        <div className="flex-grow overflow-y-auto">
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

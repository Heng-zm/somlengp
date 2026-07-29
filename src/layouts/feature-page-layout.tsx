
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

    const header = React.useMemo(() => (
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="-ml-3 mb-1 h-8 px-2 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              >
                <Link href="/home">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>All tools</span>
                </Link>
              </Button>
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {title}
              </h1>
            </div>

            {rightElement ? (
              <div className="shrink-0">{rightElement}</div>
            ) : showModelSelector ? (
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                size="sm"
              />
            ) : null}
          </div>
        </header>
    ), [title, showModelSelector, selectedModel, rightElement]);

    const mainContent = React.useMemo(() => (
        <div className="mx-auto w-full max-w-[1600px] flex-1">
            {children}
        </div>
    ), [children]);

    return (
        <section className="flex min-h-[calc(100dvh-4rem)] flex-col bg-slate-50/60 dark:bg-slate-950 lg:min-h-dvh">
            {header}
            {mainContent}
        </section>
    );
});

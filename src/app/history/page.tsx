
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { History as HistoryIcon, Mic, FileText, Combine, ImageIcon, Wand2, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHistory } from '@/hooks/use-history';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { useContext } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: { [key: string]: React.ElementType } = {
    '/voice-transcript': Mic,
    '/pdf-transcript': FileText,
    '/text-to-speech': AudioLines,
    '/combine-pdf': Combine,
    '/image-to-pdf': ImageIcon,
    '/convert-image-format': Wand2,
};

export default function HistoryPage() {
    const { history, isLoaded } = useHistory();
    const langContext = useContext(LanguageContext);
    
    if (!langContext) {
        throw new Error('HistoryPage must be used within a LanguageProvider');
    }

    const { language } = langContext;
    const t = useMemo(() => allTranslations[language], [language]);

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => b.timestamp - a.timestamp);
    }, [history]);

    return (
        <FeaturePageLayout title={t.history as string}>
            <div className="p-4 md:p-6 h-full">
                <Card className="h-full flex flex-col">
                    {isLoaded && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-10 flex-grow">
                            <HistoryIcon className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">{t.noHistory}</h3>
                            <p className="text-muted-foreground mt-2">Start using the tools to see your history here.</p>
                            <Button asChild className="mt-4">
                                <Link href="/home">Go to Home</Link>
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="flex-grow">
                            <CardContent className="p-4 space-y-4">
                                {sortedHistory.map(item => {
                                    const Icon = iconMap[item.href] || HistoryIcon;
                                    return (
                                        <Link key={`${item.href}-${item.timestamp}`} href={item.href} passHref>
                                            <Card className="p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer mb-4">
                                                <div className="p-3 bg-primary/10 rounded-lg">
                                                    <Icon className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-grow">
                                                    <h4 className="font-semibold text-lg">{item.label}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <Button variant="ghost">Go</Button>
                                            </Card>
                                        </Link>
                                    )
                                })}
                            </CardContent>
                        </ScrollArea>
                    )}
                </Card>
            </div>
        </FeaturePageLayout>
    );
}

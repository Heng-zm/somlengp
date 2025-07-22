
'use client';

import { useContext, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Mic, FileText, Menu, Combine, Image as ImageIcon, Users, Wand2, BotMessageSquare, AudioLines, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/shared/sidebar';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const VISITOR_SESSION_KEY = 'ozo-designer-session-visited';

export default function HomePage() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const langContext = useContext(LanguageContext);
  
  if (!langContext) {
    throw new Error('Home page must be used within a LanguageProvider');
  }

  const { language, toggleLanguage, theme, toggleTheme } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);
  
  useEffect(() => {
    const fetchVisitorCount = async () => {
      try {
        const response = await fetch('/api/visit');
        const data = await response.json();
        if (data.success) {
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch initial visitor count:', error);
      }
    };
    
    const incrementAndFetchCount = async () => {
        try {
            const response = await fetch('/api/visit', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setVisitorCount(data.count);
                sessionStorage.setItem(VISITOR_SESSION_KEY, 'true');
            }
        } catch(error) {
            console.error('Failed to increment visitor count:', error);
            // Fallback to just fetching if post fails
            fetchVisitorCount();
        }
    };

    if (typeof window !== 'undefined') {
        const hasVisited = sessionStorage.getItem(VISITOR_SESSION_KEY);
        if (hasVisited) {
            fetchVisitorCount();
        } else {
            incrementAndFetchCount();
        }
    }
  }, []);
  
  const featureCards = [
    { href: '/voice-transcript', title: t.voiceScribe, description: t.voiceTranscriptDescription, icon: Mic },
    { href: '/pdf-transcript', title: t.pdfTranscript, description: t.pdfTranscriptDescription, icon: FileText },
    { href: '/text-to-speech', title: 'Text to Speech', description: 'Convert text into natural-sounding speech.', icon: AudioLines },
    { href: '/combine-pdf', title: t.combinePdf, description: t.combinePdfDescription, icon: Combine },
    { href: '/image-to-pdf', title: t.imageToPdf, description: t.imageToPdfDescription, icon: ImageIcon },
    { href: '/convert-image-format', title: t.convertImageFormat, description: t.convertImageFormatDescription, icon: Wand2 },
  ];

  return (
    <div className="flex flex-col h-full text-foreground">
      <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4">
          <BotMessageSquare className="h-8 w-8 text-primary" />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">VoiceScribe</h1>
            {visitorCount !== null ? (
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{visitorCount} Visitors</span>
                </div>
            ) : (
                <Skeleton className="h-7 w-32 rounded-full" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:inline-flex">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] bg-background/80 backdrop-blur-lg">
                  <SheetHeader className="p-4 border-b sr-only">
                      <SheetTitle>Main Menu</SheetTitle>
                  </SheetHeader>
                  <Sidebar language={language} toggleLanguage={toggleLanguage} />
                </SheetContent>
            </Sheet>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card, index) => (
                <FeatureCard
                    key={card.href}
                    href={card.href}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                />
            ))}
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

function FeatureCard({ href, title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Link href={href} passHref>
      <Card as="div" className={cn(
        "w-full h-full min-h-[220px] flex flex-col justify-between p-6 overflow-hidden transition-all duration-300 ease-in-out",
        "bg-card text-card-foreground border",
        "hover:scale-[1.03] hover:shadow-2xl hover:border-primary/20"
      )}>
          <div className="relative z-10">
            <div className="mb-4 p-3 bg-primary/10 rounded-xl w-fit border border-primary/20">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex justify-end z-10">
            <Button variant="secondary" type="button">
              {allTranslations.en.startNow}
            </Button>
          </div>
      </Card>
    </Link>
  );
}


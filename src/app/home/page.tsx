
'use client';

import { useContext, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Mic, FileText, Menu, Combine, Image as ImageIcon, Users, Wand2, AudioLines, Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/shared/sidebar';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const VISITOR_SESSION_KEY = 'ozo-designer-session-visited';

export default function HomePage() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const langContext = useContext(LanguageContext);
  
  if (!langContext) {
    throw new Error('Home page must be used within a LanguageProvider');
  }

  const { language, toggleLanguage, theme, toggleTheme } = langContext;
  const t = useMemo(() => {
    const translations = allTranslations[language];
    return {
      ...translations,
      // Helper to resolve function-based translations
      getFileTooLargeDescription: (size: number) => translations.fileTooLargeDescription(size)
    };
  }, [language]);
  
  useEffect(() => {
    const fetchVisitorCount = async (isIncrement: boolean) => {
      try {
        const response = await fetch('/api/visit', { method: isIncrement ? 'POST' : 'GET' });
        const data = await response.json();
        if (data.success) {
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch visitor count:', error);
      }
    };
    
    if (typeof window !== 'undefined') {
        const hasVisited = sessionStorage.getItem(VISITOR_SESSION_KEY);
        if (hasVisited) {
            fetchVisitorCount(false);
        } else {
            fetchVisitorCount(true);
            sessionStorage.setItem(VISITOR_SESSION_KEY, 'true');
        }
    }
  }, []);
  
  const featureCards = useMemo(() => [
    { href: '/voice-transcript', title: t.voiceScribe, description: t.voiceTranscriptDescription, icon: Mic },
    { href: '/pdf-transcript', title: t.pdfTranscript, description: t.pdfTranscriptDescription, icon: FileText },
    { href: '/text-to-speech', title: 'Text to Speech', description: 'Convert text into natural-sounding speech.', icon: AudioLines },
    { href: '/combine-pdf', title: t.combinePdf, description: t.combinePdfDescription, icon: Combine },
    { href: '/image-to-pdf', title: t.imageToPdf, description: t.imageToPdfDescription, icon: ImageIcon },
    { href: '/convert-image-format', title: t.convertImageFormat, description: t.convertImageFormatDescription, icon: Wand2 },
  ], [t]);
  
  const primaryFeature = featureCards[0];
  const otherFeatures = featureCards.slice(1);

  return (
    <div className="flex flex-col h-full text-foreground">
      <header className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXQ6IUyl8D8fpZl8p9BvXg-PCxKPa-1vOp0oPC2-uKH-H_M1T" alt="logo" width={32} height={32} data-ai-hint="logo" className="rounded-full" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">VoiceScribe</h1>
            {visitorCount !== null ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{visitorCount} Visitors</span>
                </div>
            ) : (
                <Skeleton className="h-6 w-24 rounded-md" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:inline-flex" type="button">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" type="button">
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

      <ScrollArea className="flex-grow">
        <main className="p-4 sm:p-6 space-y-8">
            <Link href={primaryFeature.href} passHref>
                <Card className="w-full p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-all duration-300 ease-in-out bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-2xl hover:border-primary/20 group">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="p-4 bg-primary/20 rounded-xl w-fit border border-primary/30">
                            <primaryFeature.icon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-3xl font-bold">{primaryFeature.title}</h2>
                            <p className="text-muted-foreground mt-2 max-w-lg">{primaryFeature.description}</p>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button variant="default" className="group-hover:bg-primary/90">
                            {t.startNow}
                            <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </Card>
            </Link>
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold px-2">{t.otherTools}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherFeatures.map((card) => (
                        <FeatureCard
                            key={card.href}
                            href={card.href}
                            title={card.title}
                            description={card.description}
                            icon={card.icon}
                        />
                    ))}
                </div>
            </div>
        </main>
      </ScrollArea>
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
      <Card className={cn(
        "w-full h-full p-5 flex items-center gap-5 transition-all duration-300 ease-in-out",
        "bg-card text-card-foreground border",
        "hover:scale-[1.03] hover:shadow-xl hover:border-primary/20 group"
      )}>
          <div className="p-3 bg-secondary rounded-lg border">
            <Icon className="w-6 h-6 text-primary transition-colors group-hover:text-primary" />
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
          <ArrowRight className="text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
      </Card>
    </Link>
  );
}

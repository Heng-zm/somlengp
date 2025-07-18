
'use client';

import { useContext, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Mic, FileText, Menu, Combine, Image as ImageIcon, Users, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/shared/sidebar';
import { LanguageContext } from '@/contexts/language-context';
import { allTranslations } from '@/lib/translations';
import { BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const VISITOR_COUNT_KEY = 'ozoDesignerVisitorCount';

export default function Home() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('Home page must be used within a LanguageProvider');
  }
  const { language, toggleLanguage } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);
  
  useEffect(() => {
    const manageVisitorCount = async () => {
      let storedCount = localStorage.getItem(VISITOR_COUNT_KEY);

      if (storedCount) {
        // User has visited before, use the stored count.
        setVisitorCount(parseInt(storedCount, 10));
      } else {
        // First visit for this browser.
        try {
          // Fetch a base count from the server.
          const response = await fetch('/api/visit');
          const data = await response.json();
          
          if (data.success) {
            // Increment the base count for this new visitor and store it.
            const newCount = (data.count || 0) + 1;
            setVisitorCount(newCount);
            localStorage.setItem(VISITOR_COUNT_KEY, newCount.toString());
          } else {
            // Fallback if API fails on first visit.
            setVisitorCount(1);
            localStorage.setItem(VISITOR_COUNT_KEY, '1');
          }
        } catch (error) {
          console.error('Failed to fetch initial visitor count:', error);
          // Fallback if API is unreachable.
          setVisitorCount(1);
          localStorage.setItem(VISITOR_COUNT_KEY, '1');
        }
      }
    };

    manageVisitorCount();
  }, []);
  
  const featureCards = [
    { href: '/voice-transcript', title: t.voiceScribe, description: t.voiceTranscriptDescription, icon: Mic, gradient: 'from-blue-400 to-teal-400' },
    { href: '/pdf-transcript', title: t.pdfTranscript, description: t.pdfTranscriptDescription, icon: FileText, gradient: 'from-purple-400 to-pink-400' },
    { href: '/combine-pdf', title: t.combinePdf, description: t.combinePdfDescription, icon: Combine, gradient: 'from-green-400 to-blue-400' },
    { href: '/image-to-pdf', title: t.imageToPdf, description: t.imageToPdfDescription, icon: ImageIcon, gradient: 'from-orange-400 to-red-400' },
    { href: '/convert-image-format', title: t.convertImageFormat, description: t.convertImageFormatDescription, icon: Wand2, gradient: 'from-yellow-400 to-orange-400' },
  ];

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BotMessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ozo. Designer</h1>
            {visitorCount !== null && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Users className="w-4 h-4" />
                    <span>{visitorCount} Visitors</span>
                </div>
            )}
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[300px]">
            <SheetHeader className="p-4 border-b sr-only">
                <SheetTitle>Main Menu</SheetTitle>
            </SheetHeader>
            <Sidebar language={language} toggleLanguage={toggleLanguage} />
          </SheetContent>
        </Sheet>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        {featureCards.map((card, index) => (
            <div key={card.href} className={cn(
                (featureCards.length % 2 !== 0 && index === featureCards.length - 1) && 'md:col-span-2 lg:col-span-1',
                 (featureCards.length % 3 !== 0 && index === featureCards.length - 1) && 'lg:col-span-3'
            )}>
                <FeatureCard
                  href={card.href}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  gradient={card.gradient}
                />
            </div>
        ))}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

function FeatureCard({ href, title, description, icon: Icon, gradient }: FeatureCardProps) {
  return (
    <Link href={href} passHref>
      <Card className={`relative w-full h-full min-h-[200px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] shadow-lg text-white bg-gradient-to-br ${gradient}`}>
          <div className="relative z-10">
            <div className="mb-4 p-3 bg-white/20 rounded-full w-fit">
              <Icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="opacity-80 mt-1">{description}</p>
          </div>
          <div className="flex justify-end z-10">
            <Button variant="secondary" className="bg-white/90 text-foreground hover:bg-white">
              {allTranslations.en.startNow}
            </Button>
          </div>
      </Card>
    </Link>
  );
}

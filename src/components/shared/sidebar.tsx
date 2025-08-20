
"use client";

import { useContext, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Languages, FileText, LifeBuoy, Mic, Combine, Image as ImageIcon, Wand2, FileHeart, AudioLines, Sun, Moon, History, ArrowRight, Home, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { allTranslations } from '@/lib/translations';
import type { Language } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { useHistory } from '@/hooks/use-history';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Sidebar = memo(function Sidebar({ language, toggleLanguage }: { language: Language, toggleLanguage: () => void }) {
  const pathname = usePathname();
  const t = useMemo(() => allTranslations[language], [language]);
  const langContext = useContext(LanguageContext);
  const { history } = useHistory();
  
  if (!langContext) {
    throw new Error('Sidebar must be used within a LanguageProvider');
  }

  const { theme, toggleTheme } = langContext;

  const navItems = useMemo(() => [
    { href: '/home', label: t.home, icon: Home },
    { href: '/ai-assistant', label: "AI Assistant", icon: Bot, premium: true },
    { href: '/voice-transcript', label: t.voiceScribe, icon: Mic },
    { href: '/text-to-speech', label: "Text to Speech", icon: AudioLines },
    { href: '/pdf-transcript', label: t.pdfTranscript, icon: FileText },
    { href: '/combine-pdf', label: t.combinePdf, icon: Combine },
    { href: '/image-to-pdf', label: t.imageToPdf, icon: ImageIcon },
    { href: '/convert-image-format', label: t.convertImageFormat, icon: Wand2 },
  ], [t]);

  const recentHistory = useMemo(() => {
    // Find the corresponding nav item for each history entry to get the icon
    return history
        .sort((a,b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map(h => {
            const navItem = navItems.find(item => item.href === h.href);
            return {
                ...h,
                icon: navItem?.icon || History, // Fallback icon
            };
    });
  }, [history, navItems]);


  return (
    <aside className="w-full h-full flex flex-col bg-transparent">
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <Link href="/home" className="flex items-center gap-2">
            <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXQ6IUyl8D8fpZl8p9BvXg-PCxKPa-1vOp0oPC2-uKH-H_M1T" alt="logo" width={32} height={32} data-ai-hint="logo" className="rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Somleng</h1>
              <p className="text-xs text-muted-foreground">Version 2.2.5</p>
            </div>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-grow">
          <nav className="p-4 space-y-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-base py-6 relative"
                    type="button"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                    {item.premium && (
                      <span className="ml-auto text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full">
                        Premium
                      </span>
                    )}
                  </Button>
                </Link>
              ))}
          </nav>
          
          {history.length > 0 && (
                <div className='p-4 pt-0'>
                    <Separator className="my-2" />
                    <h2 className="mb-2 mt-4 px-2 text-lg font-semibold tracking-tight flex items-center">{t.history}</h2>
                    <div className="space-y-1">
                        {recentHistory.map(item => (
                            <Link key={`history-${item.href}`} href={item.href} passHref>
                                <Button
                                    variant='ghost'
                                    className="w-full justify-start text-base py-6"
                                    type="button"
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                    {history.length > 3 && (
                         <Link href="/history" passHref>
                            <Button variant="link" className="w-full justify-start text-base py-6 text-primary" type="button">
                                <ArrowRight className="mr-3 h-5 w-5" />
                                {t.seeAll}
                            </Button>
                         </Link>
                    )}
                </div>
          )}
      </ScrollArea>

      <div className="flex-shrink-0 p-4 border-t mt-auto">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start" type="button">
              <LifeBuoy className="mr-3 h-5 w-5" />
              {t.support}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg h-[80vh] flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SheetHeader className="text-center mb-4">
              <SheetTitle>
                <div className="flex items-center justify-center gap-2">
                  <LifeBuoy />
                  {t.support}
                </div>
              </SheetTitle>
              <SheetDescription>
                {t.supportDescription}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-grow flex justify-center items-center">
                <div className="h-full w-full max-w-sm rounded-md border border-border overflow-hidden">
                    <iframe src="https://pay-coffee.vercel.app/" className="w-full h-full" title="Support" />
                </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="https://t.me/Ozo0_0" target="_blank" rel="noopener noreferrer" passHref>
          <Button variant="ghost" className="w-full justify-start mt-2" type="button">
            <FileHeart className="mr-3 h-5 w-5" />
            {t.reportBug}
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" onClick={toggleLanguage} className="w-full justify-start" type="button">
                <Languages className="mr-3 h-5 w-5" />
                <span>{language === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="flex-shrink-0" type="button">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
        </div>
      </div>
    </aside>
  );
});

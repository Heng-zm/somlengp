
"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BotMessageSquare, Languages, FileText, LifeBuoy, Mic, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { allTranslations } from '@/lib/translations';
import type { Language } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface SidebarProps {
  language: Language;
  toggleLanguage: () => void;
}

export function Sidebar({ language, toggleLanguage }: SidebarProps) {
  const pathname = usePathname();
  const t = useMemo(() => allTranslations[language], [language]);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/voice-transcript', label: t.voiceScribe, icon: Mic },
    { href: '/pdf-transcript', label: t.pdfTranscript, icon: FileText },
  ];

  return (
    <aside className="w-full h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <BotMessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">VoiceScribe</h1>
        </Link>
      </div>

      <nav className="flex-grow p-4 space-y-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start text-base py-6"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          ))}
      </nav>

      <div className="p-4 border-t">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <LifeBuoy className="mr-3 h-5 w-5" />
              {t.support}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg h-[80vh] flex flex-col">
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
                    <iframe src="https://0zodesigner.github.io/donate/" className="w-full h-full" title="Donate" />
                </div>
            </div>
          </SheetContent>
        </Sheet>
         <Button variant="ghost" onClick={toggleLanguage} className="w-full justify-start mt-2">
            <Languages className="mr-3 h-5 w-5" />
            <span>{language === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
        </Button>
      </div>
    </aside>
  );
}

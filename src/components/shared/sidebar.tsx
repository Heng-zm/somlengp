
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BotMessageSquare, Languages, FileText, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const translations = {
  km: {
    voiceScribe: "ប្រតិចារិកសំឡេង",
    pdfTranscript: "ប្រតិចារិក PDF",
    support: "គាំទ្រ",
    supportDescription: "ប្រសិនបើអ្នកពេញចិត្តនឹងកម្មវិធីនេះ សូមពិចារណាគាំទ្រការអភិវឌ្ឍន៍របស់វា។",
  },
  en: {
    voiceScribe: "Voice Transcript",
    pdfTranscript: "PDF Transcript",
    support: "Support",
    supportDescription: "If you find this application useful, please consider supporting its development.",
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<'km' | 'en'>('en');
  const t = useMemo(() => translations[language], [language]);

  const navItems = [
    { href: '/', label: t.voiceScribe, icon: BotMessageSquare },
    { href: '/pdf-transcript', label: t.pdfTranscript, icon: FileText },
  ];

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'km' : 'en'));
  };

  return (
    <aside className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <BotMessageSquare className="h-8 w-8 text-sidebar-primary" />
          <h1 className="text-xl font-bold">VoiceScribe</h1>
        </Link>
      </div>

      <nav className="flex-grow p-4">
        <ul>
          {navItems.map(item => (
            <li key={item.href}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-2"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
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
      </div>
       <div className="p-4 border-t border-sidebar-border">
         <Button variant="ghost" onClick={toggleLanguage} className="w-full justify-start">
            <Languages className="mr-2 h-5 w-5" />
            <span>{language === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
        </Button>
      </div>
    </aside>
  );
}

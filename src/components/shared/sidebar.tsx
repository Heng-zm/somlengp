
"use client";

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LifeBuoy, Mic, Combine, Image as ImageIcon, Wand2, FileHeart, AudioLines, Sun, Moon, Home, Bot, QrCode, Shield } from 'lucide-react' // TODO: Consider importing icons individually for better tree shaking;
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/hooks/use-language';
import { LanguageToggle } from './language-toggle';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { t, theme, toggleTheme } = useLanguage();

  const navItems = useMemo(() => [
    // Main Pages
    { href: '/home', label: t('home'), icon: Home },
    
    // AI & Smart Tools
    { href: '/ai-assistant', label: t('aiAssistant'), icon: Bot, premium: true },
    
    // Audio & Voice Tools
    { href: '/voice-transcript', label: t('voiceScribe'), icon: Mic },
    { href: '/text-to-speech', label: t('textToSpeech'), icon: AudioLines },
    
    // Text & Utility Tools
    { href: '/generate-qr-code', label: t('generateQrCode'), icon: QrCode },
    { href: '/password-generator', label: t('passwordGenerator'), icon: Shield },
    
    // Document Tools
    { href: '/pdf-transcript', label: t('pdfTranscript'), icon: FileText },
    { href: '/combine-pdf', label: t('combinePdf'), icon: Combine },
    { href: '/image-to-pdf', label: t('imageToPdf'), icon: ImageIcon },
    { href: '/convert-image-format', label: t('convertImageFormat'), icon: Wand2 },
  ], [t]);

  return (
    <aside className="w-full h-full flex flex-col bg-background">
      <div className="flex-shrink-0 p-4">
        <Link href="/home" className="flex items-center gap-2" aria-label="Go to home">
          <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXQ6IUyl8D8fpZl8p9BvXg-PCxKPa-1vOp0oPC2-uKH-H_M1T" alt="Somleng logo" width={32} height={32} data-ai-hint="logo" className="rounded-full" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Somleng</h1>
            <p className="text-[10px] text-muted-foreground">{t('version')} 2.2.5</p>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-grow">
          <nav className="px-4 py-2 space-y-0.5" aria-label="Primary">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    passHref 
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-foreground text-background font-medium' 
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.premium && (
                      <span className="text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        {t('premium')}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
          
      </ScrollArea>

      <div className="flex-shrink-0 px-4 py-3 mt-auto border-t">
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left" aria-label="Open support">
              <LifeBuoy className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{t('support')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg h-[80vh] flex flex-col bg-background border-t shadow-lg">
            <SheetHeader className="text-center mb-4">
              <SheetTitle>
                <div className="flex items-center justify-center gap-2">
                  <LifeBuoy aria-hidden="true" />
                  {t('support')}
                </div>
              </SheetTitle>
              <SheetDescription>
                {t('supportDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-grow flex justify-center items-center">
                <div className="h-full w-full max-w-sm rounded-md border border-border overflow-hidden">
                    <iframe src="https://pay-coffee.vercel.app/" className="w-full h-full" title="Support" />
                </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="https://t.me/Ozo0_0" target="_blank" rel="noopener noreferrer" passHref aria-label="Report a bug on Telegram (opens in a new tab)" className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors mt-1">
          <FileHeart className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">{t('reportBug')}</span>
        </Link>
        <div className="flex items-center gap-2 mt-3 px-3">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>
            <LanguageToggle variant="sidebar" className="flex-1" />
        </div>
      </div>
    </aside>
  );
});


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
    <aside className="w-full h-full flex flex-col bg-transparent">
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex justify-between items-center mb-3">
          <Link href="/home" className="flex items-center gap-2" aria-label="Go to home">
            <Image src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfXQ6IUyl8D8fpZl8p9BvXg-PCxKPa-1vOp0oPC2-uKH-H_M1T" alt="Somleng logo" width={32} height={32} data-ai-hint="logo" className="rounded-full" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Somleng</h1>
              <p className="text-xs text-muted-foreground">{t('version')} 2.2.5</p>
            </div>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-grow">
          <nav className="p-4 space-y-1" aria-label="Primary">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    passHref 
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm py-3 relative"
                      type="button"
                      aria-pressed={isActive ? true : undefined}
                    >
                      <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                      {item.label}
                      {item.premium && (
                        <span className="ml-auto text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full">
                          {t('premium')}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
          </nav>
          
      </ScrollArea>

      <div className="flex-shrink-0 p-4 border-t mt-auto">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start" type="button" aria-label="Open support">
              <LifeBuoy className="mr-3 h-5 w-5" aria-hidden="true" />
              {t('support')}
            </Button>
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
        <Link href="https://t.me/Ozo0_0" target="_blank" rel="noopener noreferrer" passHref aria-label="Report a bug on Telegram (opens in a new tab)">
          <Button variant="ghost" className="w-full justify-start mt-2" type="button">
            <FileHeart className="mr-3 h-5 w-5" aria-hidden="true" />
            {t('reportBug')}
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
            <LanguageToggle variant="sidebar" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="flex-shrink-0" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </Button>
        </div>
      </div>
    </aside>
  );
});

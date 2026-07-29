"use client";

import { memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AudioLines,
  Bot,
  Combine,
  FileHeart,
  FileText,
  History,
  Home,
  Image as ImageIcon,
  LifeBuoy,
  Mic,
  Moon,
  QrCode,
  ScanLine,
  Shield,
  Sparkles,
  Sun,
  Wand2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LanguageToggle } from './language-toggle';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const Sidebar = memo(function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t, theme, toggleTheme } = useLanguage();

  const navigation = useMemo<NavigationGroup[]>(
    () => [
      {
        label: 'Workspace',
        items: [
          { href: '/home', label: t('home'), icon: Home },
          {
            href: '/ai-assistant',
            label: t('aiAssistant'),
            icon: Bot,
            badge: 'AI',
          },
          { href: '/history', label: 'History', icon: History },
        ],
      },
      {
        label: 'Create',
        items: [
          { href: '/voice-transcript', label: t('voiceScribe'), icon: Mic },
          {
            href: '/text-to-speech',
            label: t('textToSpeech'),
            icon: AudioLines,
          },
          {
            href: '/generate-qr-code',
            label: t('generateQrCode'),
            icon: QrCode,
          },
          { href: '/scanner', label: 'QR Scanner', icon: ScanLine },
          {
            href: '/password-generator',
            label: t('passwordGenerator'),
            icon: Shield,
          },
        ],
      },
      {
        label: 'Documents',
        items: [
          {
            href: '/pdf-transcript',
            label: t('pdfTranscript'),
            icon: FileText,
          },
          { href: '/combine-pdf', label: t('combinePdf'), icon: Combine },
          {
            href: '/image-to-pdf',
            label: t('imageToPdf'),
            icon: ImageIcon,
          },
          {
            href: '/convert-image-format',
            label: t('convertImageFormat'),
            icon: Wand2,
          },
        ],
      },
    ],
    [t]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-100 px-5 dark:border-slate-800">
        <Link
          href="/home"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Somleng dashboard"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 ring-1 ring-blue-600">
            <Image
              src="/icon.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-slate-950 dark:text-white">
              Somleng
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Creative workspace
            </span>
          </span>
        </Link>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 px-3 py-5" aria-label="Primary navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/home' && pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="mb-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Need a hand?
            </p>
          </div>
          <div className="flex gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
                  Support
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex h-[82dvh] flex-col rounded-t-2xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              >
                <SheetHeader className="mx-auto w-full max-w-2xl text-left">
                  <SheetTitle>{t('support')}</SheetTitle>
                  <SheetDescription>
                    {t('supportDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mx-auto mt-4 min-h-0 w-full max-w-2xl flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <iframe
                    src="https://pay-coffee.vercel.app/"
                    className="h-full w-full"
                    title="Support"
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href="https://t.me/Ozo0_0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FileHeart className="h-3.5 w-3.5" aria-hidden="true" />
              Report
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <LanguageToggle variant="sidebar" className="min-w-0 flex-1" />
        </div>
      </div>
    </div>
  );
});

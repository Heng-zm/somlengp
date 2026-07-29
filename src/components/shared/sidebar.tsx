"use client";

import { memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AudioLines,
  Bot,
  Bug,
  Combine,
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
          { href: '/ai-assistant', label: t('aiAssistant'), icon: Bot, badge: 'AI' },
          { href: '/history', label: 'Recent activity', icon: History },
        ],
      },
      {
        label: 'Audio',
        items: [
          { href: '/voice-transcript', label: t('voiceScribe'), icon: Mic },
          { href: '/text-to-speech', label: t('textToSpeech'), icon: AudioLines },
        ],
      },
      {
        label: 'Documents',
        items: [
          { href: '/pdf-transcript', label: t('pdfTranscript'), icon: FileText },
          { href: '/combine-pdf', label: t('combinePdf'), icon: Combine },
          { href: '/image-to-pdf', label: t('imageToPdf'), icon: ImageIcon },
          { href: '/convert-image-format', label: t('convertImageFormat'), icon: Wand2 },
        ],
      },
      {
        label: 'Utilities',
        items: [
          { href: '/generate-qr-code', label: t('generateQrCode'), icon: QrCode },
          { href: '/scanner', label: 'QR scanner', icon: ScanLine },
          { href: '/password-generator', label: t('passwordGenerator'), icon: Shield },
        ],
      },
    ],
    [t]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <Link
          href="/home"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Somleng dashboard"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 dark:bg-white">
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
            <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Everyday tools
            </span>
          </span>
        </Link>

        <Link
          href="/ai-assistant"
          onClick={onNavigate}
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Start with AI
        </Link>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-5 px-3 py-3" aria-label="Primary navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
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
                        'group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                        isActive
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[17px] w-[17px] shrink-0',
                          isActive
                            ? 'text-indigo-300 dark:text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[9px] font-bold',
                            isActive
                              ? 'bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950'
                              : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                          )}
                        >
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

      <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-800">
        <div className="mb-2 flex items-center gap-1">
          <Link
            href="/contact"
            onClick={onNavigate}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
            Help
          </Link>
          <Link
            href="https://t.me/Ozo0_0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            <Bug className="h-3.5 w-3.5" aria-hidden="true" />
            Feedback
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <LanguageToggle
            variant="sidebar"
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 dark:border-slate-800"
          />
        </div>
      </div>
    </div>
  );
});

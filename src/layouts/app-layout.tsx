"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';
import { FeaturePageLayoutProvider } from './feature-page-layout';
import { Sidebar } from '@/components/shared/sidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const routeNames: Record<string, string> = {
  '/home': 'Dashboard',
  '/ai-assistant': 'AI Assistant',
  '/voice-transcript': 'Voice Transcript',
  '/text-to-speech': 'Text to Speech',
  '/generate-qr-code': 'QR Generator',
  '/scanner': 'QR Scanner',
  '/password-generator': 'Password Generator',
  '/pdf-transcript': 'PDF Transcript',
  '/combine-pdf': 'Combine PDF',
  '/image-to-pdf': 'Image to PDF',
  '/convert-image-format': 'Image Converter',
  '/history': 'History',
  '/features': 'Features',
  '/pricing': 'Pricing',
  '/contact': 'Contact',
  '/profile': 'Profile',
};

function getRouteName(pathname: string): string {
  if (routeNames[pathname]) {
    return routeNames[pathname];
  }

  const segment = pathname.split('/').filter(Boolean).at(-1);
  if (!segment) {
    return 'Dashboard';
  }

  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const routeName = useMemo(() => getRouteName(pathname), [pathname]);

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [pathname]);

  return (
    <FeaturePageLayoutProvider>
      <div className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
          <Sidebar />
        </aside>

        <Sheet
          open={mobileNavigationOpen}
          onOpenChange={setMobileNavigationOpen}
        >
          <SheetContent
            side="left"
            className="w-[min(88vw,18rem)] border-r border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Browse Somleng tools and pages.</SheetDescription>
            </SheetHeader>
            <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavigationOpen(true)}
              className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {routeName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Somleng workspace
              </p>
            </div>

            {pathname === '/ai-assistant' ? (
              <Link
                href="/home"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white"
                aria-label="Go to dashboard"
              >
                <Image
                  src="/icon.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </Link>
            ) : (
              <Link
                href="/ai-assistant"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                aria-label="Open AI assistant"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Ask AI
              </Link>
            )}
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[calc(100dvh-4rem)] min-w-0 overflow-x-hidden lg:min-h-dvh"
          >
            {children}
          </main>
        </div>
      </div>
    </FeaturePageLayoutProvider>
  );
}

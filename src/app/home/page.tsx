'use client';

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AudioLines,
  Clock3,
  Combine,
  FileText,
  History,
  Image as ImageIcon,
  Mic,
  QrCode,
  ScanLine,
  Shield,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useHistory } from '@/hooks/use-history';
import {
  OptimizedFeatureGrid,
  type FeatureCardData,
  type ToolCategory,
} from '@/components/home/optimized-feature-grid';
import { SearchToolBar } from '@/components/home/search-tool-bar';
import { Footer } from '@/components/shared/footer';
import { cn } from '@/lib/utils';

const FAVORITES_STORAGE_KEY = 'somleng-favorite-tools';

type CategoryFilter = 'all' | 'favorites' | ToolCategory;

const categoryOptions: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  { value: 'all', label: 'All tools' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'ai', label: 'AI' },
  { value: 'audio', label: 'Audio' },
  { value: 'documents', label: 'Documents' },
  { value: 'utilities', label: 'Utilities' },
];

const HomePageComponent = function HomePage() {
  const { t } = useLanguage();
  const { history, isLoaded: historyLoaded } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>('all');
  const [favoriteHrefs, setFavoriteHrefs] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);

  const tools = useMemo<FeatureCardData[]>(
    () => [
      {
        href: '/ai-assistant',
        title: t('smartAiChat'),
        description: t('smartAiChatDesc'),
        icon: Sparkles,
        category: 'ai',
        keywords: ['ask', 'chat', 'write', 'brainstorm', 'assistant'],
      },
      {
        href: '/voice-transcript',
        title: t('voiceToText'),
        description: t('voiceToTextDesc'),
        icon: Mic,
        category: 'audio',
        keywords: ['transcribe', 'speech to text', 'recording', 'notes'],
      },
      {
        href: '/text-to-speech',
        title: t('textReader'),
        description: t('textReaderDesc'),
        icon: AudioLines,
        category: 'audio',
        keywords: ['text to speech', 'read aloud', 'voice', 'listen'],
      },
      {
        href: '/pdf-transcript',
        title: t('pdfReader'),
        description: t('pdfReaderDesc'),
        icon: FileText,
        category: 'documents',
        keywords: ['extract PDF', 'PDF text', 'read document'],
      },
      {
        href: '/combine-pdf',
        title: t('pdfMerger'),
        description: t('pdfMergerDesc'),
        icon: Combine,
        category: 'documents',
        keywords: ['merge PDF', 'join PDF', 'combine files'],
      },
      {
        href: '/image-to-pdf',
        title: t('imageToPdfTitle'),
        description: t('imageToPdfDesc'),
        icon: ImageIcon,
        category: 'documents',
        keywords: ['photo PDF', 'picture document', 'convert photo'],
      },
      {
        href: '/convert-image-format',
        title: t('imageConverter'),
        description: t('imageConverterDesc'),
        icon: Wand2,
        category: 'documents',
        keywords: ['JPG', 'PNG', 'WebP', 'convert image'],
      },
      {
        href: '/generate-qr-code',
        title: t('qrGenerator'),
        description: t('qrGeneratorDesc'),
        icon: QrCode,
        category: 'utilities',
        keywords: ['create QR', 'make QR', 'link code'],
      },
      {
        href: '/scanner',
        title: 'QR scanner',
        description:
          'Scan a QR code with your camera or upload an image to read it.',
        icon: ScanLine,
        category: 'utilities',
        keywords: ['read QR', 'camera QR', 'upload QR'],
      },
      {
        href: '/password-generator',
        title: t('passwordGen'),
        description: t('passwordGenDesc'),
        icon: Shield,
        category: 'utilities',
        keywords: ['secure password', 'random password', 'credentials'],
      },
    ],
    [t]
  );

  const availableToolHrefs = useMemo(
    () => new Set(tools.map((tool) => tool.href)),
    [tools]
  );

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(
        localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]'
      );
      if (Array.isArray(savedFavorites)) {
        setFavoriteHrefs(
          new Set(
            savedFavorites.filter(
              (href): href is string =>
                typeof href === 'string' && availableToolHrefs.has(href)
            )
          )
        );
      }
    } catch {
      setFavoriteHrefs(new Set());
    } finally {
      setFavoritesLoaded(true);
    }
  }, [availableToolHrefs]);

  useEffect(() => {
    if (!favoritesLoaded) return;

    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(Array.from(favoriteHrefs))
      );
    } catch {
      // Favorites continue to work in memory when storage is unavailable.
    }
  }, [favoriteHrefs, favoritesLoaded]);

  const toggleFavorite = useCallback((href: string) => {
    setFavoriteHrefs((current) => {
      const next = new Set(current);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }, []);

  const filteredTools = useMemo(() => {
    const queryTerms = deferredQuery
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return tools
      .filter((tool) => {
        if (activeCategory === 'favorites') {
          return favoriteHrefs.has(tool.href);
        }
        if (activeCategory !== 'all') {
          return tool.category === activeCategory;
        }
        return true;
      })
      .filter((tool) => {
        if (queryTerms.length === 0) return true;
        const searchText = [
          tool.title,
          tool.description,
          tool.category,
          ...(tool.keywords ?? []),
        ]
          .join(' ')
          .toLocaleLowerCase();
        return queryTerms.every((term) =>
          searchText.includes(term)
        );
      })
      .sort((a, b) => {
        const favoriteDifference =
          Number(favoriteHrefs.has(b.href)) - Number(favoriteHrefs.has(a.href));
        return favoriteDifference || tools.indexOf(a) - tools.indexOf(b);
      });
  }, [activeCategory, deferredQuery, favoriteHrefs, tools]);

  const recentTools = useMemo(() => {
    if (!historyLoaded) return [];

    const usedHrefs = new Set<string>();
    return history
      .map((item) => tools.find((tool) => tool.href === item.href))
      .filter((tool): tool is FeatureCardData => {
        if (!tool || usedHrefs.has(tool.href)) return false;
        usedHrefs.add(tool.href);
        return true;
      })
      .slice(0, 3);
  }, [history, historyLoaded, tools]);

  const quickActions = [tools[0], tools[1], tools[7]];

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[#f7f8fb] dark:bg-slate-950 lg:min-h-dvh">
      <div className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-950 text-white dark:border-slate-800 dark:bg-slate-900">
          <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
            <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                Somleng workspace
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                What would you like to get done?
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Find the right tool for audio, documents, QR codes, images, or
                everyday AI work.
              </p>

              <div className="mt-7 max-w-3xl">
                <SearchToolBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Try “merge PDF” or “transcribe audio”"
                />
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.04] p-5 lg:border-l lg:border-t-0 lg:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Quick start
              </p>
              <div className="mt-4 space-y-2">
                {quickActions.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                      <tool.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {tool.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        Open tool
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {recentTools.length > 0 && (
          <section className="mt-8" aria-labelledby="recent-tools-heading">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock3
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <h2
                  id="recent-tools-heading"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Continue where you left off
                </h2>
              </div>
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
              >
                View history
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {recentTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <tool.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {tool.title}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10" aria-labelledby="all-tools-heading">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                Your toolkit
              </p>
              <h2
                id="all-tools-heading"
                className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white sm:text-3xl"
              >
                All tools, one workspace
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Save favorites and they will always appear first.
              </p>
            </div>

            <div
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
              aria-label="Filter tools by category"
            >
              {categoryOptions.map((category) => {
                const isActive = activeCategory === category.value;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setActiveCategory(category.value)}
                    className={cn(
                      'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white'
                    )}
                    aria-pressed={isActive}
                  >
                    {category.value === 'favorites' && (
                      <Star
                        className={cn(
                          'h-3.5 w-3.5',
                          favoriteHrefs.size > 0 && 'fill-current'
                        )}
                        aria-hidden="true"
                      />
                    )}
                    {category.label}
                    {category.value === 'favorites' && favoriteHrefs.size > 0 && (
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px]',
                          isActive
                            ? 'bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {favoriteHrefs.size}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            {filteredTools.length > 0 ? (
              <OptimizedFeatureGrid
                features={filteredTools}
                favoriteHrefs={favoriteHrefs}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 text-center dark:border-slate-700 dark:bg-slate-900/50">
                {activeCategory === 'favorites' ? (
                  <Star
                    className="h-7 w-7 text-slate-300 dark:text-slate-600"
                    aria-hidden="true"
                  />
                ) : (
                  <History
                    className="h-7 w-7 text-slate-300 dark:text-slate-600"
                    aria-hidden="true"
                  />
                )}
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {activeCategory === 'favorites'
                    ? 'No favorite tools yet'
                    : 'No matching tools'}
                </h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {activeCategory === 'favorites'
                    ? 'Select the star on any tool to keep it close at hand.'
                    : 'Try a shorter search or choose a different category.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Show all tools
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default memo(HomePageComponent);

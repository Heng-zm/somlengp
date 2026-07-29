'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolCategory = 'ai' | 'audio' | 'documents' | 'utilities';

export interface FeatureCardData {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: ToolCategory;
  keywords?: string[];
}

interface OptimizedFeatureGridProps {
  features: FeatureCardData[];
  favoriteHrefs: Set<string>;
  onToggleFavorite: (href: string) => void;
}

const categoryStyles: Record<
  ToolCategory,
  { icon: string; label: string; labelText: string }
> = {
  ai: {
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    label: 'AI',
    labelText: 'text-violet-700 dark:text-violet-300',
  },
  audio: {
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    label: 'Audio',
    labelText: 'text-sky-700 dark:text-sky-300',
  },
  documents: {
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    label: 'Documents',
    labelText: 'text-amber-700 dark:text-amber-300',
  },
  utilities: {
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    label: 'Utilities',
    labelText: 'text-emerald-700 dark:text-emerald-300',
  },
};

const ToolCard = memo(function ToolCard({
  feature,
  isFavorite,
  onToggleFavorite,
}: {
  feature: FeatureCardData;
  isFavorite: boolean;
  onToggleFavorite: (href: string) => void;
}) {
  const Icon = feature.icon;
  const style = categoryStyles[feature.category];

  return (
    <article className="group relative min-h-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <Link
        href={feature.href}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
        aria-label={`Open ${feature.title}`}
      >
        <span className="sr-only">Open {feature.title}</span>
      </Link>

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            style.icon
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(feature.href)}
          className={cn(
            'relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            isFavorite
              ? 'border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          )}
          aria-label={
            isFavorite
              ? `Remove ${feature.title} from favorites`
              : `Add ${feature.title} to favorites`
          }
          aria-pressed={isFavorite}
        >
          <Star
            className={cn('h-4 w-4', isFavorite && 'fill-current')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="relative mt-8">
        <p
          className={cn(
            'text-[11px] font-bold uppercase tracking-[0.14em]',
            style.labelText
          )}
        >
          {style.label}
        </p>
        <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          {feature.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {feature.description}
        </p>
      </div>

      <div className="relative mt-5 flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-300">
        Open tool
        <ArrowUpRight
          className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </article>
  );
});

export const OptimizedFeatureGrid = memo(function OptimizedFeatureGrid({
  features,
  favoriteHrefs,
  onToggleFavorite,
}: OptimizedFeatureGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {features.map((feature) => (
        <ToolCard
          key={feature.href}
          feature={feature}
          isFavorite={favoriteHrefs.has(feature.href)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
});

'use client';

import { memo } from 'react';
import { Search, X } from 'lucide-react';

interface SearchToolBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const SearchToolBar = memo(function SearchToolBar({ value, onChange, onSubmit }: SearchToolBarProps) {
  const handleSubmit = () => onSubmit?.(value);

  return (
    <section aria-label="Search tools" className="w-full">
      <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onChange(''); }}
            placeholder="Search tools..."
            className="h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-28 text-base text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 sm:h-14"
            aria-label="Search tools"
          />
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange('')}
              className="absolute right-[4.7rem] top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={handleSubmit}
            className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:h-11"
          >
            Search
          </button>
      </div>
    </section>
  );
});

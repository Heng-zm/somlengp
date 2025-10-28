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
      <div className="flex items-center">
        <div className="relative w-full">
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onChange(''); }}
            placeholder="Search Tool"
            className="w-full h-12 sm:h-14 rounded-full bg-gray-100 border border-gray-200 px-5 pr-24 text-[15px] placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-gray-300"
            aria-label="Search Tool"
          />
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange('')}
              className="absolute right-14 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-500 hover:bg-gray-200/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Search"
            onClick={handleSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black text-white hover:bg-black/90 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
});

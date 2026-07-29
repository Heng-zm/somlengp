import { memo } from 'react';
import Link from 'next/link';

export const Footer = memo(function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Somleng</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Somleng. Built for focused work.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400"
          aria-label="Footer"
        >
          <Link
            href="/privacy"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Contact
          </Link>
          <Link
            href="/pricing"
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </footer>
  );
});

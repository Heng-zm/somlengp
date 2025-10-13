'use client';

import { Button } from '@/components/ui/button';

export default function HomeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center gap-4 text-center">
      <div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-1">An unexpected error occurred while loading the Home page.</p>
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()} type="button">Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/home')} type="button">Go to Home</Button>
      </div>
    </div>
  );
}
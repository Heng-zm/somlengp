
"use client";

import { FeaturePageLayoutProvider } from './feature-page-layout';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeaturePageLayoutProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </div>
    </FeaturePageLayoutProvider>
  );
}

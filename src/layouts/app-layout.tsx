
"use client";

import { FeaturePageLayoutProvider } from './feature-page-layout';
import { IdleSessionGuard } from '@/components/providers/idle-session-guard';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeaturePageLayoutProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <IdleSessionGuard timeoutMs={10 * 60 * 1000} redirectPath="/" />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </div>
    </FeaturePageLayoutProvider>
  );
}

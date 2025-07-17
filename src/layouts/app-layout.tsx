
"use client";

import { Sidebar } from '@/components/shared/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col h-screen">
        {/* Main Content */}
        {children}
      </main>
    </div>
  );
}

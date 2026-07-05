'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import AccessGuard from '@/components/AccessGuard';
import { Loader2 } from 'lucide-react';

export default function LisaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <AccessGuard>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </AccessGuard>
    </Suspense>
  );
}

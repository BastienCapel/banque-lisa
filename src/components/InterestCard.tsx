'use client';

import React from 'react';
import { Award, Sparkles, TrendingUp } from 'lucide-react';

interface InterestCardProps {
  cumulativeInterest: number;
  dailyInterestRate: number;
  currency: string;
  pedagogicalMessage: string;
}

export default function InterestCard({
  cumulativeInterest,
  dailyInterestRate,
  currency,
  pedagogicalMessage,
}: InterestCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            Intérêts cumulés
          </span>
          <h3 className="mt-2 text-3xl font-extrabold text-zinc-900 group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
            {formatCurrency(cumulativeInterest)}
          </h3>
          <p className="mt-1 flex items-center text-xs text-zinc-500 dark:text-zinc-400">
            Taux quotidien : <strong className="ml-1 text-violet-600 dark:text-violet-400">{(dailyInterestRate * 100).toFixed(0)}%</strong>
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 transition-colors group-hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:group-hover:bg-violet-900/50">
          <TrendingUp className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-4 border border-violet-50/50 dark:from-zinc-850 dark:to-zinc-850/50 dark:border-zinc-800">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 animate-pulse" />
        <div>
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Le mot du jour
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {pedagogicalMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

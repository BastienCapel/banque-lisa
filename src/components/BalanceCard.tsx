'use client';

import React from 'react';
import { ArrowUpRight, Calendar, PiggyBank, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  currentBalance: number;
  initialCapital: number;
  startDate: string;
  endDate: string;
  currency: string;
  daysRemaining: number;
  totalDays: number;
}

export default function BalanceCard({
  currentBalance,
  initialCapital,
  startDate,
  endDate,
  currency,
  daysRemaining,
  totalDays,
}: BalanceCardProps) {
  const percentTimePassed = Math.min(
    100,
    Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Decorative background shapes */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-pink-500/20 blur-xl" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
          Solde Actuel Disponible
        </span>
        <div className="rounded-full bg-white/15 p-2 backdrop-blur-md">
          <PiggyBank className="h-5 w-5 text-indigo-100" />
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          {formatCurrency(currentBalance)}
        </h2>
        <p className="mt-2 flex items-center text-xs text-indigo-100/90">
          <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-emerald-300" />
          Capital de départ: {formatCurrency(initialCapital)}
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs text-indigo-100">
          <span className="flex items-center">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {formatDate(startDate)} au {formatDate(endDate)}
          </span>
          <span className="font-medium">
            {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Période terminée'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500 ease-out"
            style={{ width: `${percentTimePassed}%` }}
          />
        </div>
        
        <div className="mt-1 flex justify-between text-[10px] text-indigo-200">
          <span>Début ({totalDays}j)</span>
          <span className="flex items-center font-semibold">
            <TrendingUp className="mr-0.5 h-3 w-3" />
            {Math.round(percentTimePassed)}% écoulé
          </span>
          <span>Fin</span>
        </div>
      </div>
    </div>
  );
}

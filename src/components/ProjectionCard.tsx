'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Trophy } from 'lucide-react';

interface ProjectionCardProps {
  projectedFinalBalance: number; // with bonus
  finalBonusEstimated: number;
  maxBudget: number;
  currency: string;
}

export default function ProjectionCard({
  projectedFinalBalance,
  finalBonusEstimated,
  maxBudget,
  currency,
}: ProjectionCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const isOverBudget = projectedFinalBalance > maxBudget;
  const balanceBeforeBonus = projectedFinalBalance - finalBonusEstimated;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            Projection au 10 août (sans retrait)
          </span>
          <h3 className="mt-2 text-3xl font-extrabold text-zinc-900 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
            {formatCurrency(projectedFinalBalance)}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Solde estimé : {formatCurrency(balanceBeforeBonus)} + Bonus 10%
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-600 transition-colors group-hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:group-hover:bg-sky-900/50">
          <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {/* Bonus indicator */}
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
          <span>Bonus final estimé (10%) :</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(finalBonusEstimated)}
          </span>
        </div>

        {/* Budget security check */}
        <div
          className={`flex items-center gap-2.5 rounded-xl p-3 text-xs border ${
            isOverBudget
              ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300'
          }`}
        >
          {isOverBudget ? (
            <>
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
              <div>
                <span className="font-bold">Attention Budget dépassé :</span> Projetez {formatCurrency(projectedFinalBalance)} pour un plafond de {formatCurrency(maxBudget)}.
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
              <div>
                <span className="font-bold">Budget sécurisé :</span> Le montant final projeté reste inférieur au plafond parent de {formatCurrency(maxBudget)}.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

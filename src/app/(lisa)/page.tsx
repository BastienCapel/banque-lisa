'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, Transaction } from '@/types';
import { calculateDailyEvolution, diffDays, getTodayStr } from '@/lib/finance';
import BalanceCard from '@/components/BalanceCard';
import InterestCard from '@/components/InterestCard';
import ProjectionCard from '@/components/ProjectionCard';
import { Sparkles, Calendar, TrendingUp, Info, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { fetchJson, isAuthRequiredError } from '@/lib/api-client';

export default function LisaDashboard() {
  const [params, setParams] = useState<FinancialParams | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    let authRequired = false;
    try {
      const [paramsData, txData] = await Promise.all([
        fetchJson<FinancialParams>('/api/settings'),
        fetchJson<Transaction[]>('/api/transactions'),
      ]);

      setParams(paramsData);
      setTransactions(txData);
    } catch (err) {
      if (isAuthRequiredError(err)) {
        authRequired = true;
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur de communication avec le serveur.');
    } finally {
      if (!authRequired) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !params) {
    return (
      <div className="rounded-3xl bg-rose-50 p-6 border border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
        <h3 className="font-bold text-lg">Erreur de chargement</h3>
        <p className="mt-2 text-sm">{error || "Impossible de récupérer les paramètres de l'application."}</p>
      </div>
    );
  }

  // Calculate stats using the finance engine
  const evolution = calculateDailyEvolution(params, transactions);
  const totalDays = diffDays(params.startDate, params.endDate) + 1;

  // Find today's date index in the evolution array
  const todayStr = getTodayStr();
  
  // Find current day based on today's date (or last day if period ended, first day if not started)
  let currentDayRow = evolution.find(row => row.date === todayStr);
  if (!currentDayRow) {
    if (todayStr < params.startDate) {
      currentDayRow = evolution[0];
    } else {
      currentDayRow = evolution[evolution.length - 1];
    }
  }

  const currentBalance = currentDayRow ? currentDayRow.endBalance : 0;
  const currentCumulativeInterest = currentDayRow ? currentDayRow.cumulativeInterest : 0;
  
  const finalRow = evolution[evolution.length - 1];
  const finalBalanceBeforeBonus = finalRow ? finalRow.endBalance : 0;
  const estimatedBonus = finalBalanceBeforeBonus * params.finalBonusRate;
  const projectedFinalWithBonus = finalBalanceBeforeBonus + estimatedBonus;

  const approvedWithdrawals = transactions.filter(t => t.status === 'approved' && t.type === 'withdrawal');
  const totalWithdrawn = approvedWithdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate days remaining
  const daysRemaining = Math.max(0, diffDays(todayStr, params.endDate));

  // Generate pedagogical message of the day
  const getPedagogicalMessage = (): string => {
    if (totalWithdrawn === 0) {
      const potentialGains = projectedFinalWithBonus - params.initialCapital - (params.dailyAllowance * totalDays);
      return `Super ! Tu n'as fait aucun retrait. Tes intérêts composés tournent à plein régime. Au total, ton argent va fabriquer ${potentialGains.toFixed(2)} € tout seul !`;
    }

    const lastWithdrawal = approvedWithdrawals[approvedWithdrawals.length - 1];
    if (lastWithdrawal) {
      return `Ton dernier retrait pour "${lastWithdrawal.label}" de ${Math.abs(lastWithdrawal.amount)} € réduit ta cagnotte finale, car ces euros ne produiront plus d'intérêt à 5% tous les soirs. Essaye de limiter tes retraits pour relancer la machine !`;
    }

    return "Chaque soir, tes intérêts produisent eux-mêmes de nouveaux intérêts. C'est l'effet boule de neige des intérêts composés !";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-500" />
          Bonjour Lisa !
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Bienvenue dans ton espace d'épargne pédagogique pour l'été.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard
          currentBalance={currentBalance}
          initialCapital={params.initialCapital}
          startDate={params.startDate}
          endDate={params.endDate}
          currency={params.currency}
          daysRemaining={daysRemaining}
          totalDays={totalDays}
        />

        <InterestCard
          cumulativeInterest={currentCumulativeInterest}
          dailyInterestRate={params.dailyInterestRate}
          currency={params.currency}
          pedagogicalMessage={getPedagogicalMessage()}
        />

        <ProjectionCard
          projectedFinalBalance={projectedFinalWithBonus}
          finalBonusEstimated={estimatedBonus}
          maxBudget={params.maxBudget}
          currency={params.currency}
        />
      </div>

      {/* Secondary Metrics / Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics list */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
            Résumé de ma Banque de l'été
          </h3>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            <div className="flex justify-between py-2.5">
              <span className="text-zinc-500 dark:text-zinc-400">Total versé (argent de poche) :</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {(params.initialCapital + params.dailyAllowance * totalDays).toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-zinc-500 dark:text-zinc-400">Total retiré à ce jour :</span>
              <span className="font-bold text-rose-600">
                {totalWithdrawn.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-zinc-500 dark:text-zinc-400">Nombre de jours dans la période :</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {totalDays} jours
              </span>
            </div>
          </div>
        </div>

        {/* Quick Nav Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-zinc-900 dark:to-zinc-900/50 border border-indigo-50/50 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Que veux-tu faire aujourd'hui ?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Consulte le tableau détaillé de ton solde jour par jour, simule différentes dépenses pour voir leur impact à long terme, ou demande une validation de retrait à ton banquier (ton parent).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link
              href="/retraits"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all text-center cursor-pointer"
            >
              💸 Retirer de l'argent
            </Link>
            <Link
              href="/simulations"
              className="inline-flex items-center justify-center border border-indigo-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs py-2 px-3 rounded-xl transition-all text-center cursor-pointer"
            >
              📊 Simuler des choix
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

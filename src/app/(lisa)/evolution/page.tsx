'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, Transaction } from '@/types';
import { calculateDailyEvolution } from '@/lib/finance';
import DailyEvolutionTable from '@/components/DailyEvolutionTable';
import { Calendar, Loader2, Sparkles } from 'lucide-react';

export default function EvolutionPage() {
  const [params, setParams] = useState<FinancialParams | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [paramsRes, txRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/transactions'),
      ]);

      if (!paramsRes.ok || !txRes.ok) {
        throw new Error('Erreur de communication avec le serveur lors du chargement des données.');
      }

      const paramsData = await paramsRes.json();
      const txData = await txRes.json();

      setParams(paramsData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <h3 className="font-bold text-lg">Erreur</h3>
        <p className="mt-2 text-sm">{error || "Impossible de charger les paramètres."}</p>
      </div>
    );
  }

  const evolution = calculateDailyEvolution(params, transactions);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-500" />
            Mon Tableau d'Évolution
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Découvre comment ton solde grandit chaque jour grâce aux versements et aux intérêts.
          </p>
        </div>
      </div>

      {/* Intro Warning / Guide */}
      <div className="bg-indigo-50 border border-indigo-100 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-3xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
        <p className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Rappel du fonctionnement de la Banque de l'été :
        </p>
        <p>
          Chaque matin, tu reçois ton versement de <strong className="text-zinc-800 dark:text-zinc-200">{params.dailyAllowance.toFixed(2)} €</strong>.
          Si tu effectues un retrait dans la journée, le montant est retiré du solde. Le soir, l'intérêt de <strong>{(params.dailyInterestRate * 100).toFixed(0)}%</strong> s'applique sur le solde restant. C'est pourquoi un retrait réduit directement tes intérêts du soir, mais aussi tous les intérêts des jours suivants !
        </p>
      </div>

      {/* Daily Evolution Component */}
      <div className="bg-white dark:bg-zinc-900 p-2 md:p-6 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
        <DailyEvolutionTable evolution={evolution} currency={params.currency} />
      </div>
    </div>
  );
}

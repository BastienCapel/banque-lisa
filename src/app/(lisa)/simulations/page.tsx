'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams } from '@/types';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import { BarChart2, Loader2, Sparkles } from 'lucide-react';
import { fetchJson, isAuthRequiredError } from '@/lib/api-client';

export default function SimulationsPage() {
  const [params, setParams] = useState<FinancialParams | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      let authRequired = false;
      try {
        const data = await fetchJson<FinancialParams>('/api/settings');
        setParams(data);
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

    fetchParams();
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
        <p className="mt-2 text-sm">{error || "Impossible de charger les données."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-indigo-500" />
          Simulateur d'Épargne
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Simule des dépenses fictives et compare leur impact sur ta cagnotte de fin d'été.
        </p>
      </div>

      {/* Pedagogical info */}
      <div className="bg-indigo-50 border border-indigo-100 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-3xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
        <p className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Comprendre l'impact de tes choix :
        </p>
        <p>
          Ce simulateur n'affecte pas ton solde réel. Il te permet de tester différents scénarios de dépenses (ex: retirer 5 € par semaine) et d'observer immédiatement la différence par rapport à un comportement sans aucun retrait. Tu verras que retarder une dépense ou l'annuler augmente fortement ton argent disponible à la fin de l'été !
        </p>
      </div>

      {/* Simulator Component */}
      <ScenarioSimulator params={params} />
    </div>
  );
}

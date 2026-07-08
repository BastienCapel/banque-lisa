'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, SimulatedWithdrawal, SimulationResult } from '../types';
import { calculateScenario, getDatesInRange, addDays, getTodayStr } from '@/lib/finance';
import { Plus, Trash2, LineChart as ChartIcon, RefreshCw, BarChart2, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ScenarioSimulatorProps {
  params: FinancialParams;
}

export default function ScenarioSimulator({ params }: ScenarioSimulatorProps) {
  const [mounted, setMounted] = useState(false);
  const [customWithdrawals, setCustomWithdrawals] = useState<SimulatedWithdrawal[]>([]);
  const [newDate, setNewDate] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newLabel, setNewLabel] = useState<string>('Cinéma');

  const [activeScenario, setActiveScenario] = useState<string>('no_withdrawal');

  // Prevent SSR hydration issues for Recharts
  useEffect(() => {
    setMounted(true);
    setNewDate(params.startDate);
  }, [params.startDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: params.currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // 1. Reference Scenario: No withdrawals
  const refResult = calculateScenario(params, [], 'Aucun retrait');

  // 2. Compute preset scenarios
  const getPresetWithdrawals = (presetType: string): SimulatedWithdrawal[] => {
    const dates = getDatesInRange(params.startDate, params.endDate);
    
    switch (presetType) {
      case 'weekly_5': {
        // Withdraw 5 € every 7 days starting from day 7
        const withdrawals: SimulatedWithdrawal[] = [];
        for (let i = 6; i < dates.length; i += 7) {
          withdrawals.push({
            date: dates[i],
            amount: 5,
            label: 'Retrait hebdo (5 €)',
          });
        }
        return withdrawals;
      }
      case 'today_10': {
        // Withdraw 10 € today or on day 1
        const today = getTodayStr();
        const date = (today >= params.startDate && today <= params.endDate) ? today : params.startDate;
        return [{
          date,
          amount: 10,
          label: 'Achat de 10 €',
        }];
      }
      case 'all_now': {
        // Withdraw all available funds on Day 1
        // On Day 1, available balance is initialCapital (10) + dailyAllowance (2.10) = 12.10
        // We withdraw 12 € (rounded to the euro)
        return [{
          date: params.startDate,
          amount: Math.round(params.initialCapital + params.dailyAllowance),
          label: 'Tout retirer',
        }];
      }
      case 'custom':
        return customWithdrawals;
      default:
        return [];
    }
  };

  // Determine withdrawals for current selection
  const currentWithdrawals = activeScenario === 'custom'
    ? customWithdrawals
    : getPresetWithdrawals(activeScenario);

  const activeResult = calculateScenario(
    params,
    currentWithdrawals,
    activeScenario === 'no_withdrawal'
      ? 'Aucun retrait'
      : activeScenario === 'weekly_5'
      ? 'Retrait 5 € / semaine'
      : activeScenario === 'today_10'
      ? 'Retrait 10 € aujourd\'hui'
      : activeScenario === 'all_now'
      ? 'Retrait max départ'
      : 'Simulé personnalisé'
  );

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(parseFloat(newAmount) || 0);
    if (!newDate || amount <= 0) return;

    const newWithdrawal: SimulatedWithdrawal = {
      date: newDate,
      amount,
      label: newLabel,
    };

    setCustomWithdrawals((prev) => {
      const updated = [...prev, newWithdrawal];
      // Sort by date
      return updated.sort((a, b) => a.date.localeCompare(b.date));
    });
    setNewAmount('');
    setActiveScenario('custom');
  };

  const handleRemoveCustom = (index: number) => {
    setCustomWithdrawals((prev) => prev.filter((_, i) => i !== index));
    setActiveScenario('custom');
  };

  // Combine charts data
  const chartData = refResult.evolution.map((refRow, idx) => {
    const actRow = activeResult.evolution[idx];
    return {
      date: formatDate(refRow.date),
      'Sans retrait': parseFloat(refRow.endBalance.toFixed(2)),
      'Scénario actif': actRow ? parseFloat(actRow.endBalance.toFixed(2)) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Selector Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveScenario('no_withdrawal')}
          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeScenario === 'no_withdrawal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          🔒 Aucun retrait
        </button>
        <button
          onClick={() => setActiveScenario('weekly_5')}
          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeScenario === 'weekly_5'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          📅 5 € / semaine
        </button>
        <button
          onClick={() => setActiveScenario('today_10')}
          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeScenario === 'today_10'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          🛍️ 10 € aujourd'hui
        </button>
        <button
          onClick={() => setActiveScenario('all_now')}
          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeScenario === 'all_now'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          💥 Tout retirer J1
        </button>
        <button
          onClick={() => setActiveScenario('custom')}
          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeScenario === 'custom'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          ⚙️ Personnalisé
        </button>
      </div>

      {/* Metrics comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total retiré</span>
          <p className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1">
            {formatCurrency(activeResult.totalWithdrawn)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Intérêts cumulés</span>
          <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
            {formatCurrency(activeResult.cumulativeInterest)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Intérêts perdus</span>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            -{formatCurrency(activeResult.interestLost)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Différence finale</span>
          <p className="text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">
            -{formatCurrency(activeResult.differenceFromMax)}
          </p>
        </div>
      </div>

      {/* Pedagogical summary message */}
      <div className="bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <Info className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <span className="font-bold">Analyse pédagogique : </span>
          {activeScenario === 'no_withdrawal' ? (
            "Dans ce scénario, tu gardes tout ton argent. Les intérêts composés travaillent à plein régime ! Tu atteins le montant optimal de 196,44 € (dont 17,86 € offerts en bonus)."
          ) : (
            `Dans ce scénario, tu retires ${formatCurrency(activeResult.totalWithdrawn)}. Mais ton montant final baisse de ${formatCurrency(activeResult.differenceFromMax)}, car tu perds également ${formatCurrency(activeResult.interestLost)} d'intérêts futurs que cet argent n'a pas pu fabriquer.`
          )}
        </div>
      </div>

      {/* Chart container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
            <ChartIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
            Évolution comparée du solde
          </h4>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Intérêts cumulés inclus
          </span>
        </div>
        <div className="h-64 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 9 }} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="Sans retrait"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  name="100% Placé"
                />
                <Line
                  type="monotone"
                  dataKey="Scénario actif"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  name="Scénario simulé"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400">
              Chargement du graphique...
            </div>
          )}
        </div>
      </div>

      {/* Custom scenario withdrawals editor */}
      {activeScenario === 'custom' && (
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
            <BarChart2 className="h-4 w-4 mr-1.5 text-indigo-500" />
            Créer tes propres retraits simués
          </h4>

          {/* Form */}
          <form onSubmit={handleAddCustom} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Date</label>
              <input
                type="date"
                min={params.startDate}
                max={params.endDate}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Montant (€)</label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 5"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Motif</label>
              <input
                type="text"
                placeholder="Ex: Glace, T-shirt"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customWithdrawals.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-4">
                Aucun retrait simulé. Remplis le formulaire ci-dessus pour simuler un retrait.
              </p>
            ) : (
              customWithdrawals.map((cw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-2.5 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-500">{formatDate(cw.date)}</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-lg">
                      {cw.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600">-{formatCurrency(cw.amount)}</span>
                    <button
                      onClick={() => handleRemoveCustom(idx)}
                      className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

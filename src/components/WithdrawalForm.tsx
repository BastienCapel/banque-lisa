'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, Transaction } from '../types';
import { calculateScenario, getAvailableBalanceAtDate, getTodayStr } from '@/lib/finance';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { fetchJson, isAuthRequiredError } from '@/lib/api-client';

interface WithdrawalFormProps {
  params: FinancialParams;
  transactions: Transaction[];
  onSuccess: () => void;
}

export default function WithdrawalForm({
  params,
  transactions,
  onSuccess,
}: WithdrawalFormProps) {
  const [date, setDate] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [label, setLabel] = useState<string>('glace');
  const [note, setNote] = useState<string>('');
  
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [interestLost, setInterestLost] = useState<number>(0);
  const [finalDifference, setFinalDifference] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Set default date to today, clamped to period
  useEffect(() => {
    const today = getTodayStr();
    if (today >= params.startDate && today <= params.endDate) {
      setDate(today);
    } else {
      setDate(params.startDate);
    }
  }, [params.startDate, params.endDate]);

  // Update available balance and compute compound interest impact when date or amount changes
  useEffect(() => {
    if (!date) return;

    // Calculate available balance at this date
    const avail = getAvailableBalanceAtDate(params, transactions, date);
    setAvailableBalance(avail);

    const amount = Math.round(parseFloat(amountInput) || 0);
    if (amount <= 0 || amount > avail) {
      setInterestLost(0);
      setFinalDifference(0);
      return;
    }

    // Run custom simulation: comparing "Current state (no new withdrawals)" vs "Current state + this new withdrawal"
    // To make it simple:
    // Base Case (current real approved withdrawals)
    const baseWithdrawals = transactions
      .filter(t => t.status === 'approved' && t.type === 'withdrawal')
      .map(t => ({ date: t.date, amount: Math.abs(t.amount), label: t.label }));
      
    const baseSim = calculateScenario(params, baseWithdrawals);

    // Alternative Case (current approved + this new one)
    const altWithdrawals = [...baseWithdrawals, { date, amount, label }];
    const altSim = calculateScenario(params, altWithdrawals);

    // Interest lost is the difference in cumulative interest
    const interestDiff = Math.max(0, baseSim.cumulativeInterest - altSim.cumulativeInterest);
    const totalDiff = Math.max(0, baseSim.finalBalanceWithBonus - altSim.finalBalanceWithBonus);

    setInterestLost(interestDiff);
    setFinalDifference(totalDiff);
  }, [date, amountInput, label, params, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const amount = Math.round(parseFloat(amountInput) || 0);

    if (amount <= 0) {
      setError('Le montant doit être supérieur à 0 €.');
      return;
    }

    if (amount > availableBalance) {
      setError(`Solde insuffisant à cette date. Maximum disponible : ${availableBalance.toFixed(2)} €.`);
      return;
    }

    setLoading(true);

    try {
      await fetchJson('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          type: 'withdrawal',
          amount: -amount,
          label,
          note,
        }),
      });

      setSuccessMsg(`Demande de retrait de ${amount} € enregistrée ! En attente de validation par le parent.`);
      setAmountInput('');
      setNote('');
      onSuccess();
    } catch (err) {
      if (isAuthRequiredError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  const roundedAmount = Math.round(parseFloat(amountInput) || 0);

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-md space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl text-rose-500">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white">Proposer un Retrait</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Toutes les demandes de Lisa doivent être validées.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-2xl dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-2xl dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Date du retrait
          </label>
          <input
            type="date"
            min={params.startDate}
            max={params.endDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Disponible à cette date : <span className="font-semibold">{availableBalance.toFixed(2)} €</span>
          </span>
        </div>

        {/* Amount field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Montant souhaité (€)
          </label>
          <input
            type="number"
            step="1"
            min="1"
            placeholder="Ex: 10"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
          <span className="text-[10px] text-zinc-400 mt-1 block">
            Les retraits sont arrondis à l'euro.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Label select */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Motif de la dépense
          </label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="glace">🍧 Glace</option>
            <option value="sortie">🎬 Sortie / Cinéma</option>
            <option value="restaurant">🍕 Restaurant</option>
            <option value="shopping">🛍️ Shopping</option>
            <option value="cadeau">🎁 Cadeau</option>
            <option value="autre">❓ Autre</option>
          </select>
        </div>

        {/* Note field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Note ou précision (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: glace à la vanille au port"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Real-time Pedagogical Warning Box */}
      {roundedAmount > 0 && roundedAmount <= availableBalance && (
        <div className="bg-violet-50 border border-violet-100 text-violet-850 p-4 rounded-2xl text-xs space-y-2 dark:bg-violet-950/20 dark:border-violet-900/30 dark:text-violet-300 transition-all duration-300">
          <p className="font-semibold flex items-center gap-1.5 text-violet-750 dark:text-violet-200">
            💡 Effet pédagogique en direct :
          </p>
          <p className="leading-relaxed">
            Ce retrait de <strong className="text-rose-600 dark:text-rose-400">{roundedAmount} €</strong> réduit ton solde disponible de {roundedAmount} €, mais il réduit également la production d'intérêts.
          </p>
          <p className="border-t border-violet-100 dark:border-violet-900/40 pt-2 flex flex-col gap-1">
            <span>• Intérêts futurs perdus : <strong className="text-violet-700 dark:text-violet-300">{interestLost.toFixed(2)} €</strong></span>
            <span>• Coût réel au 10 août : <strong className="text-rose-600 dark:text-rose-400">{finalDifference.toFixed(2)} €</strong> (montant retiré + intérêts perdus)</span>
          </p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            Proposer le retrait
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}

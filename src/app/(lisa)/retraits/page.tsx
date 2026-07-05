'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, Transaction } from '@/types';
import WithdrawalForm from '@/components/WithdrawalForm';
import { Wallet, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function RetraitsPage() {
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
        throw new Error('Erreur de communication avec le serveur lors du chargement.');
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

  // Filter withdrawals
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal');
  const pendingWithdrawals = withdrawals.filter((t) => t.status === 'pending');
  const approvedWithdrawals = withdrawals.filter((t) => t.status === 'approved');
  const rejectedWithdrawals = withdrawals.filter((t) => t.status === 'rejected');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: params.currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
          <Wallet className="h-6 w-6 text-indigo-500" />
          Retraits & Dépenses
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Propose un retrait pour tes dépenses d'été ou consulte tes demandes passées.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <WithdrawalForm
            params={params}
            transactions={transactions}
            onSuccess={fetchData}
          />
        </div>

        {/* Requests List Column */}
        <div className="space-y-6">
          {/* Pending requests */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              Demandes en attente ({pendingWithdrawals.length})
            </h3>

            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">
                Aucune demande en attente de validation.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingWithdrawals.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-amber-50/40 border border-amber-100 rounded-2xl p-3 text-xs flex justify-between items-center dark:bg-amber-950/5 dark:border-amber-900/20"
                  >
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                        {tx.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Demandé le {formatDate(tx.date)}
                      </span>
                      {tx.note && (
                        <span className="text-[10px] italic text-zinc-500 block mt-0.5">
                          "{tx.note}"
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-zinc-900 dark:text-white block">
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-100/50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        En attente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved requests */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Retraits validés ({approvedWithdrawals.length})
            </h3>

            {approvedWithdrawals.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">
                Aucun retrait validé pour l'instant.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {approvedWithdrawals.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 text-xs flex justify-between items-center dark:bg-zinc-800/40 dark:border-zinc-700/50"
                  >
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                        {tx.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Effectué le {formatDate(tx.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 block">
                        -{formatCurrency(Math.abs(tx.amount))}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        Validé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected requests */}
          {rejectedWithdrawals.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-500" />
                Demandes refusées
              </h3>
              <div className="space-y-2">
                {rejectedWithdrawals.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-rose-50/20 border border-rose-100/50 rounded-2xl p-3 text-xs flex justify-between items-center dark:bg-rose-950/5 dark:border-rose-900/10"
                  >
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 line-through capitalize">
                        {tx.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Refusé le {formatDate(tx.updatedAt || tx.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-zinc-400 line-through block">
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

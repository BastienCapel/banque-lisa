'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, Transaction, AuditLog } from '@/types';
import { calculateDailyEvolution, diffDays } from '@/lib/finance';
import {
  Shield,
  KeyRound,
  Loader2,
  Lock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  ListFilter,
  PlusCircle,
  Activity,
  Trash2,
  Check,
  X,
  Edit2,
  Calendar,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [params, setParams] = useState<FinancialParams | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lisaAccessLink, setLisaAccessLink] = useState<string>('');
  const [accessLinkCopied, setAccessLinkCopied] = useState<boolean>(false);

  // Form states for settings
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialCapital, setInitialCapital] = useState('0');
  const [dailyAllowance, setDailyAllowance] = useState('0');
  const [dailyInterestRate, setDailyInterestRate] = useState('0');
  const [finalBonusRate, setFinalBonusRate] = useState('0');
  const [maxBudget, setMaxBudget] = useState('0');
  const [appName, setAppName] = useState('');

  // Form states for adding manual transaction
  const [newTxDate, setNewTxDate] = useState('');
  const [newTxType, setNewTxType] = useState<'withdrawal' | 'adjustment'>('withdrawal');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxLabel, setNewTxLabel] = useState('Ajustement');
  const [newTxNote, setNewTxNote] = useState('');

  // Editing transaction state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editNote, setEditNote] = useState('');

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      const data = await res.json();
      setIsAdmin(data.admin);
      if (data.admin) {
        fetchAdminData();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [paramsRes, txRes, logsRes] = await Promise.all([
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/transactions', { cache: 'no-store' }),
        fetch('/api/settings?logs=true', { cache: 'no-store' }),
      ]);

      if (!paramsRes.ok || !txRes.ok || !logsRes.ok) {
        throw new Error('Erreur de chargement des données.');
      }

      const paramsData = await paramsRes.json();
      const txData = await txRes.json();
      const logsData = await logsRes.json();

      setParams(paramsData);
      setTransactions(txData);
      setAuditLogs(logsData.logs || []);

      // Populate settings form
      setStartDate(paramsData.startDate);
      setEndDate(paramsData.endDate);
      setInitialCapital(String(paramsData.initialCapital));
      setDailyAllowance(String(paramsData.dailyAllowance));
      setDailyInterestRate(String(paramsData.dailyInterestRate));
      setFinalBonusRate(String(paramsData.finalBonusRate));
      setMaxBudget(String(paramsData.maxBudget));
      setAppName(paramsData.appName);

      setNewTxDate(paramsData.startDate);

      const linkRes = await fetch('/api/auth?shareLink=true', { cache: 'no-store' });
      if (linkRes.ok) {
        const linkData = await linkRes.json();
        setLisaAccessLink(linkData.shareUrl || '');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Code PIN incorrect.');
      }

      setIsAdmin(true);
      fetchAdminData();
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setPinLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params) return;
    setError(null);
    setActionLoading('settings');

    const updatedParams: FinancialParams = {
      ...params,
      startDate,
      endDate,
      initialCapital: parseFloat(initialCapital) || 0,
      dailyAllowance: parseFloat(dailyAllowance) || 0,
      dailyInterestRate: parseFloat(dailyInterestRate) || 0,
      finalBonusRate: parseFloat(finalBonusRate) || 0,
      maxBudget: parseFloat(maxBudget) || 0,
      appName,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedParams),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour.');
      }

      setParams(updatedParams);
      // Refresh logs
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransactionAction = async (id: string, action: 'approved' | 'rejected' | 'deleted') => {
    setError(null);
    setActionLoading(id);

    try {
      const method = action === 'deleted' ? 'DELETE' : 'PUT';
      const body = action === 'deleted' ? null : JSON.stringify({ status: action });

      const res = await fetch(`/api/transactions/${id}`, {
        method,
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de modification de la transaction.");
      }

      // Refresh list
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddManualTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setActionLoading('add_tx');

    const amount = newTxType === 'withdrawal' ? -Math.abs(parseFloat(newTxAmount)) : parseFloat(newTxAmount);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newTxDate,
          type: newTxType,
          amount,
          label: newTxLabel,
          note: newTxNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de création de la transaction.');
      }

      setNewTxAmount('');
      setNewTxNote('');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditAmount(String(Math.abs(tx.amount)));
    setEditDate(tx.date);
    setEditLabel(tx.label);
    setEditNote(tx.note || '');
  };

  const saveEditTx = async (id: string, type: string) => {
    setError(null);
    setActionLoading(`edit_${id}`);

    const rawAmount = parseFloat(editAmount) || 0;
    const finalAmount = type === 'withdrawal' ? -Math.abs(rawAmount) : rawAmount;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          date: editDate,
          label: editLabel,
          note: editNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la modification.');
      }

      setEditingTxId(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setIsAdmin(false);
  };

  const handleCopyLisaAccessLink = async () => {
    if (!lisaAccessLink) return;
    await navigator.clipboard.writeText(lisaAccessLink);
    setAccessLinkCopied(true);
    window.setTimeout(() => setAccessLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 1. LOGIN SCREEN
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50/40 via-indigo-50/20 to-zinc-50/40 p-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-3.5 text-white shadow-lg shadow-purple-500/20">
              <Shield className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Espace Banquier (Parent)
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Saisis ton code PIN parent pour accéder au panneau de contrôle.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            {pinError && (
              <div className="text-[11px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                ⚠️ {pinError}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Code PIN Parent
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  maxLength={10}
                  placeholder="Ex: 1234"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center tracking-widest font-extrabold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pinLoading}
              className="w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow transition-all duration-200 cursor-pointer"
            >
              {pinLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Vérification...
                </>
              ) : (
                'Déverrouiller'
              )}
            </button>
            
            <Link
              href="/"
              className="block text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-2"
            >
              Retour à l'espace Lisa
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN ADMIN PANEL
  if (!params) return null;

  const evolution = calculateDailyEvolution(params, transactions);
  const totalDays = diffDays(params.startDate, params.endDate) + 1;
  const finalRow = evolution[evolution.length - 1];
  const finalBalanceBeforeBonus = finalRow ? finalRow.endBalance : 0;
  const estimatedBonus = finalBalanceBeforeBonus * params.finalBonusRate;
  const projectedFinalWithBonus = finalBalanceBeforeBonus + estimatedBonus;

  const totalInterest = finalRow ? finalRow.cumulativeInterest : 0;

  // Budget Safety check
  // Scenario: no withdrawals
  const noWithdrawalEvolution = calculateDailyEvolution(params, []);
  const noWithdrawalFinalRow = noWithdrawalEvolution[noWithdrawalEvolution.length - 1];
  const maxPotentialBalanceWithBonus = noWithdrawalFinalRow
    ? noWithdrawalFinalRow.endBalance + (noWithdrawalFinalRow.endBalance * params.finalBonusRate)
    : 0;

  const isBudgetSafe = maxPotentialBalanceWithBonus <= params.maxBudget;

  const pendingRequests = transactions.filter((t) => t.status === 'pending');
  const otherApprovedTransactions = transactions.filter(
    (t) => t.status === 'approved' && (t.type === 'withdrawal' || t.type === 'adjustment')
  );

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-purple-900 text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-300" />
            <span className="font-extrabold text-sm tracking-tight text-white">
              Panneau de Contrôle Parent (Banquier)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white py-1.5 px-3 rounded-xl transition"
            >
              Voir Espace Lisa
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-3 rounded-xl transition cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-2xl dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lisaAccessLink && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-purple-500" />
                Lien privé Lisa
              </span>
              <p className="mt-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate select-all">
                {lisaAccessLink}
              </p>
            </div>
            <button
              onClick={handleCopyLisaAccessLink}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 transition cursor-pointer"
            >
              {accessLinkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {accessLinkCopied ? 'Copié' : 'Copier'}
            </button>
          </div>
        )}

        {/* Dashboard Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proj. balance card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Solde réel projeté (avec bonus)</span>
            <h3 className="text-3xl font-extrabold text-purple-600 mt-2">
              {formatCurrency(projectedFinalWithBonus)}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Solde: {formatCurrency(finalBalanceBeforeBonus)} + Bonus: {formatCurrency(estimatedBonus)}
            </p>
          </div>

          {/* Int cumul card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Total Intérêts distribués</span>
            <h3 className="text-3xl font-extrabold text-indigo-600 mt-2">
              {formatCurrency(totalInterest)}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Période : {totalDays} jours
            </p>
          </div>

          {/* Budget Safety Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Plafond de sécurité budgétaire</span>
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                  {formatCurrency(params.maxBudget)}
                </h3>
                {isBudgetSafe ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle className="h-3 w-3 mr-0.5 text-emerald-500" />
                    Respecté
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="h-3 w-3 mr-0.5 text-rose-500" />
                    Alerte dépassement
                  </span>
                )}
              </div>
            </div>
            <p className={`text-xs mt-2 p-2 rounded-xl border ${
              isBudgetSafe 
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/20 dark:text-emerald-300'
                : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300'
            }`}>
              {isBudgetSafe 
                ? `Max théorique (sans retrait) : ${formatCurrency(maxPotentialBalanceWithBonus)} (sous la limite).`
                : `Risque : Le max théorique est de ${formatCurrency(maxPotentialBalanceWithBonus)}, dépassant le plafond parent.`}
            </p>
          </div>
        </div>

        {/* main actions area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1 & 2: Transactions management */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pending validation requests list */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ListFilter className="h-4.5 w-4.5 text-purple-500" />
                Demandes de Retraits en attente ({pendingRequests.length})
              </h3>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">
                  Aucune demande de retrait en attente. Lisa gère bien son budget !
                </p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {pendingRequests.map((tx) => (
                    <div key={tx.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {editingTxId === tx.id ? (
                        /* Edit mode */
                        <div className="w-full space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                          <h4 className="text-xs font-bold text-zinc-500">Modifier la demande</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="text-xs rounded-lg border border-zinc-200 p-2 w-full dark:bg-zinc-800 text-zinc-800 dark:text-white"
                            />
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="Montant (€)"
                              className="text-xs rounded-lg border border-zinc-200 p-2 w-full dark:bg-zinc-800 text-zinc-800 dark:text-white"
                            />
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="Libellé"
                              className="text-xs rounded-lg border border-zinc-200 p-2 w-full dark:bg-zinc-800 text-zinc-800 dark:text-white"
                            />
                          </div>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Note ou raison"
                            className="text-xs rounded-lg border border-zinc-200 p-2 w-full dark:bg-zinc-800 text-zinc-800 dark:text-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingTxId(null)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-750 text-zinc-500 cursor-pointer"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => saveEditTx(tx.id, tx.type)}
                              disabled={actionLoading === `edit_${tx.id}`}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-600 text-white flex items-center gap-1 cursor-pointer"
                            >
                              {actionLoading === `edit_${tx.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Sauvegarder
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal display */
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 capitalize">
                                {tx.label}
                              </span>
                              <span className="text-[9px] bg-purple-50 text-purple-600 dark:bg-purple-950/30 px-2 py-0.5 rounded font-bold">
                                Par Lisa
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400">
                              Demandé le {formatDate(tx.date)}
                            </p>
                            {tx.note && (
                              <p className="text-[10px] italic text-zinc-500">
                                Note parent : "{tx.note}"
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-black text-rose-600">
                              {formatCurrency(Math.abs(tx.amount))}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {/* Validate */}
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'approved')}
                                disabled={!!actionLoading}
                                title="Approuver"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                {actionLoading === tx.id ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Check className="h-4.5 w-4.5" />}
                              </button>

                              {/* Reject */}
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'rejected')}
                                disabled={!!actionLoading}
                                title="Rejeter"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => startEditTx(tx)}
                                disabled={!!actionLoading}
                                title="Modifier"
                                className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved and history transactions list */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Historique des écritures réelles ({otherApprovedTransactions.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-zinc-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left font-bold text-zinc-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left font-bold text-zinc-500 uppercase">Libellé</th>
                      <th className="px-3 py-2 text-right font-bold text-zinc-500 uppercase">Montant</th>
                      <th className="px-3 py-2 text-center font-bold text-zinc-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {otherApprovedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-zinc-400 italic">Aucune transaction approuvée.</td>
                      </tr>
                    ) : (
                      otherApprovedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-3 py-2.5 font-medium">{formatDate(tx.date)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'withdrawal'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {tx.type === 'withdrawal' ? 'Retrait' : 'Ajustement'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-bold capitalize">{tx.label}</td>
                          <td className={`px-3 py-2.5 text-right font-bold ${
                            tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => handleTransactionAction(tx.id, 'deleted')}
                              title="Annuler/Supprimer"
                              className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit log viewer */}
            {auditLogs.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  Journal d'Audit ({auditLogs.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[10px] leading-normal"
                    >
                      <div className="flex justify-between items-center text-zinc-400 mb-1">
                        <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                          {log.action}
                        </span>
                        <span>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                        Cible : {log.entityType} ({log.entityId})
                      </p>
                      {log.newValueJson && (
                        <p className="text-zinc-500 mt-1 truncate">
                          Valeur : {log.newValueJson}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* COLUMN 3: Parameters form & adding new items */}
          <div className="space-y-6">
            
            {/* Parameters Settings form */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-purple-500" />
                Paramètres financiers
              </h3>

              <form onSubmit={handleSettingsSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nom appli</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Fin</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Capital Initial (€)</label>
                    <input
                      type="number"
                      step="any"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Versement/Jour (€)</label>
                    <input
                      type="number"
                      step="any"
                      value={dailyAllowance}
                      onChange={(e) => setDailyAllowance(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Intérêt/Jour (ex: 0.05)</label>
                    <input
                      type="number"
                      step="any"
                      value={dailyInterestRate}
                      onChange={(e) => setDailyInterestRate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Bonus final (ex: 0.10)</label>
                    <input
                      type="number"
                      step="any"
                      value={finalBonusRate}
                      onChange={(e) => setFinalBonusRate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Budget Max de sécurité (€)</label>
                  <input
                    type="number"
                    step="any"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading === 'settings'}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl shadow cursor-pointer text-xs"
                >
                  {actionLoading === 'settings' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Mettre à jour les paramètres
                </button>
              </form>
            </div>

            {/* Form to inject parent manual transaction */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle className="h-4.5 w-4.5 text-purple-500" />
                Ajouter une écriture manuelle
              </h3>

              <form onSubmit={handleAddManualTx} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    min={params.startDate}
                    max={params.endDate}
                    value={newTxDate}
                    onChange={(e) => setNewTxDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Type d'écriture</label>
                  <select
                    value={newTxType}
                    onChange={(e) => setNewTxType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                  >
                    <option value="withdrawal">Retrait (Débit -)</option>
                    <option value="adjustment">Ajustement (Ajust. +/-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Montant (€)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ex: -10 (débit) ou 5 (crédit)"
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    required
                  />
                  <span className="text-[9px] text-zinc-400 mt-1 block">
                    Pour un retrait, saisissez une valeur positive ou négative. Elle sera automatiquement déduite.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Libellé</label>
                  <input
                    type="text"
                    placeholder="Ex: Shopping, Bonus exceptionnel"
                    value={newTxLabel}
                    onChange={(e) => setNewTxLabel(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Note interne (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: approuvé suite à ton comportement"
                    value={newTxNote}
                    onChange={(e) => setNewTxNote(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading === 'add_tx'}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-xl shadow cursor-pointer text-xs"
                >
                  {actionLoading === 'add_tx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Valider l'écriture
                </button>
              </form>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

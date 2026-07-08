'use client';

import React, { useState, useEffect } from 'react';
import { FinancialParams, DailyEvolutionRow, Transaction } from '../types';
import { calculateDailyEvolution, getTodayStr } from '@/lib/finance';
import { LineChart as ChartIcon, Info } from 'lucide-react';
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

interface RealEvolutionChartProps {
  evolution: DailyEvolutionRow[];
  params: FinancialParams;
  transactions: Transaction[];
}

export default function RealEvolutionChart({
  evolution,
  params,
  transactions,
}: RealEvolutionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Calculate the "No withdrawal" (maximum) scenario
  const noWithdrawalEvolution = calculateDailyEvolution(params, []);

  // Determine the cutoff date to separate "real history" and "future projection"
  const todayStr = getTodayStr();
  const approvedTx = transactions.filter((t) => t.status === 'approved');
  
  const lastTxDate = approvedTx.length > 0
    ? approvedTx.reduce((max, t) => t.date > max ? t.date : max, params.startDate)
    : params.startDate;
  
  // Cutoff date is the later of today and the latest transaction date
  const cutoffDate = lastTxDate > todayStr ? lastTxDate : todayStr;

  // Combine data for Recharts
  const chartData = evolution.map((realRow, idx) => {
    const maxRow = noWithdrawalEvolution[idx];
    const isPastOrToday = realRow.date <= cutoffDate;

    return {
      date: formatDate(realRow.date),
      // Max potential path
      '100% Placé (Sans retrait)': maxRow ? parseFloat(maxRow.endBalance.toFixed(2)) : 0,
      // Solid real line up to cutoff date
      'Solde réel': isPastOrToday ? parseFloat(realRow.endBalance.toFixed(2)) : null,
      // Dashed projection line from cutoff date onwards
      'Projection du solde': !isPastOrToday || realRow.date === cutoffDate
        ? parseFloat(realRow.endBalance.toFixed(2))
        : null,
    };
  });

  return (
    <div className="space-y-4">
      {/* Chart container */}
      <div className="bg-white dark:bg-zinc-900 p-2 md:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
            <ChartIcon className="h-4 w-4 mr-1.5 text-indigo-500" />
            Évolution de ma cagnotte
          </h4>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Intérêts cumulés inclus
          </span>
        </div>

        <div className="h-72 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" className="dark:stroke-zinc-800" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 9 }} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                {/* 1. Max Potential Curve (Green) */}
                <Line
                  type="monotone"
                  dataKey="100% Placé (Sans retrait)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  name="100% Placé (Maximum)"
                />
                {/* 2. Real Solde Curve (Solid Purple) */}
                <Line
                  type="monotone"
                  dataKey="Solde réel"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  name="Mon solde réel"
                />
                {/* 3. Projection Solde Curve (Dashed Purple) */}
                <Line
                  type="monotone"
                  dataKey="Projection du solde"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Projection (sans autre retrait)"
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

      {/* Info Card */}
      <div className="bg-zinc-50 border border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-800/50 p-4 rounded-2xl text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2.5">
        <Info className="h-4.5 w-4.5 shrink-0 text-indigo-500 mt-0.5" />
        <div>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Pédagogie de l'écart : </span>
          L'écart entre la courbe verte (<span className="text-emerald-600 font-semibold">Maximum possible</span>) et la courbe violette (<span className="text-indigo-600 font-semibold">Ton solde réel</span>) représente les retraits effectués et les intérêts qu'ils n'ont pas pu générer. Plus tu laisses ton argent travailler, plus ton solde réel se rapproche du maximum possible !
        </div>
      </div>
    </div>
  );
}

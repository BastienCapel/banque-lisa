'use client';

import React from 'react';
import { DailyEvolutionRow } from '../types';
import { ArrowDown, ArrowUp, Info, HelpCircle } from 'lucide-react';

interface DailyEvolutionTableProps {
  evolution: DailyEvolutionRow[];
  currency: string;
}

export default function DailyEvolutionTable({
  evolution,
  currency,
}: DailyEvolutionTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          Tableau d'Évolution Quotidienne
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
          <Info className="h-3.5 w-3.5 mr-1" />
          Intérêts calculés chaque soir
        </span>
      </div>

      {/* MOBILE VIEW (CARD LIST) */}
      <div className="block md:hidden space-y-4">
        {evolution.map((row) => {
          const hasWithdrawal = row.withdrawalsSubtracted > 0;
          const hasAdjustment = Math.abs(row.adjustmentsAdded) > 0;
          
          return (
            <div
              key={row.date}
              className={`rounded-2xl border p-4 transition-all duration-200 ${
                hasWithdrawal
                  ? 'border-rose-100 bg-rose-50/30 dark:border-rose-950/30 dark:bg-rose-950/5'
                  : hasAdjustment
                  ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/30 dark:bg-amber-950/5'
                  : 'border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
                <div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Jour {row.dayIndex}
                  </span>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                    {formatDate(row.date)}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                    Solde fin de journée
                  </span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    {formatCurrency(row.endBalance)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="text-zinc-500 dark:text-zinc-400">Solde départ:</div>
                <div className="text-right font-medium text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(row.startBalance)}
                </div>

                <div className="text-zinc-500 dark:text-zinc-400">Versement quotidien:</div>
                <div className="text-right font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
                  <ArrowUp className="h-3 w-3 mr-0.5" />
                  {formatCurrency(row.allowanceAdded)}
                </div>

                {row.initialCapitalAdded > 0 && (
                  <>
                    <div className="text-zinc-500 dark:text-zinc-400 font-semibold text-indigo-600 dark:text-indigo-400">
                      Capital initial :
                    </div>
                    <div className="text-right font-semibold text-indigo-600 dark:text-indigo-400">
                      +{formatCurrency(row.initialCapitalAdded)}
                    </div>
                  </>
                )}

                {hasAdjustment && (
                  <>
                    <div className="text-zinc-500 dark:text-zinc-400">Ajustement parent:</div>
                    <div
                      className={`text-right font-medium flex items-center justify-end ${
                        row.adjustmentsAdded > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {row.adjustmentsAdded > 0 ? (
                        <ArrowUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-0.5" />
                      )}
                      {formatCurrency(row.adjustmentsAdded)}
                    </div>
                  </>
                )}

                {hasWithdrawal && (
                  <>
                    <div className="font-semibold text-rose-600 dark:text-rose-400">
                      Retrait effectué :
                    </div>
                    <div className="text-right font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end">
                      <ArrowDown className="h-3 w-3 mr-0.5" />
                      -{formatCurrency(row.withdrawalsSubtracted)}
                    </div>
                  </>
                )}

                <div className="text-zinc-500 dark:text-zinc-400 border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-1 mt-1">
                  Intérêt du jour (+{(row.interestRate * 100).toFixed(0)}%) :
                </div>
                <div className="text-right font-bold text-indigo-500 dark:text-indigo-400 border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-1 mt-1">
                  +{formatCurrency(row.interestEarned)}
                </div>

                <div className="text-zinc-400 dark:text-zinc-500 col-span-2 text-[10px] mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  Cumul des intérêts: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{formatCurrency(row.cumulativeInterest)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW (TABLE) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-850">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Jour
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Solde début
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Mouvements
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Avant intérêts
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Intérêt
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Solde fin
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Intérêts cumulés
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {evolution.map((row) => {
                const hasWithdrawal = row.withdrawalsSubtracted > 0;
                const hasAdjustment = Math.abs(row.adjustmentsAdded) > 0;
                const isFirstDay = row.dayIndex === 1;

                return (
                  <tr
                    key={row.date}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                      hasWithdrawal
                        ? 'bg-rose-50/10 dark:bg-rose-950/5'
                        : hasAdjustment
                        ? 'bg-amber-50/5 dark:bg-amber-950/5'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      {row.dayIndex}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold capitalize whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-700 dark:text-zinc-300 text-right">
                      {formatCurrency(row.startBalance)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{formatCurrency(row.allowanceAdded)}
                        </span>
                        {isFirstDay && (
                          <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            +{formatCurrency(row.initialCapitalAdded)} Cap.
                          </span>
                        )}
                        {hasAdjustment && (
                          <span
                            className={`text-[10px] font-medium ${
                              row.adjustmentsAdded > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {row.adjustmentsAdded > 0 ? '+' : ''}
                            {formatCurrency(row.adjustmentsAdded)} Ajust.
                          </span>
                        )}
                        {hasWithdrawal && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            -{formatCurrency(row.withdrawalsSubtracted)} Retr.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-700 dark:text-zinc-300 text-right font-medium">
                      {formatCurrency(row.balanceBeforeInterest)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-indigo-500 dark:text-indigo-400 text-right font-bold">
                      +{formatCurrency(row.interestEarned)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-900 dark:text-white text-right font-extrabold">
                      {formatCurrency(row.endBalance)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 text-right">
                      {formatCurrency(row.cumulativeInterest)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

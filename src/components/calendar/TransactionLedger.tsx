'use client';

import React, { useState } from 'react';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { formatVND } from '@/lib/services/financialService';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Trash2,
  Receipt,
} from 'lucide-react';

export const TransactionLedger: React.FC = () => {
  const { transactions, dailyRecords, deleteDailyRecord } = useSavingsStore();
  const { showToast } = useAppStore();
  const [filterType, setFilterType] = useState<'ALL' | 'CONTRIBUTION' | 'ALLOCATION' | 'INCOME'>('ALL');

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Sổ giao dịch (Ledger)
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 text-[11px] font-semibold">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'CONTRIBUTION', label: 'Tiết kiệm' },
              { id: 'ALLOCATION', label: 'Phân bổ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === tab.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
          Không có giao dịch nào phù hợp
        </p>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isContrib = tx.type === 'CONTRIBUTION';
            const isAlloc = tx.type === 'ALLOCATION';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isContrib
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : isAlloc
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isContrib ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {tx.description || (isContrib ? 'Tiết kiệm thêm' : 'Phân bổ mục tiêu')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[9px] uppercase tracking-wide">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div
                    className={`font-extrabold text-sm ${
                      isContrib
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isAlloc
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isContrib ? '+' : ''}
                    {formatVND(tx.amount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


'use client';

import React, { useState, useEffect } from 'react';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { formatVND } from '@/lib/services/financialService';
import { Activity, TrendingUp, PiggyBank, ArrowDownRight, ArrowUpRight, ArrowRight } from 'lucide-react';

export const DailyActivityCard: React.FC = () => {
  const { dailyRecords, transactions } = useSavingsStore();
  const { setActiveTab } = useAppStore();
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const todayRecord = dailyRecords.find((r) => r.date === todayStr);

  const todayIncome = todayRecord?.incomeAmount || 0;
  const todaySavings = todayRecord?.savingsContribution || 0;

  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Hoạt động hôm nay
          </h2>
        </div>
        <button
          onClick={() => setActiveTab('calendar')}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          Lịch sử
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Today 2 Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Thu nhập hôm nay
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {formatVND(todayIncome)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <PiggyBank className="w-3.5 h-3.5 text-teal-500" />
            Tiết kiệm hôm nay
          </div>
          <div className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {formatVND(todaySavings)}
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Giao dịch gần đây
        </h3>

        {recentTxs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
            Chưa có giao dịch nào
          </p>
        ) : (
          <div className="space-y-2">
            {recentTxs.map((tx) => {
              const isContrib = tx.type === 'CONTRIBUTION';
              const isAlloc = tx.type === 'ALLOCATION';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isContrib
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isAlloc
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isContrib ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {tx.description || (isContrib ? 'Đóng góp tiết kiệm' : 'Phân bổ mục tiêu')}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-bold shrink-0 ml-2 ${
                      isContrib
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isAlloc
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isContrib ? '+' : ''}
                    {formatVND(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

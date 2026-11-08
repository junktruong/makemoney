'use client';

import React from 'react';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { formatVND } from '@/lib/services/financialService';
import { ProgressBar } from '../common/ProgressBar';
import { Wallet, TrendingUp, PiggyBank, Coins } from 'lucide-react';

export const SavingsSummaryCard: React.FC = () => {
  const { summary } = useSavingsStore();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 shadow-lg shadow-emerald-950/10">
      {/* Background ambient decor */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Total Savings */}
      <div className="relative z-10">
        <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
          <span className="flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-emerald-300" />
            Tổng tiền tiết kiệm
          </span>
          <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-white font-bold">
            Tiến độ {summary.overallProgress}%
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight my-2">
          {formatVND(summary.totalSavings)}
        </div>

        {/* Progress bar towards active wishlist items */}
        <div className="mt-3 mb-4">
          <ProgressBar progress={summary.overallProgress} height="h-2" colorScheme="emerald" />
          <div className="flex justify-between text-[11px] text-emerald-100/90 mt-1 font-medium">
            <span>Đã gán cho mục tiêu: {formatVND(summary.allocatedSavings)}</span>
            <span>Mục tiêu: {formatVND(summary.totalTargetPrice)}</span>
          </div>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
            <div className="flex items-center gap-1 text-emerald-200 text-[10px] font-medium">
              <Coins className="w-3 h-3 text-emerald-300" />
              Chưa phân bổ
            </div>
            <div className="font-bold text-xs sm:text-sm mt-0.5 truncate text-emerald-50">
              {formatVND(summary.unallocatedSavings)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
            <div className="flex items-center gap-1 text-emerald-200 text-[10px] font-medium">
              <TrendingUp className="w-3 h-3 text-emerald-300" />
              Tổng thu nhập
            </div>
            <div className="font-bold text-xs sm:text-sm mt-0.5 truncate text-emerald-50">
              {formatVND(summary.totalIncome)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5">
            <div className="flex items-center gap-1 text-emerald-200 text-[10px] font-medium">
              <Wallet className="w-3 h-3 text-emerald-300" />
              Đã đóng góp
            </div>
            <div className="font-bold text-xs sm:text-sm mt-0.5 truncate text-emerald-50">
              {formatVND(summary.totalContributions)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

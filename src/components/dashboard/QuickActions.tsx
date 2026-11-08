'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Plus, TrendingUp, PiggyBank, HeartHandshake } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { setIsIncomeModalOpen, setIsSavingsModalOpen, setIsWishlistModalOpen } = useAppStore();

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* 1. Ghi thu nhập */}
      <button
        onClick={() => setIsIncomeModalOpen(true)}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/5 active:scale-95 transition-all text-center group"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
          <TrendingUp className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
          + Ghi thu nhập
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Hôm nay</span>
      </button>

      {/* 2. Thêm tiền tiết kiệm */}
      <button
        onClick={() => setIsSavingsModalOpen(true)}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/5 active:scale-95 transition-all text-center group"
      >
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
          <PiggyBank className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
          + Tiết kiệm
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Để dành</span>
      </button>

      {/* 3. Thêm nguyện vọng */}
      <button
        onClick={() => setIsWishlistModalOpen(true)}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-emerald-500/5 active:scale-95 transition-all text-center group"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
          + Nguyện vọng
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Mục tiêu mới</span>
      </button>
    </div>
  );
};

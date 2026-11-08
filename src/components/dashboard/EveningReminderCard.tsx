'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { Sparkles, Moon, ArrowRight } from 'lucide-react';

export const EveningReminderCard: React.FC = () => {
  const { setIsEveningModalOpen } = useAppStore();

  return (
    <div
      onClick={() => setIsEveningModalOpen(true)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/20 dark:border-emerald-500/30 p-4 transition-all hover:border-emerald-500/40 active:scale-[0.99] shadow-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Moon className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tổng kết cuối ngày
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Hôm nay bạn tiết kiệm được bao nhiêu?
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ghi nhanh thu nhập & khoản để dành trong 10 giây
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

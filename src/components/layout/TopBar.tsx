'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { syncWithServer } from '@/lib/services/syncService';
import { Sun, Moon, RefreshCw, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { isOnline, syncState, theme, setTheme, showToast } = useAppStore();

  const handleManualSync = async () => {
    if (!isOnline) {
      showToast('Đang ngoại tuyến, không thể đồng bộ máy chủ', 'info');
      return;
    }
    showToast('Bắt đầu đồng bộ với máy chủ...', 'info');
    const res = await syncWithServer();
    if (res.success) {
      showToast('Đồng bộ thành công!', 'success');
    } else {
      showToast('Đồng bộ thất bại, hãy thử lại', 'error');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 safe-top">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 fill-white/20" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              Make Money
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Ước mơ & Tích lũy
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {/* Sync status pill */}
          <button
            onClick={handleManualSync}
            disabled={syncState === 'syncing'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
            title="Nhấn để đồng bộ ngay"
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span className="hidden xs:inline">Ngoại tuyến</span>
              </>
            ) : syncState === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                <span className="hidden xs:inline">Đang đồng bộ</span>
              </>
            ) : syncState === 'error' ? (
              <>
                <RefreshCw className="w-3 h-3 text-rose-500" />
                <span className="hidden xs:inline">Thử lại</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="hidden xs:inline">Đã đồng bộ</span>
              </>
            )}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

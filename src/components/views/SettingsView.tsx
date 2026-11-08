'use client';

import React from 'react';
import { StorageManager } from '../settings/StorageManager';
import { ExportImportCard } from '../settings/ExportImportCard';
import { InstallGuide } from '../settings/InstallGuide';
import { useAppStore } from '@/lib/store/useAppStore';
import { Sun, Moon, Monitor, DollarSign, ShieldCheck, Heart } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="space-y-4 pb-20 pt-2 animate-in fade-in duration-200">
      <div className="px-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Cài đặt hệ thống
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tùy chỉnh giao diện, lưu trữ hình ảnh & sao lưu dữ liệu
        </p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Giao diện (Theme)
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Sáng</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Tối</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              theme === 'system'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-4 h-4 text-slate-500" />
            <span>Hệ thống</span>
          </button>
        </div>
      </div>

      {/* Currency & Financial Standards */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Tiền tệ & Định dạng
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ứng dụng sử dụng chuẩn tiền tệ <strong>Việt Nam Đồng (VND - ₫)</strong> với tính toán số nguyên chính xác tuyệt đối, không có sai số dấu phẩy động.
        </p>
      </div>

      {/* Storage & Sync */}
      <StorageManager />

      {/* Backup & Export */}
      <ExportImportCard />

      {/* PWA Mobile Installation */}
      <InstallGuide />

      {/* Security & Data Integrity badge */}
      <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Kiến trúc Offline-First an toàn</span>
          <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">
            Dữ liệu tài chính và hình ảnh của bạn được lưu trữ bền vững trong cơ sở dữ liệu IndexedDB trên thiết bị. Mọi thao tác đều có mã định danh Idempotency Key để tránh ghi trùng lặp và tự động đồng bộ lên MongoDB Atlas + GridFS khi có mạng.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-2 pb-4">
        <p className="font-semibold text-slate-500 dark:text-slate-400">
          Make Money 2.0 • Ứng dụng quản lý ước mơ & tiết kiệm
        </p>
        <p className="mt-0.5 flex items-center justify-center gap-1">
          Thiết kế với <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> cho người Việt
        </p>
      </div>
    </div>
  );
};


'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAppStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
  };

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold max-w-sm">
        {icons[toast.type]}
        <span className="flex-1 truncate">{toast.message}</span>
        <button
          onClick={hideToast}
          className="p-0.5 rounded-full hover:bg-white/20 dark:hover:bg-slate-800/20 text-white/80 dark:text-slate-800/80"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


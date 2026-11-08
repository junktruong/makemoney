'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, CheckCircle2, Apple } from 'lucide-react';

export const InstallGuide: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if launched as installed PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Cài đặt ứng dụng di động (PWA)
          </h3>
        </div>

        {isStandalone && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Đã cài đặt
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Make Money được xây dựng dưới dạng Progressive Web App (PWA) mượt mà như ứng dụng gốc, không tốn dung lượng, có icon riêng trên màn hình chính và hoạt động không cần mạng.
      </p>

      {/* Android Install Button if available */}
      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          Cài đặt Make Money lên điện thoại ngay
        </button>
      )}

      {/* iOS Instructions */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Apple className="w-4 h-4" />
          Hướng dẫn cài đặt trên iPhone / iPad (Safari)
        </div>

        <ol className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-4 list-decimal text-[11px]">
          <li>Mở ứng dụng Make Money bằng trình duyệt <strong>Safari</strong>.</li>
          <li>
            Bấm vào nút <strong>Chia sẻ (Share)</strong>{' '}
            <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> ở thanh dưới màn hình.
          </li>
          <li>
            Cuộn xuống và chọn <strong>Thêm vào màn hình chính (Add to Home Screen)</strong>{' '}
            <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />.
          </li>
          <li>Nhấn <strong>Thêm (Add)</strong> ở góc trên cùng bên phải.</li>
        </ol>
      </div>
    </div>
  );
};


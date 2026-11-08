'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Apple,
  MoreVertical,
  Download,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const InstallGuide: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSecureOrigin, setIsSecureOrigin] = useState<boolean>(true);

  useEffect(() => {
    // Check if launched as installed PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    // Check if connection is secure (HTTPS or localhost)
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setIsSecureOrigin(false);
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
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Cài đặt ứng dụng di động (PWA)
          </h3>
        </div>

        {isStandalone ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Đã cài đặt
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Bản Web App</span>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Make Money được xây dựng theo chuẩn PWA (Progressive Web App) với Service Worker lưu trữ cục bộ. Khi cài đặt, ứng dụng mở toàn màn hình (không có thanh địa chỉ), chạy mượt mà ngay cả khi mất mạng.
      </p>

      {/* 1-Click Install Button if Chrome fired beforeinstallprompt */}
      {deferredPrompt && !isStandalone && (
        <button
          onClick={handleInstallClick}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Cài đặt Make Money lên điện thoại (1 Chạm)
        </button>
      )}

      {/* Insecure Origin Alert (HTTP on local IP) */}
      {!isSecureOrigin && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            Lưu ý bảo mật của Google Chrome trên Android
          </div>
          <p className="text-[11px] leading-relaxed">
            Bạn đang truy cập qua địa chỉ IP cục bộ không có bảo mật (HTTP). Trình duyệt Chrome trên Android theo mặc định <strong>chỉ cho phép cài đặt PWA qua HTTPS hoặc localhost</strong>.
          </p>
          <p className="text-[11px] leading-relaxed font-semibold">
            👉 Khi deploy lên Vercel/Cloudflare (có HTTPS), nút cài đặt và menu Chrome sẽ hoạt động 100% tự động!
          </p>
        </div>
      )}

      {/* Android Chrome Instructions */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          Hướng dẫn cài đặt trên Android (Google Chrome)
        </div>

        <ol className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-4 list-decimal text-[11px]">
          <li>
            Mở ứng dụng bằng trình duyệt <strong>Google Chrome</strong>.
          </li>
          <li>
            Bấm vào nút <strong>Menu 3 chấm</strong>{' '}
            <MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-300" /> ở góc trên bên phải.
          </li>
          <li>
            Chọn <strong>&ldquo;Cài đặt ứng dụng&rdquo; (Install app)</strong> hoặc{' '}
            <strong>&ldquo;Thêm vào màn hình chính&rdquo; (Add to Home screen)</strong>.
          </li>
          <li>
            Bấm <strong>&ldquo;Cài đặt&rdquo; (Install)</strong> trong hộp thoại xác nhận. Biểu tượng Make Money sẽ xuất hiện trong danh sách ứng dụng điện thoại.
          </li>
        </ol>
      </div>

      {/* iOS Instructions */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Apple className="w-4 h-4 text-slate-800 dark:text-slate-200" />
          Hướng dẫn cài đặt trên iPhone / iPad (Safari)
        </div>

        <ol className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-4 list-decimal text-[11px]">
          <li>Mở ứng dụng bằng trình duyệt <strong>Safari</strong>.</li>
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

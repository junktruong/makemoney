'use client';

import React, { useState, useEffect } from 'react';
import { getLocalStorageStats, db } from '@/lib/db/indexedDb';
import { syncWithServer } from '@/lib/services/syncService';
import { useAppStore } from '@/lib/store/useAppStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { HardDrive, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const StorageManager: React.FC = () => {
  const { isOnline, showToast } = useAppStore();
  const { loadWishlist } = useWishlistStore();
  const { loadSavingsData } = useSavingsStore();

  const [stats, setStats] = useState<{
    localImagesCount: number;
    localImagesSizeBytes: number;
    pendingUploadsCount: number;
    syncedImagesCount: number;
  }>({
    localImagesCount: 0,
    localImagesSizeBytes: 0,
    pendingUploadsCount: 0,
    syncedImagesCount: 0,
  });

  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const refreshStats = async () => {
    const s = await getLocalStorageStats();
    setStats(s);
    const meta = await db.meta.get('lastSyncedAt');
    setLastSync(meta ? meta.value : null);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) {
      showToast('Thiết bị đang ngoại tuyến', 'info');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncWithServer();
      if (res.success) {
        showToast('Đồng bộ dữ liệu và hình ảnh hoàn tất!', 'success');
      } else {
        showToast('Lỗi đồng bộ: ' + res.error, 'error');
      }
      await refreshStats();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if (stats.pendingUploadsCount > 0) {
      showToast(
        'Bạn có hình ảnh chưa đồng bộ lên máy chủ! Không thể xóa cache lúc này.',
        'error'
      );
      return;
    }

    try {
      // Clear synced images from local IndexedDB
      await db.images.where({ syncStatus: 'synced' }).delete();
      await refreshStats();
      await loadWishlist();
      await loadSavingsData();
      showToast('Đã dọn dẹp bộ nhớ tạm hình ảnh thành công!', 'success');
      setShowClearConfirm(false);
    } catch (err: any) {
      showToast('Lỗi dọn dẹp: ' + err.message, 'error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Quản lý bộ nhớ & Đồng bộ
          </h3>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Đồng bộ ngay
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <span className="text-[10px] text-slate-400 block font-medium">
            Số ảnh lưu trên máy
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 block">
            {stats.localImagesCount} ảnh
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Dung lượng: {formatBytes(stats.localImagesSizeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <span className="text-[10px] text-slate-400 block font-medium">
            Trạng thái đồng bộ
          </span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {stats.pendingUploadsCount > 0
              ? `Chờ tải ${stats.pendingUploadsCount} ảnh`
              : 'Đã tải hết lên Cloud'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Đã đồng bộ: {stats.syncedImagesCount} ảnh
          </span>
        </div>
      </div>

      {/* Last sync info */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Lần đồng bộ gần nhất:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {lastSync ? new Date(lastSync).toLocaleString('vi-VN') : 'Chưa đồng bộ'}
        </span>
      </div>

      {/* Clear Cache */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        {showClearConfirm ? (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
              Xác nhận dọn dẹp ảnh đã đồng bộ?
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              Ảnh đã có trên Cloud GridFS sẽ được xóa bớt khỏi bộ nhớ máy để giải phóng dung lượng.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleClearCache}
                className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                Xác nhận dọn dẹp
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={stats.localImagesCount === 0}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Giải phóng bộ nhớ tạm hình ảnh
          </button>
        )}
      </div>
    </div>
  );
};

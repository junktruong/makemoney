'use client';

import React, { useRef, useState } from 'react';
import { db } from '@/lib/db/indexedDb';
import { useAppStore } from '@/lib/store/useAppStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { Download, Upload, FileSpreadsheet, Database, CheckCircle2 } from 'lucide-react';

export const ExportImportCard: React.FC = () => {
  const { showToast } = useAppStore();
  const { loadWishlist } = useWishlistStore();
  const { loadSavingsData } = useSavingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const records = await db.dailyRecords.toArray();
      const headers = ['Ngày', 'Thu nhập (VND)', 'Tiết kiệm (VND)', 'Nguồn thu', 'Ghi chú'];
      const rows = records.map((r) => [
        `"${r.date}"`,
        r.incomeAmount || 0,
        r.savingsContribution || 0,
        `"${(r.source || '').replace(/"/g, '""')}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `make_money_records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Đã xuất file CSV thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi xuất CSV: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const [items, records, txs] = await Promise.all([
        db.wishlist.toArray(),
        db.dailyRecords.toArray(),
        db.transactions.toArray(),
      ]);

      const backup = {
        app: 'Make Money',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        wishlist: items,
        dailyRecords: records,
        transactions: txs,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `make_money_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Đã sao lưu toàn bộ dữ liệu (JSON)!', 'success');
    } catch (err: any) {
      showToast('Lỗi sao lưu JSON: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.wishlist && !parsed.dailyRecords) {
        throw new Error('Định dạng file sao lưu không hợp lệ');
      }

      await db.transaction('rw', [db.wishlist, db.dailyRecords, db.transactions], async () => {
        if (Array.isArray(parsed.wishlist)) {
          for (const item of parsed.wishlist) {
            await db.wishlist.put(item);
          }
        }
        if (Array.isArray(parsed.dailyRecords)) {
          for (const rec of parsed.dailyRecords) {
            await db.dailyRecords.put(rec);
          }
        }
        if (Array.isArray(parsed.transactions)) {
          for (const tx of parsed.transactions) {
            await db.transactions.put(tx);
          }
        }
      });

      await loadWishlist();
      await loadSavingsData();
      showToast('Khôi phục dữ liệu thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khôi phục: ' + err.message, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Sao lưu & Xuất dữ liệu
        </h3>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Bạn có toàn quyền với dữ liệu của mình. Xuất file Excel (CSV) hoặc file sao lưu toàn diện để lưu trữ an toàn.
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
        >
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Xuất file CSV</span>
          <span className="text-[10px] text-slate-400 font-normal">Mở bằng Excel</span>
        </button>

        <button
          onClick={handleExportJSON}
          disabled={isExporting}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
        >
          <Download className="w-5 h-5 text-teal-600" />
          <span>Sao lưu JSON</span>
          <span className="text-[10px] text-slate-400 font-normal">Toàn bộ dữ liệu</span>
        </button>
      </div>

      <div className="pt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJSON}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          Khôi phục từ file sao lưu JSON
        </button>
      </div>
    </div>
  );
};


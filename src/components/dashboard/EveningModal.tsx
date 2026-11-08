'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { useAppStore } from '@/lib/store/useAppStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import confetti from 'canvas-confetti';
import { Sparkles, Moon, Wallet } from 'lucide-react';

export const EveningModal: React.FC = () => {
  const { isEveningModalOpen, setIsEveningModalOpen, showToast } = useAppStore();
  const { dailyRecords, addDailyRecord, updateDailyRecord } = useSavingsStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const existingToday = dailyRecords.find((r) => r.date === todayStr);

  const [income, setIncome] = useState<number>(0);
  const [savings, setSavings] = useState<number>(0);
  const [source, setSource] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isEveningModalOpen) {
      if (existingToday) {
        setIncome(existingToday.incomeAmount || 0);
        setSavings(existingToday.savingsContribution || 0);
        setSource(existingToday.source || '');
        setNote(existingToday.note || '');
      } else {
        setIncome(0);
        setSavings(0);
        setSource('');
        setNote('');
      }
    }
  }, [isEveningModalOpen, existingToday]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (income === 0 && savings === 0) {
      showToast('Vui lòng nhập thu nhập hoặc tiền tiết kiệm', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingToday) {
        await updateDailyRecord(existingToday.id, {
          incomeAmount: income,
          savingsContribution: savings,
          source,
          note,
        });
      } else {
        await addDailyRecord({
          date: todayStr,
          incomeAmount: income,
          savingsContribution: savings,
          source,
          note,
        });
      }

      if (savings > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }

      showToast('Đã ghi nhận tài chính hôm nay!', 'success');
      setIsEveningModalOpen(false);
    } catch (err: any) {
      showToast('Có lỗi xảy ra: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonSources = ['Lương', 'Freelance', 'Bán hàng', 'Thưởng', 'Được tặng'];

  return (
    <Modal
      isOpen={isEveningModalOpen}
      onClose={() => setIsEveningModalOpen(false)}
      title="Tổng kết cuối ngày"
      subtitle={`Ngày ${new Date().toLocaleDateString('vi-VN')}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income Input */}
        <CurrencyInput
          label="1. Hôm nay bạn kiếm được bao nhiêu?"
          placeholder="0 ₫"
          value={income}
          onChange={setIncome}
          presets={[100000, 200000, 500000, 1000000]}
          autoFocus={true}
        />

        {/* Savings Input */}
        <div className="pt-1">
          <CurrencyInput
            label="2. Bạn trích vào quỹ tiết kiệm bao nhiêu?"
            placeholder="0 ₫"
            value={savings}
            onChange={setSavings}
            presets={[50000, 100000, 200000, 500000]}
          />
        </div>

        {/* Remaining spending preview */}
        {income > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Tiền chi tiêu cá nhân còn lại:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {Math.max(0, income - savings).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        )}

        {/* Source */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nguồn thu nhập (tùy chọn)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {commonSources.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  source === s
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Hoặc tự gõ nguồn..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cảm nghĩ, mục tiêu cho ngày mai..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : 'Lưu lại (Xong trong 10s)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


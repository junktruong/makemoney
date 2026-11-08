'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { useAppStore } from '@/lib/store/useAppStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { TrendingUp, Plus } from 'lucide-react';

export const IncomeModal: React.FC = () => {
  const { isIncomeModalOpen, setIsIncomeModalOpen, showToast } = useAppStore();
  const { addDailyRecord } = useSavingsStore();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [source, setSource] = useState<string>('Lương');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Vui lòng nhập số tiền thu nhập hợp lệ', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDailyRecord({
        date,
        incomeAmount: amount,
        savingsContribution: 0,
        source,
        note,
      });

      showToast('Đã ghi nhận thu nhập!', 'success');
      setAmount(0);
      setNote('');
      setIsIncomeModalOpen(false);
    } catch (err: any) {
      showToast('Có lỗi xảy ra: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sources = ['Lương', 'Freelance', 'Bán hàng', 'Thưởng', 'Đầu tư', 'Khác'];

  return (
    <Modal
      isOpen={isIncomeModalOpen}
      onClose={() => setIsIncomeModalOpen(false)}
      title="Ghi nhận thu nhập"
      subtitle="Thêm khoản tiền bạn vừa kiếm được"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ngày ghi nhận
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>

        {/* Amount */}
        <CurrencyInput
          label="Số tiền thu nhập"
          required
          autoFocus
          value={amount}
          onChange={setAmount}
          presets={[100000, 200000, 500000, 1000000, 2000000]}
        />

        {/* Source */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nguồn thu
          </label>
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
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
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú chi tiết
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Tiền dự án thiết kế web, bán đồ cũ..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : 'Xác nhận thu nhập'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


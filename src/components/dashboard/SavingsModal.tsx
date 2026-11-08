'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { useAppStore } from '@/lib/store/useAppStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import confetti from 'canvas-confetti';
import { PiggyBank } from 'lucide-react';

export const SavingsModal: React.FC = () => {
  const { isSavingsModalOpen, setIsSavingsModalOpen, showToast } = useAppStore();
  const { contributeSavings } = useSavingsStore();

  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('Tiết kiệm thêm');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await contributeSavings(amount, description);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      showToast('Đã thêm tiền vào quỹ tiết kiệm!', 'success');
      setAmount(0);
      setIsSavingsModalOpen(false);
    } catch (err: any) {
      showToast('Có lỗi xảy ra: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isSavingsModalOpen}
      onClose={() => setIsSavingsModalOpen(false)}
      title="Thêm tiền tiết kiệm"
      subtitle="Tích lũy vào quỹ tiết kiệm chung"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <CurrencyInput
          label="Số tiền để dành"
          required
          autoFocus
          value={amount}
          onChange={setAmount}
          presets={[50000, 100000, 200000, 500000, 1000000]}
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Lý do / Nguồn để dành
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ví dụ: Tiền thừa đi chợ, bớt tiền trà sữa..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 active:scale-95 transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
          >
            <PiggyBank className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : 'Góp vào quỹ tiết kiệm'}
          </button>
        </div>
      </form>
    </Modal>
  );
};


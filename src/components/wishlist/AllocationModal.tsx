'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { useAppStore } from '@/lib/store/useAppStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { formatVND } from '@/lib/services/financialService';
import confetti from 'canvas-confetti';
import { Coins, CheckCircle2, AlertCircle } from 'lucide-react';

export const AllocationModal: React.FC = () => {
  const { isAllocationModalOpen, closeAllocationModal, allocationTargetItem, showToast } =
    useAppStore();
  const { items } = useWishlistStore();
  const { summary, allocateSavings } = useSavingsStore();

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('Phân bổ cho mục tiêu');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAllocationModalOpen) {
      if (allocationTargetItem) {
        setSelectedGoalId(allocationTargetItem.id);
        const remainingNeeded = Math.max(
          0,
          allocationTargetItem.targetPrice - (allocationTargetItem.allocatedSavings || 0)
        );
        // Pre-fill with min of remainingNeeded or available unallocated
        const initial = Math.min(remainingNeeded, summary.unallocatedSavings);
        setAmount(initial > 0 ? initial : 0);
        setDescription(`Tiết kiệm cho ${allocationTargetItem.name}`);
      } else if (items.length > 0) {
        setSelectedGoalId(items[0].id);
        setAmount(0);
        setDescription(`Tiết kiệm cho ${items[0].name}`);
      }
    }
  }, [isAllocationModalOpen, allocationTargetItem, items, summary.unallocatedSavings]);

  const targetItem = items.find((i) => i.id === selectedGoalId);
  const itemRemaining = targetItem
    ? Math.max(0, targetItem.targetPrice - (targetItem.allocatedSavings || 0))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) {
      showToast('Vui lòng chọn mục tiêu cần phân bổ', 'info');
      return;
    }
    if (amount <= 0) {
      showToast('Số tiền phân bổ phải lớn hơn 0', 'info');
      return;
    }
    if (amount > summary.unallocatedSavings) {
      showToast(
        `Số dư chưa phân bổ không đủ (chỉ còn ${formatVND(summary.unallocatedSavings)})`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await allocateSavings(selectedGoalId, amount, description);
      if (success) {
        if (amount >= itemRemaining) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
          showToast(`Đã phân bổ đủ tiền cho ${targetItem?.name}!`, 'success');
        } else {
          showToast(`Đã phân bổ ${formatVND(amount)} cho ${targetItem?.name}!`, 'success');
        }
        closeAllocationModal();
      } else {
        showToast('Không thể phân bổ tiền, vui lòng kiểm tra lại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillMaxAvailable = () => {
    const max = Math.min(itemRemaining, summary.unallocatedSavings);
    setAmount(max);
  };

  return (
    <Modal
      isOpen={isAllocationModalOpen}
      onClose={closeAllocationModal}
      title="Phân bổ tiền tiết kiệm"
      subtitle="Chuyển tiền từ số dư chung sang mục tiêu cụ thể"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Available Balance Notice */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Số dư chưa phân bổ:
            </span>
          </div>
          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
            {formatVND(summary.unallocatedSavings)}
          </span>
        </div>

        {summary.unallocatedSavings <= 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Bạn chưa có tiền tiết kiệm tự do. Hãy thêm tiền tiết kiệm trước khi phân bổ!
            </span>
          </div>
        )}

        {/* Target Item Selection */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chọn mục tiêu nhận tiền
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => {
              setSelectedGoalId(e.target.value);
              const found = items.find((i) => i.id === e.target.value);
              if (found) setDescription(`Tiết kiệm cho ${found.name}`);
            }}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          >
            {items
              .filter((i) => i.status !== 'archived')
              .map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} (Còn thiếu:{' '}
                  {formatVND(Math.max(0, it.targetPrice - (it.allocatedSavings || 0)))})
                </option>
              ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <CurrencyInput
            label="Số tiền muốn phân bổ"
            required
            autoFocus
            value={amount}
            onChange={setAmount}
            presets={[100000, 200000, 500000, 1000000]}
          />

          {summary.unallocatedSavings > 0 && itemRemaining > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFillMaxAvailable}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Gán tối đa ({formatVND(Math.min(itemRemaining, summary.unallocatedSavings))})
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú giao dịch
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || summary.unallocatedSavings <= 0}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận phân bổ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { useAppStore } from '@/lib/store/useAppStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { formatVND } from '@/lib/services/financialService';
import confetti from 'canvas-confetti';
import { Coins, CheckCircle2, AlertCircle, ArrowLeftRight, PiggyBank } from 'lucide-react';

export const AllocationModal: React.FC = () => {
  const { isAllocationModalOpen, closeAllocationModal, allocationTargetItem, showToast } =
    useAppStore();
  const { items } = useWishlistStore();
  const { summary, allocateSavings, reallocateSavings } = useSavingsStore();

  const [mode, setMode] = useState<'allocate' | 'reallocate'>('allocate');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [sourceGoalId, setSourceGoalId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAllocationModalOpen) {
      setMode('allocate');
      if (allocationTargetItem) {
        setSelectedGoalId(allocationTargetItem.id);
        const remainingNeeded = Math.max(
          0,
          allocationTargetItem.targetPrice - (allocationTargetItem.allocatedSavings || 0)
        );
        const initial = Math.min(remainingNeeded, summary.unallocatedSavings);
        setAmount(initial > 0 ? initial : 0);
        setDescription(`Tiết kiệm cho ${allocationTargetItem.name}`);
      } else if (items.length > 0) {
        setSelectedGoalId(items[0].id);
        setAmount(0);
        setDescription(`Tiết kiệm cho ${items[0].name}`);
      }

      // Default source goal for reallocation
      const itemsWithSavings = items.filter((i) => (i.allocatedSavings || 0) > 0);
      if (itemsWithSavings.length > 0) {
        setSourceGoalId(itemsWithSavings[0].id);
      }
    }
  }, [isAllocationModalOpen, allocationTargetItem, items, summary.unallocatedSavings]);

  const targetItem = items.find((i) => i.id === selectedGoalId);
  const sourceItem = items.find((i) => i.id === sourceGoalId);

  const itemRemaining = targetItem
    ? Math.max(0, targetItem.targetPrice - (targetItem.allocatedSavings || 0))
    : 0;

  const sourceAllocated = sourceItem?.allocatedSavings || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Số tiền phải lớn hơn 0', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'allocate') {
        if (!selectedGoalId) {
          showToast('Vui lòng chọn mục tiêu cần phân bổ', 'info');
          return;
        }
        if (amount > summary.unallocatedSavings) {
          showToast(`Số dư chưa phân bổ không đủ (chỉ còn ${formatVND(summary.unallocatedSavings)})`, 'error');
          return;
        }

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
      } else {
        // Reallocation
        if (!sourceGoalId) {
          showToast('Vui lòng chọn mục tiêu nguồn', 'info');
          return;
        }
        if (amount > sourceAllocated) {
          showToast(`Mục tiêu nguồn chỉ có ${formatVND(sourceAllocated)}`, 'error');
          return;
        }

        const destId = selectedGoalId === 'unallocated' ? undefined : selectedGoalId;
        const desc = description || `Điều chuyển từ ${sourceItem?.name || ''}`;
        const success = await reallocateSavings(sourceGoalId, destId, amount, desc);
        if (success) {
          showToast(`Đã điều chuyển ${formatVND(amount)} thành công!`, 'success');
          closeAllocationModal();
        } else {
          showToast('Không thể điều chuyển tiền, vui lòng kiểm tra lại', 'error');
        }
      }
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillMax = () => {
    if (mode === 'allocate') {
      const max = Math.min(itemRemaining, summary.unallocatedSavings);
      setAmount(max);
    } else {
      setAmount(sourceAllocated);
    }
  };

  const itemsWithSavings = items.filter((i) => (i.allocatedSavings || 0) > 0);

  return (
    <Modal
      isOpen={isAllocationModalOpen}
      onClose={closeAllocationModal}
      title="Quản lý phân bổ tiền tiết kiệm"
      subtitle="Chuyển tiền vào mục tiêu hoặc điều chuyển giữa các mục tiêu"
    >
      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setMode('allocate');
            setAmount(0);
          }}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'allocate'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Phân bổ từ quỹ chung
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('reallocate');
            setAmount(0);
          }}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'reallocate'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Điều chuyển mục tiêu
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'allocate' ? (
          <>
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
                  Bạn chưa có tiền tiết kiệm tự do. Hãy ghi nhận thêm tiền tiết kiệm trước khi phân bổ!
                </span>
              </div>
            )}

            {/* Target Item Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mục tiêu nhận tiền
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
                      {it.name} (Còn thiếu: {formatVND(Math.max(0, it.targetPrice - (it.allocatedSavings || 0)))})
                    </option>
                  ))}
              </select>
            </div>
          </>
        ) : (
          <>
            {/* Reallocation Source & Destination */}
            {itemsWithSavings.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-xs text-amber-800 dark:text-amber-300">
                Chưa có mục tiêu nào có tiền tiết kiệm để điều chuyển.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lấy tiền từ mục tiêu nguồn:
                  </label>
                  <select
                    value={sourceGoalId}
                    onChange={(e) => setSourceGoalId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    {itemsWithSavings.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} (Đang có: {formatVND(it.allocatedSavings || 0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chuyển đến:
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="unallocated">Trả lại Quỹ tiết kiệm chung (Chưa phân bổ)</option>
                    {items
                      .filter((i) => i.id !== sourceGoalId && i.status !== 'archived')
                      .map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (Còn thiếu: {formatVND(Math.max(0, it.targetPrice - (it.allocatedSavings || 0)))})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {/* Amount Input */}
        <div>
          <CurrencyInput
            label="Số tiền thực hiện"
            required
            autoFocus
            value={amount}
            onChange={setAmount}
            presets={[100000, 200000, 500000, 1000000]}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={handleFillMax}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Gán tối đa có thể (
              {mode === 'allocate'
                ? formatVND(Math.min(itemRemaining, summary.unallocatedSavings))
                : formatVND(sourceAllocated)}
              )
            </button>
          </div>
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
            placeholder="Ví dụ: Đổi ý ưu tiên mua trước..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (mode === 'allocate' && summary.unallocatedSavings <= 0) ||
              (mode === 'reallocate' && sourceAllocated <= 0)
            }
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting
              ? 'Đang thực hiện...'
              : mode === 'allocate'
              ? 'Xác nhận phân bổ tiền'
              : 'Xác nhận điều chuyển'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

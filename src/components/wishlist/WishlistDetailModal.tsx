'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { WishlistGallery } from './WishlistGallery';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';
import { formatVND, computeGoalProjection } from '@/lib/services/financialService';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { useAppStore } from '@/lib/store/useAppStore';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  TrendingUp,
  Coins,
  CheckCircle2,
  Trash2,
  Edit,
  Archive,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface WishlistDetailModalProps {
  onEdit: () => void;
}

export const WishlistDetailModal: React.FC<WishlistDetailModalProps> = ({ onEdit }) => {
  const { selectedItem, setSelectedItem, deleteItem, markStatus } = useWishlistStore();
  const { dailyRecords } = useSavingsStore();
  const { openAllocationModal, showToast } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  if (!selectedItem) return null;

  const allocated = selectedItem.allocatedSavings || 0;
  const projection = computeGoalProjection(selectedItem, allocated, dailyRecords);
  const isCompleted = selectedItem.status === 'completed' || projection.progressPercent >= 100;

  const handleMarkCompleted = async () => {
    await markStatus(selectedItem.id, 'completed');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    showToast('Chúc mừng bạn đã hoàn thành mục tiêu này!', 'success');
  };

  const handleDelete = async () => {
    await deleteItem(selectedItem.id);
    showToast('Đã xóa nguyện vọng', 'info');
    setSelectedItem(null);
  };

  return (
    <Modal
      isOpen={!!selectedItem}
      onClose={() => {
        setSelectedItem(null);
        setConfirmDelete(false);
      }}
      title={selectedItem.name}
      subtitle={selectedItem.category || 'Mục tiêu cá nhân'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Product Image Gallery */}
        <WishlistGallery
          images={selectedItem.images || []}
          itemName={selectedItem.name}
        />

        {/* Badges & Meta */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={selectedItem.priority} size="md" />
            <StatusBadge status={selectedItem.status} />
          </div>

          {selectedItem.targetDate && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hạn: {selectedItem.targetDate}</span>
            </div>
          )}
        </div>

        {/* Pricing & Progress Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Giá mục tiêu
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {formatVND(selectedItem.targetPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Đã tiết kiệm được
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatVND(allocated)}
              </span>
            </div>
          </div>

          <ProgressBar
            progress={projection.progressPercent}
            height="h-3"
            showLabel
            colorScheme={isCompleted ? 'blue' : 'emerald'}
          />

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {projection.remainingAmount > 0
                ? `Còn thiếu: ${formatVND(projection.remainingAmount)}`
                : 'Đã tích lũy đủ 100%'}
            </span>

            {!isCompleted && (
              <button
                onClick={() => openAllocationModal(selectedItem)}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 active:scale-95"
              >
                + Phân bổ tiền ngay
              </button>
            )}
          </div>
        </div>

        {/* Section 11: Goal Planner Projections */}
        {!isCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Kế hoạch tiết kiệm (Goal Planner)
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">
                  Thời gian còn lại
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {projection.remainingDays} ngày
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">
                  Cần tiết kiệm mỗi ngày
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatVND(projection.requiredDailySavings)}/ngày
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <p>
                • Cần để dành: <strong>{formatVND(projection.requiredWeeklySavings)}/tuần</strong>
              </p>
              {projection.avgDailySavings7d > 0 && (
                <p>
                  • Trung bình 7 ngày qua bạn tiết kiệm được:{' '}
                  <strong>{formatVND(projection.avgDailySavings7d)}/ngày</strong>
                </p>
              )}
            </div>

            {/* Ahead / Behind Status Badge */}
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                projection.status === 'ahead'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                  : projection.status === 'behind'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                  : 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300'
              }`}
            >
              {projection.status === 'behind' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              ) : (
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{projection.statusMessage}</span>
            </div>

            {projection.projectedCompletionDate7d && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                * Dự kiến hoàn thành (theo tốc độ 7 ngày qua): {projection.projectedCompletionDate7d}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {selectedItem.notes && (
          <div className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
              Ghi chú:
            </span>
            {selectedItem.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {!isCompleted && (
            <button
              onClick={() => openAllocationModal(selectedItem)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Phân bổ tiền tiết kiệm
            </button>
          )}

          <div className="flex gap-2">
            {!isCompleted && (
              <button
                onClick={handleMarkCompleted}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs hover:bg-purple-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đánh dấu đã mua
              </button>
            )}

            <button
              onClick={onEdit}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>

            {confirmDelete ? (
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                Xác nhận xóa!
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 font-bold text-xs active:scale-95 transition-all"
                title="Xóa mục này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

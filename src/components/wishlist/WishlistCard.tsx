'use client';

import React from 'react';
import { WishlistItem } from '@/lib/types';
import { formatVND } from '@/lib/services/financialService';
import { ProgressBar } from '../common/ProgressBar';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { ImageBlobPreview } from '../common/ImageBlobPreview';
import { Calendar, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

interface WishlistCardProps {
  item: WishlistItem;
  onClick: () => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({ item, onClick }) => {
  const { openAllocationModal } = useAppStore();
  const primaryImg = item.images?.find((img) => img.isPrimary) || item.images?.[0];

  const allocated = item.allocatedSavings || 0;
  const remaining = Math.max(0, item.targetPrice - allocated);
  const progress = item.targetPrice > 0 ? Math.min(100, Math.round((allocated / item.targetPrice) * 100)) : 0;
  const isCompleted = item.status === 'completed' || remaining === 0;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border p-4 shadow-xs transition-all active:scale-[0.99] ${
        isCompleted
          ? 'border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/20 to-transparent'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:shadow-md'
      }`}
    >
      <div className="flex gap-3.5">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-800">
          <ImageBlobPreview
            imageId={primaryImg?.imageId}
            gridFsFileId={primaryImg?.gridFsFileId}
            thumbnailGridFsFileId={primaryImg?.thumbnailGridFsFileId}
            alt={item.name}
            useThumbnail={true}
          />
          {item.images && item.images.length > 1 && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
              +{item.images.length - 1}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <PriorityBadge priority={item.priority} size="sm" />
            </div>
          </div>

          {/* Pricing info */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatVND(item.targetPrice)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isCompleted ? (
                <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> Đã đủ tiền
                </span>
              ) : (
                `Còn thiếu ${formatVND(remaining)}`
              )}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <ProgressBar progress={progress} height="h-2" colorScheme={isCompleted ? 'blue' : 'emerald'} />
          </div>

          {/* Footer info: target date & allocate button */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{item.targetDate ? item.targetDate : 'Chưa đặt hạn'}</span>
            </div>

            {!isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openAllocationModal(item);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Phân bổ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

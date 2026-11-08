'use client';

import React from 'react';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { formatVND } from '@/lib/services/financialService';
import { ProgressBar } from '../common/ProgressBar';
import { PriorityBadge } from '../common/Badge';
import { ImageBlobPreview } from '../common/ImageBlobPreview';
import { Heart, PlusCircle, ArrowRight, Calendar, Sparkles } from 'lucide-react';

export const WishlistOverview: React.FC = () => {
  const { items, setSelectedItem } = useWishlistStore();
  const { setActiveTab, setIsWishlistModalOpen, openAllocationModal } = useAppStore();

  const activeItems = items
    .filter((i) => i.status === 'active')
    .sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
    })
    .slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Nguyện vọng ưu tiên
          </h2>
        </div>
        <button
          onClick={() => setActiveTab('wishlist')}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          Xem tất cả ({items.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center bg-white dark:bg-slate-900/50">
          <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Chưa có mục tiêu nào trong danh sách
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Thêm đồ bạn muốn mua để có động lực tiết kiệm mỗi ngày!
          </p>
          <button
            onClick={() => setIsWishlistModalOpen(true)}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Tạo nguyện vọng đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeItems.map((item) => {
            const primaryImg = item.images?.find((img) => img.isPrimary) || item.images?.[0];
            const allocated = item.allocatedSavings || 0;
            const remaining = Math.max(0, item.targetPrice - allocated);
            const progress = item.targetPrice > 0 ? Math.min(100, Math.round((allocated / item.targetPrice) * 100)) : 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-800">
                    <ImageBlobPreview
                      imageId={primaryImg?.imageId}
                      gridFsFileId={primaryImg?.gridFsFileId}
                      thumbnailGridFsFileId={primaryImg?.thumbnailGridFsFileId}
                      alt={item.name}
                      useThumbnail={true}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h4>
                      <PriorityBadge priority={item.priority} size="sm" />
                    </div>

                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatVND(item.targetPrice)}
                      </span>
                      {remaining > 0 ? (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Còn thiếu {formatVND(remaining)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          Đã đủ tiền mua!
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-2">
                      <ProgressBar progress={progress} height="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        {item.targetDate ? (
                          <>
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Hạn: {item.targetDate}
                          </>
                        ) : (
                          'Chưa đặt hạn'
                        )}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAllocationModal(item);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        + Phân bổ tiền
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

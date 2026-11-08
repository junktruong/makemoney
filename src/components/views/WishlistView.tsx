'use client';

import React, { useState } from 'react';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { WishlistCard } from '../wishlist/WishlistCard';
import { WishlistDetailModal } from '../wishlist/WishlistDetailModal';
import { WishlistFormModal } from '../wishlist/WishlistFormModal';
import { AllocationModal } from '../wishlist/AllocationModal';
import { WishlistItem, ItemStatus } from '@/lib/types';
import { Plus, Search, Filter, ArrowUpDown, Sparkles, Heart } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const { items, setSelectedItem, filter, setFilter } = useWishlistStore();
  const { setIsWishlistModalOpen, isWishlistModalOpen } = useAppStore();

  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Filter & Search Logic
  const filteredItems = items.filter((item) => {
    // Search
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // Status filter
    if (filter.status !== 'all') {
      if (item.status !== filter.status) return false;
    }

    // Category filter
    if (filter.category !== 'all') {
      if (item.category !== filter.category) return false;
    }

    return true;
  });

  // Sort Logic
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (filter.sortBy === 'priority') {
      const pMap = { high: 3, medium: 2, low: 1 };
      const diff = (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
      return filter.sortOrder === 'desc' ? diff : -diff;
    }
    if (filter.sortBy === 'targetPrice') {
      const diff = b.targetPrice - a.targetPrice;
      return filter.sortOrder === 'desc' ? diff : -diff;
    }
    if (filter.sortBy === 'targetDate') {
      const dateA = a.targetDate || '9999-12-31';
      const dateB = b.targetDate || '9999-12-31';
      return filter.sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    }
    // Default createdAt
    return filter.sortOrder === 'desc'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt);
  });

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category || 'Chung')))];

  const handleOpenEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-20 pt-2 animate-in fade-in duration-200">
      {/* Top Header & Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            Danh sách nguyện vọng
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {items.length} món đồ ao ước sở hữu
          </p>
        </div>

        <button
          onClick={() => setIsWishlistModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter({ search: e.target.value })}
          placeholder="Tìm theo tên món đồ, danh mục..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs"
        />
        {filter.search && (
          <button
            onClick={() => setFilter({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Status Filter Tabs & Sort */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex gap-1.5 shrink-0">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang tích lũy' },
              { id: 'completed', label: 'Đã hoàn thành' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter({ status: tab.id })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                filter.status === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <select
          value={filter.sortBy}
          onChange={(e) => setFilter({ sortBy: e.target.value as any })}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden shrink-0"
        >
          <option value="priority">Ưu tiên cao nhất</option>
          <option value="targetPrice">Giá cao nhất</option>
          <option value="targetDate">Hạn gần nhất</option>
          <option value="createdAt">Mới tạo gần đây</option>
        </select>
      </div>

      {/* Items list */}
      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900/50">
          <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Không tìm thấy nguyện vọng nào
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {filter.search ? 'Thử tìm với từ khóa khác' : 'Hãy bắt đầu tạo mục tiêu đầu tiên của bạn!'}
          </p>
          <button
            onClick={() => setIsWishlistModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all"
          >
            + Thêm nguyện vọng ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <WishlistFormModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
      />

      <WishlistFormModal
        isOpen={isEditModalOpen}
        editItem={editingItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
      />

      <WishlistDetailModal
        onEdit={() => {
          const cur = useWishlistStore.getState().selectedItem;
          if (cur) handleOpenEdit(cur);
        }}
      />

      <AllocationModal />
    </div>
  );
};


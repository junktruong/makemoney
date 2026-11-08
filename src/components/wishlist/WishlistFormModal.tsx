'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CurrencyInput } from '../common/CurrencyInput';
import { ImageUploader } from './ImageUploader';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { Priority, WishlistItem, ImageMetadata } from '@/lib/types';
import { Sparkles } from 'lucide-react';

interface WishlistFormModalProps {
  editItem?: WishlistItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistFormModal: React.FC<WishlistFormModalProps> = ({
  editItem,
  isOpen,
  onClose,
}) => {
  const { addItem, updateItem } = useWishlistStore();
  const { showToast } = useAppStore();

  const [name, setName] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetDays, setTargetDays] = useState<number>(30);
  const [category, setCategory] = useState<string>('Công nghệ');
  const [notes, setNotes] = useState<string>('');
  const [tempImages, setTempImages] = useState<ImageMetadata[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Consistent ID for item so images uploaded before submitting are permanently attached to this ID
  const [activeItemId, setActiveItemId] = useState<string>(() =>
    `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setActiveItemId(editItem.id);
        setName(editItem.name);
        setTargetPrice(editItem.targetPrice);
        setDescription(editItem.description || '');
        setPriority(editItem.priority);
        setTargetDate(editItem.targetDate || '');
        setTargetDays(editItem.targetDays || 30);
        setCategory(editItem.category || 'Công nghệ');
        setNotes(editItem.notes || '');
        setTempImages(editItem.images ? [...editItem.images] : []);
      } else {
        const newId = `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setActiveItemId(newId);
        setName('');
        setTargetPrice(0);
        setDescription('');
        setPriority('medium');
        setCategory('Công nghệ');
        setNotes('');
        setTempImages([]);

        // Default 30 days from now
        const d = new Date();
        d.setDate(d.getDate() + 30);
        setTargetDate(d.toISOString().split('T')[0]);
        setTargetDays(30);
      }
    }
  }, [isOpen, editItem]);

  const handlePresetDays = (days: number) => {
    setTargetDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split('T')[0]);
  };

  const handleCustomDateChange = (val: string) => {
    setTargetDate(val);
    if (val) {
      const target = new Date(val);
      const now = new Date();
      const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setTargetDays(Math.max(1, diff));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên món đồ muốn mua', 'info');
      return;
    }
    if (targetPrice <= 0) {
      showToast('Vui lòng nhập giá trị mục tiêu', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editItem) {
        await updateItem(editItem.id, {
          name: name.trim(),
          targetPrice,
          description: description.trim(),
          priority,
          targetDate,
          targetDays,
          category,
          notes: notes.trim(),
          images: tempImages,
        });
        showToast('Đã cập nhật nguyện vọng!', 'success');
      } else {
        await addItem({
          id: activeItemId, // Crucial: preserves activeItemId so uploaded images remain attached!
          name: name.trim(),
          targetPrice,
          description: description.trim(),
          priority,
          targetDate,
          targetDays,
          status: 'active',
          category,
          notes: notes.trim(),
          images: tempImages,
        });
        showToast('Đã thêm nguyện vọng mới!', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Công nghệ', 'Du lịch', 'Thời trang', 'Nhà cửa', 'Xe cộ', 'Học tập', 'Khác'];
  const presets = [7, 15, 30, 60, 90];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'Chỉnh sửa nguyện vọng' : 'Thêm nguyện vọng mới'}
      subtitle="Đặt mục tiêu cho món đồ bạn ao ước sở hữu"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tên sản phẩm / Nguyện vọng <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: MacBook Pro M4, iPhone 16 Pro, Xe máy..."
            className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        {/* Target Price */}
        <CurrencyInput
          label="Giá dự kiến"
          required
          value={targetPrice}
          onChange={setTargetPrice}
          presets={[1000000, 5000000, 10000000, 20000000, 35000000]}
        />

        {/* Product Images (Offline IndexedDB first + GridFS sync) */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hình ảnh minh họa sản phẩm
          </label>
          <ImageUploader
            wishlistItemId={activeItemId}
            images={tempImages}
            onImagesChange={setTempImages}
          />
        </div>

        {/* Priority & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mức độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="high">Ưu tiên cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deadline presets */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Hạn hoàn thành (Deadline)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handlePresetDays(days)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                  targetDays === days
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                {days} ngày
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>
        </div>

        {/* Description & Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghi chú thêm
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nơi bán, link sản phẩm, cấu hình muốn mua..."
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : editItem ? 'Cập nhật nguyện vọng' : 'Tạo nguyện vọng'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

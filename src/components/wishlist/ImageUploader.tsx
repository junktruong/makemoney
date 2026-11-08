'use client';

import React, { useRef, useState } from 'react';
import { processImageFile, validateImageFile } from '@/lib/services/imageService';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { ImageBlobPreview } from '../common/ImageBlobPreview';
import { Camera, Upload, Trash2, Star, Loader2, Plus } from 'lucide-react';
import { ImageMetadata } from '@/lib/types';

interface ImageUploaderProps {
  wishlistItemId: string;
  images: ImageMetadata[];
  onImagesChange?: (images: ImageMetadata[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  wishlistItemId,
  images,
  onImagesChange,
}) => {
  const { saveImageLocally, removeImageLocally } = useWishlistStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setErrorMsg(validation.error || 'File không hợp lệ');
          continue;
        }

        const processed = await processImageFile(file);
        await saveImageLocally(
          wishlistItemId,
          processed.originalBlob,
          processed.thumbnailBlob,
          file.name,
          processed.mimeType,
          images.length === 0 && i === 0
        );
      }
    } catch (err: any) {
      setErrorMsg('Lỗi xử lý ảnh: ' + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleSetPrimary = (targetImageId: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.imageId === targetImageId,
    }));
    useWishlistStore.getState().updateItem(wishlistItemId, { images: updated });
    if (onImagesChange) onImagesChange(updated);
  };

  const handleDelete = async (imageId: string) => {
    await removeImageLocally(wishlistItemId, imageId);
  };

  return (
    <div className="space-y-3">
      {/* Upload Buttons & Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-xs active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Chọn ảnh
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-xs active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-teal-600" />
            Chụp ảnh
          </button>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Hỗ trợ JPG, PNG, WebP. Tự động nén và lưu ngoại tuyến IndexedDB.
        </p>

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang xử lý & lưu ảnh ngoại tuyến...
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-500 mt-2">{errorMsg}</p>
        )}
      </div>

      {/* Uploaded Images List / Grid */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {images.map((img) => (
            <div
              key={img.imageId}
              className={`relative rounded-xl overflow-hidden aspect-square border-2 bg-slate-100 dark:bg-slate-800 group ${
                img.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <ImageBlobPreview
                imageId={img.imageId}
                gridFsFileId={img.gridFsFileId}
                thumbnailGridFsFileId={img.thumbnailGridFsFileId}
                alt={img.originalFilename}
                useThumbnail={true}
              />

              {/* Badges and overlays */}
              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-emerald-600 text-white rounded-md px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Ảnh chính
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.imageId)}
                    className="p-1.5 rounded-full bg-white text-slate-800 hover:text-emerald-600 shadow-md"
                    title="Đặt làm ảnh chính"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.imageId)}
                  className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

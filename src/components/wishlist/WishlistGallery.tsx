'use client';

import React, { useState } from 'react';
import { ImageMetadata } from '@/lib/types';
import { ImageBlobPreview } from '../common/ImageBlobPreview';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface WishlistGalleryProps {
  images: ImageMetadata[];
  itemName: string;
  wishlistItemId?: string;
}

export const WishlistGallery: React.FC<WishlistGalleryProps> = ({
  images,
  itemName,
  wishlistItemId,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-16/10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400">
        <ImageIcon className="w-10 h-10 stroke-1 mb-2 opacity-50" />
        <span className="text-xs">Chưa có hình ảnh minh họa</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-2">
      {/* Main Large Image */}
      <div
        onClick={() => setIsFullscreen(true)}
        className="relative group cursor-pointer w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-inner"
      >
        <ImageBlobPreview
          imageId={currentImage.imageId}
          wishlistItemId={wishlistItemId}
          gridFsFileId={currentImage.gridFsFileId}
          thumbnailGridFsFileId={currentImage.thumbnailGridFsFileId}
          alt={itemName}
          useThumbnail={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Counter Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Navigation arrows (if > 1 image) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-opacity"
              aria-label="Ảnh kế"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Horizontal Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {images.map((img, idx) => (
            <button
              key={img.imageId}
              onClick={() => setSelectedIndex(idx)}
              className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                selectedIndex === idx
                  ? 'border-emerald-500 scale-105 shadow-sm'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <ImageBlobPreview
                imageId={img.imageId}
                wishlistItemId={wishlistItemId}
                gridFsFileId={img.gridFsFileId}
                thumbnailGridFsFileId={img.thumbnailGridFsFileId}
                alt={`${itemName} ${idx + 1}`}
                useThumbnail={true}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between text-white safe-top">
            <span className="text-sm font-semibold truncate pr-4">{itemName}</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Large Image */}
          <div
            className="flex-1 flex items-center justify-center p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageBlobPreview
              imageId={currentImage.imageId}
              wishlistItemId={wishlistItemId}
              gridFsFileId={currentImage.gridFsFileId}
              alt={itemName}
              useThumbnail={false}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom count */}
          <div className="text-center text-white/60 text-xs safe-bottom">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

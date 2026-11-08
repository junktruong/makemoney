'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/indexedDb';
import { getObjectUrlForBlob } from '@/lib/services/imageService';
import { Image as ImageIcon } from 'lucide-react';

interface ImageBlobPreviewProps {
  imageId?: string;
  wishlistItemId?: string;
  gridFsFileId?: string;
  thumbnailGridFsFileId?: string;
  alt?: string;
  className?: string;
  useThumbnail?: boolean;
}

export const ImageBlobPreview: React.FC<ImageBlobPreviewProps> = ({
  imageId,
  wishlistItemId,
  gridFsFileId,
  thumbnailGridFsFileId,
  alt = 'Hình ảnh sản phẩm',
  className = 'w-full h-full object-cover',
  useThumbnail = true,
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveImageSrc() {
      setLoading(true);
      setHasError(false);

      // 1. Priority 1: Check Dexie IndexedDB by imageId
      if (imageId) {
        try {
          const localRecord = await db.images.get(imageId);
          if (localRecord && isMounted) {
            const blobToUse =
              useThumbnail && localRecord.thumbnailBlob
                ? localRecord.thumbnailBlob
                : localRecord.blob || localRecord.thumbnailBlob;

            if (blobToUse) {
              const safeBlob =
                blobToUse instanceof Blob
                  ? blobToUse
                  : new Blob([blobToUse], { type: localRecord.mimeType || 'image/jpeg' });

              const url = getObjectUrlForBlob(
                useThumbnail ? `${localRecord.id}_thumb` : localRecord.id,
                safeBlob
              );

              if (url) {
                setSrc(url);
                setLoading(false);
                return;
              }
            }
          }
        } catch (dexieErr) {
          console.warn('Dexie read by imageId failed:', dexieErr);
        }
      }

      // 2. Priority 2: Check Dexie IndexedDB by wishlistItemId fallback
      if (wishlistItemId) {
        try {
          const localRecord = await db.images.where({ wishlistItemId }).first();
          if (localRecord && isMounted) {
            const blobToUse =
              useThumbnail && localRecord.thumbnailBlob
                ? localRecord.thumbnailBlob
                : localRecord.blob || localRecord.thumbnailBlob;

            if (blobToUse) {
              const safeBlob =
                blobToUse instanceof Blob
                  ? blobToUse
                  : new Blob([blobToUse], { type: localRecord.mimeType || 'image/jpeg' });

              const url = getObjectUrlForBlob(
                useThumbnail ? `${localRecord.id}_thumb` : localRecord.id,
                safeBlob
              );

              if (url) {
                setSrc(url);
                setLoading(false);
                return;
              }
            }
          }
        } catch (dexieErr) {
          console.warn('Dexie read by wishlistItemId failed:', dexieErr);
        }
      }

      // 3. Priority 3: Server GridFS URL
      const fileId = useThumbnail
        ? thumbnailGridFsFileId || gridFsFileId || imageId
        : gridFsFileId || imageId;

      if (fileId && isMounted) {
        const endpoint =
          useThumbnail && thumbnailGridFsFileId
            ? `/api/images/${fileId}/thumbnail`
            : `/api/images/${fileId}`;
        setSrc(endpoint);
        setLoading(false);
        return;
      }

      if (isMounted) {
        setLoading(false);
        setHasError(true);
      }
    }

    resolveImageSrc();

    return () => {
      isMounted = false;
    };
  }, [imageId, wishlistItemId, gridFsFileId, thumbnailGridFsFileId, useThumbnail]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse ${className}`}>
        <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ${className}`}>
        <ImageIcon className="w-6 h-6 stroke-1 mb-1" />
        <span className="text-[10px]">Chưa có ảnh</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        // Fallback to error placeholder
        setHasError(true);
      }}
      loading="lazy"
    />
  );
};

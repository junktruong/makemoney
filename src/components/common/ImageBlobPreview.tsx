'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/indexedDb';
import { getObjectUrlForBlob } from '@/lib/services/imageService';
import { Image as ImageIcon } from 'lucide-react';

interface ImageBlobPreviewProps {
  imageId?: string;
  gridFsFileId?: string;
  thumbnailGridFsFileId?: string;
  alt?: string;
  className?: string;
  useThumbnail?: boolean;
  priority?: boolean;
}

export const ImageBlobPreview: React.FC<ImageBlobPreviewProps> = ({
  imageId,
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
      if (!imageId && !gridFsFileId && !thumbnailGridFsFileId) {
        setLoading(false);
        setHasError(true);
        return;
      }

      setLoading(true);
      setHasError(false);

      // 1. First priority: Check Dexie IndexedDB for instant offline access
      if (imageId) {
        try {
          const localRecord = await db.images.get(imageId);
          if (localRecord && isMounted) {
            const blobToUse = useThumbnail && localRecord.thumbnailBlob
              ? localRecord.thumbnailBlob
              : localRecord.blob;

            if (blobToUse) {
              const url = getObjectUrlForBlob(
                useThumbnail ? `${imageId}_thumb` : imageId,
                blobToUse
              );
              setSrc(url);
              setLoading(false);
              return;
            }
          }
        } catch (dexieErr) {
          console.warn('Dexie read failed:', dexieErr);
        }
      }

      // 2. Second priority: Server GridFS URL
      const fileId = useThumbnail
        ? thumbnailGridFsFileId || gridFsFileId || imageId
        : gridFsFileId || imageId;

      if (fileId && isMounted) {
        const endpoint = useThumbnail && thumbnailGridFsFileId
          ? `/api/images/${fileId}/thumbnail`
          : `/api/images/${fileId}`;
        setSrc(endpoint);
        setLoading(false);
      }
    }

    resolveImageSrc();

    return () => {
      isMounted = false;
    };
  }, [imageId, gridFsFileId, thumbnailGridFsFileId, useThumbnail]);

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

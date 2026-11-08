export interface ProcessedImageResult {
  originalBlob: Blob;
  thumbnailBlob: Blob;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
}

/**
 * Object URL cache map to prevent memory leaks and redundant calls
 */
const objectUrlCache = new Map<string, string>();

export function getObjectUrlForBlob(id: string, blob: Blob): string {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

export function revokeObjectUrl(id: string): void {
  const url = objectUrlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(id);
  }
}

export function clearObjectUrlCache(): void {
  objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
  objectUrlCache.clear();
}

/**
 * Validates file type and size
 */
export function validateImageFile(file: File, maxSizeBytes = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpe?g|png|webp|gif|heic|heif)$/i)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF, HEIC)' };
  }
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Kích thước ảnh tối đa là ${Math.round(maxSizeBytes / (1024 * 1024))}MB` };
  }
  return { valid: true };
}

/**
 * Compresses an image and creates both an optimized main Blob and a 240x240 thumbnail Blob
 */
export async function processImageFile(
  file: File | Blob,
  maxDimension = 1600,
  thumbnailSize = 240,
  quality = 0.85
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const tempUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(tempUrl);

      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        // 1. Calculate main image dimensions
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (origWidth > maxDimension || origHeight > maxDimension) {
          if (origWidth > origHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.round((origHeight * maxDimension) / origWidth);
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.round((origWidth * maxDimension) / origHeight);
          }
        }

        // Draw main image
        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = targetWidth;
        mainCanvas.height = targetHeight;
        const mainCtx = mainCanvas.getContext('2d');
        if (!mainCtx) throw new Error('Cannot get canvas 2d context');

        mainCtx.imageSmoothingEnabled = true;
        mainCtx.imageSmoothingQuality = 'high';
        mainCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 2. Generate thumbnail canvas (Square crop center)
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbnailSize;
        thumbCanvas.height = thumbnailSize;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (!thumbCtx) throw new Error('Cannot get thumbnail canvas context');

        thumbCtx.imageSmoothingEnabled = true;
        thumbCtx.imageSmoothingQuality = 'high';

        const minDim = Math.min(origWidth, origHeight);
        const sx = (origWidth - minDim) / 2;
        const sy = (origHeight - minDim) / 2;

        thumbCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, thumbnailSize, thumbnailSize);

        // Output blobs
        const mimeType = 'image/webp'; // standard efficient format

        const mainBlobPromise = new Promise<Blob>((res, rej) => {
          mainCanvas.toBlob((b) => (b ? res(b) : rej(new Error('Failed to create main blob'))), mimeType, quality);
        });

        const thumbBlobPromise = new Promise<Blob>((res, rej) => {
          thumbCanvas.toBlob((b) => (b ? res(b) : rej(new Error('Failed to create thumbnail blob'))), mimeType, 0.8);
        });

        const [originalBlob, thumbnailBlob] = await Promise.all([mainBlobPromise, thumbBlobPromise]);

        resolve({
          originalBlob,
          thumbnailBlob,
          mimeType,
          fileSize: originalBlob.size,
          width: targetWidth,
          height: targetHeight,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new Error('Không thể tải file hình ảnh'));
    };

    img.src = tempUrl;
  });
}

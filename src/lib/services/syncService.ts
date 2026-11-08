import { db } from '../db/indexedDb';
import { WishlistItem, DailyRecord, SavingsTransaction, LocalImageRecord } from '../types';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

let isSyncing = 0;
let syncListeners: ((state: SyncState, message?: string) => void)[] = [];

export function subscribeSyncState(fn: (state: SyncState, message?: string) => void) {
  syncListeners.push(fn);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== fn);
  };
}

function notifySyncState(state: SyncState, message?: string) {
  for (const listener of syncListeners) {
    try {
      listener(state, message);
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  }
}

/**
 * Main synchronization engine
 */
export async function syncWithServer(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Server environment' };

  if (!navigator.onLine) {
    notifySyncState('offline', 'Thiết bị đang ngoại tuyến');
    return { success: false, error: 'Offline' };
  }

  if (isSyncing > 0) {
    return { success: true };
  }

  isSyncing++;
  notifySyncState('syncing', 'Đang đồng bộ dữ liệu...');

  try {
    // 1. Gather pending local items
    const [allWishlist, allRecords, allTransactions, allImages] = await Promise.all([
      db.wishlist.toArray(),
      db.dailyRecords.toArray(),
      db.transactions.toArray(),
      db.images.toArray(),
    ]);

    const pendingWishlist = allWishlist.filter((w) => w.syncStatus && w.syncStatus !== 'synced');
    const pendingRecords = allRecords.filter((r) => r.syncStatus && r.syncStatus !== 'synced');
    const pendingTransactions = allTransactions.filter((t) => t.syncStatus && t.syncStatus !== 'synced');
    const pendingImages = allImages.filter((img) => img.syncStatus === 'pending_upload');

    // 2. Push data to server
    if (pendingWishlist.length > 0 || pendingRecords.length > 0 || pendingTransactions.length > 0) {
      const payload = {
        wishlist: pendingWishlist.filter((w) => w.syncStatus !== 'pending_delete'),
        dailyRecords: pendingRecords.filter((r) => r.syncStatus !== 'pending_delete'),
        transactions: pendingTransactions.filter((t) => t.syncStatus !== 'pending_delete'),
        deletedWishlistIds: pendingWishlist.filter((w) => w.syncStatus === 'pending_delete').map((w) => w.id),
        deletedRecordIds: pendingRecords.filter((r) => r.syncStatus === 'pending_delete').map((r) => r.id),
        deletedTransactionIds: pendingTransactions.filter((t) => t.syncStatus === 'pending_delete').map((t) => t.id),
      };

      const pushRes = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (pushRes.ok) {
        // Mark local records as synced
        await db.transaction('rw', [db.wishlist, db.dailyRecords, db.transactions], async () => {
          // Wishlist
          for (const item of pendingWishlist) {
            if (item.syncStatus === 'pending_delete') {
              await db.wishlist.delete(item.id);
            } else {
              await db.wishlist.update(item.id, { syncStatus: 'synced' });
            }
          }
          // Daily records
          for (const r of pendingRecords) {
            if (r.syncStatus === 'pending_delete') {
              await db.dailyRecords.delete(r.id);
            } else {
              await db.dailyRecords.update(r.id, { syncStatus: 'synced' });
            }
          }
          // Transactions
          for (const tx of pendingTransactions) {
            if (tx.syncStatus === 'pending_delete') {
              await db.transactions.delete(tx.id);
            } else {
              await db.transactions.update(tx.id, { syncStatus: 'synced' });
            }
          }
        });
      }
    }

    // 3. Sync pending images to GridFS
    for (const img of pendingImages) {
      try {
        const formData = new FormData();
        formData.append('file', img.blob, img.originalFilename || 'image.jpg');
        if (img.thumbnailBlob) {
          formData.append('thumbnail', img.thumbnailBlob, `thumb_${img.originalFilename || 'image.jpg'}`);
        }
        formData.append('imageId', img.id);
        formData.append('wishlistItemId', img.wishlistItemId);
        formData.append('isPrimary', img.isPrimary ? 'true' : 'false');

        const uploadRes = await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          if (data.success && data.gridFsFileId) {
            await db.images.update(img.id, {
              syncStatus: 'synced',
              gridFsFileId: data.gridFsFileId,
              thumbnailGridFsFileId: data.thumbnailGridFsFileId,
            });

            // Also update the image metadata in the WishlistItem in IndexedDB
            const wishItem = await db.wishlist.get(img.wishlistItemId);
            if (wishItem) {
              const updatedImages = (wishItem.images || []).map((m) =>
                m.imageId === img.id
                  ? {
                      ...m,
                      gridFsFileId: data.gridFsFileId,
                      thumbnailGridFsFileId: data.thumbnailGridFsFileId,
                      syncStatus: 'synced' as const,
                    }
                  : m
              );
              await db.wishlist.update(img.wishlistItemId, { images: updatedImages });
            }
          }
        }
      } catch (imgErr) {
        console.warn(`Error uploading image ${img.id}:`, imgErr);
      }
    }

    // 4. Pull server changes
    const lastSyncedMeta = await db.meta.get('lastSyncedAt');
    const sinceParam = lastSyncedMeta ? `?since=${encodeURIComponent(lastSyncedMeta.value)}` : '';

    const pullRes = await fetch(`/api/sync/pull${sinceParam}`);
    if (pullRes.ok) {
      const pullData = await pullRes.json();
      if (pullData.success && !pullData.offlineMode) {
        await db.transaction('rw', [db.wishlist, db.dailyRecords, db.transactions], async () => {
          // Merge items from server (only if not locally pending)
          for (const sItem of pullData.wishlist || []) {
            const local = await db.wishlist.get(sItem.id);
            if (!local || local.syncStatus === 'synced') {
              await db.wishlist.put({ ...sItem, syncStatus: 'synced' });
            }
          }
          // Merge records
          for (const sRec of pullData.dailyRecords || []) {
            const local = await db.dailyRecords.get(sRec.id);
            if (!local || local.syncStatus === 'synced') {
              await db.dailyRecords.put({ ...sRec, syncStatus: 'synced' });
            }
          }
          // Merge transactions
          for (const sTx of pullData.transactions || []) {
            const local = await db.transactions.get(sTx.id);
            if (!local || local.syncStatus === 'synced') {
              await db.transactions.put({ ...sTx, syncStatus: 'synced' });
            }
          }
        });
      }
    }

    // 5. Update last synced timestamp
    const nowIso = new Date().toISOString();
    await db.meta.put({ key: 'lastSyncedAt', value: nowIso });

    notifySyncState('synced', 'Đã đồng bộ');
    return { success: true };
  } catch (err: any) {
    console.error('Sync failed:', err);
    notifySyncState('error', 'Đồng bộ thất bại, sẽ thử lại');
    return { success: false, error: err.message };
  } finally {
    isSyncing--;
  }
}


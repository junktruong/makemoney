import Dexie, { type Table } from 'dexie';
import { WishlistItem, DailyRecord, SavingsTransaction, LocalImageRecord } from '../types';

export interface SyncQueueItem {
  id: string;
  entityType: 'wishlist' | 'record' | 'transaction' | 'image';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload?: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface MetaItem {
  key: string;
  value: any;
}

export class MakeMoneyDatabase extends Dexie {
  wishlist!: Table<WishlistItem, string>;
  dailyRecords!: Table<DailyRecord, string>;
  transactions!: Table<SavingsTransaction, string>;
  images!: Table<LocalImageRecord, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  meta!: Table<MetaItem, string>;

  constructor() {
    super('MakeMoneyDB');
    this.version(1).stores({
      wishlist: 'id, status, priority, syncStatus, updatedAt',
      dailyRecords: 'id, date, syncStatus, updatedAt',
      transactions: 'id, type, goalId, idempotencyKey, syncStatus, createdAt',
      images: 'id, wishlistItemId, syncStatus, uploadedAt',
      syncQueue: 'id, entityType, entityId, createdAt',
      meta: 'key',
    });
  }
}

// Singleton database instance
export const db = new MakeMoneyDatabase();

/**
 * Storage calculations from IndexedDB
 */
export async function getLocalStorageStats(): Promise<{
  localImagesCount: number;
  localImagesSizeBytes: number;
  pendingUploadsCount: number;
  syncedImagesCount: number;
}> {
  try {
    const images = await db.images.toArray();
    let totalBytes = 0;
    let pendingUploads = 0;
    let synced = 0;

    for (const img of images) {
      totalBytes += img.blob?.size || 0;
      totalBytes += img.thumbnailBlob?.size || 0;
      if (img.syncStatus === 'pending_upload') {
        pendingUploads++;
      } else if (img.syncStatus === 'synced') {
        synced++;
      }
    }

    return {
      localImagesCount: images.length,
      localImagesSizeBytes: totalBytes,
      pendingUploadsCount: pendingUploads,
      syncedImagesCount: synced,
    };
  } catch (error) {
    console.error('Error getting local storage stats:', error);
    return {
      localImagesCount: 0,
      localImagesSizeBytes: 0,
      pendingUploadsCount: 0,
      syncedImagesCount: 0,
    };
  }
}


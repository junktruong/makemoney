// Common financial and model types

export type Priority = 'low' | 'medium' | 'high';
export type ItemStatus = 'active' | 'completed' | 'archived';

export interface ImageMetadata {
  imageId: string;
  gridFsFileId?: string;
  thumbnailGridFsFileId?: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPrimary: boolean;
  uploadedAt: string;
  syncStatus: 'synced' | 'pending';
}

export interface WishlistItem {
  id: string; // Used locally and mapped to _id
  userId?: string;
  name: string;
  description?: string;
  targetPrice: number; // Integer VND
  priority: Priority;
  targetDate?: string; // ISO date string YYYY-MM-DD
  targetDays?: number; // Presets: 7, 15, 30, 60, 90, or custom
  status: ItemStatus;
  notes?: string;
  category?: string;
  images: ImageMetadata[];
  allocatedSavings: number; // Sum of allocated transactions
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export interface DailyRecord {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  incomeAmount: number; // Integer VND
  savingsContribution: number; // Integer VND
  source?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export type TransactionType = 'CONTRIBUTION' | 'ALLOCATION' | 'REALLOCATION' | 'WITHDRAWAL';

export interface SavingsTransaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number; // Integer VND
  goalId?: string; // WishlistItem id if allocated
  sourceGoalId?: string; // If reallocated from one goal to another
  dailyRecordId?: string;
  description: string;
  idempotencyKey: string;
  createdAt: string;
  syncStatus?: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export interface LocalImageRecord {
  id: string; // unique imageId
  wishlistItemId: string;
  blob: Blob;
  thumbnailBlob: Blob;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPrimary: boolean;
  gridFsFileId?: string;
  thumbnailGridFsFileId?: string;
  uploadedAt: string;
  syncStatus: 'synced' | 'pending_upload' | 'pending_delete';
}

export interface SavingsSummary {
  totalSavings: number;
  totalIncome: number;
  totalContributions: number;
  allocatedSavings: number;
  unallocatedSavings: number;
  overallProgress: number; // 0 to 100
  totalTargetPrice: number;
}

export interface FinancialProjection {
  remainingAmount: number;
  remainingDays: number;
  requiredDailySavings: number;
  requiredWeeklySavings: number;
  progressPercent: number;
  avgDailySavings7d: number;
  avgDailySavings30d: number;
  projectedCompletionDate7d?: string;
  projectedCompletionDate30d?: string;
  status: 'ahead' | 'on_track' | 'behind' | 'completed';
  statusMessage: string;
}

export interface SyncPayload {
  wishlist: WishlistItem[];
  dailyRecords: DailyRecord[];
  transactions: SavingsTransaction[];
  deletedWishlistIds?: string[];
  deletedRecordIds?: string[];
  deletedTransactionIds?: string[];
  lastSyncedAt?: string;
}

export interface StorageStats {
  localImagesCount: number;
  localImagesSizeBytes: number;
  pendingUploadsCount: number;
  syncedImagesCount: number;
  lastSyncedAt: string | null;
}


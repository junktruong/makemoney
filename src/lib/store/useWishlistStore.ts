import { create } from 'zustand';
import { WishlistItem, ItemStatus, Priority, LocalImageRecord } from '../types';
import { db } from '../db/indexedDb';
import { syncWithServer } from '../services/syncService';
import { computeAllocatedPerItem } from '../services/financialService';

interface WishlistFilter {
  status: ItemStatus | 'all';
  category: string;
  search: string;
  sortBy: 'priority' | 'targetPrice' | 'progress' | 'targetDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  filter: WishlistFilter;
  selectedItem: WishlistItem | null;

  setFilter: (filter: Partial<WishlistFilter>) => void;
  setSelectedItem: (item: WishlistItem | null) => void;

  loadWishlist: () => Promise<void>;
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt' | 'allocatedSavings'>) => Promise<WishlistItem>;
  updateItem: (id: string, updates: Partial<WishlistItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markStatus: (id: string, status: ItemStatus) => Promise<void>;

  // Image actions
  saveImageLocally: (
    wishlistItemId: string,
    originalBlob: Blob,
    thumbnailBlob: Blob,
    filename: string,
    mimeType: string,
    isPrimary?: boolean
  ) => Promise<string>;
  removeImageLocally: (wishlistItemId: string, imageId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: true,
  selectedItem: null,
  filter: {
    status: 'all',
    category: 'all',
    search: '',
    sortBy: 'priority',
    sortOrder: 'desc',
  },

  setFilter: (newFilter) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }));
  },

  setSelectedItem: (item) => set({ selectedItem: item }),

  loadWishlist: async () => {
    set({ isLoading: true });
    try {
      // 1. Load from Dexie IndexedDB first for instant UI response
      let localItems = await db.wishlist.toArray();

      // Recalculate allocated savings from local transactions
      const transactions = await db.transactions.toArray();
      localItems = localItems.map((item) => ({
        ...item,
        allocatedSavings: computeAllocatedPerItem(item.id, transactions),
      }));

      set({ items: localItems, isLoading: false });

      // If selectedItem is open, keep it updated
      const currentSelected = get().selectedItem;
      if (currentSelected) {
        const refreshed = localItems.find((i) => i.id === currentSelected.id);
        if (refreshed) set({ selectedItem: refreshed });
      }

      // 2. Trigger sync if online
      if (typeof window !== 'undefined' && navigator.onLine) {
        syncWithServer().then(async () => {
          const fresh = await db.wishlist.toArray();
          const txs = await db.transactions.toArray();
          const updatedFresh = fresh.map((item) => ({
            ...item,
            allocatedSavings: computeAllocatedPerItem(item.id, txs),
          }));
          set({ items: updatedFresh });
        });
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
      set({ isLoading: false });
    }
  },

  addItem: async (itemData) => {
    const id = `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newItem: WishlistItem = {
      ...itemData,
      id,
      allocatedSavings: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncStatus: 'pending_create',
    };

    // Save to Dexie
    await db.wishlist.put(newItem);

    set((state) => ({ items: [newItem, ...state.items] }));

    // Trigger sync
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }

    return newItem;
  },

  updateItem: async (id, updates) => {
    const existing = await db.wishlist.get(id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updated: WishlistItem = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
      syncStatus: existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update',
    };

    await db.wishlist.put(updated);

    set((state) => {
      const newItems = state.items.map((i) => (i.id === id ? updated : i));
      const newSelected = state.selectedItem?.id === id ? updated : state.selectedItem;
      return { items: newItems, selectedItem: newSelected };
    });

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }
  },

  deleteItem: async (id) => {
    const existing = await db.wishlist.get(id);
    if (!existing) return;

    // Mark as pending_delete or delete immediately if never synced
    if (existing.syncStatus === 'pending_create') {
      await db.wishlist.delete(id);
      await db.images.where({ wishlistItemId: id }).delete();
    } else {
      await db.wishlist.update(id, { syncStatus: 'pending_delete' });
    }

    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
    }));

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }
  },

  markStatus: async (id, status) => {
    await get().updateItem(id, { status });
  },

  saveImageLocally: async (wishlistItemId, originalBlob, thumbnailBlob, filename, mimeType, isPrimary = false) => {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const localImageRecord: LocalImageRecord = {
      id: imageId,
      wishlistItemId,
      blob: originalBlob,
      thumbnailBlob,
      originalFilename: filename,
      mimeType,
      fileSize: originalBlob.size,
      sortOrder: 0,
      isPrimary,
      uploadedAt: nowIso,
      syncStatus: 'pending_upload',
    };

    // 1. Put into Dexie images table
    await db.images.put(localImageRecord);

    // 2. Add metadata to WishlistItem
    const item = await db.wishlist.get(wishlistItemId);
    if (item) {
      const currentImages = item.images || [];
      const newMeta = {
        imageId,
        originalFilename: filename,
        mimeType,
        fileSize: originalBlob.size,
        sortOrder: currentImages.length,
        isPrimary: isPrimary || currentImages.length === 0,
        uploadedAt: nowIso,
        syncStatus: 'pending' as const,
      };

      const updatedImages = [...currentImages, newMeta];
      await get().updateItem(wishlistItemId, { images: updatedImages });
    }

    // 3. Trigger background sync
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }

    return imageId;
  },

  removeImageLocally: async (wishlistItemId, imageId) => {
    // Delete from Dexie images table
    await db.images.delete(imageId);

    // Remove from WishlistItem
    const item = await db.wishlist.get(wishlistItemId);
    if (item) {
      const updatedImages = (item.images || []).filter((m) => m.imageId !== imageId);
      await get().updateItem(wishlistItemId, { images: updatedImages });
    }

    if (typeof window !== 'undefined' && navigator.onLine) {
      fetch(`/api/images/${imageId}`, { method: 'DELETE' }).catch(console.warn);
    }
  },
}));

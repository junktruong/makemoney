import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db/indexedDb';
import { useWishlistStore } from '../store/useWishlistStore';
import { getObjectUrlForBlob, clearObjectUrlCache } from './imageService';

describe('Offline Image Persistence across browser restarts', () => {
  beforeEach(async () => {
    // Clear IndexedDB tables
    await db.wishlist.clear();
    await db.images.clear();
    await db.transactions.clear();
    clearObjectUrlCache();

    // Reset Zustand store state (simulating fresh browser launch)
    useWishlistStore.setState({
      items: [],
      selectedItem: null,
      isLoading: true,
    });

    // Mock window / navigator as offline
    (global as any).window = {
      matchMedia: () => ({ matches: false }),
    };
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });
    (global as any).URL = {
      createObjectURL: (blob: any) => `blob:mock-url-${Math.random()}`,
      revokeObjectURL: () => {},
    };
  });

  it('preserves uploaded image Blobs and metadata after complete browser close and reopen', async () => {
    const store = useWishlistStore.getState();

    // 1. User starts creating a new item while OFFLINE
    const activeItemId = 'wish_test_offline_123';

    // Create mock original and thumbnail blobs
    const originalBlob = new Blob(['sample-original-binary-data'], { type: 'image/jpeg' });
    const thumbnailBlob = new Blob(['sample-thumbnail-binary-data'], { type: 'image/jpeg' });

    // User selects image in ImageUploader
    const newImageMeta = await store.saveImageLocally(
      activeItemId,
      originalBlob,
      thumbnailBlob,
      'macbook.jpg',
      'image/jpeg',
      true
    );

    expect(newImageMeta).toBeDefined();
    expect(newImageMeta.imageId).toContain('img_');
    expect(newImageMeta.isPrimary).toBe(true);

    // 2. User submits the item form
    const createdItem = await store.addItem({
      id: activeItemId, // Must preserve activeItemId
      name: 'MacBook Pro M4',
      targetPrice: 35000000,
      priority: 'high',
      status: 'active',
      images: [newImageMeta],
    });

    expect(createdItem.id).toBe(activeItemId);
    expect(createdItem.images.length).toBe(1);
    expect(createdItem.images[0].imageId).toBe(newImageMeta.imageId);

    // Verify stored in IndexedDB before restart
    const dbItemBefore = await db.wishlist.get(activeItemId);
    const dbImgBefore = await db.images.get(newImageMeta.imageId);

    expect(dbItemBefore).toBeDefined();
    expect(dbImgBefore).toBeDefined();
    expect(dbImgBefore?.wishlistItemId).toBe(activeItemId);
    expect(dbImgBefore?.blob).toBeDefined();
    expect(dbImgBefore?.thumbnailBlob).toBeDefined();

    // ========================================================
    // 3. SIMULATE CLOSING THE BROWSER COMPLETELY
    // ========================================================
    clearObjectUrlCache();
    // Wipe all in-memory Zustand store states
    useWishlistStore.setState({
      items: [],
      selectedItem: null,
      isLoading: true,
    });

    expect(useWishlistStore.getState().items.length).toBe(0);

    // ========================================================
    // 4. SIMULATE REOPENING THE BROWSER
    // ========================================================
    // Browser loads page, calls loadWishlist() from IndexedDB
    await useWishlistStore.getState().loadWishlist();

    const restoredItems = useWishlistStore.getState().items;
    expect(restoredItems.length).toBe(1);

    const restoredMacBook = restoredItems[0];
    expect(restoredMacBook.id).toBe(activeItemId);
    expect(restoredMacBook.name).toBe('MacBook Pro M4');

    // 5. VERIFY IMAGES REMAIN COMPLETELY INTACT
    expect(restoredMacBook.images).toBeDefined();
    expect(restoredMacBook.images.length).toBe(1);
    expect(restoredMacBook.images[0].imageId).toBe(newImageMeta.imageId);
    expect(restoredMacBook.images[0].originalFilename).toBe('macbook.jpg');

    // 6. Verify image Blob can be read from IndexedDB and object URL created
    const restoredImgRecord = await db.images.get(newImageMeta.imageId);
    expect(restoredImgRecord).toBeDefined();
    expect(restoredImgRecord?.blob).toBeDefined();

    const objectUrl = getObjectUrlForBlob(newImageMeta.imageId, restoredImgRecord!.blob);
    expect(objectUrl).toContain('blob:mock-url-');
  });

  it('self-heals and restores images even if wishlist item was saved with empty images array', async () => {
    const activeItemId = 'wish_damaged_item_456';
    const imageId = 'img_orphaned_789';

    // Mock an orphaned image record in db.images pointing to wishlistItemId
    const originalBlob = new Blob(['mock-data'], { type: 'image/jpeg' });
    const thumbnailBlob = new Blob(['mock-thumb'], { type: 'image/jpeg' });

    await db.images.put({
      id: imageId,
      wishlistItemId: activeItemId,
      blob: originalBlob,
      thumbnailBlob,
      originalFilename: 'camera.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      sortOrder: 0,
      isPrimary: true,
      uploadedAt: new Date().toISOString(),
      syncStatus: 'pending_upload',
    });

    // Mock item in db.wishlist with empty images array
    await db.wishlist.put({
      id: activeItemId,
      name: 'Sony A7IV',
      targetPrice: 50000000,
      priority: 'high',
      status: 'active',
      images: [], // damaged / empty
      allocatedSavings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_create',
    });

    // Reopen browser: loadWishlist should self-heal and reconnect the image!
    await useWishlistStore.getState().loadWishlist();

    const restoredItems = useWishlistStore.getState().items;
    expect(restoredItems.length).toBe(1);

    const healedItem = restoredItems[0];
    expect(healedItem.images.length).toBe(1);
    expect(healedItem.images[0].imageId).toBe(imageId);
    expect(healedItem.images[0].originalFilename).toBe('camera.jpg');
  });
});

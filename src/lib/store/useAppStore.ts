import { create } from 'zustand';
import { WishlistItem } from '../types';
import { SyncState } from '../services/syncService';

export type AppTab = 'dashboard' | 'wishlist' | 'calendar' | 'settings';

interface AppState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  syncState: SyncState;
  syncMessage: string;
  setSyncState: (state: SyncState, message?: string) => void;

  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modal open states
  isIncomeModalOpen: boolean;
  setIsIncomeModalOpen: (open: boolean) => void;

  isSavingsModalOpen: boolean;
  setIsSavingsModalOpen: (open: boolean) => void;

  isWishlistModalOpen: boolean;
  setIsWishlistModalOpen: (open: boolean) => void;

  isEveningModalOpen: boolean;
  setIsEveningModalOpen: (open: boolean) => void;

  isAllocationModalOpen: boolean;
  allocationTargetItem: WishlistItem | null;
  openAllocationModal: (item?: WishlistItem) => void;
  closeAllocationModal: () => void;

  // Global toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),

  syncState: 'synced',
  syncMessage: 'Đã đồng bộ',
  setSyncState: (state, message) =>
    set({
      syncState: state,
      syncMessage: message || (state === 'synced' ? 'Đã đồng bộ' : state === 'syncing' ? 'Đang đồng bộ...' : 'Ngoại tuyến'),
    }),

  theme: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('makemoney_theme', theme);
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  isIncomeModalOpen: false,
  setIsIncomeModalOpen: (open) => set({ isIncomeModalOpen: open }),

  isSavingsModalOpen: false,
  setIsSavingsModalOpen: (open) => set({ isSavingsModalOpen: open }),

  isWishlistModalOpen: false,
  setIsWishlistModalOpen: (open) => set({ isWishlistModalOpen: open }),

  isEveningModalOpen: false,
  setIsEveningModalOpen: (open) => set({ isEveningModalOpen: open }),

  isAllocationModalOpen: false,
  allocationTargetItem: null,
  openAllocationModal: (item) => set({ isAllocationModalOpen: true, allocationTargetItem: item || null }),
  closeAllocationModal: () => set({ isAllocationModalOpen: false, allocationTargetItem: null }),

  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => (state.toast?.message === message ? { toast: null } : {}));
    }, 3500);
  },
  hideToast: () => set({ toast: null }),
}));


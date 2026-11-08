'use client';

import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { Toast } from '../common/Toast';
import { DashboardView } from '../views/DashboardView';
import { WishlistView } from '../views/WishlistView';
import { CalendarViewScreen } from '../views/CalendarViewScreen';
import { SettingsView } from '../views/SettingsView';
import { IncomeModal } from '../dashboard/IncomeModal';
import { SavingsModal } from '../dashboard/SavingsModal';
import { EveningModal } from '../dashboard/EveningModal';
import { AllocationModal } from '../wishlist/AllocationModal';
import { useAppStore } from '@/lib/store/useAppStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { subscribeSyncState, syncWithServer } from '@/lib/services/syncService';

export const AppShell: React.FC = () => {
  const { activeTab, setIsOnline, setSyncState, showToast } = useAppStore();
  const { loadWishlist } = useWishlistStore();
  const { loadSavingsData } = useSavingsStore();

  useEffect(() => {
    // 1. Initial data load from Dexie IndexedDB
    loadWishlist();
    loadSavingsData();

    // 2. Initialize theme from localStorage
    const savedTheme = localStorage.getItem('makemoney_theme');
    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Online / Offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã kết nối Internet, đang đồng bộ...', 'info');
      syncWithServer();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline', 'Ngoại tuyến');
      showToast('Đã chuyển sang chế độ ngoại tuyến', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    // 4. Subscribe to sync state changes
    const unsubscribeSync = subscribeSyncState((state, message) => {
      setSyncState(state, message);
    });

    // 5. Register Service Worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('PWA Service Worker registered'))
        .catch((err) => console.warn('SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, [loadWishlist, loadSavingsData, setIsOnline, setSyncState, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <TopBar />
      <Toast />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-2">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'wishlist' && <WishlistView />}
        {activeTab === 'calendar' && <CalendarViewScreen />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Modals */}
      <IncomeModal />
      <SavingsModal />
      <EveningModal />
      <AllocationModal />

      <BottomNav />
    </div>
  );
};


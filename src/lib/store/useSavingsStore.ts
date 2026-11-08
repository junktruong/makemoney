import { create } from 'zustand';
import { DailyRecord, SavingsTransaction, SavingsSummary } from '../types';
import { db } from '../db/indexedDb';
import {
  computeSavingsSummary,
  generateIdempotencyKey,
} from '../services/financialService';
import { syncWithServer } from '../services/syncService';
import { useWishlistStore } from './useWishlistStore';

interface SavingsState {
  dailyRecords: DailyRecord[];
  transactions: SavingsTransaction[];
  summary: SavingsSummary;
  selectedCalendarDate: string; // YYYY-MM-DD
  isLoading: boolean;

  setSelectedCalendarDate: (date: string) => void;
  loadSavingsData: () => Promise<void>;

  // Daily records
  addDailyRecord: (data: {
    date: string;
    incomeAmount: number;
    savingsContribution: number;
    source?: string;
    note?: string;
  }) => Promise<DailyRecord>;
  updateDailyRecord: (id: string, updates: Partial<DailyRecord>) => Promise<void>;
  deleteDailyRecord: (id: string) => Promise<void>;

  // Ledger transactions
  contributeSavings: (amount: number, description?: string) => Promise<void>;
  allocateSavings: (goalId: string, amount: number, description?: string) => Promise<boolean>;
  reallocateSavings: (sourceGoalId: string, goalId: string | undefined, amount: number, description?: string) => Promise<boolean>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  dailyRecords: [],
  transactions: [],
  summary: {
    totalSavings: 0,
    totalIncome: 0,
    totalContributions: 0,
    allocatedSavings: 0,
    unallocatedSavings: 0,
    overallProgress: 0,
    totalTargetPrice: 0,
  },
  selectedCalendarDate: new Date().toISOString().split('T')[0],
  isLoading: true,

  setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),

  loadSavingsData: async () => {
    set({ isLoading: true });
    try {
      const [records, transactions, items] = await Promise.all([
        db.dailyRecords.toArray(),
        db.transactions.toArray(),
        db.wishlist.toArray(),
      ]);

      const activeRecords = records.filter((r) => r.syncStatus !== 'pending_delete');
      const activeTransactions = transactions.filter((t) => t.syncStatus !== 'pending_delete');

      const summary = computeSavingsSummary(activeTransactions, activeRecords, items);

      set({
        dailyRecords: activeRecords.sort((a, b) => b.date.localeCompare(a.date)),
        transactions: activeTransactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        summary,
        isLoading: false,
      });

      // Background sync if online
      if (typeof window !== 'undefined' && navigator.onLine) {
        syncWithServer().then(async () => {
          const freshRecs = await db.dailyRecords.toArray();
          const freshTxs = await db.transactions.toArray();
          const freshItems = await db.wishlist.toArray();
          const summ = computeSavingsSummary(freshTxs, freshRecs, freshItems);
          set({
            dailyRecords: freshRecs.filter((r) => r.syncStatus !== 'pending_delete').sort((a, b) => b.date.localeCompare(a.date)),
            transactions: freshTxs.filter((t) => t.syncStatus !== 'pending_delete').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
            summary: summ,
          });
        });
      }
    } catch (err) {
      console.error('Error loading savings data:', err);
      set({ isLoading: false });
    }
  },

  addDailyRecord: async (data) => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newRecord: DailyRecord = {
      ...data,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      syncStatus: 'pending_create',
    };

    await db.dailyRecords.put(newRecord);

    // If savings contribution > 0, automatically create corresponding CONTRIBUTION transaction in ledger
    if (data.savingsContribution > 0) {
      const idempotencyKey = `rec_contrib_${id}`;
      const txId = `tx_${id}`;
      const contribTx: SavingsTransaction = {
        id: txId,
        type: 'CONTRIBUTION',
        amount: data.savingsContribution,
        dailyRecordId: id,
        description: `Tiết kiệm ngày ${data.date}${data.source ? ` (${data.source})` : ''}`,
        idempotencyKey,
        createdAt: nowIso,
        syncStatus: 'pending_create',
      };
      await db.transactions.put(contribTx);
    }

    await get().loadSavingsData();
    useWishlistStore.getState().loadWishlist();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }

    return newRecord;
  },

  updateDailyRecord: async (id, updates) => {
    const existing = await db.dailyRecords.get(id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updated: DailyRecord = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
      syncStatus: existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update',
    };

    await db.dailyRecords.put(updated);

    // Update associated transaction if savings amount changed
    if (updates.savingsContribution !== undefined) {
      const idempotencyKey = `rec_contrib_${id}`;
      if (updates.savingsContribution > 0) {
        await db.transactions.put({
          id: `tx_${id}`,
          type: 'CONTRIBUTION',
          amount: updates.savingsContribution,
          dailyRecordId: id,
          description: `Tiết kiệm ngày ${updated.date}`,
          idempotencyKey,
          createdAt: nowIso,
          syncStatus: 'pending_update',
        });
      } else {
        await db.transactions.delete(`tx_${id}`);
      }
    }

    await get().loadSavingsData();
    useWishlistStore.getState().loadWishlist();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }
  },

  deleteDailyRecord: async (id) => {
    const existing = await db.dailyRecords.get(id);
    if (!existing) return;

    if (existing.syncStatus === 'pending_create') {
      await db.dailyRecords.delete(id);
      await db.transactions.delete(`tx_${id}`);
    } else {
      await db.dailyRecords.update(id, { syncStatus: 'pending_delete' });
      await db.transactions.update(`tx_${id}`, { syncStatus: 'pending_delete' });
    }

    await get().loadSavingsData();
    useWishlistStore.getState().loadWishlist();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }
  },

  contributeSavings: async (amount, description = 'Đóng góp tiết kiệm') => {
    if (amount <= 0) return;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = generateIdempotencyKey('contrib');
    const nowIso = new Date().toISOString();

    const tx: SavingsTransaction = {
      id: txId,
      type: 'CONTRIBUTION',
      amount,
      description,
      idempotencyKey,
      createdAt: nowIso,
      syncStatus: 'pending_create',
    };

    await db.transactions.put(tx);
    await get().loadSavingsData();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }
  },

  allocateSavings: async (goalId, amount, description = 'Phân bổ cho mục tiêu') => {
    if (amount <= 0) return false;

    const currentSummary = get().summary;
    if (amount > currentSummary.unallocatedSavings) {
      return false;
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = generateIdempotencyKey('alloc');
    const nowIso = new Date().toISOString();

    const tx: SavingsTransaction = {
      id: txId,
      type: 'ALLOCATION',
      amount,
      goalId,
      description,
      idempotencyKey,
      createdAt: nowIso,
      syncStatus: 'pending_create',
    };

    await db.transactions.put(tx);

    // Refresh data
    await get().loadSavingsData();
    await useWishlistStore.getState().loadWishlist();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }

    return true;
  },

  reallocateSavings: async (sourceGoalId, goalId, amount, description = 'Điều chuyển tiết kiệm') => {
    if (amount <= 0) return false;

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = generateIdempotencyKey('realloc');
    const nowIso = new Date().toISOString();

    const tx: SavingsTransaction = {
      id: txId,
      type: 'REALLOCATION',
      amount,
      sourceGoalId,
      goalId,
      description,
      idempotencyKey,
      createdAt: nowIso,
      syncStatus: 'pending_create',
    };

    await db.transactions.put(tx);

    await get().loadSavingsData();
    await useWishlistStore.getState().loadWishlist();

    if (typeof window !== 'undefined' && navigator.onLine) {
      syncWithServer();
    }

    return true;
  },
}));


import { describe, it, expect } from 'vitest';
import {
  formatVND,
  parseVND,
  computeSavingsSummary,
  computeAllocatedPerItem,
  computeGoalProjection,
  generateIdempotencyKey,
} from './financialService';
import { WishlistItem, DailyRecord, SavingsTransaction } from '../types';

describe('financialService', () => {
  describe('formatVND & parseVND', () => {
    it('formats integer VND to Vietnamese currency format', () => {
      expect(formatVND(5000000)).toBe('5.000.000 ₫');
      expect(formatVND(300000)).toBe('300.000 ₫');
      expect(formatVND(0)).toBe('0 ₫');
    });

    it('parses formatted VND strings to integer', () => {
      expect(parseVND('5.000.000 ₫')).toBe(5000000);
      expect(parseVND('300.000')).toBe(300000);
      expect(parseVND('10,000,000')).toBe(10000000);
      expect(parseVND('')).toBe(0);
      expect(parseVND(50000)).toBe(50000);
    });
  });

  describe('computeSavingsSummary & Ledger rules', () => {
    it('calculates total savings, income, allocations, and unallocated balance correctly', () => {
      const records: DailyRecord[] = [
        {
          id: 'r1',
          date: '2026-11-01',
          incomeAmount: 1000000,
          savingsContribution: 500000,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'r2',
          date: '2026-11-02',
          incomeAmount: 500000,
          savingsContribution: 300000,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const transactions: SavingsTransaction[] = [
        {
          id: 't1',
          type: 'CONTRIBUTION',
          amount: 500000,
          dailyRecordId: 'r1',
          description: '',
          idempotencyKey: 'k1',
          createdAt: '',
        },
        {
          id: 't2',
          type: 'CONTRIBUTION',
          amount: 300000,
          dailyRecordId: 'r2',
          description: '',
          idempotencyKey: 'k2',
          createdAt: '',
        },
        // Allocate 400,000 to goal 1
        {
          id: 't3',
          type: 'ALLOCATION',
          amount: 400000,
          goalId: 'g1',
          description: '',
          idempotencyKey: 'k3',
          createdAt: '',
        },
      ];

      const items: WishlistItem[] = [
        {
          id: 'g1',
          name: 'AirPods Pro',
          targetPrice: 5000000,
          priority: 'medium',
          status: 'active',
          images: [],
          allocatedSavings: 400000,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const summary = computeSavingsSummary(transactions, records, items);

      // Total Income: 1.000.000 + 500.000 = 1.500.000
      expect(summary.totalIncome).toBe(1500000);
      // Total Contributions: 500.000 + 300.000 = 800.000
      expect(summary.totalContributions).toBe(800000);
      expect(summary.totalSavings).toBe(800000);
      // Allocated: 400.000
      expect(summary.allocatedSavings).toBe(400000);
      // Unallocated: 800.000 - 400.000 = 400.000
      expect(summary.unallocatedSavings).toBe(400000);
      // Overall progress: 400.000 / 5.000.000 = 8%
      expect(summary.overallProgress).toBe(8);
    });

    it('handles reallocation between goals correctly', () => {
      const transactions: SavingsTransaction[] = [
        {
          id: 't1',
          type: 'CONTRIBUTION',
          amount: 1000000,
          description: '',
          idempotencyKey: 'k1',
          createdAt: '',
        },
        {
          id: 't2',
          type: 'ALLOCATION',
          amount: 600000,
          goalId: 'g1',
          description: '',
          idempotencyKey: 'k2',
          createdAt: '',
        },
        // Reallocate 200,000 from g1 to g2
        {
          id: 't3',
          type: 'REALLOCATION',
          amount: 200000,
          sourceGoalId: 'g1',
          goalId: 'g2',
          description: '',
          idempotencyKey: 'k3',
          createdAt: '',
        },
      ];

      const allocG1 = computeAllocatedPerItem('g1', transactions);
      const allocG2 = computeAllocatedPerItem('g2', transactions);

      expect(allocG1).toBe(400000); // 600.000 - 200.000
      expect(allocG2).toBe(200000);
    });
  });

  describe('computeGoalProjection', () => {
    it('calculates remaining amount, daily requirement, and projections accurately', () => {
      const item: WishlistItem = {
        id: 'macbook',
        name: 'MacBook Pro',
        targetPrice: 35000000,
        priority: 'high',
        targetDays: 60,
        status: 'active',
        images: [],
        allocatedSavings: 10000000,
        createdAt: '',
        updatedAt: '',
      };

      const records: DailyRecord[] = [
        { id: '1', date: '2026-11-01', incomeAmount: 0, savingsContribution: 500000, createdAt: '', updatedAt: '' },
        { id: '2', date: '2026-11-02', incomeAmount: 0, savingsContribution: 500000, createdAt: '', updatedAt: '' },
      ];

      const projection = computeGoalProjection(item, 10000000, records, new Date('2026-11-08'));

      // Remaining: 35.000.000 - 10.000.000 = 25.000.000
      expect(projection.remainingAmount).toBe(25000000);
      // Progress %: (10.000.000 / 35.000.000) * 100 = 29%
      expect(projection.progressPercent).toBe(29);
      // Remaining days: 60
      expect(projection.remainingDays).toBe(60);
      // Required daily savings: ceil(25.000.000 / 60) = 416667
      expect(projection.requiredDailySavings).toBe(416667);
      // Required weekly savings: 416667 * 7 = 2916669
      expect(projection.requiredWeeklySavings).toBe(2916669);
    });

    it('returns completed status when allocated >= targetPrice', () => {
      const item: WishlistItem = {
        id: 'book',
        name: 'Sách hay',
        targetPrice: 200000,
        priority: 'low',
        status: 'active',
        images: [],
        allocatedSavings: 200000,
        createdAt: '',
        updatedAt: '',
      };

      const projection = computeGoalProjection(item, 200000, []);
      expect(projection.status).toBe('completed');
      expect(projection.remainingAmount).toBe(0);
      expect(projection.progressPercent).toBe(100);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('generates unique keys with prefix', () => {
      const k1 = generateIdempotencyKey('contrib');
      const k2 = generateIdempotencyKey('contrib');
      expect(k1.startsWith('contrib_')).toBe(true);
      expect(k1).not.toBe(k2);
    });
  });
});


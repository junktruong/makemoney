import { WishlistItem, DailyRecord, SavingsTransaction, SavingsSummary, FinancialProjection } from '../types';

/**
 * Format integer VND to Vietnamese standard: "5.000.000 ₫"
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₫';
  }
  const clean = Math.round(amount);
  return `${clean.toLocaleString('vi-VN')} ₫`;
}

/**
 * Parse VND string to integer
 */
export function parseVND(val: string | number): number {
  if (typeof val === 'number') return Math.max(0, Math.round(val));
  const digits = val.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Calculates current ledger summary from transactions and items
 * Ledger rules:
 * - CONTRIBUTION: increases general savings (totalSavings) and unallocatedSavings
 * - ALLOCATION: moves money from unallocatedSavings to a goal (does not change totalSavings)
 * - REALLOCATION: moves money from goal to another goal or back to unallocated
 * - WITHDRAWAL: decreases totalSavings and unallocated
 */
export function computeSavingsSummary(
  transactions: SavingsTransaction[],
  records: DailyRecord[],
  items: WishlistItem[]
): SavingsSummary {
  let totalIncome = 0;
  for (const r of records) {
    totalIncome += r.incomeAmount || 0;
  }

  let totalContributions = 0;
  let totalAllocated = 0;
  let totalWithdrawn = 0;

  // Track per-goal allocation from transactions
  const goalAllocations: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.syncStatus === 'pending_delete') continue;

    if (tx.type === 'CONTRIBUTION') {
      totalContributions += tx.amount;
    } else if (tx.type === 'ALLOCATION') {
      if (tx.goalId) {
        goalAllocations[tx.goalId] = (goalAllocations[tx.goalId] || 0) + tx.amount;
        totalAllocated += tx.amount;
      }
    } else if (tx.type === 'REALLOCATION') {
      if (tx.sourceGoalId) {
        goalAllocations[tx.sourceGoalId] = Math.max(0, (goalAllocations[tx.sourceGoalId] || 0) - tx.amount);
      }
      if (tx.goalId) {
        goalAllocations[tx.goalId] = (goalAllocations[tx.goalId] || 0) + tx.amount;
      } else {
        // Returned to unallocated
        totalAllocated = Math.max(0, totalAllocated - tx.amount);
      }
    } else if (tx.type === 'WITHDRAWAL') {
      totalWithdrawn += tx.amount;
    }
  }

  const totalSavings = Math.max(0, totalContributions - totalWithdrawn);
  const unallocatedSavings = Math.max(0, totalSavings - totalAllocated);

  let totalTargetPrice = 0;
  for (const it of items) {
    if (it.status !== 'archived') {
      totalTargetPrice += it.targetPrice;
    }
  }

  const overallProgress = totalTargetPrice > 0 
    ? Math.min(100, Math.round((totalAllocated / totalTargetPrice) * 100))
    : 0;

  return {
    totalSavings,
    totalIncome,
    totalContributions,
    allocatedSavings: totalAllocated,
    unallocatedSavings,
    overallProgress,
    totalTargetPrice,
  };
}

/**
 * Calculates allocation per item from transactions
 */
export function computeAllocatedPerItem(
  itemId: string,
  transactions: SavingsTransaction[]
): number {
  let allocated = 0;
  for (const tx of transactions) {
    if (tx.syncStatus === 'pending_delete') continue;
    if (tx.type === 'ALLOCATION' && tx.goalId === itemId) {
      allocated += tx.amount;
    } else if (tx.type === 'REALLOCATION') {
      if (tx.goalId === itemId) {
        allocated += tx.amount;
      }
      if (tx.sourceGoalId === itemId) {
        allocated -= tx.amount;
      }
    }
  }
  return Math.max(0, allocated);
}

/**
 * Calculate financial projection and required daily/weekly savings for a wishlist goal
 */
export function computeGoalProjection(
  item: WishlistItem,
  allocatedSavings: number,
  records: DailyRecord[],
  referenceDate: Date = new Date()
): FinancialProjection {
  const targetPrice = item.targetPrice;
  const remainingAmount = Math.max(0, targetPrice - allocatedSavings);
  const progressPercent = targetPrice > 0 
    ? Math.min(100, Math.round((allocatedSavings / targetPrice) * 100))
    : 0;

  if (remainingAmount === 0 || progressPercent >= 100) {
    return {
      remainingAmount: 0,
      remainingDays: 0,
      requiredDailySavings: 0,
      requiredWeeklySavings: 0,
      progressPercent: 100,
      avgDailySavings7d: 0,
      avgDailySavings30d: 0,
      status: 'completed',
      statusMessage: 'Đã tích lũy đủ mục tiêu!',
    };
  }

  // Calculate remaining days
  let remainingDays = 30; // default fallback
  if (item.targetDate) {
    const target = new Date(item.targetDate);
    const now = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const diffTime = target.getTime() - now.getTime();
    remainingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  } else if (item.targetDays) {
    remainingDays = Math.max(1, item.targetDays);
  }

  const requiredDailySavings = Math.ceil(remainingAmount / remainingDays);
  const requiredWeeklySavings = requiredDailySavings * 7;

  // Calculate 7-day and 30-day savings average
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const recent7 = sortedRecords.slice(0, 7);
  const recent30 = sortedRecords.slice(0, 30);

  const sum7 = recent7.reduce((sum, r) => sum + (r.savingsContribution || 0), 0);
  const avgDailySavings7d = recent7.length > 0 ? Math.round(sum7 / Math.max(recent7.length, 1)) : 0;

  const sum30 = recent30.reduce((sum, r) => sum + (r.savingsContribution || 0), 0);
  const avgDailySavings30d = recent30.length > 0 ? Math.round(sum30 / Math.max(recent30.length, 1)) : 0;

  // Projections
  let projectedCompletionDate7d: string | undefined;
  if (avgDailySavings7d > 0) {
    const daysNeeded7d = Math.ceil(remainingAmount / avgDailySavings7d);
    const projDate = new Date(referenceDate);
    projDate.setDate(projDate.getDate() + daysNeeded7d);
    projectedCompletionDate7d = projDate.toISOString().split('T')[0];
  }

  let projectedCompletionDate30d: string | undefined;
  if (avgDailySavings30d > 0) {
    const daysNeeded30d = Math.ceil(remainingAmount / avgDailySavings30d);
    const projDate = new Date(referenceDate);
    projDate.setDate(projDate.getDate() + daysNeeded30d);
    projectedCompletionDate30d = projDate.toISOString().split('T')[0];
  }

  // Status check: Compare actual 7-day average with required daily
  let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
  let statusMessage = 'Đúng tiến độ';

  if (avgDailySavings7d >= requiredDailySavings * 1.2) {
    status = 'ahead';
    statusMessage = 'Vượt tiến độ! Bạn đang tiết kiệm nhanh hơn dự kiến.';
  } else if (avgDailySavings7d < requiredDailySavings * 0.8) {
    status = 'behind';
    const gap = requiredDailySavings - avgDailySavings7d;
    statusMessage = `Chậm tiến độ. Cần tiết kiệm thêm khoảng ${formatVND(gap)}/ngày để kịp hạn.`;
  } else {
    status = 'on_track';
    statusMessage = 'Đang duy trì tiến độ tốt để đạt mục tiêu đúng hạn.';
  }

  return {
    remainingAmount,
    remainingDays,
    requiredDailySavings,
    requiredWeeklySavings,
    progressPercent,
    avgDailySavings7d,
    avgDailySavings30d,
    projectedCompletionDate7d,
    projectedCompletionDate30d,
    status,
    statusMessage,
  };
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(prefix: string = 'tx'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  return `${prefix}_${timestamp}_${rand}`;
}


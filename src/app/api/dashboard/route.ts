import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';
import { computeSavingsSummary } from '@/lib/services/financialService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        offlineMode: true,
        summary: {
          totalSavings: 0,
          totalIncome: 0,
          totalContributions: 0,
          allocatedSavings: 0,
          unallocatedSavings: 0,
          overallProgress: 0,
          totalTargetPrice: 0,
        },
        activeWishlist: [],
        todayActivity: {
          income: 0,
          savings: 0,
        },
        recentTransactions: [],
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [items, records, transactions, todayRecords] = await Promise.all([
      WishlistItemModel.find({ userId: 'default_user', status: 'active' }).sort({ priority: -1, createdAt: -1 }).limit(10).lean(),
      DailyRecordModel.find({ userId: 'default_user' }).lean(),
      SavingsTransactionModel.find({ userId: 'default_user' }).sort({ createdAt: -1 }).limit(10).lean(),
      DailyRecordModel.find({ userId: 'default_user', date: todayStr }).lean(),
    ]);

    const mappedItems = items.map((i: any) => ({ ...i, id: i._id, _id: undefined }));
    const mappedRecords = records.map((r: any) => ({ ...r, id: r._id, _id: undefined }));
    const mappedTransactions = transactions.map((t: any) => ({ ...t, id: t._id, _id: undefined }));

    const summary = computeSavingsSummary(mappedTransactions, mappedRecords, mappedItems);

    let todayIncome = 0;
    let todaySavings = 0;
    for (const r of todayRecords) {
      todayIncome += r.incomeAmount || 0;
      todaySavings += r.savingsContribution || 0;
    }

    return NextResponse.json({
      success: true,
      summary,
      activeWishlist: mappedItems,
      todayActivity: {
        income: todayIncome,
        savings: todaySavings,
      },
      recentTransactions: mappedTransactions,
    });
  } catch (error: any) {
    console.error('API /dashboard GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

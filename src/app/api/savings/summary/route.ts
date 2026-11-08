import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { computeSavingsSummary } from '@/lib/services/financialService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        summary: {
          totalSavings: 0,
          totalIncome: 0,
          totalContributions: 0,
          allocatedSavings: 0,
          unallocatedSavings: 0,
          overallProgress: 0,
          totalTargetPrice: 0,
        },
        offlineMode: true,
      });
    }

    const [transactions, records, items] = await Promise.all([
      SavingsTransactionModel.find({ userId: 'default_user' }).lean(),
      DailyRecordModel.find({ userId: 'default_user' }).lean(),
      WishlistItemModel.find({ userId: 'default_user' }).lean(),
    ]);

    const mappedTx = transactions.map((t: any) => ({ ...t, id: t._id }));
    const mappedRec = records.map((r: any) => ({ ...r, id: r._id }));
    const mappedIt = items.map((i: any) => ({ ...i, id: i._id }));

    const summary = computeSavingsSummary(mappedTx, mappedRec, mappedIt);

    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('API /savings/summary GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

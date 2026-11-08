import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        offlineMode: true,
        wishlist: [],
        dailyRecords: [],
        transactions: [],
        timestamp: new Date().toISOString(),
      });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    const filter: Record<string, any> = { userId: 'default_user' };
    if (since) {
      filter.updatedAt = { $gte: new Date(since) };
    }

    const [items, records, transactions] = await Promise.all([
      WishlistItemModel.find(filter).lean(),
      DailyRecordModel.find(filter).lean(),
      SavingsTransactionModel.find({ userId: 'default_user' }).lean(),
    ]);

    const mappedItems = items.map((i: any) => ({ ...i, id: i._id, _id: undefined }));
    const mappedRecords = records.map((r: any) => ({ ...r, id: r._id, _id: undefined }));
    const mappedTransactions = transactions.map((t: any) => ({ ...t, id: t._id, _id: undefined }));

    return NextResponse.json({
      success: true,
      wishlist: mappedItems,
      dailyRecords: mappedRecords,
      transactions: mappedTransactions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /sync/pull GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

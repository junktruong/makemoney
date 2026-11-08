import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';
import { SyncPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const payload: SyncPayload = await request.json();

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        offlineMode: true,
        syncedAt: new Date().toISOString(),
        message: 'Cơ sở dữ liệu đám mây chưa kết nối. Đã lưu an toàn trên máy.',
      });
    }

    const {
      wishlist = [],
      dailyRecords = [],
      transactions = [],
      deletedWishlistIds = [],
      deletedRecordIds = [],
      deletedTransactionIds = [],
    } = payload;

    // 1. Process Wishlist
    for (const item of wishlist) {
      await WishlistItemModel.findOneAndUpdate(
        { _id: item.id },
        {
          ...item,
          _id: item.id,
          userId: 'default_user',
        },
        { upsert: true }
      );
    }
    if (deletedWishlistIds.length > 0) {
      await WishlistItemModel.deleteMany({ _id: { $in: deletedWishlistIds }, userId: 'default_user' });
    }

    // 2. Process DailyRecords
    for (const record of dailyRecords) {
      await DailyRecordModel.findOneAndUpdate(
        { _id: record.id },
        {
          ...record,
          _id: record.id,
          userId: 'default_user',
        },
        { upsert: true }
      );
    }
    if (deletedRecordIds.length > 0) {
      await DailyRecordModel.deleteMany({ _id: { $in: deletedRecordIds }, userId: 'default_user' });
    }

    // 3. Process Transactions (preserve idempotency)
    for (const tx of transactions) {
      await SavingsTransactionModel.findOneAndUpdate(
        { idempotencyKey: tx.idempotencyKey },
        {
          ...tx,
          _id: tx.id,
          userId: 'default_user',
        },
        { upsert: true }
      );
    }
    if (deletedTransactionIds.length > 0) {
      await SavingsTransactionModel.deleteMany({ _id: { $in: deletedTransactionIds }, userId: 'default_user' });
    }

    const syncedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      syncedAt,
      syncedCounts: {
        wishlist: wishlist.length,
        dailyRecords: dailyRecords.length,
        transactions: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('API /sync/push POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

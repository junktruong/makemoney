import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    const [items, records, transactions] = await Promise.all([
      WishlistItemModel.find({ userId: 'default_user' }).lean(),
      DailyRecordModel.find({ userId: 'default_user' }).sort({ date: -1 }).lean(),
      SavingsTransactionModel.find({ userId: 'default_user' }).sort({ createdAt: -1 }).lean(),
    ]);

    if (format === 'csv') {
      const headers = ['Ngày', 'Thu nhập (VND)', 'Tiết kiệm (VND)', 'Nguồn thu', 'Ghi chú'];
      const rows = records.map((r: any) => [
        `"${r.date}"`,
        r.incomeAmount || 0,
        r.savingsContribution || 0,
        `"${(r.source || '').replace(/"/g, '""')}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="make_money_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      wishlist: items.map((i: any) => ({ ...i, id: i._id, _id: undefined })),
      dailyRecords: records.map((r: any) => ({ ...r, id: r._id, _id: undefined })),
      transactions: transactions.map((t: any) => ({ ...t, id: t._id, _id: undefined })),
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error('API /export GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

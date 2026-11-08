import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

export const dynamic = 'force-dynamic';

const DailyRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  incomeAmount: z.number().int().nonnegative().default(0),
  savingsContribution: z.number().int().nonnegative().default(0),
  source: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, records: [], offlineMode: true });
    }

    const records = await DailyRecordModel.find({ userId: 'default_user' })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const mapped = records.map((r: any) => ({
      ...r,
      id: r._id,
      _id: undefined,
    }));

    return NextResponse.json({ success: true, records: mapped });
  } catch (error: any) {
    console.error('API /records GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DailyRecordSchema.parse(body);

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        record: validated,
        offlineMode: true,
      });
    }

    const record = await DailyRecordModel.findOneAndUpdate(
      { _id: validated.id },
      {
        ...validated,
        _id: validated.id,
        userId: 'default_user',
      },
      { upsert: true, new: true }
    ).lean();

    // If savingsContribution > 0, ensure a corresponding contribution ledger entry exists
    if (validated.savingsContribution > 0) {
      const idempotencyKey = `rec_contrib_${validated.id}`;
      await SavingsTransactionModel.findOneAndUpdate(
        { idempotencyKey },
        {
          _id: `tx_${validated.id}`,
          userId: 'default_user',
          type: 'CONTRIBUTION',
          amount: validated.savingsContribution,
          dailyRecordId: validated.id,
          description: `Tiết kiệm ngày ${validated.date}`,
          idempotencyKey,
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      record: {
        ...record,
        id: (record as any)._id,
        _id: undefined,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 });
    }
    console.error('API /records POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

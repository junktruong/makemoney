import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { computeSavingsSummary } from '@/lib/services/financialService';

const AllocateSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  amount: z.number().int().positive('Số tiền phân bổ phải lớn hơn 0'),
  description: z.string().optional().default('Phân bổ cho mục tiêu'),
  idempotencyKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = AllocateSchema.parse(body);

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: validated.id,
          type: 'ALLOCATION',
          amount: validated.amount,
          goalId: validated.goalId,
          description: validated.description,
          idempotencyKey: validated.idempotencyKey,
          createdAt: new Date().toISOString(),
        },
        offlineMode: true,
      });
    }

    // Check idempotency
    const existing = await SavingsTransactionModel.findOne({
      idempotencyKey: validated.idempotencyKey,
    }).lean();

    if (existing) {
      return NextResponse.json({
        success: true,
        transaction: {
          ...existing,
          id: (existing as any)._id,
          _id: undefined,
        },
        duplicate: true,
      });
    }

    // Check available unallocated balance
    const [transactions, records, items] = await Promise.all([
      SavingsTransactionModel.find({ userId: 'default_user' }).lean(),
      DailyRecordModel.find({ userId: 'default_user' }).lean(),
      WishlistItemModel.find({ userId: 'default_user' }).lean(),
    ]);

    const mappedTx = transactions.map((t: any) => ({ ...t, id: t._id }));
    const mappedRec = records.map((r: any) => ({ ...r, id: r._id }));
    const mappedIt = items.map((i: any) => ({ ...i, id: i._id }));
    const summary = computeSavingsSummary(mappedTx, mappedRec, mappedIt);

    if (validated.amount > summary.unallocatedSavings) {
      return NextResponse.json(
        {
          success: false,
          error: `Số dư chưa phân bổ không đủ (hiện có ${summary.unallocatedSavings.toLocaleString('vi-VN')} ₫)`,
        },
        { status: 400 }
      );
    }

    const tx = await SavingsTransactionModel.create({
      _id: validated.id,
      userId: 'default_user',
      type: 'ALLOCATION',
      amount: validated.amount,
      goalId: validated.goalId,
      description: validated.description,
      idempotencyKey: validated.idempotencyKey,
    });

    // Update WishlistItem allocatedSavings
    await WishlistItemModel.updateOne(
      { _id: validated.goalId, userId: 'default_user' },
      { $inc: { allocatedSavings: validated.amount } }
    );

    return NextResponse.json({
      success: true,
      transaction: {
        ...tx.toObject(),
        id: tx._id,
        _id: undefined,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 });
    }
    console.error('API /savings/allocate POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

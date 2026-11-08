import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';

const ReallocateSchema = z.object({
  id: z.string(),
  sourceGoalId: z.string(),
  goalId: z.string().optional(), // If undefined/null, reallocates back to general unallocated
  amount: z.number().int().positive('Số tiền điều chuyển phải lớn hơn 0'),
  description: z.string().optional().default('Điều chuyển tiền tiết kiệm'),
  idempotencyKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ReallocateSchema.parse(body);

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: validated.id,
          type: 'REALLOCATION',
          amount: validated.amount,
          sourceGoalId: validated.sourceGoalId,
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

    // Check source goal has enough allocated savings
    const sourceItem = await WishlistItemModel.findOne({
      _id: validated.sourceGoalId,
      userId: 'default_user',
    }).lean();

    if (!sourceItem || (sourceItem.allocatedSavings || 0) < validated.amount) {
      return NextResponse.json(
        { success: false, error: 'Mục tiêu nguồn không đủ số dư để điều chuyển' },
        { status: 400 }
      );
    }

    const tx = await SavingsTransactionModel.create({
      _id: validated.id,
      userId: 'default_user',
      type: 'REALLOCATION',
      amount: validated.amount,
      sourceGoalId: validated.sourceGoalId,
      goalId: validated.goalId,
      description: validated.description,
      idempotencyKey: validated.idempotencyKey,
    });

    // Update source goal
    await WishlistItemModel.updateOne(
      { _id: validated.sourceGoalId, userId: 'default_user' },
      { $inc: { allocatedSavings: -validated.amount } }
    );

    // Update destination goal if specified
    if (validated.goalId) {
      await WishlistItemModel.updateOne(
        { _id: validated.goalId, userId: 'default_user' },
        { $inc: { allocatedSavings: validated.amount } }
      );
    }

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
    console.error('API /savings/reallocate POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

const ContributeSchema = z.object({
  id: z.string(),
  amount: z.number().int().positive('Số tiền phải lớn hơn 0'),
  description: z.string().optional().default('Đóng góp tiết kiệm'),
  idempotencyKey: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ContributeSchema.parse(body);

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        transaction: {
          id: validated.id,
          type: 'CONTRIBUTION',
          amount: validated.amount,
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

    const tx = await SavingsTransactionModel.create({
      _id: validated.id,
      userId: 'default_user',
      type: 'CONTRIBUTION',
      amount: validated.amount,
      description: validated.description,
      idempotencyKey: validated.idempotencyKey,
    });

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
    console.error('API /savings/contribute POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


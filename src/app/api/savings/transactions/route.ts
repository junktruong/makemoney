import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, transactions: [], offlineMode: true });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const filter: Record<string, any> = { userId: 'default_user' };
    if (goalId) {
      filter.$or = [{ goalId }, { sourceGoalId: goalId }];
    }

    const transactions = await SavingsTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const mapped = transactions.map((t: any) => ({
      ...t,
      id: t._id,
      _id: undefined,
    }));

    return NextResponse.json({ success: true, transactions: mapped });
  } catch (error: any) {
    console.error('API /savings/transactions GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DailyRecordModel } from '@/lib/db/models/DailyRecord';
import { SavingsTransactionModel } from '@/lib/db/models/SavingsTransaction';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, offlineMode: true, id, updates });
    }

    delete updates._id;
    delete updates.id;

    const record = await DailyRecordModel.findOneAndUpdate(
      { _id: id, userId: 'default_user' },
      { $set: updates },
      { new: true }
    ).lean();

    if (!record) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi' }, { status: 404 });
    }

    // Update associated contribution transaction if amount changed
    if (updates.savingsContribution !== undefined) {
      const idempotencyKey = `rec_contrib_${id}`;
      if (updates.savingsContribution > 0) {
        await SavingsTransactionModel.findOneAndUpdate(
          { idempotencyKey },
          {
            $set: {
              amount: updates.savingsContribution,
              description: `Tiết kiệm ngày ${record.date}`,
            },
          },
          { upsert: true }
        );
      } else {
        await SavingsTransactionModel.deleteOne({ idempotencyKey });
      }
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
    console.error('API /records/[id] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, offlineMode: true, id });
    }

    await DailyRecordModel.deleteOne({ _id: id, userId: 'default_user' });
    // Also remove any linked savings transaction
    await SavingsTransactionModel.deleteMany({ dailyRecordId: id, userId: 'default_user' });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API /records/[id] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

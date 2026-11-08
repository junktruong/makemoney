import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';

export const dynamic = 'force-dynamic';

const WishlistCreateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên nguyện vọng không được để trống'),
  description: z.string().optional(),
  targetPrice: z.number().int().nonnegative('Giá mục tiêu phải lớn hơn hoặc bằng 0'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetDate: z.string().optional(),
  targetDays: z.number().optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  notes: z.string().optional(),
  category: z.string().optional(),
  images: z.array(z.any()).default([]),
  allocatedSavings: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: true, items: [], offlineMode: true });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const filter: Record<string, any> = { userId: 'default_user' };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const items = await WishlistItemModel.find(filter).sort({ updatedAt: -1 }).lean();
    const mapped = items.map((item: any) => ({
      ...item,
      id: item._id,
      _id: undefined,
    }));

    return NextResponse.json({ success: true, items: mapped });
  } catch (error: any) {
    console.error('API /wishlist GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = WishlistCreateSchema.parse(body);

    const conn = await connectToDatabase();
    if (!conn) {
      // Offline mode acknowledgment
      return NextResponse.json({
        success: true,
        item: validated,
        offlineMode: true,
        message: 'Đã lưu cục bộ (chế độ ngoại tuyến)',
      });
    }

    const item = await WishlistItemModel.findOneAndUpdate(
      { _id: validated.id },
      {
        ...validated,
        _id: validated.id,
        userId: 'default_user',
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        id: (item as any)._id,
        _id: undefined,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 });
    }
    console.error('API /wishlist POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

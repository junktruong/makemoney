import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';

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

    const item = await WishlistItemModel.findOneAndUpdate(
      { _id: id, userId: 'default_user' },
      { $set: updates },
      { new: true }
    ).lean();

    if (!item) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy nguyện vọng' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        id: (item as any)._id,
        _id: undefined,
      },
    });
  } catch (error: any) {
    console.error('API /wishlist/[id] PATCH error:', error);
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

    await WishlistItemModel.deleteOne({ _id: id, userId: 'default_user' });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API /wishlist/[id] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


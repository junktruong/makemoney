import { NextRequest, NextResponse } from 'next/server';
import { uploadToGridFS } from '@/lib/db/gridfs';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;
    const wishlistItemId = formData.get('wishlistItemId') as string | null;
    const imageId = (formData.get('imageId') as string) || `img_${Date.now()}`;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'Thiếu file hình ảnh' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({
        success: true,
        offlineMode: true,
        imageId,
        message: 'Lưu cục bộ IndexedDB (chế độ ngoại tuyến)',
      });
    }

    // 1. Upload main image to GridFS
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const gridFsFileId = await uploadToGridFS(
      `${imageId}_${file.name}`,
      fileBuffer,
      file.type || 'image/jpeg',
      {
        imageId,
        wishlistItemId,
        isPrimary,
      }
    );

    // 2. Upload thumbnail if provided
    let thumbnailGridFsFileId = gridFsFileId;
    if (thumbnail) {
      const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer());
      thumbnailGridFsFileId = await uploadToGridFS(
        `${imageId}_thumb_${file.name}`,
        thumbBuffer,
        thumbnail.type || 'image/webp',
        {
          imageId,
          isThumbnail: true,
          wishlistItemId,
        }
      );
    }

    // 3. If wishlistItemId is present, update the item's images list
    if (wishlistItemId) {
      const imageMeta = {
        imageId,
        gridFsFileId,
        thumbnailGridFsFileId,
        originalFilename: file.name,
        mimeType: file.type || 'image/jpeg',
        fileSize: file.size,
        sortOrder: 0,
        isPrimary,
        uploadedAt: new Date().toISOString(),
      };

      await WishlistItemModel.updateOne(
        { _id: wishlistItemId, userId: 'default_user' },
        {
          $push: { images: imageMeta },
        }
      );
    }

    return NextResponse.json({
      success: true,
      imageId,
      gridFsFileId,
      thumbnailGridFsFileId,
    });
  } catch (error: any) {
    console.error('API /images/upload POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

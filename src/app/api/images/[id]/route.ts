import { NextRequest, NextResponse } from 'next/server';
import { getGridFSDownloadStream, deleteFromGridFS, getGridFSBucket } from '@/lib/db/gridfs';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WishlistItemModel } from '@/lib/db/models/WishlistItem';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conn = await connectToDatabase();
    if (!conn) {
      return new NextResponse('Database unavailable', { status: 503 });
    }

    const bucket = await getGridFSBucket();
    if (!bucket) {
      return new NextResponse('GridFS unavailable', { status: 503 });
    }

    let objectId: mongoose.mongo.ObjectId;
    try {
      objectId = new mongoose.mongo.ObjectId(id);
    } catch {
      // Find file by metadata.imageId if not valid objectId
      const files = await bucket.find({ 'metadata.imageId': id }).toArray();
      if (!files.length) {
        return new NextResponse('Image not found', { status: 404 });
      }
      objectId = files[0]._id;
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files.length) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const fileDoc = files[0];
    const stream = await getGridFSDownloadStream(objectId.toString());

    // Convert Node readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    const contentType =
      (fileDoc.metadata as any)?.contentType || (fileDoc as any).contentType || 'image/jpeg';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileDoc.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('API /images/[id] GET error:', error);
    return new NextResponse(error.message, { status: 500 });
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

    await deleteFromGridFS(id);

    // Also remove from any WishlistItem images metadata
    await WishlistItemModel.updateMany(
      { userId: 'default_user' },
      {
        $pull: {
          images: {
            $or: [{ imageId: id }, { gridFsFileId: id }, { thumbnailGridFsFileId: id }],
          },
        },
      }
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API /images/[id] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

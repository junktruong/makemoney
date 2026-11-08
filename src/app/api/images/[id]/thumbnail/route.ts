import { NextRequest, NextResponse } from 'next/server';
import { getGridFSDownloadStream, getGridFSBucket } from '@/lib/db/gridfs';
import { connectToDatabase } from '@/lib/db/mongodb';
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
      // Find thumbnail by metadata.imageId and isThumbnail: true
      const files = await bucket.find({ 'metadata.imageId': id, 'metadata.isThumbnail': true }).toArray();
      if (!files.length) {
        // Fallback to main file
        const mainFiles = await bucket.find({ 'metadata.imageId': id }).toArray();
        if (!mainFiles.length) {
          return new NextResponse('Thumbnail not found', { status: 404 });
        }
        objectId = mainFiles[0]._id;
      } else {
        objectId = files[0]._id;
      }
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files.length) {
      return new NextResponse('Thumbnail not found', { status: 404 });
    }

    const fileDoc = files[0];
    const stream = await getGridFSDownloadStream(objectId.toString());

    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    const contentType =
      (fileDoc.metadata as any)?.contentType || (fileDoc as any).contentType || 'image/webp';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileDoc.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    console.error('API /images/[id]/thumbnail GET error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

import mongooseDriver from 'mongoose';
import { connectToDatabase } from './mongodb';
import { Readable } from 'stream';

let gridFsBucket: mongooseDriver.mongo.GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<mongooseDriver.mongo.GridFSBucket | null> {
  const conn = await connectToDatabase();
  if (!conn || !conn.connection.db) {
    return null;
  }

  if (!gridFsBucket) {
    gridFsBucket = new mongooseDriver.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'make_money_images',
    });
  }

  return gridFsBucket;
}

/**
 * Upload a buffer or stream to GridFS
 */
export async function uploadToGridFS(
  filename: string,
  buffer: Buffer,
  contentType: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  const bucket = await getGridFSBucket();
  if (!bucket) {
    throw new Error('GridFS bucket is unavailable. Database not connected.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        contentType,
        uploadedAt: new Date(),
      },
    } as any);

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id.toString()));
  });
}

/**
 * Open a download stream for a file in GridFS
 */
export async function getGridFSDownloadStream(fileId: string) {
  const bucket = await getGridFSBucket();
  if (!bucket) {
    throw new Error('GridFS bucket is unavailable');
  }

  const id = new mongooseDriver.mongo.ObjectId(fileId);
  return bucket.openDownloadStream(id);
}

/**
 * Delete a file from GridFS
 */
export async function deleteFromGridFS(fileId: string): Promise<boolean> {
  const bucket = await getGridFSBucket();
  if (!bucket) return false;

  try {
    const id = new mongooseDriver.mongo.ObjectId(fileId);
    await bucket.delete(id);
    return true;
  } catch (err) {
    console.warn(`Failed to delete GridFS file ${fileId}:`, err);
    return false;
  }
}

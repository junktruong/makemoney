import mongoose, { Schema } from 'mongoose';

export interface IImageMetadata {
  imageId: string;
  gridFsFileId?: string;
  thumbnailGridFsFileId?: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface IWishlistItem {
  _id: string;
  userId?: string;
  name: string;
  description?: string;
  targetPrice: number;
  priority: 'low' | 'medium' | 'high';
  targetDate?: string;
  targetDays?: number;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  category?: string;
  images: IImageMetadata[];
  allocatedSavings: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ImageMetadataSchema = new Schema<IImageMetadata>(
  {
    imageId: { type: String, required: true },
    gridFsFileId: { type: String },
    thumbnailGridFsFileId: { type: String },
    originalFilename: { type: String, default: 'image.jpg' },
    mimeType: { type: String, default: 'image/jpeg' },
    fileSize: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    _id: { type: String, required: true },
    userId: { type: String, index: true, default: 'default_user' },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetPrice: { type: Number, required: true, min: 0 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    targetDate: { type: String },
    targetDays: { type: Number },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
    notes: { type: String, default: '' },
    category: { type: String, default: 'Chung' },
    images: { type: [ImageMetadataSchema], default: [] },
    allocatedSavings: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    _id: false,
  }
);

WishlistItemSchema.index({ userId: 1, status: 1 });
WishlistItemSchema.index({ userId: 1, updatedAt: -1 });

export const WishlistItemModel =
  mongoose.models.WishlistItem || mongoose.model<IWishlistItem>('WishlistItem', WishlistItemSchema);

import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  passwordHash?: string;
  settings: {
    currency: string;
    theme: 'light' | 'dark' | 'system';
    maxImageUploadMb: number;
    defaultSavingsGoalDays: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    settings: {
      currency: { type: String, default: 'VND' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      maxImageUploadMb: { type: Number, default: 10 },
      defaultSavingsGoalDays: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

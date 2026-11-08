import mongoose, { Schema } from 'mongoose';

export interface IDailyRecord {
  _id: string;
  userId?: string;
  date: string;
  incomeAmount: number;
  savingsContribution: number;
  source?: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DailyRecordSchema = new Schema<IDailyRecord>(
  {
    _id: { type: String, required: true },
    userId: { type: String, index: true, default: 'default_user' },
    date: { type: String, required: true, index: true },
    incomeAmount: { type: Number, default: 0, min: 0 },
    savingsContribution: { type: Number, default: 0, min: 0 },
    source: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  {
    timestamps: true,
    _id: false,
  }
);

DailyRecordSchema.index({ userId: 1, date: -1 });

export const DailyRecordModel =
  mongoose.models.DailyRecord || mongoose.model<IDailyRecord>('DailyRecord', DailyRecordSchema);

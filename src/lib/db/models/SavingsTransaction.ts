import mongoose, { Schema } from 'mongoose';

export interface ISavingsTransaction {
  _id: string;
  userId?: string;
  type: 'CONTRIBUTION' | 'ALLOCATION' | 'REALLOCATION' | 'WITHDRAWAL';
  amount: number;
  goalId?: string;
  sourceGoalId?: string;
  dailyRecordId?: string;
  description: string;
  idempotencyKey: string;
  createdAt?: Date;
}

const SavingsTransactionSchema = new Schema<ISavingsTransaction>(
  {
    _id: { type: String, required: true },
    userId: { type: String, index: true, default: 'default_user' },
    type: {
      type: String,
      enum: ['CONTRIBUTION', 'ALLOCATION', 'REALLOCATION', 'WITHDRAWAL'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    goalId: { type: String, index: true },
    sourceGoalId: { type: String },
    dailyRecordId: { type: String },
    description: { type: String, default: '' },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false,
  }
);

SavingsTransactionSchema.index({ userId: 1, createdAt: -1 });

export const SavingsTransactionModel =
  mongoose.models.SavingsTransaction ||
  mongoose.model<ISavingsTransaction>('SavingsTransaction', SavingsTransactionSchema);

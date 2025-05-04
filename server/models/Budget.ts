import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema({
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  userId: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IBudget>('Budget', BudgetSchema); 
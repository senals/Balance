import { Schema, model } from 'mongoose';

export interface IDrink {
  userId: string;
  type: string;
  amount: number;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const drinkSchema = new Schema<IDrink>(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes
drinkSchema.index({ userId: 1, timestamp: -1 });
drinkSchema.index({ type: 1 });

export const Drink = model<IDrink>('Drink', drinkSchema); 
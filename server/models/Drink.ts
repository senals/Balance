import mongoose, { Schema, Document } from 'mongoose';

export interface IDrink extends Document {
  category: string;
  type: string;
  brand: string;
  alcoholContent: number;
  quantity: number;
  price: number;
  location?: string;
  notes?: string;
  timestamp: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrinkSchema: Schema = new Schema({
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  alcoholContent: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  location: {
    type: String
  },
  notes: {
    type: String
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  userId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for common query patterns
DrinkSchema.index({ userId: 1, timestamp: -1 }); // For getting user's drinks sorted by time
DrinkSchema.index({ userId: 1, category: 1 }); // For filtering drinks by category
DrinkSchema.index({ timestamp: -1 }); // For getting all drinks sorted by time

export default mongoose.model<IDrink>('Drink', DrinkSchema); 
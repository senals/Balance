import mongoose, { Schema, Document } from 'mongoose';

export interface IDrinkHistory extends Document {
  userId: string;
  drinkName: string;
  drinkType: string;
  amount: number;
  price: number;
  date: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrinkHistorySchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  drinkName: {
    type: String,
    required: true
  },
  drinkType: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model<IDrinkHistory>('DrinkHistory', DrinkHistorySchema); 
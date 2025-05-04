import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  password: string;
  profile: {
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    medicalConditions?: string[];
    medications?: string[];
  };
  settings: {
    notificationsEnabled: boolean;
    darkModeEnabled: boolean;
    privacyModeEnabled: boolean;
    dailyLimit: number;
  };
  statistics: {
    totalDrinks: number;
    totalSpent: number;
    averageDrinksPerWeek: number;
    lastAssessmentScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    age: Number,
    weight: Number,
    height: Number,
    gender: String,
    medicalConditions: [String],
    medications: [String]
  },
  settings: {
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    darkModeEnabled: {
      type: Boolean,
      default: false
    },
    privacyModeEnabled: {
      type: Boolean,
      default: false
    },
    dailyLimit: {
      type: Number,
      default: 3
    }
  },
  statistics: {
    totalDrinks: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageDrinksPerWeek: {
      type: Number,
      default: 0
    },
    lastAssessmentScore: Number
  }
}, {
  timestamps: true
});

// Add indexes for better query performance

export default mongoose.model<IUser>('User', UserSchema); 
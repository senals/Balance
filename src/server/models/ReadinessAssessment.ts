import mongoose, { Schema, Document } from 'mongoose';

export interface IReadinessAssessment extends Document {
  userId: string;
  date: Date;
  score: number;
  answers: {
    questionId: string;
    answer: string;
    score: number;
  }[];
  feedback: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReadinessAssessmentSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true
    }
  }],
  feedback: {
    type: String,
    required: true
  },
  recommendations: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model<IReadinessAssessment>('ReadinessAssessment', ReadinessAssessmentSchema); 
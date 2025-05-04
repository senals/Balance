import { Document, Schema, model, Model } from 'mongoose';

export interface IExpense {
  id?: string;
  amount: number;
  category: string;
  date: string | Date;
  notes?: string;
}

export interface IBudget {
  userId: string;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  expenses: IExpense[];
}

export interface IBudgetDocument extends IBudget, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetModel extends Model<IBudgetDocument> {
  new(data: IBudget): IBudgetDocument;
}

const ExpenseSchema = new Schema<IExpense>({
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String }
});

const BudgetSchema = new Schema<IBudgetDocument, IBudgetModel>({
  userId: { type: String, required: true },
  dailyBudget: { type: Number, required: true, default: 0 },
  weeklyBudget: { type: Number, required: true, default: 0 },
  monthlyBudget: { type: Number, required: true, default: 0 },
  expenses: [ExpenseSchema]
}, {
  timestamps: true
});

export const Budget = model<IBudgetDocument, IBudgetModel>('Budget', BudgetSchema); 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONGODB_URI } from '../config/mongodb.config';
import mongoose from 'mongoose';
import { Budget, IBudget, IBudgetDocument } from '../models/Budget';

// API configuration
const API_URL = MONGODB_URI;

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('auth_token');
};

// Helper function for API requests
export const apiRequest = async (
  collection: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(API_URL);
    }

    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let result;

    // Handle different collections
    switch (collection) {
      case 'budgets':
        switch (method) {
          case 'GET':
            if (data?.userId) {
              result = await Budget.findOne({ userId: data.userId }).exec();
            } else {
              result = await Budget.find({}).exec();
            }
            break;
          case 'POST':
            result = await Budget.create(data);
            break;
          case 'PUT':
            result = await Budget.findByIdAndUpdate(
              data._id,
              { $set: data },
              { new: true }
            ).exec();
            break;
          case 'DELETE':
            result = await Budget.findByIdAndDelete(data._id).exec();
            break;
        }
        break;
      
      // Add other collections here as needed
      default:
        throw new Error(`Unsupported collection: ${collection}`);
    }

    return result;
  } catch (error) {
    console.error(`MongoDB operation failed: ${collection}`, error);
    throw error;
  }
};

// Budget API
export const budgetApi = {
  getAll: async (): Promise<IBudgetDocument[]> => {
    return apiRequest('budgets') as Promise<IBudgetDocument[]>;
  },
  
  getByUser: async (userId: string): Promise<IBudgetDocument | null> => {
    return apiRequest('budgets', 'GET', { userId }) as Promise<IBudgetDocument | null>;
  },
  
  create: async (budget: Partial<IBudget>): Promise<IBudgetDocument> => {
    return apiRequest('budgets', 'POST', budget) as Promise<IBudgetDocument>;
  },
  
  update: async (id: string, updates: Partial<IBudget>): Promise<IBudgetDocument | null> => {
    return apiRequest('budgets', 'PUT', { _id: id, ...updates }) as Promise<IBudgetDocument | null>;
  },
  
  delete: async (id: string): Promise<IBudgetDocument | null> => {
    return apiRequest('budgets', 'DELETE', { _id: id }) as Promise<IBudgetDocument | null>;
  },

  addExpense: async (userId: string, expense: { amount: number; category: string; date: string; notes?: string }): Promise<IBudgetDocument> => {
    const budget = await Budget.findOne({ userId }).exec();
    if (!budget) {
      throw new Error('Budget not found for user');
    }

    budget.expenses.push({
      ...expense,
      date: new Date(expense.date),
    });

    return budget.save();
  }
};

// Transaction API
export const transactionApi = {
  getAll: async () => {
    return apiRequest('transactions');
  },
  
  getByUser: async (userId: string) => {
    return apiRequest('transactions', 'GET', { userId });
  },
  
  create: async (transaction: any) => {
    return apiRequest('transactions', 'POST', transaction);
  },
  
  update: async (id: string, updates: any) => {
    return apiRequest('transactions', 'PUT', { _id: id, ...updates });
  },
  
  delete: async (id: string) => {
    return apiRequest('transactions', 'DELETE', { _id: id });
  }
};

// User API
export const userApi = {
  getAll: async () => {
    return apiRequest('users');
  },
  
  create: async (user: any) => {
    return apiRequest('users', 'POST', user);
  },
  
  update: async (id: string, updates: any) => {
    return apiRequest('users', 'PUT', { _id: id, ...updates });
  },
  
  delete: async (id: string) => {
    return apiRequest('users', 'DELETE', { _id: id });
  }
};

// Export a function to check if the API is available
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(API_URL);
    }
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('MongoDB connection check failed:', error);
    return false;
  }
}; 
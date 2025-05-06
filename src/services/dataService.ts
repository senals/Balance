import { transactionApi, budgetApi, userApi, checkApiConnection } from './api';
import { storage, STORAGE_KEYS, StorageError } from './storage';
import { Budget, IBudget, IBudgetDocument, IExpense } from '../models/Budget';

// Add API configuration interface
interface ApiConfig {
  api: Api | null;
  isBatchingEnabled: boolean;
}

interface Api {
  sync: (changes: any[]) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  timestamp: number;
}

// Data service that combines local storage and API
export const dataService = {
  // Check if API is available
  isApiAvailable: async (): Promise<boolean> => {
    return await checkApiConnection();
  },

  // Transaction methods
  transactions: {
    // Get all transactions (from API if available, otherwise from local storage)
    getAll: async (userId: string) => {
      try {
        // Try to get from API first
        if (await dataService.isApiAvailable()) {
          return await transactionApi.getByUser(userId);
        }
      } catch (error) {
        console.warn('Failed to fetch transactions from API, falling back to local storage', error);
      }
      
      // Fall back to local storage
      return await storage.drinks.getAll(userId);
    },
    
    // Add a new transaction
    add: async (transaction: any, userId: string) => {
      try {
        // Try to save to API first
        if (await dataService.isApiAvailable()) {
          const apiTransaction = await transactionApi.create({
            ...transaction,
            userId
          });
          
          // Also save to local storage as backup
          await storage.drinks.add({
            ...transaction,
            userId
          });
          
          return apiTransaction;
        }
      } catch (error) {
        console.warn('Failed to save transaction to API, saving to local storage only', error);
      }
      
      // Fall back to local storage
      return await storage.drinks.add({
        ...transaction,
        userId
      });
    },
    
    // Update a transaction
    update: async (id: string, updates: any, userId: string) => {
      try {
        // Try to update on API first
        if (await dataService.isApiAvailable()) {
          const apiTransaction = await transactionApi.update(id, updates);
          
          // Also update in local storage
          await storage.drinks.update(id, updates);
          
          return apiTransaction;
        }
      } catch (error) {
        console.warn('Failed to update transaction on API, updating in local storage only', error);
      }
      
      // Fall back to local storage
      return await storage.drinks.update(id, updates);
    },
    
    // Delete a transaction
    delete: async (id: string, userId: string) => {
      try {
        // Try to delete from API first
        if (await dataService.isApiAvailable()) {
          await transactionApi.delete(id);
          
          // Also delete from local storage
          await storage.drinks.remove(id);
          
          return true;
        }
      } catch (error) {
        console.warn('Failed to delete transaction from API, deleting from local storage only', error);
      }
      
      // Fall back to local storage
      await storage.drinks.remove(id);
      return true;
    }
  },
  
  // Budget methods
  budget: {
    get: async (userId: string): Promise<IBudgetDocument | null> => {
      try {
        const isApiAvailable = await checkApiConnection();
        if (isApiAvailable) {
          const budget = await budgetApi.getByUser(userId);
          if (budget) {
            // Save to local storage as backup
            await storage.budget.save(budget.toObject());
            return budget;
          }
        }
        
        // Fallback to local storage
        const localBudget = await storage.budget.get(userId);
        if (localBudget) {
          return new Budget(localBudget);
        }
        
        return null;
      } catch (error) {
        console.error('Error getting budget:', error);
        // Fallback to local storage on error
        const localBudget = await storage.budget.get(userId);
        return localBudget ? new Budget(localBudget) : null;
      }
    },

    update: async (userId: string, updates: Partial<IBudget>): Promise<IBudgetDocument | null> => {
      try {
        const isApiAvailable = await checkApiConnection();
        if (isApiAvailable) {
          const budget = await budgetApi.getByUser(userId);
          if (budget) {
            const updatedBudget = await budgetApi.update(budget._id, updates);
            if (updatedBudget) {
              // Save to local storage as backup
              await storage.budget.save(updatedBudget.toObject());
              return updatedBudget;
            }
          }
        }
        
        // Fallback to local storage
        const localBudget = await storage.budget.get(userId);
        if (localBudget) {
          const updatedLocalBudget = { ...localBudget, ...updates };
          await storage.budget.save(updatedLocalBudget);
          return new Budget(updatedLocalBudget);
        }
        
        return null;
      } catch (error) {
        console.error('Error updating budget:', error);
        return null;
      }
    },

    addExpense: async (
      userId: string,
      expense: { amount: number; category: string; date: string; notes?: string }
    ): Promise<IBudgetDocument | null> => {
      try {
        const isApiAvailable = await checkApiConnection();
        if (isApiAvailable) {
          const updatedBudget = await budgetApi.addExpense(userId, expense);
          if (updatedBudget) {
            // Save to local storage as backup
            await storage.budget.save(updatedBudget.toObject());
            return updatedBudget;
          }
        }
        
        // Fallback to local storage
        const localBudget = await storage.budget.get(userId);
        if (localBudget) {
          await storage.budget.addExpense(expense);
          const updatedLocalBudget = await storage.budget.get(userId);
          return updatedLocalBudget ? new Budget(updatedLocalBudget) : null;
        }
        
        return null;
      } catch (error) {
        console.error('Error adding expense:', error);
        return null;
      }
    }
  },
  
  // User profile methods
  userProfile: {
    // Get user profile
    get: async (userId: string) => {
      try {
        // Try to get from API first
        if (await dataService.isApiAvailable()) {
          const apiUser = await userApi.getAll();
          
          if (apiUser) {
            // Convert API user to local user profile format
            const localProfile = {
              id: apiUser._id,
              name: apiUser.username,
              email: apiUser.email,
              createdAt: apiUser.createdAt,
              updatedAt: apiUser.updatedAt
            };
            
            // Save to local storage as backup
            await storage.profile.update(localProfile);
            
            return localProfile;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user profile from API, falling back to local storage', error);
      }
      
      // Fall back to local storage
      return await storage.profile.get(userId);
    },
    
    // Update user profile
    update: async (updates: any, userId: string) => {
      try {
        // Try to update on API first
        if (await dataService.isApiAvailable()) {
          await userApi.update(userId, {
            username: updates.name,
            email: updates.email
          });
          
          // Also update in local storage
          await storage.profile.update(updates);
          
          return await storage.profile.get(userId);
        }
      } catch (error) {
        console.warn('Failed to update user profile on API, updating in local storage only', error);
      }
      
      // Fall back to local storage
      return await storage.profile.update(updates);
    }
  },
  
  // Settings methods
  settings: {
    // Get user settings
    get: async (userId: string) => {
      // Settings are only stored locally
      return await storage.settings.get(userId);
    },
    
    // Update user settings
    update: async (updates: any, userId: string) => {
      // Settings are only stored locally
      return await storage.settings.update(updates);
    }
  },

  // Add API configuration
  apiConfig: {
    api: null,
    isBatchingEnabled: false
  } as ApiConfig,

  // Add API methods
  getApi(): Api | null {
    return this.apiConfig.api;
  },

  configureApi(config: Partial<ApiConfig>): void {
    this.apiConfig = { ...this.apiConfig, ...config };
  },

  // Add sync changes method
  async syncChanges(changes: Transaction[]): Promise<void> {
    if (!this.apiConfig.api) {
      // Queue changes for later sync
      return;
    }

    // Process changes in batches
    const batchSize = 10;
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize);
      await this.apiConfig.api.sync(batch);
    }
  },

  // Add transaction method
  async addTransaction(transaction: Transaction): Promise<void> {
    if (this.apiConfig.isBatchingEnabled) {
      storage.addPendingChange({
        key: 'transactions',
        value: transaction,
        timestamp: Date.now()
      });
    } else if (this.apiConfig.api) {
      await this.apiConfig.api.addTransaction(transaction);
    }
  }
}; 
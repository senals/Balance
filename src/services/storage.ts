import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  DRINKS: 'drinks',
  SETTINGS: 'settings',
  AUTH_TOKEN: 'auth_token',
  BUDGET: 'budget',
  PRE_GAME_PLANS: 'pre_game_plans',
} as const;

// Types
export interface DrinkEntry {
  id: string;
  category: string;
  type: string;
  brand: string;
  alcoholContent: number;
  quantity: number;
  price: number;
  location?: string;
  notes?: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  privacyModeEnabled: boolean;
  dailyLimit: number;
}

export interface BudgetData {
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }>;
}

export interface PreGamePlan {
  id: string;
  title: string;
  date: string;
  location: string;
  maxDrinks: number;
  maxSpending: number;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  actualDrinks?: number;
  actualSpending?: number;
  adherenceStatus?: 'pending' | 'success' | 'exceeded';
  adherenceNotes?: string;
}

// Error class for storage operations
export class StorageError extends Error {
  constructor(message: string, public operation: string, public key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Simple in-memory cache to reduce AsyncStorage calls
const cache: Record<string, any> = {};

// Generic storage operations with type safety
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check cache first
      if (cache[key] !== undefined) {
        return cache[key];
      }
      
      const data = await AsyncStorage.getItem(key);
      const parsedData = data ? JSON.parse(data) : null;
      
      // Update cache
      cache[key] = parsedData;
      
      return parsedData;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      throw new StorageError(
        `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'get',
        key
      );
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      
      // Update cache
      cache[key] = value;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      throw new StorageError(
        `Failed to set item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'set',
        key
      );
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      
      // Update cache
      delete cache[key];
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      throw new StorageError(
        `Failed to remove item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'remove',
        key
      );
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      
      // Clear cache
      Object.keys(cache).forEach(key => delete cache[key]);
    } catch (error) {
      console.error('Storage clear error:', error);
      throw new StorageError(
        `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'clear'
      );
    }
  },

  // Specialized methods for our app
  drinks: {
    async getAll(): Promise<DrinkEntry[]> {
      const drinks = await storage.get<DrinkEntry[]>(STORAGE_KEYS.DRINKS);
      return drinks || [];
    },

    async add(drink: Omit<DrinkEntry, 'id'>): Promise<DrinkEntry> {
      const drinks = await this.getAll();
      const newDrink: DrinkEntry = {
        ...drink,
        id: Date.now().toString(),
      };
      drinks.push(newDrink);
      await storage.set(STORAGE_KEYS.DRINKS, drinks);
      return newDrink;
    },

    async update(id: string, updates: Partial<DrinkEntry>): Promise<DrinkEntry> {
      const drinks = await this.getAll();
      const index = drinks.findIndex(d => d.id === id);
      if (index === -1) {
        throw new StorageError('Drink not found', 'update', STORAGE_KEYS.DRINKS);
      }
      drinks[index] = { ...drinks[index], ...updates };
      await storage.set(STORAGE_KEYS.DRINKS, drinks);
      return drinks[index];
    },

    async remove(id: string): Promise<void> {
      const drinks = await this.getAll();
      const filtered = drinks.filter(d => d.id !== id);
      await storage.set(STORAGE_KEYS.DRINKS, filtered);
    },
  },

  settings: {
    async get(): Promise<UserSettings> {
      const settings = await storage.get<UserSettings>(STORAGE_KEYS.SETTINGS);
      return settings || {
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
      };
    },

    async update(updates: Partial<UserSettings>): Promise<UserSettings> {
      const current = await this.get();
      const updated = { ...current, ...updates };
      await storage.set(STORAGE_KEYS.SETTINGS, updated);
      return updated;
    },
  },

  profile: {
    async get(): Promise<UserProfile | null> {
      return storage.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    },

    async update(updates: Partial<UserProfile>): Promise<UserProfile> {
      const current = await this.get();
      if (!current) {
        throw new StorageError('No profile found', 'update', STORAGE_KEYS.USER_PROFILE);
      }
      const updated = { ...current, ...updates };
      await storage.set(STORAGE_KEYS.USER_PROFILE, updated);
      return updated;
    },
  },

  budget: {
    async get(): Promise<BudgetData> {
      const budget = await storage.get<BudgetData>(STORAGE_KEYS.BUDGET);
      return budget || {
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
      };
    },

    async addExpense(expense: Omit<BudgetData['expenses'][0], 'id'>): Promise<BudgetData['expenses'][0]> {
      const budget = await this.get();
      const newExpense = { ...expense, id: Date.now().toString() };
      budget.expenses.push(newExpense);
      await storage.set(STORAGE_KEYS.BUDGET, budget);
      return newExpense;
    },

    async update(updates: Partial<Omit<BudgetData, 'expenses'>>): Promise<BudgetData> {
      const current = await this.get();
      const updated = { ...current, ...updates };
      await storage.set(STORAGE_KEYS.BUDGET, updated);
      return updated;
    },
  },

  preGamePlans: {
    async getAll(): Promise<PreGamePlan[]> {
      const plans = await storage.get<PreGamePlan[]>(STORAGE_KEYS.PRE_GAME_PLANS);
      return plans || [];
    },

    async add(plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<PreGamePlan> {
      const plans = await this.getAll();
      const now = new Date().toISOString();
      const newPlan: PreGamePlan = {
        ...plan,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      plans.push(newPlan);
      await storage.set(STORAGE_KEYS.PRE_GAME_PLANS, plans);
      return newPlan;
    },

    async update(id: string, updates: Partial<PreGamePlan>): Promise<PreGamePlan> {
      const plans = await this.getAll();
      const index = plans.findIndex(p => p.id === id);
      if (index === -1) {
        throw new StorageError('Pre-game plan not found', 'update', STORAGE_KEYS.PRE_GAME_PLANS);
      }
      plans[index] = { 
        ...plans[index], 
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await storage.set(STORAGE_KEYS.PRE_GAME_PLANS, plans);
      return plans[index];
    },

    async remove(id: string): Promise<void> {
      const plans = await this.getAll();
      const filtered = plans.filter(p => p.id !== id);
      await storage.set(STORAGE_KEYS.PRE_GAME_PLANS, filtered);
    },
  },
}; 
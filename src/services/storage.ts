import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  DRINKS: 'drinks',
  SETTINGS: 'settings',
  AUTH_TOKEN: 'auth_token',
  BUDGET: 'budget',
  PRE_GAME_PLANS: 'pre_game_plans',
  DAILY_TRACKER: 'daily_tracker',
  MONTHLY_TRACKER: 'monthly_tracker',
  HISTORICAL_DATA: 'historical_data',
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
  university: string;
  yearOfStudy: string;
  joinDate: string;
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
  // Tracking information
  actualDrinks?: number;
  actualSpending?: number;
  adherencePercentage?: number;
  drinksAdherencePercentage?: number;
  spendingAdherencePercentage?: number;
  trackedDrinks?: string[]; // IDs of drinks tracked during this event
}

export interface DailyTracker {
  date: string; // Format: YYYY-MM-DD
  drinks: number;
  spending: number;
  completed: boolean;
  lastUpdated: string;
}

export interface MonthlyTracker {
  year: number;
  month: number; // 1-12
  drinks: number;
  spending: number;
  daysWithinLimit: number;
  totalDays: number;
  completed: boolean;
  lastUpdated: string;
}

export interface HistoricalData {
  dailyRecords: DailyTracker[];
  monthlyRecords: MonthlyTracker[];
}

// Error class for storage operations
export class StorageError extends Error {
  constructor(message: string, public operation: string, public key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Generic storage operations with type safety
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
      const newExpense = {
        ...expense,
        id: Date.now().toString(),
      };
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
        updatedAt: new Date().toISOString()
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

  dailyTracker: {
    async getCurrent(): Promise<DailyTracker | null> {
      const today = new Date().toISOString().split('T')[0];
      const tracker = await storage.get<DailyTracker>(`${STORAGE_KEYS.DAILY_TRACKER}_${today}`);
      return tracker;
    },

    async getOrCreateCurrent(): Promise<DailyTracker> {
      const today = new Date().toISOString().split('T')[0];
      const tracker = await this.getCurrent();
      
      if (tracker) {
        return tracker;
      }
      
      // Create a new tracker for today
      const newTracker: DailyTracker = {
        date: today,
        drinks: 0,
        spending: 0,
        completed: false,
        lastUpdated: new Date().toISOString(),
      };
      
      await storage.set(`${STORAGE_KEYS.DAILY_TRACKER}_${today}`, newTracker);
      return newTracker;
    },

    async updateCurrent(updates: Partial<DailyTracker>): Promise<DailyTracker> {
      const today = new Date().toISOString().split('T')[0];
      const current = await this.getOrCreateCurrent();
      const updated = { ...current, ...updates, lastUpdated: new Date().toISOString() };
      await storage.set(`${STORAGE_KEYS.DAILY_TRACKER}_${today}`, updated);
      return updated;
    },

    async markAsCompleted(): Promise<DailyTracker> {
      const today = new Date().toISOString().split('T')[0];
      const current = await this.getOrCreateCurrent();
      const updated = { ...current, completed: true, lastUpdated: new Date().toISOString() };
      await storage.set(`${STORAGE_KEYS.DAILY_TRACKER}_${today}`, updated);
      
      // Also save to historical data
      await this.saveToHistory(updated);
      
      return updated;
    },

    async saveToHistory(tracker: DailyTracker): Promise<void> {
      const historicalData = await storage.historicalData.get();
      const updatedRecords = [...historicalData.dailyRecords, tracker];
      await storage.historicalData.update({ dailyRecords: updatedRecords });
    },

    async getForDate(date: string): Promise<DailyTracker | null> {
      return storage.get<DailyTracker>(`${STORAGE_KEYS.DAILY_TRACKER}_${date}`);
    },
  },

  monthlyTracker: {
    async getCurrent(): Promise<MonthlyTracker | null> {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const key = `${STORAGE_KEYS.MONTHLY_TRACKER}_${year}_${month}`;
      return storage.get<MonthlyTracker>(key);
    },

    async getOrCreateCurrent(): Promise<MonthlyTracker> {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const key = `${STORAGE_KEYS.MONTHLY_TRACKER}_${year}_${month}`;
      const tracker = await storage.get<MonthlyTracker>(key);
      
      if (tracker) {
        return tracker;
      }
      
      // Create a new tracker for this month
      const daysInMonth = new Date(year, month, 0).getDate();
      const newTracker: MonthlyTracker = {
        year,
        month,
        drinks: 0,
        spending: 0,
        daysWithinLimit: 0,
        totalDays: daysInMonth,
        completed: false,
        lastUpdated: new Date().toISOString(),
      };
      
      await storage.set(key, newTracker);
      return newTracker;
    },

    async updateCurrent(updates: Partial<MonthlyTracker>): Promise<MonthlyTracker> {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const key = `${STORAGE_KEYS.MONTHLY_TRACKER}_${year}_${month}`;
      const current = await this.getOrCreateCurrent();
      const updated = { ...current, ...updates, lastUpdated: new Date().toISOString() };
      await storage.set(key, updated);
      return updated;
    },

    async markAsCompleted(): Promise<MonthlyTracker> {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const key = `${STORAGE_KEYS.MONTHLY_TRACKER}_${year}_${month}`;
      const current = await this.getOrCreateCurrent();
      const updated = { ...current, completed: true, lastUpdated: new Date().toISOString() };
      await storage.set(key, updated);
      
      // Also save to historical data
      await this.saveToHistory(updated);
      
      return updated;
    },

    async saveToHistory(tracker: MonthlyTracker): Promise<void> {
      const historicalData = await storage.historicalData.get();
      const updatedRecords = [...historicalData.monthlyRecords, tracker];
      await storage.historicalData.update({ monthlyRecords: updatedRecords });
    },

    async getForMonth(year: number, month: number): Promise<MonthlyTracker | null> {
      const key = `${STORAGE_KEYS.MONTHLY_TRACKER}_${year}_${month}`;
      return storage.get<MonthlyTracker>(key);
    },
  },

  historicalData: {
    async get(): Promise<HistoricalData> {
      const data = await storage.get<HistoricalData>(STORAGE_KEYS.HISTORICAL_DATA);
      return data || { dailyRecords: [], monthlyRecords: [] };
    },

    async update(updates: Partial<HistoricalData>): Promise<HistoricalData> {
      const current = await this.get();
      const updated = { ...current, ...updates };
      await storage.set(STORAGE_KEYS.HISTORICAL_DATA, updated);
      return updated;
    },
  },
}; 
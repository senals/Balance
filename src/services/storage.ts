import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  DRINKS: 'drinks',
  SETTINGS: 'settings',
  AUTH_TOKEN: 'auth_token',
  BUDGET: 'budget',
  PRE_GAME_PLANS: 'pre_game_plans',
  USERS: 'users',
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
  userId: string;
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
  userId: string;
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
  userId: string;
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
  userId: string;
}

// User account type
export interface UserAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
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

  // Helper function to get user-specific key
  getUserKey(baseKey: string, userId: string): string {
    return `${baseKey}_${userId}`;
  },

  // User authentication methods
  auth: {
    async register(email: string, password: string, name: string): Promise<UserAccount> {
      const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
      
      // Check if user already exists
      if (users.some(user => user.email === email)) {
        throw new StorageError('User with this email already exists', 'register');
      }
      
      const now = new Date().toISOString();
      const newUser: UserAccount = {
        id: Date.now().toString(),
        email,
        password,
        createdAt: now,
        updatedAt: now,
      };
      
      users.push(newUser);
      await storage.set(STORAGE_KEYS.USERS, users);
      
      // Create initial user profile
      const userProfile: UserProfile = {
        id: newUser.id,
        name,
        email,
        age: 21,
        weight: 70,
        height: 175,
        gender: 'other',
        createdAt: now,
        updatedAt: now,
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.USER_PROFILE, newUser.id), userProfile);
      
      // Create initial user settings
      const userSettings: UserSettings = {
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
        userId: newUser.id,
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.SETTINGS, newUser.id), userSettings);
      
      // Create initial budget
      const userBudget: BudgetData = {
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
        userId: newUser.id,
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.BUDGET, newUser.id), userBudget);
      
      return newUser;
    },
    
    async login(email: string, password: string): Promise<UserAccount> {
      const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new StorageError('Invalid email or password', 'login');
      }
      
      // Store auth token
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, user.id);
      
      return user;
    },
    
    async logout(): Promise<void> {
      await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    },
    
    async getCurrentUser(): Promise<UserAccount | null> {
      const userId = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
      if (!userId) return null;
      
      const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
      return users.find(u => u.id === userId) || null;
    },
  },

  // Specialized methods for our app
  drinks: {
    async getAll(userId: string): Promise<DrinkEntry[]> {
      const drinks = await storage.get<DrinkEntry[]>(storage.getUserKey(STORAGE_KEYS.DRINKS, userId));
      return drinks || [];
    },

    async add(drink: Omit<DrinkEntry, 'id' | 'userId'>): Promise<DrinkEntry> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'add', STORAGE_KEYS.DRINKS);
      }
      
      const drinks = await this.getAll(currentUser.id);
      const newDrink: DrinkEntry = {
        ...drink,
        id: Date.now().toString(),
        userId: currentUser.id,
      };
      drinks.push(newDrink);
      await storage.set(storage.getUserKey(STORAGE_KEYS.DRINKS, currentUser.id), drinks);
      return newDrink;
    },

    async update(id: string, updates: Partial<DrinkEntry>): Promise<DrinkEntry> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.DRINKS);
      }
      
      const drinks = await this.getAll(currentUser.id);
      const index = drinks.findIndex(d => d.id === id);
      if (index === -1) {
        throw new StorageError('Drink not found', 'update', STORAGE_KEYS.DRINKS);
      }
      drinks[index] = { ...drinks[index], ...updates };
      await storage.set(storage.getUserKey(STORAGE_KEYS.DRINKS, currentUser.id), drinks);
      return drinks[index];
    },

    async remove(id: string): Promise<void> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'remove', STORAGE_KEYS.DRINKS);
      }
      
      const drinks = await this.getAll(currentUser.id);
      const filtered = drinks.filter(d => d.id !== id);
      await storage.set(storage.getUserKey(STORAGE_KEYS.DRINKS, currentUser.id), filtered);
    },
  },

  settings: {
    async get(userId: string): Promise<UserSettings> {
      const settings = await storage.get<UserSettings>(storage.getUserKey(STORAGE_KEYS.SETTINGS, userId));
      return settings || {
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
        userId,
      };
    },

    async update(updates: Partial<UserSettings>): Promise<UserSettings> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.SETTINGS);
      }
      
      const current = await this.get(currentUser.id);
      const updated = { ...current, ...updates };
      await storage.set(storage.getUserKey(STORAGE_KEYS.SETTINGS, currentUser.id), updated);
      return updated;
    },
  },

  profile: {
    async get(userId: string): Promise<UserProfile | null> {
      return storage.get<UserProfile>(storage.getUserKey(STORAGE_KEYS.USER_PROFILE, userId));
    },

    async update(updates: Partial<UserProfile>): Promise<UserProfile> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.USER_PROFILE);
      }
      
      const current = await this.get(currentUser.id);
      if (!current) {
        throw new StorageError('No profile found', 'update', STORAGE_KEYS.USER_PROFILE);
      }
      const updated = { ...current, ...updates };
      await storage.set(storage.getUserKey(STORAGE_KEYS.USER_PROFILE, currentUser.id), updated);
      return updated;
    },
  },

  budget: {
    async get(userId: string): Promise<BudgetData> {
      const budget = await storage.get<BudgetData>(storage.getUserKey(STORAGE_KEYS.BUDGET, userId));
      return budget || {
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
        userId,
      };
    },

    async addExpense(expense: Omit<BudgetData['expenses'][0], 'id'>): Promise<BudgetData['expenses'][0]> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'addExpense', STORAGE_KEYS.BUDGET);
      }
      
      const budget = await this.get(currentUser.id);
      const newExpense = { ...expense, id: Date.now().toString() };
      budget.expenses.push(newExpense);
      await storage.set(storage.getUserKey(STORAGE_KEYS.BUDGET, currentUser.id), budget);
      return newExpense;
    },

    async update(updates: Partial<Omit<BudgetData, 'expenses'>>): Promise<BudgetData> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.BUDGET);
      }
      
      const current = await this.get(currentUser.id);
      const updated = { ...current, ...updates };
      await storage.set(storage.getUserKey(STORAGE_KEYS.BUDGET, currentUser.id), updated);
      return updated;
    },
  },

  preGamePlans: {
    async getAll(userId: string): Promise<PreGamePlan[]> {
      const plans = await storage.get<PreGamePlan[]>(storage.getUserKey(STORAGE_KEYS.PRE_GAME_PLANS, userId));
      return plans || [];
    },

    async add(plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<PreGamePlan> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'add', STORAGE_KEYS.PRE_GAME_PLANS);
      }
      
      const plans = await this.getAll(currentUser.id);
      const now = new Date().toISOString();
      const newPlan: PreGamePlan = {
        ...plan,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        userId: currentUser.id,
      };
      plans.push(newPlan);
      await storage.set(storage.getUserKey(STORAGE_KEYS.PRE_GAME_PLANS, currentUser.id), plans);
      return newPlan;
    },

    async update(id: string, updates: Partial<PreGamePlan>): Promise<PreGamePlan> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.PRE_GAME_PLANS);
      }
      
      const plans = await this.getAll(currentUser.id);
      const index = plans.findIndex(p => p.id === id);
      if (index === -1) {
        throw new StorageError('Pre-game plan not found', 'update', STORAGE_KEYS.PRE_GAME_PLANS);
      }
      plans[index] = { 
        ...plans[index], 
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await storage.set(storage.getUserKey(STORAGE_KEYS.PRE_GAME_PLANS, currentUser.id), plans);
      return plans[index];
    },

    async remove(id: string): Promise<void> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'remove', STORAGE_KEYS.PRE_GAME_PLANS);
      }
      
      const plans = await this.getAll(currentUser.id);
      const filtered = plans.filter(p => p.id !== id);
      await storage.set(storage.getUserKey(STORAGE_KEYS.PRE_GAME_PLANS, currentUser.id), filtered);
    },
  },
}; 
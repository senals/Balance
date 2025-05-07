import AsyncStorage from '@react-native-async-storage/async-storage';
import { IBudget, IBudgetDocument } from '../models/Budget';
import { DateLike } from '../types/date';
import { encryptionService } from './encryption';

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  DRINKS: 'drinks',
  SETTINGS: 'settings',
  AUTH_TOKEN: 'auth_token',
  BUDGET: 'budget',
  PRE_GAME_PLANS: 'pre_game_plans',
  USERS: 'users',
  READINESS_ASSESSMENT: 'readiness_assessment',
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
  timestamp: DateLike;
  userId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  university?: string;
  preferredDrinks?: string[];
  favoriteVenues?: string[];
  drinkingGoals?: string;
  createdAt: DateLike;
  updatedAt: DateLike;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  privacyModeEnabled: boolean;
  dailyLimit: number;
  userId: string;
  preGamePlans?: PreGamePlan[];
  dailyBudget?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  readinessAssessment?: {
    primaryStage: 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
    secondaryStage: 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance' | null;
    readinessScore: number;
    confidenceLevel: number;
    recommendations: string[];
  };
}

export interface BudgetData {
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: DateLike;
    notes?: string;
  }>;
  userId: string;
}

export interface PreGamePlan {
  id: string;
  title: string;
  date: DateLike;
  location: string;
  maxDrinks: number;
  maxSpending: number;
  notes?: string;
  completed: boolean;
  createdAt: DateLike;
  updatedAt: DateLike;
  actualDrinks?: number;
  actualSpending?: number;
  adherenceStatus?: 'pending' | 'success' | 'exceeded';
  adherenceNotes?: string;
  userId: string;
}

export interface ReadinessAssessment {
  id: string;
  userId: string;
  primaryStage: 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  secondaryStage: 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance' | null;
  readinessScore: number;
  confidenceLevel: number;
  stageLevels: Record<string, { score: number; percentage: number }>;
  recommendations: string[];
  answers: {
    questionId: string;
    answer: number;
  }[];
  createdAt: DateLike;
  updatedAt: DateLike;
}

// User account type
export interface UserAccount {
  id: string;
  email: string;
  password: string;
  createdAt: DateLike;
  updatedAt: DateLike;
}

// Error class for storage operations
export class StorageError extends Error {
  constructor(message: string, public operation: string, public key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Add cache management interface
interface Cache {
  [key: string]: any;
}

interface CacheExpiry {
  [key: string]: number;
}

// Add pending changes interface
interface PendingChange {
  key: string;
  value: any;
  timestamp: number;
}

// Define which keys should be encrypted
export const ENCRYPTED_KEYS = [
  'user_profile',
  'drinks',
  'settings',
  'budget',
  'pre_game_plans',
  'readiness_assessment'
] as const;

type EncryptedKey = typeof ENCRYPTED_KEYS[number];

// Generic storage operations with type safety
export const storage = {
  // Add cache management
  cache: {} as Cache,
  cacheExpiry: {} as CacheExpiry,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  // Add pending changes tracking
  pendingChanges: [] as PendingChange[],

  // Add cache management methods
  clearCache(): void {
    this.cache = {};
    this.cacheExpiry = {};
  },

  // Add pending changes methods
  getPendingChanges(): PendingChange[] {
    return [...this.pendingChanges];
  },

  addPendingChange(change: PendingChange): void {
    this.pendingChanges.push(change);
  },

  clearPendingChanges(): void {
    this.pendingChanges = [];
  },

  // Modify existing get method to use cache
  async get<T>(key: string): Promise<T | null> {
    // Check cache first
    if (this.cache[key] && this.cacheExpiry[key] > Date.now()) {
      return this.cache[key];
    }

    const data = await AsyncStorage.getItem(key);
    if (!data) return null;

    // Decrypt if needed
    let parsedData;
    if (ENCRYPTED_KEYS.includes(key as EncryptedKey)) {
      parsedData = await encryptionService.decrypt(data);
    } else {
      parsedData = JSON.parse(data);
    }

    // Update cache
    this.cache[key] = parsedData;
    this.cacheExpiry[key] = Date.now() + this.CACHE_TTL;

    return parsedData;
  },

  // Modify existing set method to track changes
  async set<T>(key: string, value: T): Promise<void> {
    // Update cache
    this.cache[key] = value;
    this.cacheExpiry[key] = Date.now() + this.CACHE_TTL;

    // Track change
    this.addPendingChange({ key, value, timestamp: Date.now() });

    // Encrypt if needed
    const dataToStore = ENCRYPTED_KEYS.includes(key as EncryptedKey)
      ? await encryptionService.encrypt(value)
      : JSON.stringify(value);

    await AsyncStorage.setItem(key, dataToStore);
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      
      // Update cache
      delete this.cache[key];
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
      Object.keys(this.cache).forEach(key => delete this.cache[key]);
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
      try {
        const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
        
        // Validate input
        if (!email || !password || !name) {
          throw new StorageError('All fields are required', 'register');
        }
        
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
      } catch (error) {
        if (error instanceof StorageError) {
          throw error;
        }
        throw new StorageError('Failed to register user', 'register');
      }
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
      try {
        const userId = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
        if (!userId) return null;
        
        const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.id === userId);
        
        if (!user) {
          console.warn('User not found for ID:', userId);
          return null;
        }
        
        return user;
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    },

    async resetPassword(email: string, newPassword: string): Promise<void> {
      const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
      const userIndex = users.findIndex(u => u.email === email);
      
      if (userIndex === -1) {
        throw new StorageError('User not found', 'resetPassword');
      }
      
      // Update password
      users[userIndex].password = newPassword;
      users[userIndex].updatedAt = new Date().toISOString();
      
      await storage.set(STORAGE_KEYS.USERS, users);
    }
  },

  // Specialized methods for our app
  drinks: {
    async getAll(userId: string): Promise<DrinkEntry[]> {
      try {
        const drinks = await storage.get<DrinkEntry[]>(storage.getUserKey(STORAGE_KEYS.DRINKS, userId));
        return drinks || [];
      } catch (error) {
        console.error('Error getting drinks:', error);
        return [];
      }
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
      
      // Check for exact duplicates (same drink, same timestamp, same price)
      const isDuplicate = drinks.some(d => 
        d.timestamp === newDrink.timestamp && 
        d.brand === newDrink.brand && 
        d.quantity === newDrink.quantity &&
        d.price === newDrink.price &&
        d.category === newDrink.category &&
        d.type === newDrink.type
      );
      
      if (isDuplicate) {
        throw new StorageError('Duplicate drink entry', 'add', STORAGE_KEYS.DRINKS);
      }
      
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
      
      // Check for duplicates with other drinks
      const isDuplicate = drinks.some((d, i) => 
        i !== index && 
        d.timestamp === (updates.timestamp || drinks[index].timestamp) && 
        d.brand === (updates.brand || drinks[index].brand) && 
        d.quantity === (updates.quantity || drinks[index].quantity)
      );
      
      if (isDuplicate) {
        throw new StorageError('Duplicate drink entry', 'update', STORAGE_KEYS.DRINKS);
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
    async get(userId: string): Promise<IBudget | null> {
      const budget = await storage.get<IBudget>(storage.getUserKey(STORAGE_KEYS.BUDGET, userId));
      return budget || {
        userId,
        dailyBudget: 0,
        weeklyBudget: 0,
        monthlyBudget: 0,
        expenses: [],
      };
    },

    async save(budget: IBudget): Promise<void> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'save', STORAGE_KEYS.BUDGET);
      }
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.BUDGET, currentUser.id), budget);
    },

    async addExpense(expense: { amount: number; category: string; date: string; notes?: string }): Promise<void> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'addExpense', STORAGE_KEYS.BUDGET);
      }
      
      const budget = await this.get(currentUser.id);
      if (!budget) {
        throw new StorageError('Budget not found', 'addExpense', STORAGE_KEYS.BUDGET);
      }
      
      budget.expenses.push({
        ...expense,
        date: new Date(expense.date)
      });
      
      await this.save(budget);
    },

    async update(updates: Partial<IBudget>): Promise<void> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.BUDGET);
      }
      
      const budget = await this.get(currentUser.id);
      if (!budget) {
        throw new StorageError('Budget not found', 'update', STORAGE_KEYS.BUDGET);
      }
      
      const updatedBudget = { ...budget, ...updates };
      await this.save(updatedBudget);
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

  readinessAssessment: {
    async get(userId: string): Promise<ReadinessAssessment | null> {
      return storage.get<ReadinessAssessment>(storage.getUserKey(STORAGE_KEYS.READINESS_ASSESSMENT, userId));
    },

    async add(assessment: Omit<ReadinessAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReadinessAssessment> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'add', STORAGE_KEYS.READINESS_ASSESSMENT);
      }
      
      const now = new Date().toISOString();
      const newAssessment: ReadinessAssessment = {
        ...assessment,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.READINESS_ASSESSMENT, currentUser.id), newAssessment);
      return newAssessment;
    },

    async update(updates: Partial<ReadinessAssessment>): Promise<ReadinessAssessment> {
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'update', STORAGE_KEYS.READINESS_ASSESSMENT);
      }
      
      const current = await this.get(currentUser.id);
      if (!current) {
        throw new StorageError('No assessment found', 'update', STORAGE_KEYS.READINESS_ASSESSMENT);
      }
      
      const updated = { 
        ...current, 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.READINESS_ASSESSMENT, currentUser.id), updated);
      return updated;
    },
  },
}; 
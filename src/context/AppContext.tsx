import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage, STORAGE_KEYS, StorageError, UserAccount, UserProfile, UserSettings, DrinkEntry, BudgetData, PreGamePlan, ReadinessAssessment } from '../services/storage';
import { lightTheme, darkTheme } from '../theme/theme';
import { drinkApi } from '../services/drinkApi';
import { dataService } from '../services/dataService';

export type AppContextType = {
  // Authentication state
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  setIsAuthenticated: (value: boolean) => void;
  
  // State
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  settings: UserSettings;
  drinks: DrinkEntry[];
  setDrinks: React.Dispatch<React.SetStateAction<DrinkEntry[]>>;
  budget: BudgetData;
  preGamePlans: PreGamePlan[];
  setPreGamePlans: React.Dispatch<React.SetStateAction<PreGamePlan[]>>;
  readinessAssessment: ReadinessAssessment | null;
  theme: typeof lightTheme;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  
  // Drink actions
  addDrink: (drink: Omit<DrinkEntry, 'id' | 'userId'>) => Promise<DrinkEntry>;
  updateDrink: (id: string, updates: Partial<DrinkEntry>) => Promise<DrinkEntry>;
  removeDrink: (id: string) => Promise<void>;
  
  // Budget actions
  updateBudget: (updates: Partial<Omit<BudgetData, 'expenses'>>) => Promise<void>;
  addExpense: (expense: Omit<BudgetData['expenses'][0], 'id'>) => Promise<BudgetData['expenses'][0]>;

  // Pre-game plan actions
  addPreGamePlan: (plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updatePreGamePlan: (id: string, updates: Partial<PreGamePlan>) => Promise<void>;
  removePreGamePlan: (id: string) => Promise<void>;
  
  // Readiness assessment actions
  getReadinessAssessment: () => Promise<ReadinessAssessment | null>;
  addReadinessAssessment: (assessment: Omit<ReadinessAssessment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReadinessAssessment: (updates: Partial<ReadinessAssessment>) => Promise<void>;
  
  // Error handling
  clearError: () => void;
};

export const AppContext = createContext<AppContextType>({
  // Authentication state
  isAuthenticated: false,
  currentUser: null,
  setIsAuthenticated: () => {},
  
  // State
  isLoading: false,
  error: null,
  userProfile: null,
  settings: {
    notificationsEnabled: true,
    darkModeEnabled: false,
    privacyModeEnabled: false,
    dailyLimit: 3,
    userId: '',
  },
  drinks: [],
  setDrinks: () => {},
  budget: {
    dailyBudget: 15,
    weeklyBudget: 105,
    monthlyBudget: 450,
    expenses: [],
    userId: '',
  },
  preGamePlans: [],
  setPreGamePlans: () => {},
  readinessAssessment: null,
  theme: lightTheme,

  // Auth actions
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  resetPassword: async () => {},
  
  // Profile actions
  updateProfile: async () => {},
  
  // Settings actions
  updateSettings: async () => {},
  
  // Drink actions
  addDrink: async () => ({ 
    id: '', 
    category: '', 
    type: '', 
    brand: '', 
    alcoholContent: 0, 
    quantity: 0, 
    price: 0, 
    timestamp: '', 
    userId: '' 
  }),
  updateDrink: async () => ({ 
    id: '', 
    category: '', 
    type: '', 
    brand: '', 
    alcoholContent: 0, 
    quantity: 0, 
    price: 0, 
    timestamp: '', 
    userId: '' 
  }),
  removeDrink: async () => {},
  
  // Budget actions
  updateBudget: async () => {},
  addExpense: async () => ({ 
    id: '', 
    amount: 0, 
    category: '', 
    date: new Date().toISOString(), 
    notes: '' 
  }),

  // Pre-game plan actions
  addPreGamePlan: async () => {},
  updatePreGamePlan: async () => {},
  removePreGamePlan: async () => {},
  
  // Readiness assessment actions
  getReadinessAssessment: async () => null,
  addReadinessAssessment: async () => {},
  updateReadinessAssessment: async () => {},
  
  // Error handling
  clearError: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    darkModeEnabled: false,
    privacyModeEnabled: false,
    dailyLimit: 3,
    userId: '',
  });
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [budget, setBudget] = useState<BudgetData>({
    dailyBudget: 15,
    weeklyBudget: 105,
    monthlyBudget: 450,
    expenses: [],
    userId: '',
  });
  const [preGamePlans, setPreGamePlans] = useState<PreGamePlan[]>([]);
  const [readinessAssessment, setReadinessAssessment] = useState<ReadinessAssessment | null>(null);

  // Theme state
  const theme = useMemo(() => settings.darkModeEnabled ? darkTheme : lightTheme, [settings.darkModeEnabled]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await storage.auth.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          await loadUserData(user.id);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load user data
  const loadUserData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Load user profile
      const profile = await storage.profile.get(userId);
      setUserProfile(profile);
      
      // Load settings
      const userSettings = await storage.settings.get(userId);
      setSettings(userSettings);
      
      // Load drinks from MongoDB
      const userDrinks = await drinkApi.getAll(userId);
      setDrinks(userDrinks);
      
      // Load budget
      const userBudget = await storage.budget.get(userId);
      setBudget(userBudget ? {
        dailyBudget: userBudget.dailyBudget,
        weeklyBudget: userBudget.weeklyBudget,
        monthlyBudget: userBudget.monthlyBudget,
        expenses: userBudget.expenses.map((expense, index) => ({
          id: `expense-${index}`,
          amount: expense.amount,
          category: expense.category,
          date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
          notes: expense.notes
        })),
        userId: userBudget.userId
      } : {
        dailyBudget: 0,
        weeklyBudget: 0,
        monthlyBudget: 0,
        expenses: [],
        userId: userId
      });
      
      // Load pre-game plans
      const plans = await storage.preGamePlans.getAll(userId);
      setPreGamePlans(plans);
      
      // Load readiness assessment
      const assessment = await storage.readinessAssessment.get(userId);
      setReadinessAssessment(assessment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user data';
      setError(errorMessage);
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Login with local storage
      const user = await storage.auth.login(email, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Load user data
      await loadUserData(user.id);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to login';
      setError(errorMessage);
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, clearError]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      // Create user in local storage
      const user = await storage.auth.register(email, password, name);
      setCurrentUser(user);
      
      // Set auth token after registration
      await storage.set(STORAGE_KEYS.AUTH_TOKEN, user.id);
      
      // Initialize user profile with basic information
      const initialProfile: UserProfile = {
        id: user.id,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save initial profile
      await storage.profile.update(initialProfile);
      setUserProfile(initialProfile);
      
      // Initialize default settings
      const defaultSettings: UserSettings = {
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
        userId: user.id,
      };
      
      await storage.settings.update(defaultSettings);
      setSettings(defaultSettings);
      
      // Initialize default budget
      const defaultBudget: BudgetData = {
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
        userId: user.id,
      };
      
      await storage.set(storage.getUserKey(STORAGE_KEYS.BUDGET, user.id), defaultBudget);
      setBudget(defaultBudget);
      
      // Don't set isAuthenticated to true yet - wait for readiness assessment
      // This ensures the user completes the assessment before accessing the main app
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to register';
      setError(errorMessage);
      console.error('Error registering:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      // Only remove the auth token
      await storage.auth.logout();
      
      // Clear state but don't clear stored data
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      setSettings({
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
        userId: '',
      });
      setDrinks([]);
      setBudget({
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
        userId: '',
      });
      setPreGamePlans([]);
      setReadinessAssessment(null);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to logout';
      setError(errorMessage);
      console.error('Error logging out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  const deleteAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'delete', 'account');
      }

      // Delete all user data
      await Promise.all([
        storage.remove(storage.getUserKey(STORAGE_KEYS.USER_PROFILE, currentUser.id)),
        storage.remove(storage.getUserKey(STORAGE_KEYS.SETTINGS, currentUser.id)),
        storage.remove(storage.getUserKey(STORAGE_KEYS.DRINKS, currentUser.id)),
        storage.remove(storage.getUserKey(STORAGE_KEYS.BUDGET, currentUser.id)),
        storage.remove(storage.getUserKey(STORAGE_KEYS.PRE_GAME_PLANS, currentUser.id)),
      ]);

      // Remove user from users list
      const users = await storage.get<UserAccount[]>(STORAGE_KEYS.USERS) || [];
      const updatedUsers = users.filter(u => u.id !== currentUser.id);
      await storage.set(STORAGE_KEYS.USERS, updatedUsers);

      // Clear auth token
      await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
      
      // Clear all state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      setSettings({
        notificationsEnabled: true,
        darkModeEnabled: false,
        privacyModeEnabled: false,
        dailyLimit: 3,
        userId: '',
      });
      setDrinks([]);
      setBudget({
        dailyBudget: 15,
        weeklyBudget: 105,
        monthlyBudget: 450,
        expenses: [],
        userId: '',
      });
      setPreGamePlans([]);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to delete account';
      setError(errorMessage);
      console.error('Error deleting account:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Profile actions
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      clearError();
      const updated = await storage.profile.update(updates);
      setUserProfile(updated);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Settings actions
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      setIsLoading(true);
      clearError();
      const updated = await storage.settings.update(updates);
      setSettings(updated);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Drink actions
  const addDrink = useCallback(async (drink: Omit<DrinkEntry, 'id' | 'userId'>) => {
    try {
      clearError();
      
      if (!currentUser?.id) {
        console.error('Cannot add drink: No current user ID available');
        throw new Error('User not authenticated');
      }

      console.log('Adding drink to MongoDB:', { ...drink, userId: currentUser.id });

      // Save to MongoDB
      try {
        // Format the drink data to match the MongoDB schema
        const formattedDrink = {
          userId: currentUser.id,
          type: drink.type,
          amount: drink.quantity,
          timestamp: new Date(drink.timestamp),
          notes: drink.notes || '',
          category: drink.category,
          brand: drink.brand,
          alcoholContent: drink.alcoholContent,
          price: drink.price,
          location: drink.location
        };
        
        console.log('Formatted drink for MongoDB:', formattedDrink);
        
        const newDrink = await drinkApi.create(drink, currentUser.id);
        console.log('MongoDB server response:', newDrink);
        
        // Convert the MongoDB response to the format expected by the app
        const formattedDrinkEntry: DrinkEntry = {
          id: newDrink._id || newDrink.id,
          category: newDrink.category || drink.category,
          type: newDrink.type || drink.type,
          brand: newDrink.brand || drink.brand,
          alcoholContent: newDrink.alcoholContent || drink.alcoholContent,
          quantity: newDrink.amount || drink.quantity,
          price: newDrink.price || drink.price,
          location: newDrink.location || drink.location,
          notes: newDrink.notes || drink.notes,
          timestamp: newDrink.timestamp || drink.timestamp,
          userId: newDrink.userId || currentUser.id
        };
        
        console.log('Formatted drink for local state:', formattedDrinkEntry);
        
        // Update local state immediately
        setDrinks(prev => {
          const updated = [...prev, formattedDrinkEntry];
          console.log('Updated drinks state with new drink. Total drinks:', updated.length);
          return updated;
        });

        // Add the drink as an expense in the budget tracking system
        if (formattedDrinkEntry.price > 0) {
          console.log('Adding drink as expense to budget');
          const expense = {
            amount: formattedDrinkEntry.price,
            category: 'Drinks',
            date: formattedDrinkEntry.timestamp,
            notes: `${formattedDrinkEntry.quantity}x ${formattedDrinkEntry.brand} at ${formattedDrinkEntry.location || 'Unknown location'}`
          };
          const updatedBudget = await dataService.budget.addExpense(currentUser.id, expense);
          if (updatedBudget) {
            console.log('Budget updated successfully');
            // Convert the API budget to the storage budget format
            const storageBudget: BudgetData = {
              dailyBudget: updatedBudget.dailyBudget,
              weeklyBudget: updatedBudget.weeklyBudget,
              monthlyBudget: updatedBudget.monthlyBudget,
              userId: updatedBudget.userId,
              expenses: updatedBudget.expenses.map(exp => ({
                id: Date.now().toString(), // Generate a new ID for each expense
                amount: exp.amount,
                category: exp.category,
                date: exp.date.toISOString(),
                notes: exp.notes
              }))
            };
            setBudget(storageBudget);
          }
        }
        
        return formattedDrinkEntry;
      } catch (apiError) {
        console.error('MongoDB API error:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error in addDrink function:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to add drink';
      setError(errorMessage);
      throw error;
    }
  }, [clearError, currentUser]);

  const updateDrink = useCallback(async (id: string, updates: Partial<DrinkEntry>) => {
    try {
      clearError();
      
      // Update in MongoDB
      const updated = await drinkApi.update(id, updates);
      
      // Update local state
      setDrinks(prev => prev.map(d => d.id === id ? updated : d));
      
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update drink';
      setError(errorMessage);
      console.error('Error updating drink:', error);
      throw error;
    }
  }, [clearError]);

  const removeDrink = useCallback(async (id: string) => {
    try {
      clearError();
      
      // Delete from MongoDB
      await drinkApi.delete(id);
      
      // Update local state
      setDrinks(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove drink';
      setError(errorMessage);
      console.error('Error removing drink:', error);
      throw error;
    }
  }, [clearError]);

  // Budget actions
  const updateBudget = useCallback(async (updates: Partial<Omit<BudgetData, 'expenses'>>) => {
    try {
      clearError();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      // Optimistic update
      setBudget(prev => ({ ...prev, ...updates }));
      
      const updatedBudget = await dataService.budget.update(currentUser.id, updates);
      if (updatedBudget) {
        // Convert the API budget to the storage budget format
        const storageBudget: BudgetData = {
          dailyBudget: updatedBudget.dailyBudget,
          weeklyBudget: updatedBudget.weeklyBudget,
          monthlyBudget: updatedBudget.monthlyBudget,
          userId: updatedBudget.userId,
          expenses: updatedBudget.expenses.map(exp => ({
            id: Date.now().toString(), // Generate a new ID for each expense
            amount: exp.amount,
            category: exp.category,
            date: exp.date.toISOString(),
            notes: exp.notes
          }))
        };
        setBudget(storageBudget);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update budget';
      setError(errorMessage);
      throw error;
    }
  }, [clearError, currentUser]);

  const addExpense = useCallback(async (expense: Omit<BudgetData['expenses'][0], 'id'>) => {
    try {
      clearError();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log('Adding expense:', expense);
      
      // Optimistic update
      const tempId = Date.now().toString();
      const tempExpense = { ...expense, id: tempId };
      
      // Update local state immediately
      setBudget(prev => ({
        ...prev,
        expenses: [...prev.expenses, tempExpense],
      }));
      
      // Save to storage
      const updatedBudget = await dataService.budget.addExpense(currentUser.id, expense);
      
      // If we have a valid budget, update the state
      if (updatedBudget) {
        const storageBudget: BudgetData = {
          dailyBudget: updatedBudget.dailyBudget,
          weeklyBudget: updatedBudget.weeklyBudget,
          monthlyBudget: updatedBudget.monthlyBudget,
          userId: updatedBudget.userId,
          expenses: updatedBudget.expenses.map(exp => ({
            id: Date.now().toString(),
            amount: exp.amount,
            category: exp.category,
            date: exp.date.toISOString(),
            notes: exp.notes
          }))
        };
        
        // Update the state with the new budget
        setBudget(storageBudget);
        
        // Return the newly added expense
        return storageBudget.expenses[storageBudget.expenses.length - 1];
      }
      
      // If no budget was updated, return the temporary expense
      return tempExpense;
    } catch (error) {
      // Rollback on error
      setBudget(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== Date.now().toString()),
      }));
      
      console.error('Error adding expense:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      setError(errorMessage);
      throw error;
    }
  }, [clearError, currentUser]);

  // Pre-game plan actions
  const addPreGamePlan = useCallback(async (plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      clearError();
      const newPlan = await storage.preGamePlans.add(plan);
      setPreGamePlans(prev => [...prev, newPlan]);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to add pre-game plan';
      setError(errorMessage);
      console.error('Error adding pre-game plan:', error);
      throw error;
    }
  }, [clearError]);

  const updatePreGamePlan = useCallback(async (id: string, updates: Partial<PreGamePlan>) => {
    try {
      clearError();
      const updated = await storage.preGamePlans.update(id, updates);
      setPreGamePlans(prev => prev.map(p => p.id === id ? updated : p));
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update pre-game plan';
      setError(errorMessage);
      console.error('Error updating pre-game plan:', error);
      throw error;
    }
  }, [clearError]);

  const removePreGamePlan = useCallback(async (id: string) => {
    try {
      clearError();
      await storage.preGamePlans.remove(id);
      setPreGamePlans(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to remove pre-game plan';
      setError(errorMessage);
      console.error('Error removing pre-game plan:', error);
      throw error;
    }
  }, [clearError]);

  // Readiness assessment actions
  const getReadinessAssessment = useCallback(async () => {
    try {
      clearError();
      const currentUser = await storage.auth.getCurrentUser();
      if (!currentUser) {
        throw new StorageError('User not authenticated', 'get', STORAGE_KEYS.READINESS_ASSESSMENT);
      }
      
      const assessment = await storage.readinessAssessment.get(currentUser.id);
      setReadinessAssessment(assessment);
      return assessment;
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to get readiness assessment';
      setError(errorMessage);
      console.error('Error getting readiness assessment:', error);
      throw error;
    }
  }, [clearError]);

  const addReadinessAssessment = useCallback(async (assessment: Omit<ReadinessAssessment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      clearError();
      const newAssessment = await storage.readinessAssessment.add(assessment);
      setReadinessAssessment(newAssessment);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to add readiness assessment';
      setError(errorMessage);
      console.error('Error adding readiness assessment:', error);
      throw error;
    }
  }, [clearError]);

  const updateReadinessAssessment = useCallback(async (updates: Partial<ReadinessAssessment>) => {
    try {
      clearError();
      const updated = await storage.readinessAssessment.update(updates);
      setReadinessAssessment(updated);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update readiness assessment';
      setError(errorMessage);
      console.error('Error updating readiness assessment:', error);
      throw error;
    }
  }, [clearError]);

  // Auth actions
  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    try {
      setIsLoading(true);
      clearError();
      await storage.auth.resetPassword(email, newPassword);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to reset password';
      setError(errorMessage);
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Auth state
    isAuthenticated,
    currentUser,
    setIsAuthenticated,
    
    // State
    isLoading,
    error,
    userProfile,
    settings,
    drinks,
    setDrinks,
    budget,
    preGamePlans,
    setPreGamePlans,
    readinessAssessment,
    theme,

    // Actions
    login,
    register,
    logout,
    deleteAccount,
    resetPassword,
    updateProfile,
    updateSettings,
    addDrink,
    updateDrink,
    removeDrink,
    updateBudget,
    addExpense,
    addPreGamePlan,
    updatePreGamePlan,
    removePreGamePlan,
    getReadinessAssessment,
    addReadinessAssessment,
    updateReadinessAssessment,
    clearError,
  }), [
    isAuthenticated,
    currentUser,
    setIsAuthenticated,
    isLoading,
    error,
    userProfile,
    settings,
    drinks,
    setDrinks,
    budget,
    preGamePlans,
    setPreGamePlans,
    readinessAssessment,
    theme,
    login,
    register,
    logout,
    deleteAccount,
    resetPassword,
    updateProfile,
    updateSettings,
    addDrink,
    updateDrink,
    removeDrink,
    updateBudget,
    addExpense,
    addPreGamePlan,
    updatePreGamePlan,
    removePreGamePlan,
    getReadinessAssessment,
    addReadinessAssessment,
    updateReadinessAssessment,
    clearError,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 
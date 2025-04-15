import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, DrinkEntry, UserProfile, UserSettings, BudgetData, PreGamePlan, StorageError, DailyTracker, MonthlyTracker, HistoricalData } from '../services/storage';

interface AppContextType {
  // State
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  settings: UserSettings;
  drinks: DrinkEntry[];
  budget: BudgetData;
  preGamePlans: PreGamePlan[];
  dailyTracker: DailyTracker | null;
  monthlyTracker: MonthlyTracker | null;
  historicalData: HistoricalData;
  isInitialized: boolean;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  
  // Drink actions
  addDrink: (drink: Omit<DrinkEntry, 'id'>) => Promise<void>;
  updateDrink: (id: string, updates: Partial<DrinkEntry>) => Promise<void>;
  removeDrink: (id: string) => Promise<void>;
  
  // Budget actions
  updateBudget: (updates: Partial<Omit<BudgetData, 'expenses'>>) => Promise<void>;
  addExpense: (expense: Omit<BudgetData['expenses'][0], 'id'>) => Promise<void>;

  // Pre-game plan actions
  addPreGamePlan: (plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePreGamePlan: (id: string, updates: Partial<PreGamePlan>) => Promise<void>;
  removePreGamePlan: (id: string) => Promise<void>;

  // Tracker actions
  updateDailyTracker: (updates: Partial<DailyTracker>) => Promise<void>;
  updateMonthlyTracker: (updates: Partial<MonthlyTracker>) => Promise<void>;
  markDailyAsCompleted: () => Promise<void>;
  markMonthlyAsCompleted: () => Promise<void>;
  getDailyTrackerForDate: (date: string) => Promise<DailyTracker | null>;
  getMonthlyTrackerForMonth: (year: number, month: number) => Promise<MonthlyTracker | null>;
  
  // Data loading actions
  loadInitialData: () => Promise<void>;
  loadUserData: () => Promise<void>;
  loadTrackerData: () => Promise<void>;
  loadHistoricalData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    darkModeEnabled: false,
    privacyModeEnabled: false,
    dailyLimit: 3,
  });
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [budget, setBudget] = useState<BudgetData>({
    dailyBudget: 15,
    weeklyBudget: 105,
    monthlyBudget: 450,
    expenses: [],
  });
  const [preGamePlans, setPreGamePlans] = useState<PreGamePlan[]>([]);
  const [dailyTracker, setDailyTracker] = useState<DailyTracker | null>(null);
  const [monthlyTracker, setMonthlyTracker] = useState<MonthlyTracker | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    dailyRecords: [],
    monthlyRecords: [],
  });

  // Load initial data - only essential data to get the app running
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load only essential data first
      const [settingsData, profileData] = await Promise.all([
        storage.settings.get().catch(() => settings), // Fallback to default if error
        storage.profile.get().catch(() => null), // Fallback to null if error
      ]);
      
      setSettings(settingsData);
      setUserProfile(profileData);
      setIsInitialized(true);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to load initial data');
      // Still mark as initialized so the app can continue
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data (drinks, budget, pre-game plans)
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      const [drinksData, budgetData, preGamePlansData] = await Promise.all([
        storage.drinks.getAll().catch(() => []),
        storage.budget.get().catch(() => budget),
        storage.preGamePlans.getAll().catch(() => []),
      ]);
      
      setDrinks(drinksData);
      setBudget(budgetData);
      setPreGamePlans(preGamePlansData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load tracker data (daily and monthly trackers)
  const loadTrackerData = async () => {
    try {
      setIsLoading(true);
      
      const [dailyTrackerData, monthlyTrackerData] = await Promise.all([
        storage.dailyTracker.getOrCreateCurrent().catch(() => null),
        storage.monthlyTracker.getOrCreateCurrent().catch(() => null),
      ]);
      
      setDailyTracker(dailyTrackerData);
      setMonthlyTracker(monthlyTrackerData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to load tracker data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load historical data
  const loadHistoricalData = async () => {
    try {
      setIsLoading(true);
      
      const historicalDataData = await storage.historicalData.get().catch(() => ({
        dailyRecords: [],
        monthlyRecords: [],
      }));
      
      setHistoricalData(historicalDataData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to load historical data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Check for day change and reset daily tracker if needed
  useEffect(() => {
    if (!dailyTracker) return;
    
    const checkDayChange = async () => {
      const today = new Date().toISOString().split('T')[0];
      if (dailyTracker.date !== today) {
        // Day has changed, mark the old day as completed and create a new tracker
        await markDailyAsCompleted();
        const newTracker = await storage.dailyTracker.getOrCreateCurrent();
        setDailyTracker(newTracker);
      }
    };

    checkDayChange();
    
    // Set up an interval to check for day change every minute
    const interval = setInterval(checkDayChange, 60000);
    
    return () => clearInterval(interval);
  }, [dailyTracker]);

  // Check for month change and reset monthly tracker if needed
  useEffect(() => {
    if (!monthlyTracker) return;
    
    const checkMonthChange = async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (monthlyTracker.year !== currentYear || monthlyTracker.month !== currentMonth) {
        // Month has changed, mark the old month as completed and create a new tracker
        await markMonthlyAsCompleted();
        const newTracker = await storage.monthlyTracker.getOrCreateCurrent();
        setMonthlyTracker(newTracker);
      }
    };

    checkMonthChange();
    
    // Set up an interval to check for month change every day
    const interval = setInterval(checkMonthChange, 86400000);
    
    return () => clearInterval(interval);
  }, [monthlyTracker]);

  // Update daily tracker when drinks change
  useEffect(() => {
    const updateDailyStats = async () => {
      if (!dailyTracker) return;
      
      const today = new Date().toISOString().split('T')[0];
      const todayDrinks = drinks.filter(drink => 
        drink.timestamp.startsWith(today)
      );
      
      const totalDrinks = todayDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
      const totalSpending = todayDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
      
      if (totalDrinks !== dailyTracker.drinks || totalSpending !== dailyTracker.spending) {
        await updateDailyTracker({
          drinks: totalDrinks,
          spending: totalSpending,
        });
      }
    };

    updateDailyStats();
  }, [drinks, dailyTracker]);

  // Update monthly tracker when daily tracker changes
  useEffect(() => {
    const updateMonthlyStats = async () => {
      if (!monthlyTracker || !dailyTracker) return;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (monthlyTracker.year === currentYear && monthlyTracker.month === currentMonth) {
        const totalDrinks = monthlyTracker.drinks + (dailyTracker.drinks - (monthlyTracker.drinks % dailyTracker.drinks));
        const totalSpending = monthlyTracker.spending + (dailyTracker.spending - (monthlyTracker.spending % dailyTracker.spending));
        
        // Check if today was within limit
        const wasWithinLimit = dailyTracker.drinks <= settings.dailyLimit;
        const daysWithinLimit = wasWithinLimit ? monthlyTracker.daysWithinLimit + 1 : monthlyTracker.daysWithinLimit;
        
        await updateMonthlyTracker({
          drinks: totalDrinks,
          spending: totalSpending,
          daysWithinLimit,
        });
      }
    };

    updateMonthlyStats();
  }, [dailyTracker, monthlyTracker, settings.dailyLimit]);

  // Profile actions
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const updated = await storage.profile.update(updates);
      setUserProfile(updated);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Settings actions
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      setIsLoading(true);
      const updated = await storage.settings.update(updates);
      setSettings(updated);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to update settings');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Drink actions
  const addDrink = async (drink: Omit<DrinkEntry, 'id'>) => {
    try {
      // Optimistic update
      const tempId = Date.now().toString();
      const tempDrink = { ...drink, id: tempId };
      setDrinks(prev => [...prev, tempDrink]);

      const newDrink = await storage.drinks.add(drink);
      
      // Update with actual data
      setDrinks(prev => prev.map(d => d.id === tempId ? newDrink : d));
    } catch (error) {
      // Rollback on error
      setDrinks(prev => prev.filter(d => d.id !== Date.now().toString()));
      setError(error instanceof StorageError ? error.message : 'Failed to add drink');
      throw error;
    }
  };

  const updateDrink = async (id: string, updates: Partial<DrinkEntry>) => {
    try {
      // Optimistic update
      setDrinks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      
      const updated = await storage.drinks.update(id, updates);
      
      // Update with actual data
      setDrinks(prev => prev.map(d => d.id === id ? updated : d));
    } catch (error) {
      // Rollback on error
      setError(error instanceof StorageError ? error.message : 'Failed to update drink');
      throw error;
    }
  };

  const removeDrink = async (id: string) => {
    try {
      // Optimistic update
      const removedDrink = drinks.find(d => d.id === id);
      setDrinks(prev => prev.filter(d => d.id !== id));
      
      await storage.drinks.remove(id);
    } catch (error) {
      // Rollback on error
      if (removedDrink) {
        setDrinks(prev => [...prev, removedDrink]);
      }
      setError(error instanceof StorageError ? error.message : 'Failed to remove drink');
      throw error;
    }
  };

  // Budget actions
  const updateBudget = async (updates: Partial<Omit<BudgetData, 'expenses'>>) => {
    try {
      // Optimistic update
      setBudget(prev => ({ ...prev, ...updates }));
      
      const updated = await storage.budget.update(updates);
      
      // Update with actual data
      setBudget(updated);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to update budget');
      throw error;
    }
  };

  const addExpense = async (expense: Omit<BudgetData['expenses'][0], 'id'>) => {
    try {
      // Optimistic update
      const tempId = Date.now().toString();
      const tempExpense = { ...expense, id: tempId };
      setBudget(prev => ({
        ...prev,
        expenses: [...prev.expenses, tempExpense],
      }));

      const newExpense = await storage.budget.addExpense(expense);
      
      // Update with actual data
      setBudget(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === tempId ? newExpense : e),
      }));
    } catch (error) {
      // Rollback on error
      setBudget(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== Date.now().toString()),
      }));
      setError(error instanceof StorageError ? error.message : 'Failed to add expense');
      throw error;
    }
  };

  // Pre-game plan actions
  const addPreGamePlan = async (plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Optimistic update
      const tempId = Date.now().toString();
      const now = new Date().toISOString();
      const tempPlan = { ...plan, id: tempId, createdAt: now, updatedAt: now };
      setPreGamePlans(prev => [...prev, tempPlan]);

      const newPlan = await storage.preGamePlans.add(plan);
      
      // Update with actual data
      setPreGamePlans(prev => prev.map(p => p.id === tempId ? newPlan : p));
    } catch (error) {
      // Rollback on error
      setPreGamePlans(prev => prev.filter(p => p.id !== Date.now().toString()));
      setError(error instanceof StorageError ? error.message : 'Failed to add pre-game plan');
      throw error;
    }
  };

  const updatePreGamePlan = async (id: string, updates: Partial<PreGamePlan>) => {
    try {
      // Optimistic update
      setPreGamePlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      
      const updated = await storage.preGamePlans.update(id, updates);
      
      // Update with actual data
      setPreGamePlans(prev => prev.map(p => p.id === id ? updated : p));
    } catch (error) {
      // Rollback on error
      setError(error instanceof StorageError ? error.message : 'Failed to update pre-game plan');
      throw error;
    }
  };

  const removePreGamePlan = async (id: string) => {
    try {
      // Optimistic update
      const removedPlan = preGamePlans.find(p => p.id === id);
      setPreGamePlans(prev => prev.filter(p => p.id !== id));
      
      await storage.preGamePlans.remove(id);
    } catch (error) {
      // Rollback on error
      if (removedPlan) {
        setPreGamePlans(prev => [...prev, removedPlan]);
      }
      setError(error instanceof StorageError ? error.message : 'Failed to remove pre-game plan');
      throw error;
    }
  };

  // Tracker actions
  const updateDailyTracker = async (updates: Partial<DailyTracker>) => {
    try {
      const updated = await storage.dailyTracker.updateCurrent(updates);
      setDailyTracker(updated);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to update daily tracker');
      throw error;
    }
  };

  const updateMonthlyTracker = async (updates: Partial<MonthlyTracker>) => {
    try {
      const updated = await storage.monthlyTracker.updateCurrent(updates);
      setMonthlyTracker(updated);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to update monthly tracker');
      throw error;
    }
  };

  const markDailyAsCompleted = async () => {
    try {
      const updated = await storage.dailyTracker.markAsCompleted();
      setDailyTracker(updated);
      
      // Refresh historical data
      const historicalData = await storage.historicalData.get();
      setHistoricalData(historicalData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to mark daily tracker as completed');
      throw error;
    }
  };

  const markMonthlyAsCompleted = async () => {
    try {
      const updated = await storage.monthlyTracker.markAsCompleted();
      setMonthlyTracker(updated);
      
      // Refresh historical data
      const historicalData = await storage.historicalData.get();
      setHistoricalData(historicalData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to mark monthly tracker as completed');
      throw error;
    }
  };

  const getDailyTrackerForDate = async (date: string): Promise<DailyTracker | null> => {
    try {
      return await storage.dailyTracker.getForDate(date);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to get daily tracker for date');
      throw error;
    }
  };

  const getMonthlyTrackerForMonth = async (year: number, month: number): Promise<MonthlyTracker | null> => {
    try {
      return await storage.monthlyTracker.getForMonth(year, month);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to get monthly tracker for month');
      throw error;
    }
  };

  const value: AppContextType = {
    isLoading,
    error,
    userProfile,
    settings,
    drinks,
    budget,
    preGamePlans,
    dailyTracker,
    monthlyTracker,
    historicalData,
    isInitialized,
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
    updateDailyTracker,
    updateMonthlyTracker,
    markDailyAsCompleted,
    markMonthlyAsCompleted,
    getDailyTrackerForDate,
    getMonthlyTrackerForMonth,
    loadInitialData,
    loadUserData,
    loadTrackerData,
    loadHistoricalData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 
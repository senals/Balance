import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, DrinkEntry, UserProfile, UserSettings, BudgetData, StorageError } from '../services/storage';

interface AppContextType {
  // State
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  settings: UserSettings;
  drinks: DrinkEntry[];
  budget: BudgetData;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, settingsData, drinksData, budgetData] = await Promise.all([
          storage.profile.get(),
          storage.settings.get(),
          storage.drinks.getAll(),
          storage.budget.get(),
        ]);

        setUserProfile(profileData);
        setSettings(settingsData);
        setDrinks(drinksData);
        setBudget(budgetData);
      } catch (error) {
        setError(error instanceof StorageError ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  const value: AppContextType = {
    isLoading,
    error,
    userProfile,
    settings,
    drinks,
    budget,
    updateProfile,
    updateSettings,
    addDrink,
    updateDrink,
    removeDrink,
    updateBudget,
    addExpense,
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
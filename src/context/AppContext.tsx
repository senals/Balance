import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage, DrinkEntry, UserProfile, UserSettings, BudgetData, PreGamePlan, StorageError, UserAccount, STORAGE_KEYS, ReadinessAssessment } from '../services/storage';
import { lightTheme, darkTheme } from '../theme/theme';

interface AppContextType {
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
  budget: BudgetData;
  preGamePlans: PreGamePlan[];
  readinessAssessment: ReadinessAssessment | null;
  theme: typeof lightTheme;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  
  // Drink actions
  addDrink: (drink: Omit<DrinkEntry, 'id' | 'userId'>) => Promise<void>;
  updateDrink: (id: string, updates: Partial<DrinkEntry>) => Promise<void>;
  removeDrink: (id: string) => Promise<void>;
  
  // Budget actions
  updateBudget: (updates: Partial<Omit<BudgetData, 'expenses'>>) => Promise<void>;
  addExpense: (expense: Omit<BudgetData['expenses'][0], 'id'>) => Promise<void>;

  // Pre-game plan actions
  addPreGamePlan: (plan: Omit<PreGamePlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updatePreGamePlan: (id: string, updates: Partial<PreGamePlan>) => Promise<void>;
  removePreGamePlan: (id: string) => Promise<void>;
  
  // Readiness assessment actions
  getReadinessAssessment: () => Promise<ReadinessAssessment | null>;
  addReadinessAssessment: (assessment: Omit<ReadinessAssessment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ReadinessAssessment>;
  updateReadinessAssessment: (updates: Partial<ReadinessAssessment>) => Promise<ReadinessAssessment>;
  
  // Error handling
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
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
  const loadUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const [profileData, settingsData, drinksData, budgetData, preGamePlansData, readinessAssessmentData] = await Promise.all([
        storage.profile.get(userId),
        storage.settings.get(userId),
        storage.drinks.getAll(userId),
        storage.budget.get(userId),
        storage.preGamePlans.getAll(userId),
        storage.readinessAssessment.get(userId),
      ]);

      setUserProfile(profileData);
      setSettings(settingsData);
      setDrinks(drinksData);
      setBudget(budgetData);
      setPreGamePlans(preGamePlansData);
      setReadinessAssessment(readinessAssessmentData);
    } catch (error) {
      setError(error instanceof StorageError ? error.message : 'Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();
      
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
      
      const user = await storage.auth.register(email, password, name);
      setCurrentUser(user);
      // Don't set isAuthenticated to true yet - wait for readiness assessment
      await loadUserData(user.id);
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
      
      await storage.auth.logout();
      
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
      
      // Clear only the auth token from cache
      await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
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
    const tempId = Date.now().toString();
    try {
      clearError();
      // Optimistic update
      const tempDrink = { ...drink, id: tempId, userId: currentUser?.id || '' };
      setDrinks(prev => [...prev, tempDrink]);

      const newDrink = await storage.drinks.add(drink);
      
      // Update with actual data
      setDrinks(prev => prev.map(d => d.id === tempId ? newDrink : d));
    } catch (error) {
      // Rollback on error
      setDrinks(prev => prev.filter(d => d.id !== tempId));
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to add drink';
      setError(errorMessage);
      console.error('Error adding drink:', error);
      throw error;
    }
  }, [clearError, currentUser]);

  const updateDrink = useCallback(async (id: string, updates: Partial<DrinkEntry>) => {
    try {
      clearError();
      // Optimistic update
      setDrinks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      
      const updated = await storage.drinks.update(id, updates);
      
      // Update with actual data
      setDrinks(prev => prev.map(d => d.id === id ? updated : d));
    } catch (error) {
      // Rollback on error
      setDrinks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update drink';
      setError(errorMessage);
      console.error('Error updating drink:', error);
      throw error;
    }
  }, [clearError]);

  const removeDrink = useCallback(async (id: string) => {
    try {
      clearError();
      // Optimistic update
      setDrinks(prev => prev.filter(d => d.id !== id));
      
      await storage.drinks.remove(id);
    } catch (error) {
      // Rollback on error
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to remove drink';
      setError(errorMessage);
      console.error('Error removing drink:', error);
      throw error;
    }
  }, [clearError]);

  // Budget actions
  const updateBudget = useCallback(async (updates: Partial<Omit<BudgetData, 'expenses'>>) => {
    try {
      clearError();
      // Optimistic update
      setBudget(prev => ({ ...prev, ...updates }));
      
      const updated = await storage.budget.update(updates);
      
      // Update with actual data
      setBudget(updated);
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update budget';
      setError(errorMessage);
      console.error('Error updating budget:', error);
      throw error;
    }
  }, [clearError]);

  const addExpense = useCallback(async (expense: Omit<BudgetData['expenses'][0], 'id'>) => {
    try {
      clearError();
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
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to add expense';
      setError(errorMessage);
      console.error('Error adding expense:', error);
      throw error;
    }
  }, [clearError]);

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
      return newAssessment;
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
      return updated;
    } catch (error) {
      const errorMessage = error instanceof StorageError ? error.message : 'Failed to update readiness assessment';
      setError(errorMessage);
      console.error('Error updating readiness assessment:', error);
      throw error;
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
    budget,
    preGamePlans,
    readinessAssessment,
    theme,

    // Actions
    login,
    register,
    logout,
    deleteAccount,
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
    budget,
    preGamePlans,
    readinessAssessment,
    theme,
    login,
    register,
    logout,
    deleteAccount,
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
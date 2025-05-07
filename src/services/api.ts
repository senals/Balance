import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';
import { IBudget, IBudgetDocument } from '../models/Budget';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('auth_token');
};

// Helper function for API requests
export const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Budget API
export const budgetApi = {
  getAll: async (): Promise<IBudgetDocument[]> => {
    return apiRequest(API_CONFIG.ENDPOINTS.BUDGET);
  },
  
  getByUser: async (userId: string): Promise<IBudgetDocument | null> => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.BUDGET}/user/${userId}`);
  },
  
  create: async (budget: Partial<IBudget>): Promise<IBudgetDocument> => {
    return apiRequest(API_CONFIG.ENDPOINTS.BUDGET, 'POST', budget);
  },
  
  update: async (id: string, updates: Partial<IBudget>): Promise<IBudgetDocument | null> => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.BUDGET}/${id}`, 'PUT', updates);
  },
  
  delete: async (id: string): Promise<IBudgetDocument | null> => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.BUDGET}/${id}`, 'DELETE');
  },

  addExpense: async (userId: string, expense: { amount: number; category: string; date: string; notes?: string }): Promise<IBudgetDocument> => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.BUDGET}/user/${userId}/expense`, 'POST', expense);
  }
};

// Transaction API
export const transactionApi = {
  getAll: async () => {
    return apiRequest(API_CONFIG.ENDPOINTS.TRANSACTIONS);
  },
  
  getByUser: async (userId: string) => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/user/${userId}`);
  },
  
  create: async (transaction: any) => {
    return apiRequest(API_CONFIG.ENDPOINTS.TRANSACTIONS, 'POST', transaction);
  },
  
  update: async (id: string, updates: any) => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`, 'PUT', updates);
  },
  
  delete: async (id: string) => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`, 'DELETE');
  }
};

// User API
export const userApi = {
  getAll: async () => {
    return apiRequest(API_CONFIG.ENDPOINTS.USERS);
  },
  
  create: async (user: any) => {
    return apiRequest(API_CONFIG.ENDPOINTS.USERS, 'POST', user);
  },
  
  update: async (id: string, updates: any) => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.USERS}/${id}`, 'PUT', updates);
  },
  
  delete: async (id: string) => {
    return apiRequest(`${API_CONFIG.ENDPOINTS.USERS}/${id}`, 'DELETE');
  }
};

// Check API connection
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('API connection check timed out');
    } else {
      console.error('API connection check failed:', error);
    }
    return false;
  }
}; 
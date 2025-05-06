import { DrinkEntry } from './storage';
import { API_CONFIG } from '../config/api.config';

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`Making API request to: ${API_CONFIG.BASE_URL}${endpoint}`, { method, data });
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error: ${response.status}`, errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log(`API response from ${endpoint}:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Drink API
export const drinkApi = {
  // Get all drinks for a user
  getAll: async (userId: string) => {
    try {
      const response = await apiRequest(`/drinks/user/${userId}`);
      // Transform the response to match the frontend model
      return response.map((drink: any) => ({
        id: drink._id,
        userId: drink.userId,
        type: drink.type,
        quantity: drink.quantity || drink.amount, // Handle both formats
        alcoholContent: drink.alcoholContent,
        price: drink.price,
        timestamp: drink.timestamp,
        location: drink.location,
        notes: drink.notes,
        category: drink.category,
        brand: drink.brand
      }));
    } catch (error) {
      console.error('Error fetching drinks:', error);
      throw error;
    }
  },
  
  // Get a single drink
  getById: async (id: string) => {
    return apiRequest(`/drinks/${id}`);
  },
  
  // Create a new drink
  create: async (drink: Omit<DrinkEntry, 'id' | 'userId'>, userId: string) => {
    // Format the drink data to match the MongoDB schema
    const formattedDrink = {
      userId,
      category: drink.category,
      type: drink.type,
      brand: drink.brand,
      alcoholContent: drink.alcoholContent,
      quantity: drink.quantity,
      price: drink.price,
      timestamp: new Date(drink.timestamp),
      location: drink.location,
      notes: drink.notes
    };
    
    console.log('Sending formatted drink to API:', formattedDrink);
    return apiRequest('/drinks', 'POST', formattedDrink);
  },
  
  // Update a drink
  update: async (id: string, updates: Partial<DrinkEntry>) => {
    // Format the updates to match the MongoDB schema
    const formattedUpdates = {
      category: updates.category,
      type: updates.type,
      brand: updates.brand,
      alcoholContent: updates.alcoholContent,
      quantity: updates.quantity,
      price: updates.price,
      timestamp: updates.timestamp ? new Date(updates.timestamp) : undefined,
      location: updates.location,
      notes: updates.notes
    };
    
    return apiRequest(`/drinks/${id}`, 'PUT', formattedUpdates);
  },
  
  // Delete a drink
  delete: async (id: string) => {
    return apiRequest(`/drinks/${id}`, 'DELETE');
  },
  
  // Get drinks by date range
  getByDateRange: async (userId: string, startDate: string, endDate: string) => {
    return apiRequest(`/drinks/user/${userId}/range?startDate=${startDate}&endDate=${endDate}`);
  }
}; 
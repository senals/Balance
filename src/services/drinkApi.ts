import { DrinkEntry } from './storage';

// Update the API base URL to point to your actual server
const API_BASE_URL = 'http://localhost:5000/api';

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
    
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`, { method, data });
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
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
    return apiRequest(`/drinks/user/${userId}`);
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
      type: drink.type,
      amount: drink.quantity,
      timestamp: new Date(drink.timestamp),
      notes: drink.notes || '',
      // Add any additional fields needed by the backend
      category: drink.category,
      brand: drink.brand,
      alcoholContent: drink.alcoholContent,
      price: drink.price,
      location: drink.location
    };
    
    console.log('Sending formatted drink to API:', formattedDrink);
    return apiRequest('/drinks', 'POST', formattedDrink);
  },
  
  // Update a drink
  update: async (id: string, updates: Partial<DrinkEntry>) => {
    // Format the updates to match the MongoDB schema
    const formattedUpdates = {
      type: updates.type,
      amount: updates.quantity,
      timestamp: updates.timestamp ? new Date(updates.timestamp) : undefined,
      notes: updates.notes,
      // Add any additional fields needed by the backend
      category: updates.category,
      brand: updates.brand,
      alcoholContent: updates.alcoholContent,
      price: updates.price,
      location: updates.location
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
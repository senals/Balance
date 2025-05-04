import { apiRequest } from './api';

// User API
export const userApi = {
  getAll: async () => {
    return apiRequest('/users');
  },
  
  create: async (user: { username: string; email: string; id: string }) => {
    return apiRequest('/users', 'POST', user);
  },
  
  update: async (id: string, updates: any) => {
    return apiRequest(`/users/${id}`, 'PUT', updates);
  },
  
  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, 'DELETE');
  }
}; 
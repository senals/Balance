import axios from 'axios';
import { IUser } from '../server/models/User';
import { IDrinkHistory } from '../server/models/DrinkHistory';
import { IReadinessAssessment } from '../server/models/ReadinessAssessment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const userService = {
  // User account operations
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  },

  async updateUser(userId: string, userData: Partial<IUser>): Promise<IUser> {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  },

  async getUserProfile(userId: string): Promise<IUser> {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  },

  // Drink history operations
  async addDrinkHistory(drinkData: Partial<IDrinkHistory>): Promise<IDrinkHistory> {
    const response = await axios.post(`${API_URL}/drink-history`, drinkData);
    return response.data;
  },

  async getDrinkHistory(userId: string, startDate?: Date, endDate?: Date): Promise<IDrinkHistory[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await axios.get(`${API_URL}/drink-history/${userId}?${params.toString()}`);
    return response.data;
  },

  // Readiness assessment operations
  async saveReadinessAssessment(assessmentData: Partial<IReadinessAssessment>): Promise<IReadinessAssessment> {
    const response = await axios.post(`${API_URL}/readiness-assessments`, assessmentData);
    return response.data;
  },

  async getReadinessAssessments(userId: string): Promise<IReadinessAssessment[]> {
    const response = await axios.get(`${API_URL}/readiness-assessments/${userId}`);
    return response.data;
  },

  // Statistics operations
  async updateUserStatistics(userId: string, statistics: Partial<IUser['statistics']>): Promise<IUser> {
    const response = await axios.patch(`${API_URL}/users/${userId}/statistics`, statistics);
    return response.data;
  },

  async getDashboardData(userId: string): Promise<{
    drinkHistory: IDrinkHistory[];
    assessments: IReadinessAssessment[];
    statistics: IUser['statistics'];
  }> {
    const response = await axios.get(`${API_URL}/users/${userId}/dashboard`);
    return response.data;
  }
}; 
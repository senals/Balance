import { DateLike } from './date';

export interface DrinkEntry {
  id: string;
  userId: string;
  type: string;
  quantity: number;
  alcoholContent: number;
  price: number;
  timestamp: DateLike;
  location?: string;
  notes?: string;
} 
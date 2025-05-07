import { Document } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      getAll?: Document[];
      get?: Document;
      create?: Document;
      update?: Document;
      query?: Document[];
    }
  }
} 